export function buildAssetManifest({assets = [], layerMap = []} = {}) {
  const byId = new Map(assets.map((asset) => [asset.id ?? asset.asset_id ?? asset.name, asset]));
  return layerMap.map((layer) => ({
    ...layer,
    asset: byId.get(layer.source_asset_id ?? layer.element_id) ?? null,
    independentlyAddressable: Boolean(layer.independentlyAddressable ?? layer.independently_addressable),
  }));
}

export function missingCriticalLayers(manifest = []) {
  return manifest.filter(
    (layer) => layer.requiresAnimation && !layer.independentlyAddressable
  );
}
