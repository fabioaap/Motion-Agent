#### Step 3: Request Missing Assets

task: requestMissingAssets()
responsável: Asset Intake Specialist
responsavel_type: Agente
atomic_layer: Content

**Entrada:**
- campo: elementInventory
  tipo: array
  origem: Step 2 (auditSceneTopology)
  obrigatório: true
- campo: missingAssets
  tipo: array
  origem: Step 2 (auditSceneTopology)
  obrigatório: true
- campo: reconstructableElements
  tipo: array
  origem: Step 2 (auditSceneTopology)
  obrigatório: true
- campo: layerabilityStatus
  tipo: string
  origem: Step 2 (auditSceneTopology)
  obrigatório: true

**Saída:**
- campo: assetRequest
  tipo: string
  destino: user
  persistido: true
- campo: workflowStatus
  tipo: string
  destino: workflow state
  persistido: true

**Checklist:**
  pre-conditions:
    - [ ] layerabilityStatus requires user input
      tipo: pre-condition
      blocker: true
      validação: "['BLOCKED_MISSING_ASSETS','FLAT_MOTION_ONLY'].includes(layerabilityStatus)"
  post-conditions:
    - [ ] Request states exactly which assets are missing
      tipo: post-condition
      blocker: true
      validação: "missingAssets.every(asset => assetRequest.includes(asset.name || asset.elementId))"
    - [ ] User is told that continuing without critical assets would create flat slide-like motion
      tipo: post-condition
      blocker: true
      validação: "assetRequest.includes('slide') || assetRequest.includes('chapada')"
    - [ ] Workflow is waiting for assets or explicit flat-motion authorization
      tipo: post-condition
      blocker: true
      validação: "['WAITING_FOR_ASSETS','WAITING_FOR_USER_DECISION'].includes(workflowStatus)"
  acceptance-criteria:
    - [ ] The user can act on the request without asking what file is needed
      tipo: acceptance
      blocker: false
      story: MOTION-SQUAD-001
      manual_check: true

**Template:**
- path: templates/asset-request-response.md
  type: output
  version: 1.0.0
  variables: [sceneSummary, elementsThatMustMove, availableAssets, reconstructableElements, missingAssets, blockedItems, nextAction]

**Error Handling:**
- strategy: abort
- abort_workflow: true
- notification: log

**Metadata:**
- story: MOTION-SQUAD-001
- version: 1.0.0
- dependencies: [Step 2]
- breaking_changes: []
- author: Motion Agent
- created_at: 2026-09-18
- updated_at: 2026-09-18

**Execution Rule:**

HARD STOP after producing the request. Do not route to build until the missing assets arrive or the user explicitly authorizes flat motion.
