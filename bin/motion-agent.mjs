#!/usr/bin/env node
import {access, cp, mkdir, readFile, readdir, rm, writeFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(await readFile(join(PACKAGE_ROOT, "package.json"), "utf8"));
const VERSION = packageJson.version ?? "0.0.0";
const PIPELINE_VERSION = "aiox-motion-squad-v1";
const MANAGED_START = "<!-- motion-agent:start -->";
const MANAGED_END = "<!-- motion-agent:end -->";
const GITIGNORE_START = "# motion-agent:start";
const GITIGNORE_END = "# motion-agent:end";
const CUSTOM_SKILLS = ["motion-orchestrator", "template-resolver", "asset-fidelity", "scene-director", "motion-qa"];
const AIOX_SQUAD_NAME = "motion-squad";

function usage() {
  console.log(`Motion Agent ${VERSION}\n\nUsage:\n  motion-agent init [--target <dir>] [--skip-install] [--skip-remotion-skills] [--force]\n  motion-agent update [--target <dir>] [--skip-install] [--skip-remotion-skills]\n  motion-agent doctor [--target <dir>] [--deep] [--json]\n  motion-agent uninstall [--target <dir>]\n  motion-agent version\n\nRecommended from another repository:\n  pnpm dlx github:fabioaap/Motion-Agent init\n`);
}

function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift() ?? "help";
  const flags = {target: process.cwd(), skipInstall: false, skipRemotionSkills: false, force: false, deep: false, json: false};
  while (args.length) {
    const value = args.shift();
    if (value === "--target" || value === "-C") {
      const next = args.shift();
      if (!next) throw new Error(`${value} requires a directory`);
      flags.target = resolve(next);
    } else if (value === "--skip-install") flags.skipInstall = true;
    else if (value === "--skip-remotion-skills") flags.skipRemotionSkills = true;
    else if (value === "--force") flags.force = true;
    else if (value === "--deep") flags.deep = true;
    else if (value === "--json") flags.json = true;
    else if (value === "--yes" || value === "-y") continue;
    else throw new Error(`Unknown option: ${value}`);
  }
  return {command, flags};
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function listFiles(root, prefix = "") {
  const files = [];
  for (const entry of await readdir(root, {withFileTypes: true})) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(join(root, entry.name), relative));
    else files.push(relative.replaceAll("\\", "/"));
  }
  return files;
}

async function removeEmptyDirectories(root) {
  if (!(await exists(root))) return;
  for (const entry of await readdir(root, {withFileTypes: true})) {
    if (entry.isDirectory()) await removeEmptyDirectories(join(root, entry.name));
  }
  if ((await readdir(root)).length === 0) await rm(root, {recursive: true, force: true});
}

async function readText(path, fallback = "") {
  try { return await readFile(path, "utf8"); } catch { return fallback; }
}

async function upsertManagedBlock(path, start, end, body) {
  const original = await readText(path, "");
  const block = `${start}\n${body.trim()}\n${end}`;
  const startIndex = original.indexOf(start);
  const endIndex = original.indexOf(end);
  let next;
  if (startIndex >= 0 && endIndex > startIndex) {
    next = `${original.slice(0, startIndex)}${block}${original.slice(endIndex + end.length)}`;
  } else {
    next = `${original.trimEnd()}${original.trim() ? "\n\n" : ""}${block}\n`;
  }
  await writeFile(path, next, "utf8");
}

async function removeManagedBlock(path, start, end) {
  if (!(await exists(path))) return;
  const original = await readText(path, "");
  const startIndex = original.indexOf(start);
  const endIndex = original.indexOf(end);
  if (startIndex < 0 || endIndex <= startIndex) return;
  const next = `${original.slice(0, startIndex)}${original.slice(endIndex + end.length)}`.replace(/^\s+|\s+$/g, "");
  if (next) await writeFile(path, `${next}\n`, "utf8");
  else await rm(path, {force: true});
}

