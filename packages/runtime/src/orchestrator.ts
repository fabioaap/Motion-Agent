import {
  JobContextSchema,
  TemplateSelectionSchema,
  type AssetStrategy,
  type JobContext,
  type QAIssue,
  type QAReport
} from "./contracts.js";
import { AgentRegistry, type AgentName } from "./agents.js";
import { AttemptStore } from "./memory.js";
import { aggregateQA, requiredCriticsFor, requiresLayerability } from "./qa.js";
import { routeIssue, chooseFallback } from "./routing.js";
import { MotionStateMachine } from "./state_machine.js";
import { Supervisor } from "./supervisor.js";
import { planExecutionGraph } from "./graph.js";
import { LayerabilityCriticHandler, RegressionCheckerHandler } from "./visual_guard.js";
import {resolveOfficialRemotionTemplate} from "./templates.js";

export type PreviewHook = (context: JobContext) => Promise<JobContext>;

export type OrchestratorOptions = {
  maxEquivalentFailures?: number;
  maxQaCycles?: number;
  requireHumanApproval?: boolean;
  previewHook?: PreviewHook;
};

export class MotionOrchestrator {
  private readonly attempts = new AttemptStore();
  private readonly supervisor = new Supervisor();
  private readonly maxEquivalentFailures: number;
  private readonly maxQaCycles: number;
  private readonly requireHumanApproval: boolean;
  private readonly previewHook?: PreviewHook;

  constructor(
    private readonly agents: AgentRegistry,
    options: OrchestratorOptions = {}
  ) {
    this.maxEquivalentFailures = options.maxEquivalentFailures ?? 3;
    this.maxQaCycles = options.maxQaCycles ?? 6;
    this.requireHumanApproval = options.requireHumanApproval ?? true;
    this.previewHook = options.previewHook;
  }

  async run(initial: JobContext): Promise<JobContext> {
    let context = JobContextSchema.parse(initial);
    const machine = new MotionStateMachine(context.state);
    let qaCycles = 0;

    context = await this.advance(context, machine, "CONTEXT_READY", "director");
    context = await this.advance(context, machine, "ASSET_AUDIT", "asset_inspector");
    context = await this.advance(context, machine, "SCENE_TOPOLOGY_AUDIT", "decomposition_agent");

    if (this.needsSourceResolution(context)) {
      context = await this.advance(context, machine, "SOURCE_RESOLUTION", "source_asset_agent");
      if (this.needsHumanSource(context)) {
        return this.setState(context, machine, "HUMAN_INPUT_REQUIRED");
      }
      context = await this.advance(context, machine, "SCENE_TOPOLOGY_AUDIT", "decomposition_agent");
    }

    context = this.setState(context, machine, "LAYERABILITY_GATE");
    const layerability = this.evaluateLayerabilityGate(context);
    context.metadata = {
      ...context.metadata,
      layerability_gate: layerability
    };
    if (!layerability.pass) {
      return this.setState(context, machine, "HUMAN_INPUT_REQUIRED");
    }

    if (context.brief.user_direction_level === "LOW") {
      context = await this.advance(
        context,
        machine,
        "DIRECTION_DISCOVERY",
        "creative_reference_agent"
      );
    }

    context = await this.advance(context, machine, "DIRECTION_READY", "motion_director");

    context = this.setState(context, machine, "TEMPLATE_RESOLUTION");
    context.template_selection = TemplateSelectionSchema.parse(
      resolveOfficialRemotionTemplate(context)
    );
    if (this.agents.has("template_resolver")) {
      context = JobContextSchema.parse(
        (await this.agents.get("template_resolver").run(context)).context
      );
    }

    context = await this.advance(context, machine, "MOTION_SPEC_READY", "motion_spec_agent");

    while (true) {
      qaCycles += 1;
      context.metadata = {...context.metadata, qa_cycle: qaCycles};
      context = await this.build(context, machine);
      context = this.setState(context, machine, "PREVIEW_READY");
      if (this.previewHook) {
        context = JobContextSchema.parse(await this.previewHook(context));
      }
      context = await this.runQAGraph(context, machine);

      const required = requiredCriticsFor(context);
      const aggregate = aggregateQA(context.qa_reports, required);
      context.open_issues = aggregate.openIssues;
      context = this.setState(context, machine, "QA_AGGREGATION");

      const supervision = this.supervisor.review(context, aggregate);
      if (aggregate.pass && supervision.approved) {
        context = this.setState(context, machine, "READY_FOR_HUMAN");
        if (this.requireHumanApproval) return context;
        context = this.setState(context, machine, "HUMAN_APPROVED");
        return this.render(context, machine);
      }

      context = this.setState(context, machine, "FIX_REQUIRED");
      if (qaCycles >= this.maxQaCycles) {
        context.metadata = {
          ...context.metadata,
          convergence: {
            status: "MAX_QA_CYCLES_REACHED",
            cycles: qaCycles,
            unresolved_issue_ids: context.open_issues.map((issue) => issue.issue_id)
          }
        };
        return this.setState(context, machine, "HUMAN_INPUT_REQUIRED");
      }

      const strategyReview = this.shouldReviewStrategy(context.open_issues);
      if (strategyReview) {
        context = this.setState(context, machine, "STRATEGY_REVIEW");
        const changed = this.applyFallbacks(context);
        if (!changed) {
          return this.setState(context, machine, "HUMAN_INPUT_REQUIRED");
        }
      }

      const hadLayerabilityIssue = context.open_issues.some(
        (issue) => issue.category === "LAYERABILITY"
      );
      context = await this.fixIssues(context);
      context.qa_reports = [];
      context.open_issues = [];

      if (hadLayerabilityIssue) {
        context = this.setState(context, machine, "SCENE_TOPOLOGY_AUDIT");
        context = this.setState(context, machine, "LAYERABILITY_GATE");
        const repairedLayerability = this.evaluateLayerabilityGate(context);
        context.metadata = {
          ...context.metadata,
          layerability_gate: repairedLayerability
        };
        if (!repairedLayerability.pass) {
          return this.setState(context, machine, "HUMAN_INPUT_REQUIRED");
        }
        context = this.setState(context, machine, "DIRECTION_READY");
        context = this.setState(context, machine, "TEMPLATE_RESOLUTION");
        context.template_selection = TemplateSelectionSchema.parse(
          resolveOfficialRemotionTemplate(context)
        );
      }

      context = this.setState(context, machine, "BUILDING");
    }
  }

