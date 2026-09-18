task: renderFinalMotion()
responsible: remotion-builder
responsible_type: Agent
atomic_layer: Delivery
elicit: true

inputs:
- field: qa_result
  type: string
  source: Workflow Context
  required: true
- field: human_approval
  type: boolean
  source: User Input
  required: true
- field: render_settings
  type: object
  source: Workflow Context
  required: true

outputs:
- field: final_render
  type: file
  destination: .motion/remotion/out
  persisted: true
- field: delivery_notes
  type: object
  destination: Workflow Context
  persisted: true

# Procedure

1. Require `qa_result == READY_FOR_HUMAN`.
2. Require explicit human approval.
3. Render final output using approved settings.
4. Re-run technical validation on the final render.
5. Do not modify scene architecture after approval except to fix render-only defects.

# Exit Criteria

- Human approval exists.
- Final render completes.
- Final technical validation passes.
