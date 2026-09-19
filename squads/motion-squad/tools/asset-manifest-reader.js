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
