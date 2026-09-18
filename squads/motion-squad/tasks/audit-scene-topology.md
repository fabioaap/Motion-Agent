task: auditSceneTopology()
responsible: asset-intake-specialist
responsible_type: Agent
atomic_layer: Analysis
elicit: false

inputs:
- field: scene_summary
  type: string
  source: Workflow Context
  required: true
- field: references
  type: array
  source: Workflow Context
  required: false
- field: available_assets
  type: array
  source: Repository and User Input
  required: false

outputs:
- field: element_inventory
  type: array
  destination: Workflow Context
  persisted: true
- field: layer_map
  type: array
  destination: Workflow Context
  persisted: true
- field: missing_assets
  type: array
  destination: Workflow Context
  persisted: true
- field: reconstructable_elements
  type: array
  destination: Workflow Context
  persisted: true
- field: layerability_status
  type: string
  destination: Workflow Context
  persisted: true

# Procedure

1. Inspect the host repository before asking the user for anything.
2. Break the approved scene into:
   - environmental background;
   - typography;
   - primary foreground objects;
   - UI/product components;
   - pointers/cursors;
   - signal paths;
   - highlights, glows and masks.
3. Mark every element that requires independent motion.
4. For each element, classify its source:
   - SOURCE_COMPONENT
   - SVG
   - TRANSPARENT_ASSET
   - USER_CUTOUT
   - RECONSTRUCTABLE_REACT_SVG
   - BACKGROUND_PLATE
   - FLATTENED_STYLEFRAME
   - MISSING
5. A moving element is layer-ready only when it is independently addressable.
6. A full-scene raster must never satisfy multiple moving foreground elements.
7. Set:
   - `LAYERED_READY` when all required moving elements exist independently;
   - `RECONSTRUCTION_READY` when missing elements can be faithfully reconstructed without user assets;
   - `BLOCKED_MISSING_ASSETS` when one or more critical moving elements require source from the user;
   - `FLAT_MOTION_ONLY` only when the scene can only be treated as one flattened image.
8. Run `layer-readiness-checklist` and `missing-assets-gate`.

# Exit Criteria

- Every required moving object has a source classification.
- Missing critical assets are explicit and concrete.
- The scene has a single layerability status.
- No build starts in this task.
