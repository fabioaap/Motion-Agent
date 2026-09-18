task: buildMotionScene()
responsible: remotion-builder
responsible_type: Agent
atomic_layer: Implementation
elicit: false

inputs:
- field: build_mode
  type: string
  source: Workflow Context
  required: true
- field: layer_map
  type: array
  source: Workflow Context
  required: true
- field: motion_strategy
  type: object
  source: Workflow Context
  required: true
- field: selected_template
  type: object
  source: Workflow Context
  required: true

outputs:
- field: scene_build
  type: object
  destination: .motion/remotion
  persisted: true
- field: preview
  type: file
  destination: .motion/remotion/out
  persisted: true
- field: build_notes
  type: object
  destination: Workflow Context
  persisted: true

# Procedure

1. HARD FAIL if build mode is `RECONSTRUCTION_FIRST` and reconstruction has not completed.
2. HARD FAIL if any required moving element lacks an independent source.
3. Implement the Layer Map exactly.
4. Use React/SVG for simple text, vectors, glows, paths and shapes.
5. Use exact source components, SVGs, transparent assets or user cutouts for complex elements.
6. A background raster may remain a background plate.
7. Do not place the full approved styleframe behind the scene as a hidden foreground substitute.
8. Build a short isolated scene preview before full-film integration.
9. Render representative checkpoints.
10. Store build notes listing every independent layer actually implemented.

# Exit Criteria

- Major moving elements are independently addressable in code.
- Preview renders without missing assets.
- Build notes match the Layer Map.
