import { z } from "zod";

export const JobStateSchema = z.enum([
  "INTAKE",
  "CONTEXT_READY",
  "ASSET_AUDIT",
  "SCENE_TOPOLOGY_AUDIT",
  "SOURCE_RESOLUTION",
  "LAYERABILITY_GATE",
  "TEMPLATE_RESOLUTION",
  "DIRECTION_DISCOVERY",
  "DIRECTION_READY",
  "MOTION_SPEC_READY",
  "BUILDING",
  "PREVIEW_READY",
  "FIDELITY_REVIEW",
  "MOTION_REVIEW",
  "COMPOSITION_REVIEW",
  "BRAND_REVIEW",
  "TECHNICAL_REVIEW",
  "QA_AGGREGATION",
  "FIX_REQUIRED",
  "STRATEGY_REVIEW",
  "HUMAN_INPUT_REQUIRED",
  "READY_FOR_HUMAN",
  "HUMAN_APPROVED",
  "FINAL_RENDER",
  "DELIVERED",
  "BLOCKED"
]);
export type JobState = z.infer<typeof JobStateSchema>;

export const AgentStatusSchema = z.enum([
  "SUCCESS",
  "PARTIAL",
  "FAIL",
  "BLOCKED",
  "NEEDS_INPUT"
]);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

