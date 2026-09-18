import {existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import {gunzipSync} from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, "..", "public", "adsmagic-do-clique-a-venda");
const packDir = join(publicDir, "scene1-pack");
const outputDir = join(publicDir, "scene1-layers");

const chunks = readdirSync(packDir)
  .filter((name) => /^chunk-\d+$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

if (chunks.length === 0) {
  throw new Error(`No Scene 1 asset chunks found in ${packDir}`);
}

const base64 = chunks
  .map((name) => readFileSync(join(packDir, name), "utf8"))
  .join("")
  .replace(/\s+/g, "");

const tar = gunzipSync(Buffer.from(base64, "base64"));

rmSync(outputDir, {recursive: true, force: true});
mkdirSync(outputDir, {recursive: true});

const readString = (buffer, start, length) =>
  buffer
    .subarray(start, start + length)
    .toString("utf8")
    .replace(/\0.*$/, "")
    .trim();

let offset = 0;
const written = [];

while (offset + 512 <= tar.length) {
  const header = tar.subarray(offset, offset + 512);
  if (header.every((byte) => byte === 0)) break;

  const name = readString(header, 0, 100);
  const sizeText = readString(header, 124, 12);
  const size = Number.parseInt(sizeText || "0", 8);
  const typeFlag = String.fromCharCode(header[156] || 48);
  const contentStart = offset + 512;
  const contentEnd = contentStart + size;

  if ((typeFlag === "0" || typeFlag === "\0") && name.startsWith("scene1/")) {
    const relative = name.slice("scene1/".length);
    if (relative && !relative.includes("/")) {
      writeFileSync(join(outputDir, relative), tar.subarray(contentStart, contentEnd));
      written.push(relative);
    }
  }

  offset = contentStart + Math.ceil(size / 512) * 512;
}

const required = [
  "background.jpg",
  "ad-card.webp",
  "cursor.webp",
  "whatsapp-card.webp",
  "tracking-card.webp"
];

for (const name of required) {
  const file = join(outputDir, name);
  if (!existsSync(file)) {
    throw new Error(`Scene 1 asset reconstruction failed: missing ${name}`);
  }
}

console.log(
  `Scene 1 layered assets ready: ${required.join(", ")} (${chunks.length} chunks, ${written.length} files extracted)`
);
