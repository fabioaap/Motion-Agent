task: resolveTemplate()
responsible: template-resolver
responsible_type: Agent
atomic_layer: Architecture
elicit: false

inputs:
- field: motion_strategy
  type: object
  source: Workflow Context
  required: true
- field: technique_required
  type: array
  source: Workflow Context
  required: true
- field: template_registry
  type: object
  source: .motion/template-recipes.json
  required: true

outputs:
- field: selected_template
  type: object
  destination: Workflow Context
  persisted: true

# Procedure

1. Read `.motion/template-recipes.json`.
2. Default to `blank`.
3. Select `three` only for true React Three Fiber / geometry / camera requirements.
4. Select `skia` only when the scene materially benefits from Skia-specific rendering.
5. Select other specialized templates only for their explicit technical role.
6. Never select a template to compensate for missing assets.
7. Record:
   - template id;
   - official page;
   - create command;
   - reason;
   - adaptation plan;
   - dependencies introduced.
8. Preserve host project architecture and approved art direction.

# Exit Criteria

- One primary technical baseline is selected.
- Selection is justified by motion strategy.
- Layerability rules remain unchanged.
