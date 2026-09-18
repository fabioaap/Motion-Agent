# Layer Readiness Checklist

- [ ] The scene has been decomposed into meaningful visual elements.
- [ ] Every major element that must move independently is identified.
- [ ] Every required moving element has an independent source or a fidelity-safe reconstruction plan.
- [ ] Background plates are explicitly separated from foreground layers.
- [ ] No full-scene raster is being used to represent multiple moving foreground objects.
- [ ] No camera, zoom, parallax, blur or Three.js effect is being counted as layer separation.
- [ ] The Layer Map matches the implementation plan.
- [ ] Any reconstruction can be verified against source/reference.

## Pass Rule

All items must be checked.

If any required moving foreground object is not independently addressable, the build is blocked.
