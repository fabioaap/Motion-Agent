export function assertLayerableBuild({buildMode, layers = [], explicitFlatMotionAuthorization = false}) {
  if (buildMode === "FLAT_MOTION_ALLOWED" && !explicitFlatMotionAuthorization) {
    throw new Error("Flat motion requires explicit user authorization.");
  }

  if (buildMode === "LAYERED_MOTION") {
    const blocked = layers.filter(
      (layer) => layer.requiresAnimation && !layer.independentlyAddressable
    );
    if (blocked.length) {
      throw new Error(
        `Layerability Gate failed: ${blocked.map((layer) => layer.elementId ?? layer.element_id).join(", ")}`
      );
    }
  }

  return true;
}
