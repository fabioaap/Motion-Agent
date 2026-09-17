import type { JobContext } from "./contracts.js";

export type AgentName =
  | "director"
  | "context_router"
  | "asset_inspector"
  | "source_asset_agent"
  | "decomposition_agent"
  | "creative_reference_agent"
  | "motion_director"
  | "motion_spec_agent"
  | "ui_react_specialist"
  | "svg_motion_specialist"
  | "motion_specialist"
  | "composition_agent"
  | "remotion_specialist"
  | "brand_system_specialist"
  | "fidelity_critic"
  | "visual_fidelity_critic"
  | "motion_critic"
  | "composition_critic"
  | "brand_critic"
  | "technical_validator"
  | "regression_checker"
  | "render_agent";

export type AgentResult = {
  context: JobContext;
  notes?: string[];
};

export interface AgentHandler {
  name: AgentName;
  run(context: JobContext): Promise<AgentResult>;
}

export class AgentRegistry {
  private handlers = new Map<AgentName, AgentHandler>();

  register(handler: AgentHandler): this {
    this.handlers.set(handler.name, handler);
    return this;
  }

  get(name: AgentName): AgentHandler {
    const handler = this.handlers.get(name);
    if (!handler) throw new Error(`Agent not registered: ${name}`);
    return handler;
  }

  has(name: AgentName): boolean {
    return this.handlers.has(name);
  }
}
