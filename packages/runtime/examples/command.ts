import {
  AgentRegistry,
  MotionCommandGateway,
  MotionOrchestrator,
  type AgentHandler,
  type AgentName,
  type JobContext
} from "../src/index.js";

function passthrough(name: AgentName, mutate?: (context: JobContext) => JobContext): AgentHandler {
  return {
    name,
    async run(context) {
      return { context: mutate ? mutate(structuredClone(context)) : context };
    }
  };
}

const registry = new AgentRegistry();

for (const name of [
  "director",
  "asset_inspector",
  "creative_reference_agent",
  "motion_director",
  "motion_spec_agent",
  "remotion_specialist",
  "ui_react_specialist",
  "svg_motion_specialist",
  "composition_agent",
  "source_asset_agent",
  "fidelity_critic",
  "motion_critic",
  "composition_critic",
  "technical_validator",
  "render_agent"
] as AgentName[]) {
  registry.register(
    passthrough(name, (context) => {
      if (name.endsWith("critic") || name === "technical_validator") {
        context.qa_reports.push({
          job_id: context.job_id,
          scene_id: context.scene_id,
          critic: name,
          result: "PASS",
          critical_issues: 0,
          major_issues: 0,
          minor_issues: 0,
          issues: []
        });
      }
      return context;
    })
  );
}

const orchestrator = new MotionOrchestrator(registry, {
  requireHumanApproval: true
});
const motion = new MotionCommandGateway(orchestrator);

const result = await motion.invokeWithScene(
  "@motion quero uma animação premium desse dashboard mostrando uma oportunidade descoberta pela IA",
  {
    attachments: [
      {
        name: "dashboard.svg",
        path: "demo/dashboard.svg",
        mime_type: "image/svg+xml",
        source: "user"
      }
    ]
  }
);

console.log(JSON.stringify({
  job_id: result.context.job_id,
  state: result.context.state,
  request: result.context.metadata.invocation,
  materials: result.context.brief.materials,
  scene: {
    composition: "MotionScene",
    layers: result.scene.layers.length,
    firstLayerSource: result.scene.layers[0]?.source,
    firstLayerOriginal: result.scene.layers[0]?.originalAsset
  }
}, null, 2));
