#### Step 7: Review Motion Scene

task: reviewMotionScene()
responsável: Motion QA
responsavel_type: Agente
atomic_layer: Analysis

**Entrada:**
- campo: sceneBuild
  tipo: object
  origem: Step 6 (buildMotionScene)
  obrigatório: true
- campo: preview
  tipo: string (file path)
  origem: Step 6 (buildMotionScene)
  obrigatório: true
- campo: layerMap
  tipo: array
  origem: Step 2 (auditSceneTopology)
  obrigatório: true
- campo: reference
  tipo: string (file path) | null
  origem: user input
  obrigatório: false
  padrão: null

**Saída:**
- campo: qaResult
  tipo: string
  destino: workflow state
  persistido: true
- campo: issues
  tipo: array
  destino: workflow state
  persistido: true

**Checklist:**
  pre-conditions:
    - [ ] Preview exists
      tipo: pre-condition
      blocker: true
      validação: "preview != null"
  post-conditions:
    - [ ] Layer Separation Critic passed when component motion is required
      tipo: post-condition
      blocker: true
      validação: "layerSeparationResult == 'PASS'"
    - [ ] No flattened full-scene foreground carries component motion
      tipo: post-condition
      blocker: true
      validação: "flattenedForegroundUsed != true"
    - [ ] Fidelity, motion, composition and technical checks completed
      tipo: post-condition
      blocker: true
      validação: "allMandatoryCriticsCompleted == true"
  acceptance-criteria:
    - [ ] READY_FOR_HUMAN is emitted only when all mandatory gates pass
      tipo: acceptance
      blocker: false
      story: MOTION-SQUAD-001
      manual_check: false

**Error Handling:**
- strategy: fallback
- fallback: "Set qaResult to FIX_REQUIRED and route issues to the responsible task."
- abort_workflow: false
- notification: log

**Metadata:**
- story: MOTION-SQUAD-001
- version: 1.0.0
- dependencies: [Step 6]
- breaking_changes: []
- author: Motion Agent
- created_at: 2026-09-18
- updated_at: 2026-09-18
