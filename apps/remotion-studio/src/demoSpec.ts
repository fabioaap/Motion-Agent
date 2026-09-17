import {MotionSpecSchema} from "@motion-agent/runtime/contracts";

export const demoMotionSpec = MotionSpecSchema.parse({
  job_id: "motion_agent_preview",
  scene_id: "pipeline_demo",
  duration_frames: 165,
  fps: 30,
  timeline: [
    {
      element_id: "asset_audit",
      start_frame: 8,
      end_frame: 34,
      action: "ANALYZE",
      motion_family: "SoftSpring"
    },
    {
      element_id: "scene_build",
      start_frame: 38,
      end_frame: 68,
      action: "BUILD",
      motion_family: "PremiumCardEntrance"
    },
    {
      element_id: "qa_loop",
      start_frame: 72,
      end_frame: 112,
      action: "VALIDATE",
      motion_family: "SoftSpring"
    },
    {
      element_id: "ready",
      start_frame: 116,
      end_frame: 150,
      action: "APPROVE",
      motion_family: "ScaleReveal"
    }
  ]
});