function run(command, args, cwd, {optional = false} = {}) {
  const result = spawnSync(command, args, {cwd, stdio: "inherit", shell: process.platform === "win32"});
  if (result.status !== 0 && !optional) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`);
  }
  return result.status === 0;
}

async function patchPackageJson(target, remove = false) {
  const path = join(target, "package.json");
  if (!(await exists(path))) return;
  const data = JSON.parse(await readFile(path, "utf8"));
  data.scripts ??= {};
  const scripts = {
    "motion:studio": "pnpm --dir .motion/remotion studio",
    "motion:typecheck": "pnpm --dir .motion/remotion typecheck",
    "motion:compositions": "pnpm --dir .motion/remotion compositions",
    "motion:render": "pnpm --dir .motion/remotion render"
  };
  if (remove) {
    for (const [key, value] of Object.entries(scripts)) {
      if (data.scripts[key] === value) delete data.scripts[key];
    }
  } else {
    for (const [key, value] of Object.entries(scripts)) {
      if (!(key in data.scripts)) data.scripts[key] = value;
    }
  }
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function copyCustomSkills(target) {
  const sourceRoot = join(PACKAGE_ROOT, "skills", "custom");
  const destRoot = join(target, ".agents", "skills");
  await mkdir(destRoot, {recursive: true});
  for (const skill of CUSTOM_SKILLS) {
    const source = join(sourceRoot, skill);
    if (!(await exists(source))) throw new Error(`Packaged skill missing: ${skill}`);
    await rm(join(destRoot, skill), {recursive: true, force: true});
    await cp(source, join(destRoot, skill), {recursive: true});
  }
}

async function copyAioxSquad(target) {
  const source = join(PACKAGE_ROOT, "squads", AIOX_SQUAD_NAME);
  const dest = join(target, "squads", AIOX_SQUAD_NAME);
  if (!(await exists(source))) throw new Error(`Packaged AIOX squad missing: ${AIOX_SQUAD_NAME}`);
  await mkdir(join(target, "squads"), {recursive: true});
  await rm(dest, {recursive: true, force: true});
  await cp(source, dest, {recursive: true});
}

function mergeConfigDefaults(defaults, existing) {
  if (
    !defaults ||
    typeof defaults !== "object" ||
    Array.isArray(defaults) ||
    !existing ||
    typeof existing !== "object" ||
    Array.isArray(existing)
  ) {
    return existing === undefined ? defaults : existing;
  }

  const merged = {...defaults};
  for (const [key, value] of Object.entries(existing)) {
    merged[key] = key in defaults
      ? mergeConfigDefaults(defaults[key], value)
      : value;
  }
  return merged;
}

async function copyMotionTemplate(target, preserveConfig = true) {
  const source = join(PACKAGE_ROOT, "installer", "template", "motion");
  const dest = join(target, ".motion");
  const oldConfig = preserveConfig && await exists(join(dest, "config.json"))
    ? JSON.parse(await readFile(join(dest, "config.json"), "utf8"))
    : null;
  await mkdir(dest, {recursive: true});
  await cp(source, dest, {recursive: true, force: true});
  if (oldConfig) {
    const defaultConfig = JSON.parse(await readFile(join(dest, "config.json"), "utf8"));
    const mergedConfig = mergeConfigDefaults(defaultConfig, oldConfig);
    await writeFile(join(dest, "config.json"), `${JSON.stringify(mergedConfig, null, 2)}\n`, "utf8");
  }
}

async function writeManifest(target) {
  const templateRoot = join(PACKAGE_ROOT, "installer", "template", "motion");
  const managedMotionFiles = [
    ...await listFiles(templateRoot),
    "install-manifest.json"
  ].map((path) => `.motion/${path}`);
  const manifest = {
    schemaVersion: 1,
    installerVersion: VERSION,
    pipelineVersion: PIPELINE_VERSION,
    mode: "codex",
    installedAt: new Date().toISOString(),
    managedPaths: [
      ".motion",
      `squads/${AIOX_SQUAD_NAME}`,
      ...CUSTOM_SKILLS.map((name) => `.agents/skills/${name}`)
    ],
    managedMotionFiles,
    officialRemotionSkills: "remotion-dev/skills",
    officialRemotionTemplates: {
      catalog: "https://www.remotion.dev/templates",
      registry: ".motion/template-recipes.json",
      reviewedAt: "2026-09-18"
    },
    aioxSquad: {
      name: AIOX_SQUAD_NAME,
      path: `squads/${AIOX_SQUAD_NAME}`,
      entryWorkflow: "workflows/create-motion.yaml",
      slashPrefix: "motion"
    }
  };
  await writeFile(join(target, ".motion", "install-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function configureProject(target) {
  await upsertManagedBlock(
    join(target, "AGENTS.md"),
    MANAGED_START,
    MANAGED_END,
    `## Motion Agent\n\nWhen a request starts with \`@motion\` or explicitly asks for Motion Agent, read \`.agents/skills/motion-orchestrator/SKILL.md\` first. Work in this repository's real product context and reuse its exact components, SVGs, fonts, design tokens and assets before reconstructing anything. Run Scene Topology Audit and the Missing Assets / Layerability Gate before implementation whenever component-level motion is expected. If critical independent layers are missing, stop in WAITING_FOR_ASSETS and tell the user exactly which assets are required. After Layerability passes, read \`.agents/skills/template-resolver/SKILL.md\` and \`.motion/template-recipes.json\`, then select the smallest relevant official Remotion template or technique reference before building. A flattened full-scene styleframe may be a visual reference, but camera movement, parallax, zoom, blur or Three.js displacement applied to it do not count as independent component motion. The Three template does not bypass Layerability. Use \`.motion/remotion\` as the isolated preview/render workspace and do not overwrite the host app with a template. Run fidelity, layer separation, motion, composition and regression QA before presenting a preview. Do not require an OpenAI API key in Codex mode. Keep the human approval gate before final delivery.`
  );
  await upsertManagedBlock(
    join(target, ".gitignore"),
    GITIGNORE_START,
    GITIGNORE_END,
    `.motion/remotion/node_modules/\n.motion/remotion/out/\n.motion/remotion/jobs/\n.motion/cache/`
  );
  await patchPackageJson(target, false);
}

