import {access, mkdtemp, mkdir, readFile, readdir, rm, writeFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {join, resolve} from "node:path";
import {tmpdir} from "node:os";
import {fileURLToPath} from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const packageJson = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
const temp = await mkdtemp(join(tmpdir(), "motion-agent-package-"));
const packDir = join(temp, "pack");
const target = join(temp, "target");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

try {
  await mkdir(packDir, {recursive: true});
  await mkdir(target, {recursive: true});
  await writeFile(join(target, "package.json"), `${JSON.stringify({name: "package-smoke-target", private: true}, null, 2)}\n`);

  run("pnpm", ["pack", "--pack-destination", packDir], repoRoot);
  const tarballs = (await readdir(packDir)).filter((name) => name.endsWith(".tgz"));
  if (tarballs.length !== 1) throw new Error(`Expected one package tarball, found ${tarballs.length}`);
  const tarball = join(packDir, tarballs[0]);

  run("pnpm", ["dlx", tarball, "init", "--target", target, "--skip-install", "--skip-remotion-skills"], repoRoot);

  for (const relativePath of [
    ".motion/install-manifest.json",
    ".motion/remotion/package.json",
    ".motion/template-recipes.json",
    ".agents/skills/motion-orchestrator/SKILL.md",
    ".agents/skills/template-router/SKILL.md",
    ".agents/skills/asset-fidelity/SKILL.md",
    ".agents/skills/scene-director/SKILL.md",
    ".agents/skills/motion-qa/SKILL.md"
  ]) {
    if (!(await exists(join(target, relativePath)))) throw new Error(`Packaged install missing ${relativePath}`);
  }

  const manifest = JSON.parse(await readFile(join(target, ".motion", "install-manifest.json"), "utf8"));
  if (manifest.installerVersion !== packageJson.version) throw new Error(`Unexpected installer version ${manifest.installerVersion}; expected ${packageJson.version}`);

  run("pnpm", ["dlx", tarball, "doctor", "--target", target, "--json"], repoRoot);
  run("pnpm", ["dlx", tarball, "uninstall", "--target", target], repoRoot);

  if (await exists(join(target, ".motion"))) throw new Error("Packaged uninstall left .motion behind");
  console.log(`Packaged installer smoke test passed: ${tarballs[0]}`);
} finally {
  await rm(temp, {recursive: true, force: true});
}
