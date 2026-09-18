#### Step 1: Intake Motion Request

task: intakeMotionRequest()
responsável: Motion Director
responsavel_type: Agente
atomic_layer: Analysis

**Entrada:**
- campo: userRequest
  tipo: string
  origem: user input
  obrigatório: true
- campo: references
  tipo: array
  origem: user input
  obrigatório: false
- campo: availableAssets
  tipo: array
  origem: project context
  obrigatório: false
- campo: targetFormat
  tipo: string | null
  origem: user input
  obrigatório: false
  padrão: null

**Saída:**
- campo: sceneSummary
  tipo: string
  destino: Step 2 (auditSceneTopology)
  persistido: true
- campo: motionObjective
  tipo: string
  destino: Step 4 (resolveMotionStrategy)
  persistido: true
- campo: assumedElements
  tipo: array
  destino: Step 2 (auditSceneTopology)
  persistido: true

**Checklist:**
  pre-conditions:
    - [ ] userRequest is present
      tipo: pre-condition
      blocker: true
      validação: "userRequest.length > 0"
  post-conditions:
    - [ ] Candidate moving elements are explicit
      tipo: post-condition
      blocker: true
      validação: "assumedElements.length > 0"
    - [ ] No implementation started during intake
      tipo: post-condition
      blocker: true
      validação: "sceneBuild == null"
  acceptance-criteria:
    - [ ] Scene intent is understandable without inventing a new visual concept
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
- dependencies: []
- breaking_changes: []
- author: Motion Agent
- created_at: 2026-09-18
- updated_at: 2026-09-18
