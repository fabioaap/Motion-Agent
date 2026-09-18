task: intakeMotionRequest()
responsible: motion-director
responsible_type: Agent
atomic_layer: Analysis
elicit: false

inputs:
- field: user_request
  type: string
  source: User Input
  required: true
- field: references
  type: array
  source: User Input or Project Context
  required: false
- field: available_assets
  type: array
  source: Project Context
  required: false
- field: target_format
  type: string
  source: User Input or Project Context
  required: false

outputs:
- field: scene_summary
  type: string
  destination: Workflow Context
  persisted: true
- field: motion_objective
  type: string
  destination: Workflow Context
  persisted: true
- field: assumed_elements
  type: array
  destination: Workflow Context
  persisted: true
- field: next_task
  type: string
  destination: Workflow Context
  persisted: false

# Procedure

1. Restate the user's intended scene and outcome without adding a new visual concept.
2. Identify the story event: what changes, what causes it, and what the viewer should understand.
3. Identify the objects that likely need independent movement.
4. Record format, duration, brand and source constraints if known.
5. Route immediately to `audit-scene-topology`.
6. Do not build or render during intake.

# Exit Criteria

- Scene objective is explicit.
- Candidate moving elements are explicit.
- No implementation has started.
- Next task is `audit-scene-topology`.
