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

async function renderStill(studioRoot: string, propsPath: string, outputPath: string): Promise<void> {
  const propsRelative = portable(relative(studioRoot, propsPath));
  const outputRelative = portable(relative(studioRoot, outputPath));
  await mkdir(dirname(outputPath), {recursive: true});
  await run("pnpm", [
    "exec", "remotion", "still", "src/index.ts", "MotionScene", outputRelative,
    "--frame=0",
    `--props=${propsRelative}`
  ], studioRoot);
}

export function createRemotionPreviewHook(options: RemotionPreviewHookOptions = {}): PreviewHook {
  return async (context: JobContext): Promise<JobContext> => {
    const root = await findRepoRoot(options.repoRoot ?? process.cwd());
    const studioRoot = join(root, "apps", "remotion-studio");
    const safeJob = context.job_id.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const qaDir = join(studioRoot, "jobs", "qa");
    const outDir = join(studioRoot, "out", "qa");
    const actualProps = join(qaDir, `${safeJob}-actual.json`);
    const referenceProps = join(qaDir, `${safeJob}-reference.json`);
    const actualPng = join(outDir, `${safeJob}-actual.png`);
    const referencePng = join(outDir, `${safeJob}-reference.png`);
    const diffPng = join(outDir, `${safeJob}-diff.png`);
    const pixelThreshold = options.pixelThreshold ?? 0.1;
    const maxDiffRatio = options.maxDiffRatio ?? 0.005;

    try {
      const actualScene = MotionSceneJobSchema.parse({...createSceneJob(context), qaStatic: true});
      const expectedScene = referenceScene(context, actualScene);
      await writeJson(actualProps, actualScene);
      await writeJson(referenceProps, expectedScene);
      await renderStill(studioRoot, referenceProps, referencePng);
      await renderStill(studioRoot, actualProps, actualPng);
      const diff = await comparePngs(referencePng, actualPng, diffPng, pixelThreshold);

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
          diff_path: diffPng
        }
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
          diff_path: diffPng
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
