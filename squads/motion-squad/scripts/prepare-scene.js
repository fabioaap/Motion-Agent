import {readFile, writeFile} from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: node prepare-scene.js <scene.json> <prepared.json>");
}

const scene = JSON.parse(await readFile(inputPath, "utf8"));
const moving = (scene.layers ?? []).filter((layer) => layer.requiresAnimation);
const blocked = moving.filter((layer) => !layer.independentlyAddressable);

const prepared = {
  ...scene,
  layerabilityStatus:
    blocked.length > 0 ? "BLOCKED_MISSING_ASSETS" : "LAYERED_READY",
  blockedLayers: blocked.map((layer) => layer.elementId ?? layer.element_id),
};

await writeFile(outputPath, `${JSON.stringify(prepared, null, 2)}\n`);
console.log(prepared.layerabilityStatus);
