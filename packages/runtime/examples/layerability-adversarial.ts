import assert from "node:assert/strict";
import {
  AgentRegistry,
  AssetSchema,
  JobContextSchema,
  MotionOrchestrator,
  createSceneJob,
  type AgentHandler,
  type AgentName,
  type JobContext
} from "../src/index.js";

const stopAtPreview = new Error("test stopped after the real build path");

function makeContext(options: {flat?: boolean; authorized?: boolean; three?: boolean} = {}): JobContext {
  const flat = options.flat ?? false;
  const names = ["WhatsApp card", "Tracking card", "Cursor"];
  return JobContextSchema.parse({
    job_id: "layerability-integration",
    scene_id: "scene-1",
    state: "INTAKE",
    brief: {
      job_id: "layerability-integration",
      objective: "Show how signals lead to a sale",
      message: "Component motion test",
      component_motion_required: true,
      user_direction_level: "HIGH"
    },
    assets: {
      job_id: "layerability-integration",
      assets: flat
        ? [{asset_id: "styleframe", name: "full-scene.png", type: "PNG", source: "full-scene.png"}]
        : [
            {asset_id: "background", name: "background.png", type: "PNG", source: "background.png"},
            ...names.map((name, index) => ({
              asset_id: `layer-${index}`,
              name: `${name}.svg`,
              type: "SVG",
              source: `${name}.svg`
            }))
          ]
    },
    decomposition: {
      job_id: "layerability-integration",
      scene_id: "scene-1",
      layerability_status: flat ? "DECOMPOSITION_REQUIRED" : "LAYERED_READY",
      layer_map_verified: !flat,
      full_scene_flattened_foreground: flat,
      layer_map: flat
        ? [{element_id: "styleframe", role: "foreground", source_kind: "FLATTENED_STYLEFRAME", independently_addressable: true}]
        : [
            {element_id: "background", role: "background", source_kind: "BACKGROUND_PLATE", independently_addressable: true},
            ...names.map((name, index) => ({
              element_id: `element-${index}`,
              role: "animated_foreground",
              source_kind: "SVG" as const,
              independently_addressable: true
            }))
          ],
      elements: flat
        ? names.map((name, index) => ({
            element_id: `element-${index}`,
            name,
            source_asset_id: "styleframe",
            strategy: "USE_ORIGINAL",
            requires_animation: true
          }))
        : names.map((name, index) => ({
            element_id: `element-${index}`,
            name,
            source_asset_id: `layer-${index}`,
            strategy: "REUSE_SVG",
            requires_animation: true
          }))
    },
    metadata: {
      ...(options.authorized ? {explicit_flat_motion_authorization: true} : {}),
      ...(options.three ? {requested_template: "three"} : {}),
      ...(flat ? {build_mode: "FLAT_MOTION_ALLOWED"} : {})
    }
  });
}

