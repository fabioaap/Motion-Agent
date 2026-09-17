import {z} from "zod";
import type {JobContext} from "./contracts.js";

export const MotionSceneLayerSchema = z.object({
  elementId: z.string().min(1),
  assetId: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  source: z.string().min(1),
  strategy: z.string().min(1),
  fidelityRequirement: z.enum(["STRICT", "NORMAL", "FLEXIBLE"]).default("STRICT"),
  startFrame: z.number().int().nonnegative(),
  endFrame: z.number().int().nonnegative(),
  motionFamily: z.string().min(1),
  fit: z.enum(["contain", "cover"]).default("contain"),
  x: z.number().min(0).max(1).default(0.5),
  y: z.number().min(0).max(1).default(0.5),
  width: z.number().positive().max(1).default(0.82),
  height: z.number().positive().max(1).default(0.78),
  zIndex: z.number().int().default(1),
  originalAsset: z.boolean().default(true)
}).refine((value) => value.endFrame >= value.startFrame, {
  message: "endFrame must be greater than or equal to startFrame"
});

export const MotionSceneJobSchema = z.object({
  jobId: z.string().min(1),
  sceneId: z.string().min(1),
  title: z.string().min(1),
  objective: z.string().min(1),
  fps: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  durationFrames: z.number().int().positive(),
  background: z.string().default("#070B14"),
  presentation: z.enum(["FULL_FRAME", "CANVAS"]).default("FULL_FRAME"),
  layers: z.array(MotionSceneLayerSchema),
  showTitle: z.boolean().default(false)
});

export type MotionSceneLayer = z.infer<typeof MotionSceneLayerSchema>;
export type MotionSceneJob = z.infer<typeof MotionSceneJobSchema>;

type LayoutHint = Partial<Pick<MotionSceneLayer, "x" | "y" | "width" | "height" | "fit" | "zIndex">>;

function getLayoutHint(context: JobContext, elementId: string): LayoutHint {
  const raw = context.metadata.scene_layout;
  if (!raw || typeof raw !== "object") return {};
  const record = raw as Record<string, unknown>;
  const hint = record[elementId];
  if (!hint || typeof hint !== "object") return {};
  return hint as LayoutHint;
}

function safeSource(source: string, fallback: string): string {
  const value = source.trim();
  if (!value || value === "user") return fallback;
  return value;
}

export function createSceneJob(context: JobContext): MotionSceneJob {
  const fps = context.motion_spec?.fps ?? context.brief.fps ?? 30;
  const width = context.brief.width ?? 1920;
  const height = context.brief.height ?? 1080;
  const durationFrames = context.motion_spec?.duration_frames
    ?? (context.brief.duration_seconds ? Math.max(1, Math.round(context.brief.duration_seconds * fps)) : 150);

  const assetsById = new Map(
    (context.assets?.assets ?? []).map((asset) => [asset.asset_id, asset] as const)
  );

  const decomposition = context.decomposition?.elements ?? [];
  const elements = decomposition.length > 0
    ? decomposition
    : (context.assets?.assets ?? []).map((asset) => ({
        element_id: asset.asset_id,
        name: asset.name,
        source_asset_id: asset.asset_id,
        strategy: "USE_ORIGINAL" as const,
        requires_animation: true,
        requires_original_source: true,
        reconstruction_allowed: false,
        fidelity_requirement: "STRICT" as const,
        validation_required: true,
        scope_status: "OPEN" as const
      }));

  const layers: MotionSceneLayer[] = elements.flatMap((element, index) => {
    const asset = assetsById.get(element.source_asset_id);
    if (!asset) return [];

    const timeline = context.motion_spec?.timeline.find(
      (item) => item.element_id === element.element_id
    );
    const layout = getLayoutHint(context, element.element_id);

    return [{
      elementId: element.element_id,
      assetId: asset.asset_id,
      name: asset.name,
      type: asset.type.toUpperCase(),
      source: safeSource(asset.source, asset.name),
      strategy: element.strategy,
      fidelityRequirement: element.fidelity_requirement,
      startFrame: timeline?.start_frame ?? 0,
      endFrame: timeline?.end_frame ?? durationFrames - 1,
      motionFamily: element.requires_animation
        ? timeline?.motion_family ?? "SoftSpring"
        : "Static",
      fit: layout.fit ?? "contain",
      x: layout.x ?? 0.5,
      y: layout.y ?? 0.5,
      width: layout.width ?? (index === 0 ? 0.9 : 0.24),
      height: layout.height ?? (index === 0 ? 0.84 : 0.24),
      zIndex: layout.zIndex ?? index + 1,
      originalAsset: [
        "USE_ORIGINAL",
        "SEGMENT_ORIGINAL",
        "REUSE_COMPONENT",
        "REUSE_SVG",
        "MASK",
        "OVERLAY",
        "HYBRID"
      ].includes(element.strategy)
    }];
  });

  const title = context.brief.message.trim()
    || context.motion_direction?.objective.trim()
    || context.brief.objective.trim();

  return MotionSceneJobSchema.parse({
    jobId: context.job_id,
    sceneId: context.scene_id,
    title,
    objective: context.brief.objective,
    fps,
    width,
    height,
    durationFrames,
    presentation: layers.length === 1 ? "FULL_FRAME" : "CANVAS",
    layers,
    showTitle: layers.length === 0
  });
}
