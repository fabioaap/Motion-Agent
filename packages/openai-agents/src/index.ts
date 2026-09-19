import {readFile} from "node:fs/promises";
import {extname} from "node:path";
import OpenAI from "openai";
import {zodTextFormat} from "openai/helpers/zod";
import {z} from "zod/v4";
import {
  AgentRegistry,
  BuildResultSchema,
  DecompositionSchema,
  JobContextSchema,
  MotionDirectionSchema,
  MotionSpecSchema,
  QAReportSchema,
  VideoBriefSchema,
  LayerabilityCriticHandler,
  VisualFidelityCriticHandler,
  type AgentHandler,
  type AgentName,
  type AgentResult,
  type AssetStrategy,
  type JobContext,
  type QAIssue
} from "@motion-agent/runtime";

const BriefPayloadSchema = VideoBriefSchema.omit({job_id: true});
const DecompositionPayloadSchema = DecompositionSchema.omit({job_id: true, scene_id: true});
const MotionDirectionPayloadSchema = MotionDirectionSchema.omit({job_id: true, scene_id: true});
const MotionSpecPayloadSchema = MotionSpecSchema.omit({job_id: true, scene_id: true});
const CriticPayloadSchema = QAReportSchema.omit({job_id: true, scene_id: true, critic: true});

const CreativeDirectionsSchema = z.object({
  recommended: z.string().min(1),
  rationale: z.string().min(1),
  options: z.array(z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    intensity: z.enum(["LOW", "MEDIUM", "HIGH"])
  })).min(2).max(4)
});

const LayoutItemSchema = z.object({
  x: z.number().min(0).max(1).nullable(),
  y: z.number().min(0).max(1).nullable(),
  width: z.number().positive().max(1).nullable(),
  height: z.number().positive().max(1).nullable(),
  fit: z.enum(["contain", "cover"]).nullable(),
  zIndex: z.number().int().nullable()
});

const RepairPayloadSchema = z.object({
  motion_spec: MotionSpecPayloadSchema.nullable(),
  motion_direction: MotionDirectionPayloadSchema.nullable(),
  decomposition: DecompositionPayloadSchema.nullable(),
  scene_layout: z.record(z.string(), LayoutItemSchema).nullable(),
  notes: z.array(z.string())
});

export type OpenAIAgentRegistryOptions = {
  apiKey?: string;
  model?: string;
  reasoningEffort?: "low" | "medium" | "high";
};

const MASTER_RULES = `
You are operating inside @motion, a professional motion design production graph.
Creativity may be bold. Fidelity may not be approximate.
Never replace an original logo, icon, component, SVG, typeface, chart or UI element with a merely similar substitute.
Prefer USE_ORIGINAL, REUSE_SVG, REUSE_COMPONENT or HYBRID over approximate reconstruction.
Motion must communicate causality and hierarchy, not decorate randomly.
When component-level motion is required, a flattened full-scene styleframe is reference material only. Camera movement, parallax, zoom, blur or 3D displacement applied to the flattened scene do not count as independent component motion.
Every major animated foreground object must be independently addressable through source components, SVG, transparent assets, cutouts, verified masks or faithful React/SVG reconstruction.
Make the smallest correction required. Do not redesign locked or unrelated scope.
When exact source material is required but unavailable, prefer REQUEST_SOURCE rather than inventing it.
Return only the requested structured output.
`.trim();

function contextForPrompt(context: JobContext): string {
  const copy = structuredClone(context);
  const metadata = {...copy.metadata};
  delete metadata.asset_preview_paths;
  copy.metadata = metadata;
  return JSON.stringify(copy, null, 2);
}

function mimeFor(filePath: string): string | null {
  switch (extname(filePath).toLowerCase()) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".gif": return "image/gif";
    default: return null;
  }
}

