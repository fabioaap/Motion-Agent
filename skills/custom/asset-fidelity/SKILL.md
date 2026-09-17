---
name: asset-fidelity
description: Preserves source assets and prevents approximate reconstruction of UI, icons, logos and brand elements
version: 1.0.0
---

# Asset Fidelity

Use this skill whenever source material must be preserved accurately.

## Priority order

1. Reuse the original asset.
2. Reuse the original source component.
3. Reuse the original SVG.
4. Segment the original when safe.
5. Use a hybrid composition.
6. Rebuild only when enough source information exists for strict fidelity.
7. Request the source when faithful reconstruction cannot be proven.

## Strict rule

Approximate reconstruction is a failure.

Never replace a source icon with a similar icon from Lucide, Material Icons or another library when the original is required.

Never silently change typography, spacing, radius, stroke, shadow, proportions, color or layout.

## Validation

For reconstructed elements, compare original and reconstruction using equivalent frames.

When possible use overlay and difference views.

If a relevant difference remains and cannot be corrected reliably, abandon the reconstruction strategy and return to decomposition.
