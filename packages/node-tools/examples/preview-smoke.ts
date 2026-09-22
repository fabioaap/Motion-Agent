import {strict as assert} from "node:assert";
import {JobContextSchema} from "@motion-agent/runtime";
import {createRemotionPreviewHook, findRepoRoot} from "../src/index.js";

const root = await findRepoRoot();
const jobId = "qa_preview_smoke";
const context = JobContextSchema.parse({
  job_id: jobId,
  scene_id: "scene_01",
  state: "PREVIEW_READY",
  brief: {
    job_id: jobId,
    objective: "Validate multi frame visual QA",
    message: "Motion QA smoke test",
    width: 1920,
    height: 1080,
    fps: 30,
    duration_seconds: 3,
    materials: ["dashboard.svg"],
    user_direction_level: "HIGH"
  },
  assets: {
    job_id: jobId,
    assets: [
      {
        asset_id: "dashboard",
        name: "dashboard.svg",
        type: "SVG",
        source: "demo/dashboard.svg",
        is_original_source: true,
        is_structured: true,
        can_reuse_directly: true,
        fidelity_risk: "LOW"
      }
    ]
  },
  decomposition: {
    job_id: jobId,
    scene_id: "scene_01",
    layerability_status: "LAYERED_READY",
    layer_map_verified: true,
    layer_map: [
      {
        element_id: "dashboard_base",
        role: "animated_svg",
        source_kind: "SVG",
        independently_addressable: true,
        source_asset_id: "dashboard"
      }
    ],
    elements: [
      {
        element_id: "dashboard_base",
        name: "Dashboard",
        source_asset_id: "dashboard",
        strategy: "REUSE_SVG",
        requires_animation: true,
        requires_original_source: false,
        reconstruction_allowed: false,
        fidelity_requirement: "STRICT",
        validation_required: true,
        scope_status: "LOCKED"
      }
    ]
  },
  motion_direction: {
    job_id: jobId,
    scene_id: "scene_01",
    objective: "Reveal the original dashboard with a restrained premium entrance",
    primary_focus: "dashboard_base",
    entry_strategy: "Scale reveal",
    main_action: "Subtle focus",
    intensity: "MEDIUM"
  },
  motion_spec: {
    job_id: jobId,
    scene_id: "scene_01",
    duration_frames: 90,
    fps: 30,
    timeline: [
      {
        element_id: "dashboard_base",
        start_frame: 0,
        end_frame: 89,
        action: "ENTER_AND_HOLD",
        motion_family: "ScaleReveal",
        properties: {opacity: true, scale: true}
      }
    ]
  },
  locked_elements: ["dashboard_base"],
  metadata: {qa_cycle: 1}
});

const previewHook = createRemotionPreviewHook({
  repoRoot: root,
  maxDiffRatio: 0.005,
  maxMotionKeyframes: 3
});
const result = await previewHook(context);
const visual = result.metadata.visual_qa as Record<string, unknown>;
const regression = result.metadata.regression_qa as Record<string, unknown>;
const keyframes = visual.motion_keyframes as unknown[];
const identity = visual.identity_mismatches as unknown[];
const regressionMismatches = regression.mismatches as unknown[];

assert.equal((result.metadata.preview_render as Record<string, unknown>).ok, true, JSON.stringify(result.metadata.preview_render));
assert.ok(Array.isArray(keyframes) && keyframes.length >= 3, "Expected at least three motion keyframes");
assert.deepEqual(identity, []);
assert.deepEqual(regressionMismatches, []);
assert.ok(Array.isArray(result.metadata.asset_preview_paths));
assert.equal((result.metadata.asset_preview_paths as unknown[]).length, 3);

console.log(JSON.stringify({
  preview: "PASS",
  keyframes: keyframes.length,
  diff_ratio: visual.diff_ratio,
  regression: "PASS"
}, null, 2));