function registry(
  counters: {build: number; render: number},
  events: string[] = [],
  materialize = true
): AgentRegistry {
  const agents = new AgentRegistry();
  const names: AgentName[] = [
    "director", "asset_inspector", "decomposition_agent", "source_asset_agent",
    "template_resolver", "motion_director", "motion_spec_agent", "ui_react_specialist",
    "svg_motion_specialist", "remotion_specialist", "composition_agent", "render_agent"
  ];
  for (const name of names) {
    const handler: AgentHandler = {
      name,
      async run(context) {
        const reconstructing = name === "ui_react_specialist" &&
          context.decomposition?.elements.some((element) =>
            element.strategy === "REBUILD_REACT" && element.reconstruction_allowed &&
            !(context.metadata.reconstruction_receipts as Array<{element_id: string}> | undefined)
              ?.some((receipt) => receipt.element_id === element.element_id)
          );
        if (reconstructing) {
          events.push("reconstruction:start");
          await new Promise((resolve) => setTimeout(resolve, 0));
          if (materialize && context.decomposition) {
            const receipts = (context.metadata.reconstruction_receipts as Array<{element_id: string; asset_id: string}> | undefined) ?? [];
            for (const element of context.decomposition.elements.filter((item) => item.strategy === "REBUILD_REACT")) {
              if (receipts.some((receipt) => receipt.element_id === element.element_id)) continue;
              const outputAssetId = `reconstructed-${element.element_id}`;
              context.assets!.assets.push(AssetSchema.parse({
                asset_id: outputAssetId,
                name: `${element.name}.tsx`,
                type: "REACT",
                source: `src/scenes/${element.element_id}.tsx`,
                is_structured: true,
                can_reuse_directly: true
              }));
              element.source_asset_id = outputAssetId;
              const layer = context.decomposition.layer_map.find((item) => item.element_id === element.element_id);
              if (layer) {
                layer.source_kind = "REACT";
                layer.independently_addressable = true;
                layer.source_asset_id = outputAssetId;
              } else {
                context.decomposition.layer_map.push({
                  element_id: element.element_id,
                  role: "animated_foreground",
                  source_kind: "REACT",
                  independently_addressable: true,
                  source_asset_id: outputAssetId
                });
              }
              context.metadata = {
                ...context.metadata,
                reconstruction_receipts: [
                  ...receipts,
                  {element_id: element.element_id, asset_id: outputAssetId}
                ]
              };
              receipts.push({element_id: element.element_id, asset_id: outputAssetId});
            }
          }
          events.push("reconstruction:done");
        }
        if (name === "remotion_specialist") {
          events.push("remotion:build");
          const needsReconstruction = context.decomposition?.elements.some((element) => element.strategy === "REBUILD_REACT");
          if (needsReconstruction) {
            const receipts = context.metadata.reconstruction_receipts as Array<{element_id: string}> | undefined;
            for (const element of context.decomposition!.elements.filter((item) => item.strategy === "REBUILD_REACT")) {
              assert.ok(receipts?.some((receipt) => receipt.element_id === element.element_id),
                `Remotion build must wait for reconstruction of ${element.element_id}`);
            }
          }
        }
        if (["ui_react_specialist", "svg_motion_specialist", "remotion_specialist", "composition_agent"].includes(name)) {
          counters.build += 1;
          events.push(`build:${name}`);
        }
        if (name === "render_agent") counters.render += 1;
        return {context};
      }
    };
    agents.register(handler);
  }
  return agents;
}

async function assertBlockedBeforeBuild(context: JobContext, label: string): Promise<void> {
  const counters = {build: 0, render: 0};
  const result = await new MotionOrchestrator(registry(counters)).run(context);
  assert.equal(result.state, "HUMAN_INPUT_REQUIRED", `${label}: should stop for input`);
  assert.equal(result.metadata.workflow_status, "WAITING_FOR_ASSETS", `${label}: should wait for assets`);
  assert.equal(result.metadata.hard_stop, true, `${label}: hard stop must be explicit`);
  assert.equal(result.metadata.build_mode, undefined, `${label}: stale build mode must be cleared`);
  const request = result.metadata.asset_request as {what_is_missing: string[]};
  for (const name of ["WhatsApp card", "Tracking card", "Cursor"]) {
    assert.ok(request.what_is_missing.some((missing) => missing.includes(name)), `${label}: request must name ${name}`);
  }
  assert.deepEqual(counters, {build: 0, render: 0}, `${label}: build and render must not run`);
  assert.throws(() => createSceneJob(result), /Layerability Gate/, `${label}: scene creation must remain blocked`);
}

await assertBlockedBeforeBuild(makeContext({flat: true}), "A flattened styleframe");
await assertBlockedBeforeBuild(makeContext({flat: true, three: true}), "B flattened styleframe + Three");

const layeredCounters = {build: 0, render: 0};
await assert.rejects(
  new MotionOrchestrator(registry(layeredCounters), {previewHook: async () => { throw stopAtPreview; }}).run(makeContext()),
  (error: unknown) => error === stopAtPreview
);
assert.ok(layeredCounters.build >= 2, "C: actual orchestrator build path should run for independent layers");
assert.equal(layeredCounters.render, 0, "C: preview must not invoke final render");

