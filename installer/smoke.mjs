import {mkdtemp, readFile, rm, writeFile, access} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {join} from "node:path";
import {tmpdir} from "node:os";

const root = await mkdtemp(join(tmpdir(), "motion-agent-installer-"));
const target = join(root, "host-project");
const cli = new URL("../bin/motion-agent.mjs", import.meta.url).pathname;

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
    ".agents/skills/asset-fidelity/SKILL.md",
    ".agents/skills/scene-director/SKILL.md",
    ".agents/skills/motion-qa/SKILL.md"
  ];
  for (const path of required) {
    if (!(await exists(join(target, path)))) throw new Error(`Missing installed path: ${path}`);
  }

  const agents = await readFile(join(target, "AGENTS.md"), "utf8");
  if (!agents.includes("Existing project instructions") || !agents.includes("motion-agent:start")) {
    throw new Error("AGENTS.md was not preserved and patched correctly");
  }

  const packageJson = JSON.parse(await readFile(join(target, "package.json"), "utf8"));
  if (packageJson.scripts.test !== "echo ok" || !packageJson.scripts["motion:studio"]) {
    throw new Error("package.json scripts were not preserved and patched correctly");
  }

  const doctor = JSON.parse(run(["doctor", "--target", target, "--json"]));
  if (!doctor.ok) throw new Error("doctor reported a broken installation");

  run(["update", "--target", target, "--skip-install", "--skip-remotion-skills"]);
  run(["uninstall", "--target", target]);

  if (await exists(join(target, ".motion"))) throw new Error(".motion still exists after uninstall");
  if (await exists(join(target, ".agents", "skills", "motion-orchestrator"))) throw new Error("custom skill still exists after uninstall");
  const afterAgents = await readFile(join(target, "AGENTS.md"), "utf8");
  if (!afterAgents.includes("Existing project instructions") || afterAgents.includes("motion-agent:start")) {
    throw new Error("AGENTS.md cleanup failed");
  }

  console.log("Motion Agent installer smoke test passed");
} finally {
  await rm(root, {recursive: true, force: true});
}
