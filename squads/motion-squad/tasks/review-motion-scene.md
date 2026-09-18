task: reviewMotionScene()
responsible: motion-qa
responsible_type: Agent
atomic_layer: Validation
elicit: false

inputs:
- field: scene_build
  type: object
  source: Workflow Context
  required: true
- field: preview
  type: file
  source: Workflow Context
  required: true
- field: layer_map
  type: array
  source: Workflow Context
  required: true
- field: reference
  type: file
  source: User Input or Project Context
  required: false

outputs:
- field: qa_result
  type: string
  destination: Workflow Context
  persisted: true
- field: issues
  type: array
  destination: Workflow Context
  persisted: true

# Procedure

1. Run `fidelity-checklist`.
2. Run `layer-readiness-checklist` against implementation structure, not only rendered pixels.
3. Run motion, composition, brand and technical review.
4. Fail if:
   - a flattened full-scene foreground carries component motion;
   - a template replaced approved visuals;
   - any required layer is missing;
   - fidelity is materially off;
   - render/type errors remain.
5. If any mandatory item fails, route back to the responsible task.
6. Only set `READY_FOR_HUMAN` when all mandatory checks pass.
7. Human approval remains required before final render/delivery.

# Exit Criteria

- QA outcome is PASS or FIX_REQUIRED.
- READY_FOR_HUMAN is never emitted on a structural layerability failure.
