task: requestMissingAssets()
responsible: asset-intake-specialist
responsible_type: Agent
atomic_layer: Elicitation
elicit: true

inputs:
- field: element_inventory
  type: array
  source: Workflow Context
  required: true
- field: missing_assets
  type: array
  source: Workflow Context
  required: true
- field: reconstructable_elements
  type: array
  source: Workflow Context
  required: true
- field: layerability_status
  type: string
  source: Workflow Context
  required: true

outputs:
- field: asset_request
  type: string
  destination: User
  persisted: true
- field: workflow_status
  type: string
  destination: Workflow Context
  persisted: true

# Procedure

1. Use `asset-request-response.md`.
2. Tell the user:
   - what you understood;
   - what must move independently;
   - what already exists;
   - what can be reconstructed;
   - the exact assets still needed;
   - what is blocked without them.
3. Ask only for critical missing assets. Do not ask for assets the repository already contains.
4. Prefer exact actionable requests such as:
   - "card do WhatsApp recortado em PNG/WebP transparente";
   - "SVG original do ícone";
   - "frame de notebook sem fundo".
5. Explain that continuing without these assets would create flat slide motion.
6. Set workflow status to `WAITING_FOR_ASSETS`.
7. HARD STOP. Do not route to build.
8. Resume only when the missing assets are supplied or the user explicitly authorizes `FLAT_MOTION_ONLY`.

# Exit Criteria

- User received a precise asset shopping list.
- Blocked elements are named.
- Workflow is `WAITING_FOR_ASSETS`.
- No motion build was produced.
