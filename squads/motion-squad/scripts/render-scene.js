import {spawnSync} from "node:child_process";

const [composition, output] = process.argv.slice(2);
if (!composition || !output) {
  throw new Error("Usage: node render-scene.js <composition> <output>");
}

const result = spawnSync(
  "pnpm",
  ["--dir", ".motion/remotion", "exec", "remotion", "render", "src/index.ts", composition, output],
  {stdio: "inherit", shell: process.platform === "win32"}
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
