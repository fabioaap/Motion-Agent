#### Step 2: Audit Scene Topology

task: auditSceneTopology()
responsável: Asset Intake Specialist
responsavel_type: Agente
atomic_layer: Analysis

**Entrada:**
- campo: sceneSummary
  tipo: string
  origem: Step 1 (intakeMotionRequest)
  obrigatório: true
- campo: assumedElements
  tipo: array
  origem: Step 1 (intakeMotionRequest)
  obrigatório: true
- campo: references
  tipo: array
  origem: user input
  obrigatório: false
- campo: availableAssets
  tipo: array
  origem: project context
  obrigatório: false

**Saída:**
- campo: elementInventory
  tipo: array
  destino: [Step 3, Step 4]
  persistido: true
- campo: layerMap
  tipo: array
  destino: [Step 4, Step 6, Step 7]
  persistido: true
- campo: missingAssets
  tipo: array
  destino: Step 3 (requestMissingAssets)
  persistido: true
- campo: reconstructableElements
  tipo: array
  destino: Step 3 (requestMissingAssets)
  persistido: true
- campo: layerabilityStatus
  tipo: string
  destino: workflow state
  persistido: true

**Checklist:**
  pre-conditions:
    - [ ] Host repository and supplied assets were inspected before requesting new source material
      tipo: pre-condition
      blocker: true
      validação: "sourceAuditCompleted == true"
  post-conditions:
    - [ ] Every required moving foreground object has a source classification
      tipo: post-condition
      blocker: true
      validação: "layerMap.every(layer => !layer.requiresAnimation || layer.sourceKind)"
    - [ ] Full-scene raster does not satisfy multiple moving foreground layers
      tipo: post-condition
      blocker: true
      validação: "noFlattenedForegroundSubstitution == true"
    - [ ] A flattened reference is explicitly classified as FLATTENED_STYLEFRAME, never as component motion
      tipo: post-condition
      blocker: true
      validaÃ§Ã£o: "layerMap sourceKind FLATTENED_STYLEFRAME requires an independent replacement before build"
    - [ ] layerabilityStatus is valid
      tipo: post-condition
      blocker: true
      validação: "['LAYERED_READY','RECONSTRUCTION_READY','BLOCKED_MISSING_ASSETS','FLAT_MOTION_ONLY'].includes(layerabilityStatus)"
  acceptance-criteria:
    - [ ] Missing assets are concrete and actionable
      tipo: acceptance
      blocker: false
      story: MOTION-SQUAD-001
      manual_check: true

**Tools:**
- assetManifestReader:
    version: 1.0.0
    used_for: Build a source-aware inventory of scene layers
    shared_with: [Step 3, Step 6]

**Error Handling:**
- strategy: abort
- abort_workflow: true
- notification: log

**Metadata:**
- story: MOTION-SQUAD-001
- version: 1.0.0
- dependencies: [Step 1]
- breaking_changes: []
- author: Motion Agent
- created_at: 2026-09-18
- updated_at: 2026-09-18
