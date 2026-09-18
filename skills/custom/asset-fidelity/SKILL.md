---
name: asset-fidelity
description: Preserves source assets while enabling faithful layer separation for component-level motion
version: 1.1.0
---

# Asset Fidelity

Use this skill whenever source material must be preserved accurately.

## Priority order

1. Reuse the original source component.
2. Reuse the original SVG.
3. Reuse an original transparent asset.
4. Use a user-provided cutout or matte.
5. Segment the original when safe and fidelity can be verified.
6. Reconstruct simple typography, shapes, glows and signal paths in React/SVG when their appearance can be matched.
7. Use a raster environmental background plate when it is not the animated subject.
8. Rebuild complex visuals only when enough source information exists for strict fidelity.
9. Request the source when faithful reconstruction cannot be proven.

## Flattened styleframe rule

A full-scene styleframe is a valid reference for composition, lighting, spacing, color and final-frame fidelity.

It is **not** automatically a valid motion asset.

When the user requests component-level motion, do not animate the full styleframe as the foreground and claim that its internal objects are animated separately.

The foreground must be decomposed into independently addressable layers before implementation.

## Strict rule

Approximate reconstruction is a failure.

Never replace a source icon with a similar icon from Lucide, Material Icons or another library when the original is required.

Never silently change typography, spacing, radius, stroke, shadow, proportions, color or layout.

Layer separation is not permission to redesign the approved frame.

## Validation

For reconstructed or separated elements, compare the composed result with the approved reference at equivalent frames.

When possible use overlay and difference views.

Validate both:

- visual fidelity of the recomposed frame;
- structural fidelity of the layer model.

A visually similar result that still depends on one flattened foreground image fails structural fidelity when independent motion was requested.

If a relevant difference remains and cannot be corrected reliably, abandon the reconstruction strategy and return to decomposition.
