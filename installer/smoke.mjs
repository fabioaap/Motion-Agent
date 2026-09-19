import {mkdtemp, readFile, rm, writeFile, access} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {fileURLToPath} from "node:url";

const root = await mkdtemp(join(tmpdir(), "motion-agent-installer-"));
const target = join(root, "host-project");
const cli = fileURLToPath(new URL("../bin/motion-agent.mjs", import.meta.url));

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

function run(args) {
  const result = spawnSync(process.execPath, [cli, ...args], {encoding: "utf8"});
  if (result.status !== 0) {
    throw new Error(`CLI failed: ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

try {
  await import("node:fs/promises").then(({mkdir}) => mkdir(target, {recursive: true}));
  await writeFile(join(target, "package.json"), `${JSON.stringify({name: "host-project", private: true, scripts: {test: "echo ok"}}, null, 2)}\n`);
  await writeFile(join(target, "AGENTS.md"), "# Existing project instructions\n\nKeep this text.\n");
  await writeFile(join(target, ".gitignore"), "node_modules/\n");

  run(["init", "--target", target, "--skip-install", "--skip-remotion-skills"]);

  const required = [
    ".motion/config.json",
    ".motion/install-manifest.json",
    ".motion/remotion/package.json",
    ".agents/skills/motion-orchestrator/SKILL.md",
    ".agents/skills/template-resolver/SKILL.md",
    ".motion/template-recipes.json",
    ".agents/skills/asset-fidelity/SKILL.md",
    ".agents/skills/scene-director/SKILL.md",
    ".agents/skills/motion-qa/SKILL.md",
    "squads/motion-squad/squad.yaml",
    "squads/motion-squad/workflows/create-motion.yaml",
    "squads/motion-squad/tasks/request-missing-assets.md"
  ];
  for (const path of required) {
    if (!(await exists(join(target, path)))) throw new Error(`Missing installed path: ${path}`);
  }

  const agents = await readFile(join(target, "AGENTS.md"), "utf8");
  if (!agents.includes("Existing project instructions") || !agents.includes("motion-agent:start")) {
    throw new Error("AGENTS.md was not preserved and patched correctly");
  }
  if (
    !agents.includes("flattened full-scene styleframe") ||
    !agents.includes("Layerability Gate") ||
    !agents.includes("template-resolver") ||
    !agents.includes("template-recipes.json")
  ) {
    throw new Error("AGENTS.md is missing layered-motion or template-resolution pipeline rules");
  }

  const manifest = JSON.parse(await readFile(join(target, ".motion", "install-manifest.json"), "utf8"));
  if (manifest.pipelineVersion !== "aiox-motion-squad-v1") {
    throw new Error(`Unexpected pipeline version ${manifest.pipelineVersion ?? "missing"}`);
  }

  const orchestratorSkill = await readFile(join(target, ".agents", "skills", "motion-orchestrator", "SKILL.md"), "utf8");
  const templateResolverSkill = await readFile(join(target, ".agents", "skills", "template-resolver", "SKILL.md"), "utf8");
  const templateRecipes = JSON.parse(await readFile(join(target, ".motion", "template-recipes.json"), "utf8"));
  const qaSkill = await readFile(join(target, ".agents", "skills", "motion-qa", "SKILL.md"), "utf8");
  if (!orchestratorSkill.includes("## Layerability Gate") || !orchestratorSkill.includes("## Template Resolution")) {
    throw new Error("Installed orchestrator skill is missing Layerability or Template Resolution");
  }
  if (!templateResolverSkill.includes("# Template Resolver")) {
    throw new Error("Installed template resolver skill is missing");
  }
  if (!templateRecipes.templates?.some((item) => item.id === "three")) {
    throw new Error("Installed template registry is missing Three");
  }
  if (!qaSkill.includes("## Layer Separation Critic")) {
    throw new Error("Installed motion QA skill is missing Layer Separation Critic");
  }

  const squadManifest = await readFile(join(target, "squads", "motion-squad", "squad.yaml"), "utf8");
  const squadWorkflow = await readFile(join(target, "squads", "motion-squad", "workflows", "create-motion.yaml"), "utf8");
  const missingAssetsTask = await readFile(join(target, "squads", "motion-squad", "tasks", "request-missing-assets.md"), "utf8");
  if (!squadManifest.includes("slashPrefix: motion")) throw new Error("Installed Motion Squad is missing slashPrefix");
  if (
    squadWorkflow.indexOf("step: missing-assets") < 0 ||
    squadWorkflow.indexOf("step: missing-assets") > squadWorkflow.indexOf("step: build")
  ) {
    throw new Error("Installed Motion Squad does not gate missing assets before build");
  }
  if (!missingAssetsTask.includes("WAITING_FOR_ASSETS") || !missingAssetsTask.includes("HARD STOP")) {
    throw new Error("Installed Motion Squad does not hard-stop when assets are missing");
  }

  const packageJson = JSON.parse(await readFile(join(target, "package.json"), "utf8"));
  if (packageJson.scripts.test !== "echo ok" || !packageJson.scripts["motion:studio"]) {
    throw new Error("package.json scripts were not preserved and patched correctly");
  }

  const doctor = JSON.parse(run(["doctor", "--target", target, "--json"]));
  if (!doctor.ok) throw new Error("doctor reported a broken installation");

  const configPath = join(target, ".motion", "config.json");
  const preUpdateConfig = JSON.parse(await readFile(configPath, "utf8"));
  delete preUpdateConfig.templateResolution;
  preUpdateConfig.userOwnedSetting = "preserve-me";
  await writeFile(configPath, `${JSON.stringify(preUpdateConfig, null, 2)}\n`);

  run(["update", "--target", target, "--skip-install", "--skip-remotion-skills"]);

  const postUpdateConfig = JSON.parse(await readFile(configPath, "utf8"));
  if (postUpdateConfig.userOwnedSetting !== "preserve-me") {
    throw new Error("update did not preserve existing user config");
  }
  if (
    postUpdateConfig.templateResolution?.enabled !== true ||
    postUpdateConfig.templateResolution?.registry !== ".motion/template-recipes.json"
  ) {
    throw new Error("update did not merge Template Resolution defaults into existing config");
  }

  await writeFile(join(target, ".motion", "user-owned.txt"), "must survive uninstall\n");

  run(["uninstall", "--target", target]);

  if (!(await exists(join(target, ".motion", "user-owned.txt")))) throw new Error("uninstall deleted an unrelated .motion file");
  if (await exists(join(target, ".agents", "skills", "motion-orchestrator"))) throw new Error("custom skill still exists after uninstall");
  if (await exists(join(target, "squads", "motion-squad"))) throw new Error("Motion Squad still exists after uninstall");
  const afterAgents = await readFile(join(target, "AGENTS.md"), "utf8");
  if (!afterAgents.includes("Existing project instructions") || afterAgents.includes("motion-agent:start")) {
    throw new Error("AGENTS.md cleanup failed");
  }

  console.log("Motion Agent installer smoke test passed");
} finally {
  await rm(root, {recursive: true, force: true});
}
