import {
  AgentRegistry,
  MotionOrchestrator,
  type AgentHandler,
  type AgentName,
  type JobContext,
  JobContextSchema
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
  "remotion_specialist",
  "composition_agent",
  "brand_system_specialist",
  "regression_checker",
  "render_agent"
] as AgentName[]) {
  registry.register(passthrough(name));
}

registry.register(
  passthrough("fidelity_critic", (context) => {
    context.qa_reports.push({
      job_id: context.job_id,
      scene_id: context.scene_id,
      critic: "fidelity_critic",
      result: "PASS",
      critical_issues: 0,
      major_issues: 0,
      minor_issues: 0,
      issues: []
    });
    return context;
  })
);

registry.register(
  passthrough("motion_critic", (context) => {
    context.qa_reports.push({
      job_id: context.job_id,
      scene_id: context.scene_id,
      critic: "motion_critic",
      result: "PASS",
      critical_issues: 0,
      major_issues: 0,
      minor_issues: 0,
      issues: []
    });
    return context;
  })
);

registry.register(
  passthrough("composition_critic", (context) => {
    context.qa_reports.push({
      job_id: context.job_id,
      scene_id: context.scene_id,
      critic: "composition_critic",
      result: "PASS",
      critical_issues: 0,
      major_issues: 0,
      minor_issues: 0,
      issues: []
    });
    return context;
  })
);

registry.register(
  passthrough("technical_validator", (context) => {
    context.qa_reports.push({
      job_id: context.job_id,
      scene_id: context.scene_id,
      critic: "technical_validator",
      result: "PASS",
      critical_issues: 0,
      major_issues: 0,
      minor_issues: 0,
      issues: []
    });
    return context;
  })
);

const initial = JobContextSchema.parse({
  job_id: "motion_demo_001",
  scene_id: "scene_01",
  state: "INTAKE",
  brief: {
    job_id: "motion_demo_001",
    objective: "Animate a product dashboard insight",
    message: "The system discovered a growth opportunity",
    materials: ["dashboard.png", "notification.svg"],
    user_direction_level: "HIGH"
  },
  assets: {
    job_id: "motion_demo_001",
    assets: [
      {
        asset_id: "dashboard",
        name: "dashboard.png",
        type: "PNG",
        can_reuse_directly: true
      },
      {
        asset_id: "notification",
        name: "notification.svg",
        type: "SVG",
        is_original_source: true,
        is_structured: true,
        can_reuse_directly: true
      }
    ]
  },
  decomposition: {
    job_id: "motion_demo_001",
    scene_id: "scene_01",
    layerability_status: "LAYERED_READY",
    layer_map_verified: true,
    full_scene_flattened_foreground: false,
    layer_map: [
      {
        element_id: "dashboard_base",
        role: "background",
        source_kind: "BACKGROUND_PLATE",
        independently_addressable: true
      },
      {
        element_id: "notification_icon",
        role: "animated_foreground",
        source_kind: "SVG",
        independently_addressable: true
      }
    ],
    elements: [
      {
        element_id: "dashboard_base",
        name: "Dashboard base",
        source_asset_id: "dashboard",
        strategy: "USE_ORIGINAL",
        requires_animation: false
      },
      {
        element_id: "notification_icon",
        name: "Notification icon",
        source_asset_id: "notification",
        strategy: "REUSE_SVG",
        requires_animation: true,
        requires_original_source: false,
        reconstruction_allowed: false,
        fidelity_requirement: "STRICT"
      }
    ]
  },
  motion_direction: {
    job_id: "motion_demo_001",
    scene_id: "scene_01",
    objective: "Show cause and effect",
    primary_focus: "notification_icon"
  },
  motion_spec: {
    job_id: "motion_demo_001",
    scene_id: "scene_01",
    duration_frames: 90,
    fps: 30,
    timeline: [
      {
        element_id: "notification_icon",
        start_frame: 30,
        end_frame: 48,
        action: "ENTER",
        motion_family: "SoftSpring"
      }
    ]
  }
});

const orchestrator = new MotionOrchestrator(registry, { requireHumanApproval: true });
const result = await orchestrator.run(initial);

console.log(JSON.stringify({
  state: result.state,
  template: result.template_selection,
  qaCritics: result.qa_reports.map((report) => report.critic),
  openIssues: result.open_issues.length
}, null, 2));
