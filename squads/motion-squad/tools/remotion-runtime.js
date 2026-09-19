export function assertLayerableBuild({buildMode, layers = [], explicitFlatMotionAuthorization = false}) {
  if (!["LAYERED_MOTION", "FLAT_MOTION_ALLOWED"].includes(buildMode)) {
    throw new Error(`Unsupported motion build mode: ${buildMode ?? "missing"}`);
  }

  if (buildMode === "FLAT_MOTION_ALLOWED" && !explicitFlatMotionAuthorization) {
    throw new Error("Flat motion requires explicit user authorization.");
  }

  if (buildMode === "LAYERED_MOTION") {
    const blocked = layers.filter(
      (layer) => layer.requiresAnimation && (
        !layer.independentlyAddressable ||
        layer.sourceKind === "FLATTENED_STYLEFRAME" ||
        layer.source_kind === "FLATTENED_STYLEFRAME" ||
        layer.flattenedForeground === true ||
        layer.flattened_foreground === true
      )
    );
    if (blocked.length) {
      throw new Error(
        `Layerability Gate failed: ${blocked.map((layer) => layer.elementId ?? layer.element_id).join(", ")}`
      );
    }
  }

  return true;
}