  async approveAndRender(context: JobContext): Promise<JobContext> {
    const parsed = JobContextSchema.parse(context);
    if (parsed.state !== "READY_FOR_HUMAN") {
      throw new Error("Job must be READY_FOR_HUMAN before approval");
    }
    const machine = new MotionStateMachine(parsed.state);
    let next = this.setState(parsed, machine, "HUMAN_APPROVED");
    next = await this.render(next, machine);
    return next;
  }

  private async build(context: JobContext, machine: MotionStateMachine): Promise<JobContext> {
    if (machine.state !== "BUILDING") {
      context = this.setState(context, machine, "BUILDING");
    }

    const buildAgents = this.selectBuildAgents(context);
    const results = await Promise.all(
      buildAgents.map((name) => this.agents.get(name).run(structuredClone(context)))
    );

    for (const result of results) {
      context = this.mergeContext(context, result.context);
    }

    if (this.agents.has("composition_agent")) {
      context = (await this.agents.get("composition_agent").run(context)).context;
    }
    return JobContextSchema.parse(context);
  }

  private async runQAGraph(
    context: JobContext,
    machine: MotionStateMachine
  ): Promise<JobContext> {
    const required = requiredCriticsFor(context);
    const stateForCritic: Record<string, Parameters<MotionStateMachine["transition"]>[0] | null> = {
      fidelity_critic: "FIDELITY_REVIEW",
      layerability_critic: "FIDELITY_REVIEW",
      visual_fidelity_critic: "FIDELITY_REVIEW",
      motion_critic: "MOTION_REVIEW",
      composition_critic: "COMPOSITION_REVIEW",
      brand_critic: "BRAND_REVIEW",
      technical_validator: "TECHNICAL_REVIEW",
      regression_checker: null
    };

    context.qa_reports = [];
    const reviewStates: Parameters<MotionStateMachine["transition"]>[0][] = [];
    for (const critic of required) {
      const target = stateForCritic[critic];
      if (target && !reviewStates.includes(target)) reviewStates.push(target);
    }
    for (const target of reviewStates) {
      if (machine.state !== target) context = this.setState(context, machine, target);
    }

    const qaInput = structuredClone(context);
    const results = await Promise.all(required.map(async (critic) => {
      if (critic === "layerability_critic") {
        return new LayerabilityCriticHandler().run(structuredClone(qaInput));
      }
      if (critic === "regression_checker") {
        return new RegressionCheckerHandler().run(structuredClone(qaInput));
      }
      return this.agents.get(critic as AgentName).run(structuredClone(qaInput));
    }));

    for (const result of results) {
      context = this.mergeContext(context, result.context);
    }
    return JobContextSchema.parse(context);
  }

  private async fixIssues(context: JobContext): Promise<JobContext> {
    const grouped = new Map<AgentName, QAIssue[]>();

    for (const issue of context.open_issues) {
      const specialist = routeIssue(issue) as AgentName;
      const list = grouped.get(specialist) ?? [];
      list.push(issue);
      grouped.set(specialist, list);
    }

    for (const [specialist, issues] of grouped) {
      if (!this.agents.has(specialist)) continue;
      const scoped = structuredClone(context);
      scoped.metadata = {
        ...scoped.metadata,
        active_fix_issues: issues.map((issue) => issue.issue_id)
      };
      const result = await this.agents.get(specialist).run(scoped);
      context = this.mergeContext(context, result.context);

      for (const issue of issues) {
        const technique = this.techniqueForIssue(context, issue);
        this.attempts.record({
          issue_id: issue.issue_id,
          attempt_number: this.attempts.forIssue(issue.issue_id).length + 1,
          technique,
          change_summary: `Fix delegated to ${specialist}`,
          result: "FAIL",
          failure_reason: "Pending next QA cycle",
          created_regression: false
        });
      }
    }
    return context;
  }