async function installDependencies(target) {
  run("pnpm", ["--dir", join(target, ".motion", "remotion"), "install"], target);
}

async function installRemotionSkills(target) {
  run("pnpm", ["dlx", "skills", "add", "remotion-dev/skills", "--skill", "*", "--agent", "codex", "--copy", "--yes"], target);
}

async function init(target, flags, updating = false) {
  await mkdir(target, {recursive: true});
  const manifestPath = join(target, ".motion", "install-manifest.json");
  if (!updating && await exists(manifestPath) && !flags.force) {
    throw new Error("Motion Agent is already installed. Use `motion-agent update` or pass --force.");
  }
  if (!updating && await exists(join(target, ".motion")) && !(await exists(manifestPath)) && !flags.force) {
    throw new Error("A .motion directory already exists and is not managed by Motion Agent. Use --force only after reviewing it.");
  }

  await copyMotionTemplate(target, updating);
  await copyCustomSkills(target);
  await copyAioxSquad(target);
  await configureProject(target);
  await writeManifest(target);

  if (!flags.skipRemotionSkills) installRemotionSkills(target);
  if (!flags.skipInstall) installDependencies(target);

  console.log(`\nMotion Agent ${updating ? "updated" : "installed"} in ${target}`);
  console.log("Codex mode is the default. No OPENAI_API_KEY is required.");
  console.log("Try: @motion anime esta interface preservando os componentes originais");
}

