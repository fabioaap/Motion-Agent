import {access, readFile} from "node:fs/promises";
import {join, resolve} from "node:path";

const root = resolve(process.cwd(), "squads", "motion-squad");

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

const required = [
  "squad.yaml",
  "README.md",
  "config/coding-standards.md",
  "config/tech-stack.md",
  "config/source-tree.md",
  "agents/motion-director.md",
  "agents/asset-intake-specialist.md",
  "agents/layerability-guard.md",
  "agents/template-resolver.md",
  "agents/remotion-builder.md",
  "agents/fidelity-critic.md",
  "agents/motion-qa.md",
  "tasks/intake-motion-request.md",
  "tasks/audit-scene-topology.md",
  "tasks/request-missing-assets.md",
  "tasks/resolve-motion-strategy.md",
  "tasks/resolve-template.md",
  "tasks/build-motion-scene.md",
  "tasks/review-motion-scene.md",
  "tasks/render-final-motion.md",
  "workflows/create-motion.yaml",
  "workflows/rebuild-after-assets.yaml",
  "checklists/layer-readiness-checklist.md",
  "checklists/missing-assets-gate.md",
  "checklists/fidelity-checklist.md",
  "checklists/ready-for-human-checklist.md",
  "templates/asset-request-response.md",
  "templates/motion-plan-response.md",
  "templates/blocked-response.md",
  "data/motion-policy.json",
  "data/remotion-templates.json",
  "tools/asset-manifest-reader.js",
  "tools/remotion-runtime.js",
  "scripts/prepare-scene.js",
  "scripts/render-scene.js"
];

const missing=[];
for (const relative of required) {
  if (!(await exists(join(root, relative)))) missing.push(relative);
}
if (missing.length) throw new Error(`Motion Squad missing files: ${missing.join(", ")}`);

const squad = await readFile(join(root, "squad.yaml"), "utf8");
for (const token of [
  "name: motion-squad",
  "slashPrefix: motion",
  "aiox:",
  "type: squad",
  "components:",
  "create-motion.yaml"
]) {
  if (!squad.includes(token)) throw new Error(`squad.yaml missing: ${token}`);
}

const topology = await readFile(join(root, "tasks", "audit-scene-topology.md"), "utf8");
for (const token of [
  "BLOCKED_MISSING_ASSETS",
  "FLATTENED_STYLEFRAME",
  "LAYERED_READY",
  "RECONSTRUCTION_READY"
]) {
  if (!topology.includes(token)) throw new Error(`Topology task missing gate token: ${token}`);
}

const request = await readFile(join(root, "tasks", "request-missing-assets.md"), "utf8");
if (!request.includes("WAITING_FOR_ASSETS") || !request.includes("HARD STOP")) {
  throw new Error("Missing-assets task does not hard-stop correctly");
}

const build = await readFile(join(root, "tasks", "build-motion-scene.md"), "utf8");
if (!build.includes("HARD FAIL") || !build.includes("independent")) {
  throw new Error("Build task does not enforce independent layers");
}

const workflow = await readFile(join(root, "workflows", "create-motion.yaml"), "utf8");
const missingIndex = workflow.indexOf("step: missing-assets");
const buildIndex = workflow.indexOf("step: build");
if (missingIndex < 0 || buildIndex < 0 || missingIndex > buildIndex) {
  throw new Error("Missing Assets Gate must occur before build");
}

const policy = JSON.parse(await readFile(join(root, "data", "motion-policy.json"), "utf8"));
if (!policy.rules?.some((rule) => /Never animate a flattened/i.test(rule))) {
  throw new Error("Motion policy does not block flattened component motion");
}
if (!policy.userApprovalRequiredFor?.includes("FLAT_MOTION_ONLY")) {
  throw new Error("Flat motion must require explicit user approval");
}

console.log("Motion Squad structural validation passed");
