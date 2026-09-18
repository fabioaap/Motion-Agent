import {z} from "zod";
import type {JobContext} from "./contracts.js";

export const PreviewStageSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().min(1),
  startFrame: z.number().int().nonnegative(),
  status: z.enum(["pending", "active", "approved"]).optional()
});

export const MotionPreviewJobSchema = z.object({
  jobId: z.string().min(1),
  title: z.string().min(1),
  objective: z.string().min(1),
  command: z.string().default("@motion"),
  fps: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  durationFrames: z.number().int().positive(),
  stages: z.array(PreviewStageSchema).min(1)
});

export type MotionPreviewJob = z.infer<typeof MotionPreviewJobSchema>;

function stageStart(index: number, durationFrames: number): number {
  const anchors = [0.05, 0.24, 0.45, 0.67, 0.82];
  return Math.max(0, Math.floor(durationFrames * (anchors[index] ?? Math.min(0.9, 0.1 + index * 0.18))));
}

export function createPreviewJob(context: JobContext): MotionPreviewJob {
  const fps = context.motion_spec?.fps ?? context.brief.fps ?? 30;
  const width = context.brief.width ?? 1920;
  const height = context.brief.height ?? 1080;
  const durationFrames = context.motion_spec?.duration_frames
    ?? (context.brief.duration_seconds ? Math.max(1, Math.round(context.brief.duration_seconds * fps)) : 165);

  const rawCommand = context.metadata.invocation;
  const command = typeof rawCommand === "object" && rawCommand !== null && "command" in rawCommand
    ? String((rawCommand as Record<string, unknown>).command ?? "@motion")
    : "@motion";

  const stages: MotionPreviewJob["stages"] = [];

  if (context.assets) {
    stages.push({
      id: "asset_audit",
      label: "Asset Audit",
      detail: `${context.assets.assets.length} asset${context.assets.assets.length === 1 ? "" : "s"} auditado${context.assets.assets.length === 1 ? "" : "s"}`,
      startFrame: stageStart(stages.length, durationFrames),
      status: "approved"
    });
  }

  if (context.decomposition) {
    stages.push({
      id: "layerability_gate",
      label: "Layerability Gate",
      detail: `${context.decomposition.layerability_status} · ${context.decomposition.layer_map.length} layer${context.decomposition.layer_map.length === 1 ? "" : "s"}`,
      startFrame: stageStart(stages.length, durationFrames),
      status: context.decomposition.layerability_status === "LAYERED_READY" && context.decomposition.layer_map_verified
        ? "approved"
        : "active"
    });
  }

  if (context.motion_direction) {
    stages.push({
      id: "motion_direction",
      label: "Motion Direction",
      detail: context.motion_direction.story_function || context.motion_direction.objective,
      startFrame: stageStart(stages.length, durationFrames),
      status: "approved"
    });
  }

  if (context.build_result) {
    stages.push({
      id: "scene_build",
      label: "Scene Build",
      detail: `${context.build_result.components_created.length} criado${context.build_result.components_created.length === 1 ? "" : "s"}, ${context.build_result.components_reused.length} reutilizado${context.build_result.components_reused.length === 1 ? "" : "s"}`,
      startFrame: stageStart(stages.length, durationFrames),
      status: context.build_result.status === "SUCCESS" ? "approved" : "active"
    });
  }

  if (context.qa_reports.length > 0) {
    const passed = context.qa_reports.filter((report) => report.result === "PASS").length;
    stages.push({
      id: "qa_loop",
      label: "QA Loop",
      detail: `${passed}/${context.qa_reports.length} críticos aprovados`,
      startFrame: stageStart(stages.length, durationFrames),
      status: context.open_issues.length === 0 ? "approved" : "active"
    });
  }

  stages.push({
    id: "job_state",
    label: context.state === "READY_FOR_HUMAN" ? "Ready for Human" : "Job State",
    detail: context.state.replaceAll("_", " "),
    startFrame: stageStart(stages.length, durationFrames),
    status: context.state === "READY_FOR_HUMAN" || context.state === "HUMAN_APPROVED" || context.state === "DELIVERED"
      ? "approved"
      : "active"
  });

  const title = context.brief.message.trim()
    || context.motion_direction?.objective.trim()
    || context.brief.objective.trim();

  return MotionPreviewJobSchema.parse({
    jobId: context.job_id,
    title,
    objective: context.brief.objective,
    command,
    fps,
    width,
    height,
    durationFrames,
    stages
  });
}
