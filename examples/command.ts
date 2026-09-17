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
  "composition_agent",
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

const result = await motion.invoke(
  "@motion quero uma animação premium desse dashboard mostrando uma oportunidade descoberta pela IA",
  {
    attachments: [
      {
        name: "dashboard.png",
        path: "./assets/dashboard.png",
        mime_type: "image/png",
        source: "user"
      }
    ]
  }
);

console.log(JSON.stringify({
  job_id: result.job_id,
  state: result.state,
  request: result.metadata.invocation,
  materials: result.brief.materials
}, null, 2));