export const SeveritySchema = z.enum(["CRITICAL", "MAJOR", "MINOR"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const AssetStrategySchema = z.enum([
  "USE_ORIGINAL",
  "SEGMENT_ORIGINAL",
  "REUSE_COMPONENT",
  "REUSE_SVG",
  "REBUILD_REACT",
  "REBUILD_SVG",
  "MASK",
  "OVERLAY",
  "HYBRID",
  "REQUEST_SOURCE"
]);
export type AssetStrategy = z.infer<typeof AssetStrategySchema>;

export const FidelityRequirementSchema = z.enum(["STRICT", "NORMAL", "FLEXIBLE"]);
export type FidelityRequirement = z.infer<typeof FidelityRequirementSchema>;

export const BaseContractSchema = z.object({
  contract_version: z.string().default("1.0"),
  job_id: z.string().min(1),
  scene_id: z.string().min(1).optional(),
  agent: z.string().min(1),
  status: AgentStatusSchema,
  created_at: z.string().datetime(),
  confidence: z.number().min(0).max(1),
  issues: z.array(z.string()).default([])
});

export const VideoBriefSchema = z.object({
  job_id: z.string().min(1),
  objective: z.string().min(1),
  message: z.string().default(""),
  usage_context: z.string().default(""),
  platform: z.string().default(""),
  duration_seconds: z.number().positive().nullable().default(null),
  fps: z.number().int().positive().nullable().default(null),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
  aspect_ratio: z.string().default(""),
  audience: z.string().default(""),
  desired_feeling: z.array(z.string()).default([]),
  references: z.array(z.string()).default([]),
  materials: z.array(z.string()).default([]),
  audio_required: z.boolean().default(false),
  interaction_required: z.boolean().default(false),
  component_motion_required: z.boolean().default(false),
  brand_context: z.string().nullable().default(null),
  constraints: z.array(z.string()).default([]),
  user_direction_level: z.enum(["LOW", "MEDIUM", "HIGH", "COMPLETE"]).default("LOW")
});
export type VideoBrief = z.infer<typeof VideoBriefSchema>;

export const AssetSchema = z.object({
  asset_id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  source: z.string().default(""),
  width: z.number().int().positive().nullable().default(null),
  height: z.number().int().positive().nullable().default(null),
  has_transparency: z.boolean().default(false),
  is_original_source: z.boolean().default(false),
  is_structured: z.boolean().default(false),
  can_segment: z.boolean().default(false),
  can_reuse_directly: z.boolean().default(false),
  fidelity_risk: z.enum(["LOW", "MEDIUM", "HIGH"]).default("LOW"),
  notes: z.string().default("")
});

export const AssetManifestSchema = z.object({
  job_id: z.string().min(1),
  assets: z.array(AssetSchema)
});
export type AssetManifest = z.infer<typeof AssetManifestSchema>;

export const DecompositionElementSchema = z.object({
  element_id: z.string().min(1),
  name: z.string().min(1),
  source_asset_id: z.string().min(1),
  strategy: AssetStrategySchema,
  requires_animation: z.boolean(),
  requires_original_source: z.boolean().default(false),
  reconstruction_allowed: z.boolean().default(false),
  fidelity_requirement: FidelityRequirementSchema.default("STRICT"),
  validation_required: z.boolean().default(true),
  scope_status: z.enum(["OPEN", "LOCKED"]).default("OPEN")
});

export const LayerSourceKindSchema = z.enum([
  "BACKGROUND_PLATE",
  "SOURCE_COMPONENT",
  "SVG",
  "TRANSPARENT_ASSET",
  "CUTOUT",
  "REACT",
  "MASK",
  "FLATTENED_STYLEFRAME",
  "OTHER"
]);
export type LayerSourceKind = z.infer<typeof LayerSourceKindSchema>;

export const LayerMapEntrySchema = z.object({
  element_id: z.string().min(1),
  role: z.string().default(""),
  source_kind: LayerSourceKindSchema,
  independently_addressable: z.boolean().default(false)
});
export type LayerMapEntry = z.infer<typeof LayerMapEntrySchema>;

export const LayerabilityStatusSchema = z.enum([
  "UNKNOWN",
  "LAYERED_READY",
  "RECONSTRUCTION_READY",
  "DECOMPOSITION_REQUIRED",
  "BLOCKED_MISSING_SOURCE",
  "BLOCKED_MISSING_ASSETS",
  "FLAT_MOTION_ONLY"
]);
export type LayerabilityStatus = z.infer<typeof LayerabilityStatusSchema>;

export const DecompositionSchema = z.object({
  job_id: z.string().min(1),
  scene_id: z.string().min(1),
  elements: z.array(DecompositionElementSchema),
  layer_map: z.array(LayerMapEntrySchema).default([]),
  layerability_status: LayerabilityStatusSchema.default("UNKNOWN"),
  layer_map_verified: z.boolean().default(false),
  full_scene_flattened_foreground: z.boolean().default(false)
});
export type Decomposition = z.infer<typeof DecompositionSchema>;

export const TemplateSelectionSchema = z.object({
  template_id: z.string().min(1),
  name: z.string().min(1),
  official_page: z.string().url(),
  create_command: z.string().min(1),
  role: z.string().min(1),
  selection_mode: z.enum(["BASELINE", "SPECIALIZED_REFERENCE"]),
  reason: z.string().min(1),
  adaptation_plan: z.string().min(1),
  scaffold_required: z.boolean().default(false),
  preserves_host_project: z.boolean().default(true),
  layerability_gate_unchanged: z.boolean().default(true),
  catalog_source: z.literal("https://www.remotion.dev/templates")
});
export type TemplateSelection = z.infer<typeof TemplateSelectionSchema>;

export const MotionDirectionSchema = z.object({
  job_id: z.string().min(1),
  scene_id: z.string().min(1),
  objective: z.string().min(1),
  story_function: z.string().default(""),
  primary_focus: z.string().min(1),
  secondary_focus: z.array(z.string()).default([]),
  personality: z.array(z.string()).default([]),
  intensity: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  rhythm: z.string().default(""),
  entry_strategy: z.string().default(""),
  main_action: z.string().default(""),
  highlight_moment: z.string().default(""),
  exit_strategy: z.string().default(""),
  camera_strategy: z.string().default(""),
  depth_strategy: z.string().default(""),
  typography_strategy: z.string().default(""),
  audio_strategy: z.string().default("")
});
export type MotionDirection = z.infer<typeof MotionDirectionSchema>;

export const TimelineActionSchema = z.object({
  element_id: z.string().min(1),
  start_frame: z.number().int().nonnegative(),
  end_frame: z.number().int().nonnegative(),
  action: z.string().min(1),
  motion_family: z.string().min(1),
  properties: z.record(z.string(), z.boolean()).default({})
}).refine((value) => value.end_frame >= value.start_frame, {
  message: "end_frame must be greater than or equal to start_frame"
});

export const MotionSpecSchema = z.object({
  job_id: z.string().min(1),
  scene_id: z.string().min(1),
  duration_frames: z.number().int().positive(),
  fps: z.number().int().positive(),
  timeline: z.array(TimelineActionSchema),
  motion_tokens: z.record(z.string(), z.unknown()).default({}),
  transition_strategy: z.string().default(""),
  reduced_motion_strategy: z.string().default("")
});
export type MotionSpec = z.infer<typeof MotionSpecSchema>;

export const QAIssueSchema = z.object({
  issue_id: z.string().min(1),
  scene_id: z.string().min(1),
  frame_start: z.number().int().nonnegative().nullable().default(null),
  frame_end: z.number().int().nonnegative().nullable().default(null),
  category: z.enum(["FIDELITY", "LAYERABILITY", "MOTION", "COMPOSITION", "BRAND", "TECHNICAL", "REGRESSION"]),
  severity: SeveritySchema,
  element_id: z.string().nullable().default(null),
  expected: z.string().min(1),
  observed: z.string().min(1),
  responsible_agent: z.string().min(1),
  recommended_action: z.string().min(1),
  blocks_delivery: z.boolean()
});
export type QAIssue = z.infer<typeof QAIssueSchema>;

export const QAReportSchema = z.object({
  job_id: z.string().min(1),
  scene_id: z.string().min(1),
  critic: z.string().min(1),
  result: z.enum(["PASS", "FAIL"]),
  critical_issues: z.number().int().nonnegative(),
  major_issues: z.number().int().nonnegative(),
  minor_issues: z.number().int().nonnegative(),
  issues: z.array(QAIssueSchema)
});
export type QAReport = z.infer<typeof QAReportSchema>;

export const BuildResultSchema = z.object({
  job_id: z.string().min(1),
  scene_id: z.string().min(1),
  builder: z.string().min(1),
  status: AgentStatusSchema,
  files_changed: z.array(z.string()).default([]),
  assets_used: z.array(z.string()).default([]),
  components_created: z.array(z.string()).default([]),
  components_reused: z.array(z.string()).default([]),
  independent_layers: z.array(z.string()).default([]),
  flattened_foreground_used: z.boolean().default(false),
  known_limitations: z.array(z.string()).default([])
});
export type BuildResult = z.infer<typeof BuildResultSchema>;

export const AttemptMemorySchema = z.object({
  issue_id: z.string().min(1),
  attempt_number: z.number().int().positive(),
  technique: z.string().min(1),
  change_summary: z.string().default(""),
  result: z.enum(["SUCCESS", "FAIL"]),
  failure_reason: z.string().default(""),
  created_regression: z.boolean().default(false)
});
export type AttemptMemory = z.infer<typeof AttemptMemorySchema>;

export const JobContextSchema = z.object({
  job_id: z.string().min(1),
  scene_id: z.string().min(1),
  state: JobStateSchema,
  brief: VideoBriefSchema,
  assets: AssetManifestSchema.optional(),
  decomposition: DecompositionSchema.optional(),
  template_selection: TemplateSelectionSchema.optional(),
  motion_direction: MotionDirectionSchema.optional(),
  motion_spec: MotionSpecSchema.optional(),
  build_result: BuildResultSchema.optional(),
  qa_reports: z.array(QAReportSchema).default([]),
  open_issues: z.array(QAIssueSchema).default([]),
  locked_elements: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({})
});
export type JobContext = z.infer<typeof JobContextSchema>;