  private shouldReviewStrategy(issues: QAIssue[]): boolean {
    return issues.some(
      (issue) => this.attempts.countFailures(issue.issue_id) >= this.maxEquivalentFailures
    );
  }

  private applyFallbacks(context: JobContext): boolean {
    if (!context.decomposition) return false;
    let changed = false;

    for (const issue of context.open_issues) {
      const element = context.decomposition.elements.find(
        (candidate) => candidate.element_id === issue.element_id
      );
      if (!element) continue;

      const tried = this.attempts
        .forIssue(issue.issue_id)
        .map((attempt) => attempt.technique)
        .filter((value): value is AssetStrategy =>
          [
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
          ].includes(value)
        );

      const fallback = chooseFallback(element.strategy, tried);
      if (fallback) {
        element.strategy = fallback;
        changed = true;
      }
    }
    return changed;
  }

  private selectBuildAgents(context: JobContext): AgentName[] {
    return planExecutionGraph(context).build_agents;
  }

  private evaluateLayerabilityGate(context: JobContext): {pass: boolean; status: string; reasons: string[]} {
    if (!requiresLayerability(context)) {
      return {pass: true, status: "NOT_REQUIRED", reasons: []};
    }

    const decomposition = context.decomposition;
    const reasons: string[] = [];

    if (!decomposition) {
      reasons.push("Missing decomposition for component-level motion");
      return {pass: false, status: "FAIL", reasons};
    }

    if (decomposition.layerability_status !== "LAYERED_READY") {
      reasons.push(`Layerability status is ${decomposition.layerability_status}`);
    }
    if (!decomposition.layer_map_verified) {
      reasons.push("Layer Map is not verified");
    }
    if (decomposition.full_scene_flattened_foreground) {
      reasons.push("Flattened full-scene foreground detected");
    }

    const layerMap = new Map(decomposition.layer_map.map((layer) => [layer.element_id, layer]));
    for (const element of decomposition.elements.filter((item) => item.requires_animation)) {
      const layer = layerMap.get(element.element_id);
      if (!layer) {
        reasons.push(`Animated element ${element.element_id} is missing from the Layer Map`);
        continue;
      }
      if (!layer.independently_addressable) {
        reasons.push(`Animated element ${element.element_id} is not independently addressable`);
      }
      if (layer.source_kind === "FLATTENED_STYLEFRAME") {
        reasons.push(`Animated element ${element.element_id} still depends on a flattened styleframe`);
      }
    }

    return {
      pass: reasons.length === 0,
      status: reasons.length === 0 ? "PASS" : "FAIL",
      reasons
    };
  }

  private needsSourceResolution(context: JobContext): boolean {
    return Boolean(
      context.decomposition?.elements.some(
        (element) => element.strategy === "REQUEST_SOURCE" || element.requires_original_source
      )
    );
  }

  private needsHumanSource(context: JobContext): boolean {
    return Boolean(
      context.decomposition?.elements.some((element) => element.strategy === "REQUEST_SOURCE")
    );
  }

  private techniqueForIssue(context: JobContext, issue: QAIssue): string {
    return (
      context.decomposition?.elements.find((element) => element.element_id === issue.element_id)
        ?.strategy ?? "UNKNOWN"
    );
  }

  private async advance(
    context: JobContext,
    machine: MotionStateMachine,
    state: Parameters<MotionStateMachine["transition"]>[0],
    agent: AgentName
  ): Promise<JobContext> {
    context = this.setState(context, machine, state);
    if (!this.agents.has(agent)) return context;
    const result = await this.agents.get(agent).run(context);
    return JobContextSchema.parse(result.context);
  }

  private setState(
    context: JobContext,
    machine: MotionStateMachine,
    state: Parameters<MotionStateMachine["transition"]>[0]
  ): JobContext {
    machine.transition(state);
    return JobContextSchema.parse({ ...context, state });
  }

  private mergeContext(base: JobContext, incoming: JobContext): JobContext {
    const qaByCritic = new Map<string, QAReport>();
    for (const report of [...base.qa_reports, ...incoming.qa_reports]) {
      qaByCritic.set(`${report.scene_id}:${report.critic}`, report);
    }

    return JobContextSchema.parse({
      ...base,
      ...incoming,
      metadata: { ...base.metadata, ...incoming.metadata },
      qa_reports: [...qaByCritic.values()]
    });
  }

  private async render(context: JobContext, machine: MotionStateMachine): Promise<JobContext> {
    context = this.setState(context, machine, "FINAL_RENDER");
    if (this.agents.has("render_agent")) {
      context = (await this.agents.get("render_agent").run(context)).context;
    }
    context = this.setState(context, machine, "DELIVERED");
    return context;
  }
}
