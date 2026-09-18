task: resolveMotionStrategy()
responsible: motion-director
responsible_type: Agent
atomic_layer: Design
elicit: false

inputs:
- field: scene_summary
  type: string
  source: Workflow Context
  required: true
- field: layer_map
  type: array
  source: Workflow Context
  required: true
- field: layerability_status
  type: string
  source: Workflow Context
  required: true

outputs:
- field: build_mode
  type: string
  destination: Workflow Context
  persisted: true
- field: motion_strategy
  type: object
  destination: Workflow Context
  persisted: true
- field: technique_required
  type: array
  destination: Workflow Context
  persisted: true

# Procedure

1. Reject execution when status is `BLOCKED_MISSING_ASSETS`.
2. If status is `RECONSTRUCTION_READY`, define the reconstruction plan before animation.
3. If status is `FLAT_MOTION_ONLY`, verify explicit user authorization. Without it, stop.
4. Define entry, main action, causality, highlight moment and exit.
5. Define each major layer's motion responsibility.
6. Define whether any specialized implementation technique is genuinely needed.
7. Do not use camera motion as a substitute for missing object motion.
8. Output one build mode:
   - LAYERED_MOTION
   - RECONSTRUCTION_FIRST
   - FLAT_MOTION_ALLOWED

# Exit Criteria

- Motion intent is causal and layer-specific.
- Build mode matches source readiness.
- Specialized technical requirements are explicit.
