#### Step 4: Resolve Motion Strategy

task: resolveMotionStrategy()
responsável: Motion Director
responsavel_type: Agente
atomic_layer: Strategy

**Entrada:**
- campo: sceneSummary
  tipo: string
  origem: Step 1 (intakeMotionRequest)
  obrigatório: true
- campo: layerMap
  tipo: array
  origem: Step 2 (auditSceneTopology)
  obrigatório: true
- campo: layerabilityStatus
  tipo: string
  origem: Step 2 (auditSceneTopology)
  obrigatório: true
- campo: explicitFlatMotionAuthorization
  tipo: boolean
  origem: user input
  obrigatório: false
  padrão: false

**Saída:**
- campo: buildMode
  tipo: string
  destino: [Step 5, Step 6]
  persistido: true
- campo: motionStrategy
  tipo: object
  destino: [Step 5, Step 6]
  persistido: true
- campo: techniqueRequired
  tipo: array<string>
  destino: Step 5 (resolveTemplate)
  persistido: true

**Checklist:**
  pre-conditions:
    - [ ] Missing critical assets do not remain unresolved
      tipo: pre-condition
      blocker: true
      validação: "layerabilityStatus != 'BLOCKED_MISSING_ASSETS'"
    - [ ] Flat motion has explicit authorization when required
      tipo: pre-condition
      blocker: true
      validação: "layerabilityStatus != 'FLAT_MOTION_ONLY' || explicitFlatMotionAuthorization == true"
  post-conditions:
    - [ ] Motion responsibilities are defined per major layer
      tipo: post-condition
      blocker: true
      validação: "motionStrategy.layerResponsibilities != null"
    - [ ] Camera motion is not used as a substitute for missing object motion
      tipo: post-condition
      blocker: true
      validação: "motionStrategy.fakeLayerSeparation != true"
  acceptance-criteria:
    - [ ] Strategy explains cause and effect in the scene
      tipo: acceptance
      blocker: false
      story: MOTION-SQUAD-001
      manual_check: true

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
