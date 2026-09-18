# Coding Standards

- Prefer TypeScript and React for Remotion compositions.
- Reuse source components, SVGs, fonts, tokens and assets before reconstructing.
- Never replace strict source icons or brand assets with approximate library icons.
- Every major animated foreground object must be independently addressable when component motion is requested.
- Keep environmental raster backgrounds separate from animated foreground layers.
- Prefer SVG/React for simple typography, vectors, signal paths, glows and shapes.
- Treat cutouts and transparent assets as immutable source visuals unless the task explicitly requires editing them.
- Keep animation parameters deterministic and frame-based.
- Do not use camera drift, zoom, blur, parallax or Three.js displacement as a substitute for missing layer separation.
- Keep render outputs and temporary jobs outside committed source.