const flatCounters = {build: 0, render: 0};
await assert.rejects(
  new MotionOrchestrator(registry(flatCounters), {previewHook: async () => { throw stopAtPreview; }}).run(
    makeContext({flat: true, authorized: true})
  ),
  (error: unknown) => error === stopAtPreview
);
assert.ok(flatCounters.build >= 1, "E: explicit flat-animatic authorization should permit a build");
assert.equal(flatCounters.render, 0, "E: authorization must not bypass final-render approval");

const reconstruction = makeContext();
const reconstructionElement = reconstruction.decomposition!.elements[0]!;
reconstructionElement.strategy = "REBUILD_REACT";
reconstructionElement.reconstruction_allowed = true;
reconstruction.decomposition!.elements[1]!.strategy = "REBUILD_REACT";
reconstruction.decomposition!.elements[1]!.reconstruction_allowed = true;
reconstruction.decomposition!.layerability_status = "RECONSTRUCTION_READY";
reconstruction.decomposition!.layer_map[1]!.source_kind = "OTHER";
reconstruction.decomposition!.layer_map[1]!.independently_addressable = false;
reconstruction.decomposition!.layer_map[2]!.source_kind = "OTHER";
reconstruction.decomposition!.layer_map[2]!.independently_addressable = false;
assert.throws(() => createSceneJob(reconstruction), /before the Layerability Gate/, "D: do not create scene before reconstruction");

const reconstructionEvents: string[] = [];
const reconstructionCounters = {build: 0, render: 0};
await assert.rejects(
  new MotionOrchestrator(registry(reconstructionCounters, reconstructionEvents), {
    previewHook: async () => { throw stopAtPreview; }
  }).run(reconstruction),
  (error: unknown) => error === stopAtPreview
);
assert.ok(
  reconstructionEvents.indexOf("reconstruction:done") < reconstructionEvents.indexOf("remotion:build"),
  "D: independent reconstruction must finish before Remotion build"
);

const failedReconstruction = makeContext();
failedReconstruction.decomposition!.elements[0]!.strategy = "REBUILD_REACT";
failedReconstruction.decomposition!.elements[0]!.reconstruction_allowed = true;
failedReconstruction.decomposition!.elements[1]!.strategy = "REBUILD_REACT";
failedReconstruction.decomposition!.elements[1]!.reconstruction_allowed = true;
failedReconstruction.decomposition!.layerability_status = "RECONSTRUCTION_READY";
failedReconstruction.decomposition!.layer_map[1]!.source_kind = "OTHER";
failedReconstruction.decomposition!.layer_map[1]!.independently_addressable = false;
failedReconstruction.decomposition!.layer_map[2]!.source_kind = "OTHER";
failedReconstruction.decomposition!.layer_map[2]!.independently_addressable = false;
const failedEvents: string[] = [];
const failedCounters = {build: 0, render: 0};
const failedResult = await new MotionOrchestrator(registry(failedCounters, failedEvents, false)).run(failedReconstruction);
assert.equal(failedResult.metadata.workflow_status, "WAITING_FOR_ASSETS", "D: unmaterialized reconstruction must hard-stop");
assert.equal(failedEvents.includes("remotion:build"), false, "D: Remotion must not run after failed reconstruction");
assert.equal(failedCounters.render, 0);

const approvalCounters = {build: 0, render: 0};
const blockedReadyForHuman = JobContextSchema.parse({
  ...makeContext({flat: true}),
  state: "READY_FOR_HUMAN"
});
await assert.rejects(
  new MotionOrchestrator(registry(approvalCounters)).approveAndRender(blockedReadyForHuman),
  /Layerability Gate failed/
);
assert.equal(approvalCounters.render, 0, "approval cannot bypass the asset gate");

console.log("Runtime adversarial integration passed: A, B, C, D, E, approval gate");