async function doctor(target, flags) {
  const checks = [];
  const add = (name, ok, detail) => checks.push({name, ok, detail});
  add("Node >= 22", Number(process.versions.node.split(".")[0]) >= 22, process.versions.node);
  const pnpm = spawnSync("pnpm", ["--version"], {cwd: target, encoding: "utf8", shell: process.platform === "win32"});
  add("pnpm available", pnpm.status === 0, (pnpm.stdout || pnpm.stderr || "not found").trim());
  const manifestPath = join(target, ".motion", "install-manifest.json");
  add("install manifest", await exists(manifestPath), ".motion/install-manifest.json");
  const manifest = JSON.parse(await readText(manifestPath, "{}"));
  add("pipeline version", manifest.pipelineVersion === PIPELINE_VERSION, manifest.pipelineVersion ?? "missing");
  const motionConfigPath = join(target, ".motion", "config.json");
  add("Motion config", await exists(motionConfigPath), ".motion/config.json");
  const motionConfig = JSON.parse(await readText(motionConfigPath, "{}"));
  add(
    "Template resolution config",
    motionConfig.templateResolution?.enabled === true &&
      motionConfig.templateResolution?.registry === ".motion/template-recipes.json",
    "templateResolution.enabled + registry"
  );
  add("Remotion workspace", await exists(join(target, ".motion", "remotion", "package.json")), ".motion/remotion/package.json");
  for (const skill of CUSTOM_SKILLS) {
    add(`skill:${skill}`, await exists(join(target, ".agents", "skills", skill, "SKILL.md")), `.agents/skills/${skill}/SKILL.md`);
  }
  const orchestrator = await readText(join(target, ".agents", "skills", "motion-orchestrator", "SKILL.md"));
  add("Layerability Gate", orchestrator.includes("## Layerability Gate"), ".agents/skills/motion-orchestrator/SKILL.md");
  add("Template Resolution", orchestrator.includes("## Template Resolution"), ".agents/skills/motion-orchestrator/SKILL.md");
  const templateResolver = await readText(join(target, ".agents", "skills", "template-resolver", "SKILL.md"));
  add("Template Resolver skill", templateResolver.includes("# Template Resolver"), ".agents/skills/template-resolver/SKILL.md");
  const templateRegistryPath = join(target, ".motion", "template-recipes.json");
  add("Remotion template registry", await exists(templateRegistryPath), ".motion/template-recipes.json");
  const templateRegistry = JSON.parse(await readText(templateRegistryPath, "{}"));
  const templateIds = Array.isArray(templateRegistry.templates) ? templateRegistry.templates.map((item) => item?.id).filter(Boolean) : [];
  add("Three template recipe", templateIds.includes("three"), "official Remotion React Three Fiber template");
  add("Blank template recipe", templateIds.includes("blank"), "default Motion Agent baseline");
  const motionQa = await readText(join(target, ".agents", "skills", "motion-qa", "SKILL.md"));
  add("Layer Separation Critic", motionQa.includes("## Layer Separation Critic"), ".agents/skills/motion-qa/SKILL.md");
  const squadRoot = join(target, "squads", AIOX_SQUAD_NAME);
  add("AIOX Motion Squad", await exists(join(squadRoot, "squad.yaml")), `squads/${AIOX_SQUAD_NAME}/squad.yaml`);
  const squadManifest = await readText(join(squadRoot, "squad.yaml"));
  add("AIOX squad slashPrefix", squadManifest.includes("slashPrefix: motion"), "slashPrefix: motion");
  const squadWorkflow = await readText(join(squadRoot, "workflows", "create-motion.yaml"));
  add("Missing Assets Gate before build", squadWorkflow.indexOf("step: missing-assets") >= 0 && squadWorkflow.indexOf("step: missing-assets") < squadWorkflow.indexOf("step: build"), "create-motion workflow ordering");
  const assetRequestTask = await readText(join(squadRoot, "tasks", "request-missing-assets.md"));
  add("WAITING_FOR_ASSETS hard stop", assetRequestTask.includes("WAITING_FOR_ASSETS") && assetRequestTask.includes("HARD STOP"), "request-missing-assets task");
  const agents = await readText(join(target, "AGENTS.md"));
  add("AGENTS.md integration", agents.includes(MANAGED_START) && agents.includes(MANAGED_END), "managed @motion instructions");
  if (flags.deep && checks.every((item) => item.ok)) {
    const ok = run("pnpm", ["--dir", join(target, ".motion", "remotion"), "typecheck"], target, {optional: true});
    add("Remotion typecheck", ok, "pnpm --dir .motion/remotion typecheck");
  }
  if (flags.json) console.log(JSON.stringify({ok: checks.every((item) => item.ok), checks}, null, 2));
  else {
    for (const item of checks) console.log(`${item.ok ? "✓" : "✗"} ${item.name}: ${item.detail}`);
  }
  if (!checks.every((item) => item.ok)) process.exitCode = 1;
}

async function uninstall(target) {
  for (const skill of CUSTOM_SKILLS) {
    await rm(join(target, ".agents", "skills", skill), {recursive: true, force: true});
  }
  await rm(join(target, "squads", AIOX_SQUAD_NAME), {recursive: true, force: true});
  const motionRoot = join(target, ".motion");
  const manifest = JSON.parse(await readText(join(motionRoot, "install-manifest.json"), "{}"));
  const managedMotionFiles = Array.isArray(manifest.managedMotionFiles)
    ? manifest.managedMotionFiles.filter((path) => path.startsWith(".motion/") && !path.includes(".."))
    : [];
  for (const path of managedMotionFiles) await rm(join(target, path), {force: true});
  await removeEmptyDirectories(motionRoot);
  if (!managedMotionFiles.length && await exists(motionRoot)) {
    console.log("Preserved unmanaged .motion files; remove them only after reviewing ownership.");
  }
  await removeManagedBlock(join(target, "AGENTS.md"), MANAGED_START, MANAGED_END);
  await removeManagedBlock(join(target, ".gitignore"), GITIGNORE_START, GITIGNORE_END);
  await patchPackageJson(target, true);
  console.log(`Motion Agent removed from ${target}`);
  console.log("Official Remotion skills were intentionally left in place because another workflow may use them.");
}

try {
  const {command, flags} = parseArgs(process.argv.slice(2));
  const target = resolve(flags.target);
  if (command === "init") await init(target, flags, false);
  else if (command === "update") await init(target, flags, true);
  else if (command === "doctor") await doctor(target, flags);
  else if (command === "uninstall") await uninstall(target);
  else if (command === "version" || command === "--version" || command === "-v") console.log(VERSION);
  else if (command === "help" || command === "--help" || command === "-h") usage();
  else throw new Error(`Unknown command: ${command}`);
} catch (error) {
  console.error(`Motion Agent: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