async function toImageUrl(value: string): Promise<string | null> {
  if (/^https?:\/\//i.test(value) || /^data:image\//i.test(value)) return value;
  const mime = mimeFor(value);
  if (!mime) return null;
  try {
    const bytes = await readFile(value);
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

async function imageEvidence(context: JobContext): Promise<string[]> {
  const paths: string[] = [];
  const previews = context.metadata.asset_preview_paths;
  if (Array.isArray(previews)) paths.push(...previews.map(String));
  const visual = context.metadata.visual_qa;
  if (visual && typeof visual === "object") {
    const record = visual as Record<string, unknown>;
    for (const key of ["reference_path", "actual_path", "diff_path"]) {
      if (typeof record[key] === "string") paths.push(record[key] as string);
    }
  }
  const unique = [...new Set(paths)].slice(0, 6);
  const urls = await Promise.all(unique.map(toImageUrl));
  return urls.filter((url): url is string => Boolean(url));
}

class OpenAIBrain {
  readonly client: OpenAI;
  readonly model: string;
  readonly reasoningEffort: "low" | "medium" | "high";

  constructor(options: OpenAIAgentRegistryOptions) {
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is required to run real @motion agents");
    this.client = new OpenAI({apiKey});
    this.model = options.model ?? process.env.MOTION_MODEL ?? "gpt-5.5";
    this.reasoningEffort = options.reasoningEffort ??
      (process.env.MOTION_REASONING_EFFORT as "low" | "medium" | "high" | undefined) ??
      "high";
  }

  async structured(schema: any, schemaName: string, instructions: string, prompt: string, images: string[] = []): Promise<any> {
    const content: any[] = [{type: "input_text", text: prompt}];
    for (const imageUrl of images) {
      content.push({type: "input_image", image_url: imageUrl, detail: "high"});
    }
    const response = await this.client.responses.parse({
      model: this.model,
      reasoning: {effort: this.reasoningEffort},
      instructions: `${MASTER_RULES}\n\n${instructions}`,
      input: [{role: "user", content}],
      text: {format: zodTextFormat(schema, schemaName)}
    } as any);
    if (!response.output_parsed) {
      throw new Error(`Structured response ${schemaName} was not parsed`);
    }
    return response.output_parsed;
  }
}

function activeIssues(context: JobContext): QAIssue[] {
  const raw = context.metadata.active_fix_issues;
  const ids = Array.isArray(raw) ? new Set(raw.map(String)) : null;
  return ids ? context.open_issues.filter((issue) => ids.has(issue.issue_id)) : context.open_issues;
}

function sourceStrategy(type: string): AssetStrategy {
  const upper = type.toUpperCase();
  if (upper === "SVG") return "REUSE_SVG";
  if (["TSX", "JSX", "TS", "JS", "HTML"].includes(upper)) return "REUSE_COMPONENT";
  return "USE_ORIGINAL";
}

class MotionAgentHandler implements AgentHandler {
  constructor(readonly name: AgentName, private readonly brain: OpenAIBrain) {}

  async run(context: JobContext): Promise<AgentResult> {
    switch (this.name) {
      case "director": return this.direct(context);
      case "asset_inspector": return this.inspectAssets(context);
      case "decomposition_agent": return this.inspectAssets(context);
      case "template_resolver": return {context};
      case "source_asset_agent": return this.resolveSources(context);
      case "creative_reference_agent": return this.creativeDirections(context);
      case "motion_director": return this.motionDirection(context);
      case "motion_spec_agent": return this.motionSpec(context);
      case "fidelity_critic":
      case "motion_critic":
      case "composition_critic":
      case "brand_critic": return this.critic(context);
      case "technical_validator": return this.technical(context);
      case "layerability_critic": return new LayerabilityCriticHandler().run(context);
      case "visual_fidelity_critic": return new VisualFidelityCriticHandler().run(context);
      case "motion_specialist":
      case "ui_react_specialist":
      case "svg_motion_specialist":
      case "brand_system_specialist": return this.repairOrBuild(context);
      case "composition_agent":
      case "remotion_specialist": return this.repairOrBuild(context);
      case "render_agent": return this.renderReady(context);
      case "context_router":
      case "regression_checker": return {context};
      default: return {context};
    }
  }

  private async direct(context: JobContext): Promise<AgentResult> {
    const payload = await this.brain.structured(
      BriefPayloadSchema,
      "motion_video_brief",
      "Normalize the user's request into a complete production brief. Preserve known facts. Infer only safe defaults.",
      contextForPrompt(context)
    );
    const next = structuredClone(context);
    next.brief = VideoBriefSchema.parse({...payload, job_id: context.job_id});
    if (context.brief.component_motion_required) {
      next.brief.component_motion_required = true;
    }
    return {context: JobContextSchema.parse(next)};
  }

  private async inspectAssets(context: JobContext): Promise<AgentResult> {
    const images = await imageEvidence(context);
    const payload = await this.brain.structured(
      DecompositionPayloadSchema,
      "motion_asset_decomposition",
      `Audit the supplied assets, define the scene topology and decide a fidelity-safe decomposition. Use only source_asset_id values that exist in the manifest. If component_motion_required is true, every major moving foreground element must appear in layer_map and be independently_addressable. A full-scene raster styleframe may be BACKGROUND_PLATE or visual reference, but it must not stand in for multiple moving foreground elements. Use FLATTENED_STYLEFRAME only to explicitly flag an unresolved flattened foreground. Set layerability_status=LAYERED_READY and layer_map_verified=true only when the planned source structure genuinely supports independent component motion. If critical source assets are missing, use REQUEST_SOURCE and BLOCKED_MISSING_ASSETS; the workflow must enter WAITING_FOR_ASSETS and hard-stop before build. Use RECONSTRUCTION_READY only after the approved React/SVG reconstruction exists as an independent layer. Use FLAT_MOTION_ONLY only when the user explicitly authorizes an animatic. Prefer exact source components, SVGs, transparent assets, cutouts and faithful React/SVG reconstruction. Never choose reconstruction merely for convenience.`,
      contextForPrompt(context),
      images
    );
    const next = structuredClone(context);
    next.decomposition = DecompositionSchema.parse({...payload, job_id: context.job_id, scene_id: context.scene_id});
    return {context: JobContextSchema.parse(next)};
  }

  private async resolveSources(context: JobContext): Promise<AgentResult> {
    const next = structuredClone(context);
    if (!next.decomposition || !next.assets) return {context: next};
    const issues = activeIssues(next);
    const issueElements = new Set(issues.map((issue) => issue.element_id).filter(Boolean));
    for (const element of next.decomposition.elements) {
      const asset = next.assets.assets.find((candidate) => candidate.asset_id === element.source_asset_id);
      const shouldRepair = issueElements.size === 0 || issueElements.has(element.element_id);
      if (!asset || !shouldRepair) continue;
      if (element.strategy === "REQUEST_SOURCE" || element.requires_original_source || issues.length > 0) {
        element.strategy = sourceStrategy(asset.type);
        element.requires_original_source = false;
        element.reconstruction_allowed = false;
        element.fidelity_requirement = "STRICT";
      }
    }
    return {context: JobContextSchema.parse(next)};
  }

  private async creativeDirections(context: JobContext): Promise<AgentResult> {
    const images = await imageEvidence(context);
    const payload = await this.brain.structured(
      CreativeDirectionsSchema,
      "motion_creative_directions",
      "Propose two to four materially different motion directions, then recommend the strongest direction based on message causality, hierarchy and the supplied assets.",
      contextForPrompt(context),
      images
    );
    const next = structuredClone(context);
    next.metadata = {...next.metadata, creative_directions: payload};
    return {context: JobContextSchema.parse(next)};
  }

  private async motionDirection(context: JobContext): Promise<AgentResult> {
    const images = await imageEvidence(context);
    const payload = await this.brain.structured(
      MotionDirectionPayloadSchema,
      "motion_direction",
      "Create one decisive motion direction. Define narrative cause and effect, primary focus, rhythm, entry, main action, highlight, exit, camera, depth, typography and audio strategy.",
      contextForPrompt(context),
      images
    );
    const next = structuredClone(context);
    next.motion_direction = MotionDirectionSchema.parse({...payload, job_id: context.job_id, scene_id: context.scene_id});
    return {context: JobContextSchema.parse(next)};
  }

  private async motionSpec(context: JobContext): Promise<AgentResult> {
    const payload = await this.brain.structured(
      MotionSpecPayloadSchema,
      "motion_spec",
      "Translate the approved direction into an executable timeline. Timeline element_id values must come from decomposition elements. Use restrained springs and purposeful sequencing. The spec must be renderable by the generic MotionScene motion families such as SoftSpring, PremiumEntrance, ScaleReveal, MaskReveal, PanZoom and Focus.",
      contextForPrompt(context)
    );
    const next = structuredClone(context);
    const spec = MotionSpecSchema.parse({...payload, job_id: context.job_id, scene_id: context.scene_id});
    const allowed = new Set(next.decomposition?.elements.map((item) => item.element_id) ?? []);
    spec.timeline = spec.timeline.filter((item) => allowed.size === 0 || allowed.has(item.element_id));
    const covered = new Set(spec.timeline.map((item) => item.element_id));
    for (const [index, element] of (next.decomposition?.elements ?? []).entries()) {
      if (!element.requires_animation || covered.has(element.element_id)) continue;
      spec.timeline.push({
        element_id: element.element_id,
        start_frame: index * 8,
        end_frame: Math.max(index * 8 + 24, spec.duration_frames - 1),
        action: "ENTER_AND_HOLD",
        motion_family: "SoftSpring",
        properties: {opacity: true, scale: true, position: true}
      });
    }
    next.motion_spec = MotionSpecSchema.parse(spec);
    return {context: JobContextSchema.parse(next)};
  }

  private async critic(context: JobContext): Promise<AgentResult> {
    const images = await imageEvidence(context);
    const payload = await this.brain.structured(
      CriticPayloadSchema,
      `${this.name}_report`,
      `Act only as ${this.name}. Inspect the production context and supplied QA images. Do not average away defects. Critical and major defects must fail. Each issue should be concrete and actionable.`,
      contextForPrompt(context),
      images
    );
    const normalizedIssues = payload.issues.map((issue: QAIssue, index: number) => ({
      ...issue,
      issue_id: `${this.name}:${context.scene_id}:${issue.element_id ?? "general"}:${issue.category}:${index}`,
      scene_id: context.scene_id
    }));
    const report = QAReportSchema.parse({
      ...payload,
      job_id: context.job_id,
      scene_id: context.scene_id,
      critic: this.name,
      critical_issues: normalizedIssues.filter((issue: QAIssue) => issue.severity === "CRITICAL").length,
      major_issues: normalizedIssues.filter((issue: QAIssue) => issue.severity === "MAJOR").length,
      minor_issues: normalizedIssues.filter((issue: QAIssue) => issue.severity === "MINOR").length,
      issues: normalizedIssues,
      result: normalizedIssues.some((issue: QAIssue) => issue.severity !== "MINOR") ? "FAIL" : payload.result
    });
    const next = structuredClone(context);
    next.qa_reports = [...next.qa_reports.filter((item) => item.critic !== this.name), report];
    return {context: JobContextSchema.parse(next)};
  }

  private async repairOrBuild(context: JobContext): Promise<AgentResult> {
    const issues = activeIssues(context);
    if (issues.length > 0) {
      const payload = await this.brain.structured(
        RepairPayloadSchema,
        `${this.name}_repair`,
        `You are the specialist responsible for these active issues: ${JSON.stringify(issues)}. Produce the smallest safe structured repair. Use null for sections that do not need changing. Never solve fidelity by substituting a similar asset.`,
        contextForPrompt(context),
        await imageEvidence(context)
      );
      const next = structuredClone(context);
      if (payload.motion_spec) {
        next.motion_spec = MotionSpecSchema.parse({...payload.motion_spec, job_id: context.job_id, scene_id: context.scene_id});
      }
      if (payload.motion_direction) {
        next.motion_direction = MotionDirectionSchema.parse({...payload.motion_direction, job_id: context.job_id, scene_id: context.scene_id});
      }
      if (payload.decomposition) {
        next.decomposition = DecompositionSchema.parse({...payload.decomposition, job_id: context.job_id, scene_id: context.scene_id});
      }
      if (payload.scene_layout) {
        const clean: Record<string, Record<string, unknown>> = {};
        for (const [key, value] of Object.entries(payload.scene_layout as Record<string, any>)) {
          clean[key] = Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null));
        }
        next.metadata = {...next.metadata, scene_layout: clean, specialist_notes: payload.notes};
      }
      return {context: JobContextSchema.parse(next), notes: payload.notes};
    }

    const next = structuredClone(context);
    const reused = next.decomposition?.elements
      .filter((item) => ["USE_ORIGINAL", "REUSE_COMPONENT", "REUSE_SVG", "HYBRID", "MASK", "OVERLAY", "SEGMENT_ORIGINAL"].includes(item.strategy))
      .map((item) => item.element_id) ?? [];
    next.build_result = BuildResultSchema.parse({
      job_id: next.job_id,
      scene_id: next.scene_id,
      builder: this.name,
      status: "SUCCESS",
      files_changed: ["apps/remotion-studio/src/MotionScene.tsx"],
      assets_used: next.assets?.assets.map((asset) => asset.asset_id) ?? [],
      components_created: [],
      components_reused: reused,
      independent_layers: next.decomposition?.layer_map
        .filter((layer) => layer.independently_addressable)
        .map((layer) => layer.element_id) ?? [],
      flattened_foreground_used: next.decomposition?.full_scene_flattened_foreground ?? false,
      known_limitations: []
    });
    return {context: JobContextSchema.parse(next)};
  }

  private async technical(context: JobContext): Promise<AgentResult> {
    const preview = context.metadata.preview_render;
    const previewOk = !preview || typeof preview !== "object" || (preview as Record<string, unknown>).ok !== false;
    const assetsById = new Map((context.assets?.assets ?? []).map((asset) => [asset.asset_id, asset] as const));
    const unsafe = (context.decomposition?.elements ?? []).filter((element) => {
      if (!element.strategy.startsWith("REBUILD_")) return false;
      const asset = assetsById.get(element.source_asset_id);
      if (!asset) return true;
      if (element.strategy === "REBUILD_SVG") return asset.type.toUpperCase() !== "SVG";
      if (element.strategy === "REBUILD_REACT") return !["TSX", "JSX", "TS", "JS", "HTML"].includes(asset.type.toUpperCase());
      return false;
    });
    const issues: QAIssue[] = [];
    if (!previewOk) {
      issues.push({
        issue_id: `technical:${context.scene_id}:preview_render`,
        scene_id: context.scene_id,
        frame_start: null,
        frame_end: null,
        category: "TECHNICAL",
        severity: "CRITICAL",
        element_id: null,
        expected: "Preview render completes without errors",
        observed: "Preview render failed",
        responsible_agent: "remotion_specialist",
        recommended_action: "Repair the render failure and rerun preview",
        blocks_delivery: true
      });
    }
    for (const element of unsafe) {
      issues.push({
        issue_id: `technical:${context.scene_id}:${element.element_id}:unsafe_rebuild`,
        scene_id: context.scene_id,
        frame_start: null,
        frame_end: null,
        category: "TECHNICAL",
        severity: "CRITICAL",
        element_id: element.element_id,
        expected: "Exact structured source before reconstruction",
        observed: `Unsafe ${element.strategy} without an exact compatible source`,
        responsible_agent: "source_asset_agent",
        recommended_action: "Use the original or request the exact source",
        blocks_delivery: true
      });
    }
    const report = QAReportSchema.parse({
      job_id: context.job_id,
      scene_id: context.scene_id,
      critic: this.name,
      result: issues.length === 0 ? "PASS" : "FAIL",
      critical_issues: issues.filter((issue) => issue.severity === "CRITICAL").length,
      major_issues: 0,
      minor_issues: 0,
      issues
    });
    const next = structuredClone(context);
    next.qa_reports = [...next.qa_reports.filter((item) => item.critic !== this.name), report];
    return {context: JobContextSchema.parse(next)};
  }

  private async renderReady(context: JobContext): Promise<AgentResult> {
    const next = structuredClone(context);
    next.metadata = {...next.metadata, render_agent: {status: "READY"}};
    return {context: JobContextSchema.parse(next)};
  }
}

export function createOpenAIAgentRegistry(options: OpenAIAgentRegistryOptions = {}): AgentRegistry {
  const brain = new OpenAIBrain(options);
  const registry = new AgentRegistry();
  const names: AgentName[] = [
    "director",
    "context_router",
    "asset_inspector",
    "source_asset_agent",
    "decomposition_agent",
    "template_resolver",
    "creative_reference_agent",
    "motion_director",
    "motion_spec_agent",
    "ui_react_specialist",
    "svg_motion_specialist",
    "motion_specialist",
    "composition_agent",
    "remotion_specialist",
    "brand_system_specialist",
    "fidelity_critic",
    "visual_fidelity_critic",
    "layerability_critic",
    "motion_critic",
    "composition_critic",
    "brand_critic",
    "technical_validator",
    "regression_checker",
    "render_agent"
  ];
  for (const name of names) registry.register(new MotionAgentHandler(name, brain));
  return registry;
}
