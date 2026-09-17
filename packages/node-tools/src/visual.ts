import {mkdir, writeFile} from "node:fs/promises";
import {dirname, join, relative, resolve} from "node:path";
import {spawn} from "node:child_process";
import pixelmatch from "pixelmatch";
import sharp from "sharp";
import {
  JobContextSchema,
  MotionSceneJobSchema,
  createSceneJob,
  type JobContext,
  type MotionSceneJob,
  type PreviewHook
} from "@motion-agent/runtime";
import {findRepoRoot} from "./ingest.js";

export type PixelDiffResult = {
  diffPixels: number;
  totalPixels: number;
  diffRatio: number;
  width: number;
  height: number;
  diffPath: string;
};

export type RemotionPreviewHookOptions = {
  repoRoot?: string;
  pixelThreshold?: number;
  maxDiffRatio?: number;
  maxMotionKeyframes?: number;
};

type SceneSnapshotLayer = {
  elementId: string;
  source: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fit: string;
  zIndex: number;
  strategy: string;
  originalAsset: boolean;
};

function portable(value: string): string {
  return value.replaceAll("\\", "/");
}

function normalizedSource(value: string): string {
  return value.trim().replace(/^\/+/, "").replace(/^public\//, "");
}

async function run(command: string, args: string[], cwd: string): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32"
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} ${args.join(" ")} failed with ${code}\n${stdout}\n${stderr}`));
    });
  });
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), {recursive: true});
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function comparePngs(
  referencePath: string,
  actualPath: string,
  diffPath: string,
  pixelThreshold = 0.1
): Promise<PixelDiffResult> {
  const reference = await sharp(referencePath).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  const actual = await sharp(actualPath).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  if (reference.info.width !== actual.info.width || reference.info.height !== actual.info.height) {
    throw new Error(`Visual QA dimensions differ: ${reference.info.width}x${reference.info.height} vs ${actual.info.width}x${actual.info.height}`);
  }
  const width = reference.info.width;
  const height = reference.info.height;
  const diff = Buffer.alloc(width * height * 4);
  const diffPixels = pixelmatch(reference.data, actual.data, diff, width, height, {threshold: pixelThreshold});
  await mkdir(dirname(diffPath), {recursive: true});
  await sharp(diff, {raw: {width, height, channels: 4}}).png().toFile(diffPath);
  const totalPixels = width * height;
  return {
    diffPixels,
    totalPixels,
    diffRatio: totalPixels === 0 ? 0 : diffPixels / totalPixels,
    width,
    height,
    diffPath
  };
}

function referenceScene(context: JobContext, actual: MotionSceneJob): MotionSceneJob {
  const assets = new Map((context.assets?.assets ?? []).map((asset) => [asset.asset_id, asset] as const));
  return MotionSceneJobSchema.parse({
    ...actual,
    qaStatic: true,
    layers: actual.layers.map((layer) => {
      const asset = assets.get(layer.assetId);
      return {
        ...layer,
        source: asset?.source || layer.source,
        strategy: "USE_ORIGINAL",
        motionFamily: "Static",
        originalAsset: true
      };
    })
  });
}

function sceneSnapshot(scene: MotionSceneJob): SceneSnapshotLayer[] {
  return scene.layers.map((layer) => ({
    elementId: layer.elementId,
    source: normalizedSource(layer.source),
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    fit: layer.fit,
    zIndex: layer.zIndex,
    strategy: layer.strategy,
    originalAsset: layer.originalAsset
  }));
}

function regressionMismatches(context: JobContext, current: SceneSnapshotLayer[]): string[] {
  const raw = context.metadata.scene_snapshot;
  if (!Array.isArray(raw)) return [];
  const previous = raw.filter((item): item is SceneSnapshotLayer => Boolean(item && typeof item === "object"));
  const locked = new Set([
    ...context.locked_elements,
    ...(context.decomposition?.elements.filter((item) => item.scope_status === "LOCKED").map((item) => item.element_id) ?? [])
  ]);
  if (locked.size === 0) return [];

  const before = new Map(previous.map((item) => [item.elementId, item] as const));
  const after = new Map(current.map((item) => [item.elementId, item] as const));
  const mismatches: string[] = [];

  for (const elementId of locked) {
    const oldLayer = before.get(elementId);
    const newLayer = after.get(elementId);
    if (!oldLayer || !newLayer) {
      mismatches.push(`${elementId}: locked layer was added or removed`);
      continue;
    }
    for (const key of ["source", "x", "y", "width", "height", "fit", "zIndex", "strategy", "originalAsset"] as const) {
      if (oldLayer[key] !== newLayer[key]) {
        mismatches.push(`${elementId}.${key}: ${String(oldLayer[key])} -> ${String(newLayer[key])}`);
      }
    }
  }
  return mismatches;
}

function selectMotionKeyframes(context: JobContext, scene: MotionSceneJob, limit = 7): number[] {
  const maxFrame = Math.max(0, scene.durationFrames - 1);
  const frames = new Set<number>([
    0,
    Math.round(maxFrame * 0.2),
    Math.round(maxFrame * 0.4),
    Math.round(maxFrame * 0.6),
    Math.round(maxFrame * 0.8),
    maxFrame
  ]);
  for (const item of context.motion_spec?.timeline ?? []) {
    frames.add(Math.max(0, Math.min(maxFrame, item.start_frame)));
    frames.add(Math.max(0, Math.min(maxFrame, Math.round((item.start_frame + item.end_frame) / 2))));
    frames.add(Math.max(0, Math.min(maxFrame, item.end_frame)));
  }
  const ordered = [...frames].sort((a, b) => a - b);
  if (ordered.length <= limit) return ordered;
  const sampled = new Set<number>();
  for (let index = 0; index < limit; index += 1) {
    sampled.add(ordered[Math.round((index / (limit - 1)) * (ordered.length - 1))]);
  }
  return [...sampled].sort((a, b) => a - b);
}

async function renderStill(studioRoot: string, propsPath: string, outputPath: string, frame = 0): Promise<void> {
  const propsRelative = portable(relative(studioRoot, propsPath));
  const outputRelative = portable(relative(studioRoot, outputPath));
  await mkdir(dirname(outputPath), {recursive: true});
  await run("pnpm", [
    "exec", "remotion", "still", "src/index.ts", "MotionScene", outputRelative,
    `--frame=${frame}`,
    `--props=${propsRelative}`
  ], studioRoot);
}

export function createRemotionPreviewHook(options: RemotionPreviewHookOptions = {}): PreviewHook {
  return async (context: JobContext): Promise<JobContext> => {
    const root = await findRepoRoot(options.repoRoot ?? process.cwd());
    const studioRoot = join(root, "apps", "remotion-studio");
    const safeJob = context.job_id.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const cycle = Number(context.metadata.qa_cycle ?? 1);
    const qaDir = join(studioRoot, "jobs", "qa");
    const outDir = join(studioRoot, "out", "qa", safeJob, `cycle-${cycle}`);
    const actualProps = join(qaDir, `${safeJob}-c${cycle}-actual.json`);
    const referenceProps = join(qaDir, `${safeJob}-c${cycle}-reference.json`);
    const motionProps = join(qaDir, `${safeJob}-c${cycle}-motion.json`);
    const actualPng = join(outDir, "fidelity-actual.png");
    const referencePng = join(outDir, "fidelity-reference.png");
    const diffPng = join(outDir, "fidelity-diff.png");
    const pixelThreshold = options.pixelThreshold ?? 0.1;
    const maxDiffRatio = options.maxDiffRatio ?? 0.005;

    try {
      const motionScene = MotionSceneJobSchema.parse({...createSceneJob(context), qaStatic: false});
      const actualScene = MotionSceneJobSchema.parse({...motionScene, qaStatic: true});
      const expectedScene = referenceScene(context, actualScene);
      const snapshot = sceneSnapshot(motionScene);
      const regression = regressionMismatches(context, snapshot);

      await writeJson(actualProps, actualScene);
      await writeJson(referenceProps, expectedScene);
      await writeJson(motionProps, motionScene);
      await renderStill(studioRoot, referenceProps, referencePng, 0);
      await renderStill(studioRoot, actualProps, actualPng, 0);
      const diff = await comparePngs(referencePng, actualPng, diffPng, pixelThreshold);

      const keyframes = selectMotionKeyframes(context, motionScene, options.maxMotionKeyframes ?? 7);
      const motionKeyframes: {frame: number; path: string}[] = [];
      for (const frame of keyframes) {
        const output = join(outDir, `motion-f${String(frame).padStart(4, "0")}.png`);
        await renderStill(studioRoot, motionProps, output, frame);
        motionKeyframes.push({frame, path: output});
      }

      const assets = new Map((context.assets?.assets ?? []).map((asset) => [asset.asset_id, asset] as const));
      const identityMismatches: string[] = [];
      for (const layer of actualScene.layers) {
        if (layer.fidelityRequirement !== "STRICT") continue;
        const source = assets.get(layer.assetId)?.source;
        if (!layer.originalAsset) {
          identityMismatches.push(`${layer.elementId}: strict layer is not marked as original`);
        }
        if (source && normalizedSource(source) !== normalizedSource(layer.source)) {
          identityMismatches.push(`${layer.elementId}: ${layer.source} != ${source}`);
        }
      }

      const next = structuredClone(context);
      next.metadata = {
        ...next.metadata,
        preview_render: {ok: true, actual_path: actualPng, reference_path: referencePng},
        visual_qa: {
          diff_ratio: diff.diffRatio,
          diff_pixels: diff.diffPixels,
          total_pixels: diff.totalPixels,
          threshold: maxDiffRatio,
          pixel_threshold: pixelThreshold,
          identity_mismatches: identityMismatches,
          reference_path: referencePng,
          actual_path: actualPng,
          diff_path: diffPng,
          motion_keyframes: motionKeyframes
        },
        regression_qa: {
          mismatches: regression,
          locked_elements: [
            ...new Set([
              ...context.locked_elements,
              ...(context.decomposition?.elements.filter((item) => item.scope_status === "LOCKED").map((item) => item.element_id) ?? [])
            ])
          ],
          baseline_available: Array.isArray(context.metadata.scene_snapshot),
          cycle
        },
        scene_snapshot: snapshot
      };
      return JobContextSchema.parse(next);
    } catch (error) {
      const next = structuredClone(context);
      const message = error instanceof Error ? error.message : String(error);
      next.metadata = {
        ...next.metadata,
        preview_render: {ok: false, error: message},
        visual_qa: {
          diff_ratio: 1,
          threshold: maxDiffRatio,
          identity_mismatches: [`Preview QA failed: ${message}`],
          reference_path: referencePng,
          actual_path: actualPng,
          diff_path: diffPng,
          motion_keyframes: []
        },
        regression_qa: {
          mismatches: [`Preview QA failed before regression validation: ${message}`],
          locked_elements: context.locked_elements,
          baseline_available: Array.isArray(context.metadata.scene_snapshot),
          cycle
        }
      };
      return JobContextSchema.parse(next);
    }
  };
}

export async function renderSceneVideo(
  scene: MotionSceneJob,
  outputPath: string,
  repoRoot = process.cwd()
): Promise<string> {
  const root = await findRepoRoot(repoRoot);
  const studioRoot = join(root, "apps", "remotion-studio");
  const safeJob = scene.jobId.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const propsPath = join(studioRoot, "jobs", "generated", `${safeJob}.json`);
  const absoluteOutput = resolve(outputPath);
  await writeJson(propsPath, MotionSceneJobSchema.parse({...scene, qaStatic: false}));
  await mkdir(dirname(absoluteOutput), {recursive: true});
  await run("pnpm", [
    "exec", "remotion", "render", "src/index.ts", "MotionScene", portable(absoluteOutput),
    `--props=${portable(relative(studioRoot, propsPath))}`
  ], studioRoot);
  return absoluteOutput;
}
