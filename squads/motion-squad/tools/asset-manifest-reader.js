import {readdir} from "node:fs/promises";
import {relative, resolve, sep} from "node:path";

const ignoredDirectories = new Set([".git", "node_modules", "dist", "build", ".next"]);

export async function findRepositoryAsset(root, requestedName) {
  const base = resolve(root);
  const target = requestedName.toLocaleLowerCase();
  const pending = [base];

  while (pending.length) {
    const directory = pending.pop();
    let entries;
    try {
      entries = await readdir(directory, {withFileTypes: true});
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) {
        pending.push(resolve(directory, entry.name));
      } else if (entry.isFile() && entry.name.toLocaleLowerCase() === target) {
        const source = relative(base, resolve(directory, entry.name)).split(sep).join("/");
        return {id: source, name: entry.name, source};
      }
    }
  }
  return null;
}

export function buildAssetManifest({assets = [], repositoryAssets = [], layerMap = []} = {}) {
  const available = [...assets, ...repositoryAssets];
  const byId = new Map(available.flatMap((asset) => {
    const keys = [asset.id, asset.asset_id, asset.name, asset.source].filter(Boolean);
    return keys.map((key) => [key, asset]);
  }));
  return layerMap.map((layer) => ({
    ...layer,
    asset: byId.get(layer.source_asset_id ?? layer.sourceAssetId ?? layer.element_id ?? layer.name) ?? null,
    independentlyAddressable: Boolean(layer.independentlyAddressable ?? layer.independently_addressable),
  }));
}

export function missingCriticalLayers(manifest = []) {
  return manifest.filter(
    (layer) => layer.requiresAnimation && (
      !layer.asset ||
      !layer.independentlyAddressable ||
      layer.sourceKind === "FLATTENED_STYLEFRAME" ||
      layer.source_kind === "FLATTENED_STYLEFRAME" ||
      layer.flattenedForeground === true ||
      layer.flattened_foreground === true
    )
  );
}
