import type { JobContext } from "./contracts.js";
import type { AgentName } from "./agents.js";
import {requiresLayerability} from "./qa.js";

export type GraphNode = {
  id: string;
  agent: AgentName;
  phase: "DISCOVERY" | "BUILD" | "QA" | "DELIVERY";
  depends_on: string[];
  parallel_group: string | null;
  required: boolean;
};

export type ExecutionGraph = {
  nodes: GraphNode[];
  build_agents: AgentName[];
  qa_agents: AgentName[];
};

function node(
  id: string,
  agent: AgentName,
  phase: GraphNode["phase"],
  depends_on: string[] = [],
  parallel_group: string | null = null,
  required = true
): GraphNode {
  return { id, agent, phase, depends_on, parallel_group, required };
}

export function planExecutionGraph(context: JobContext): ExecutionGraph {
  const nodes: GraphNode[] = [];

  nodes.push(node("director", "director", "DISCOVERY"));
  nodes.push(node("asset_inspector", "asset_inspector", "DISCOVERY", ["director"]));
  nodes.push(node("decomposition_agent", "decomposition_agent", "DISCOVERY", ["asset_inspector"]));

  const needsSource = context.decomposition?.elements.some(
    (element) => element.strategy === "REQUEST_SOURCE" || element.requires_original_source
  );
  if (needsSource) {
    nodes.push(
      node("source_asset_agent", "source_asset_agent", "DISCOVERY", ["decomposition_agent"])
    );
  }

  const templateDependency = needsSource ? "source_asset_agent" : "decomposition_agent";
  nodes.push(
    node(
      "template_resolver",
      "template_resolver",
      "DISCOVERY",
      [templateDependency]
    )
  );

  if (context.brief.user_direction_level === "LOW") {
    nodes.push(
      node(
        "creative_reference_agent",
        "creative_reference_agent",
        "DISCOVERY",
        ["template_resolver"]
      )
    );
  }

  const directionDependency = context.brief.user_direction_level === "LOW"
    ? "creative_reference_agent"
    : "template_resolver";

  nodes.push(node("motion_director", "motion_director", "DISCOVERY", [directionDependency]));
  nodes.push(node("motion_spec_agent", "motion_spec_agent", "DISCOVERY", ["motion_director"]));

  const strategies = new Set(context.decomposition?.elements.map((item) => item.strategy) ?? []);
  const buildAgents = new Set<AgentName>();

  if (
    strategies.has("REBUILD_REACT") ||
    strategies.has("REUSE_COMPONENT") ||
    strategies.has("HYBRID")
  ) {
    buildAgents.add("ui_react_specialist");
  }
  if (strategies.has("REBUILD_SVG") || strategies.has("REUSE_SVG")) {
    buildAgents.add("svg_motion_specialist");
  }
  buildAgents.add("remotion_specialist");

  for (const agent of buildAgents) {
    nodes.push(
      node(
        `build:${agent}`,
        agent,
        "BUILD",
        ["motion_spec_agent"],
        "build_parallel"
      )
    );
  }

  nodes.push(
    node(
      "composition_agent",
      "composition_agent",
      "BUILD",
      [...buildAgents].map((agent) => `build:${agent}`)
    )
  );

  const qaAgents: AgentName[] = [
    "fidelity_critic",
    ...(requiresLayerability(context) ? ["layerability_critic" as AgentName] : []),
    "motion_critic",
    "composition_critic",
    "technical_validator"
  ];
  if (context.brief.brand_context) qaAgents.push("brand_critic");

  for (const agent of qaAgents) {
    nodes.push(
      node(
        `qa:${agent}`,
        agent,
        "QA",
        ["composition_agent"],
        "qa_parallel"
      )
    );
  }

  nodes.push(
    node(
      "render_agent",
      "render_agent",
      "DELIVERY",
      qaAgents.map((agent) => `qa:${agent}`)
    )
  );

  return {
    nodes,
    build_agents: [...buildAgents],
    qa_agents: qaAgents
  };
}
