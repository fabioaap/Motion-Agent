#### Step 8: Render Final Motion

task: renderFinalMotion()
responsável: Remotion Builder
responsavel_type: Agente
atomic_layer: Media

**Entrada:**
- campo: qaResult
  tipo: string
  origem: Step 7 (reviewMotionScene)
  obrigatório: true
- campo: humanApproval
  tipo: boolean
  origem: user input
  obrigatório: true
- campo: renderSettings
  tipo: object
  origem: workflow state
  obrigatório: true

**Saída:**
- campo: finalRender
  tipo: string (file path)
  destino: output
  persistido: true
- campo: deliveryNotes
  tipo: object
  destino: output
  persistido: true

**Checklist:**
  pre-conditions:
    - [ ] QA is READY_FOR_HUMAN
      tipo: pre-condition
      blocker: true
      validação: "qaResult == 'READY_FOR_HUMAN'"
    - [ ] Human explicitly approved the preview
      tipo: pre-condition
      blocker: true
      validação: "humanApproval == true"
  post-conditions:
    - [ ] Final render completed
      tipo: post-condition
      blocker: true
      validação: "finalRender != null"
    - [ ] Final technical validation passed
      tipo: post-condition
      blocker: true
      validação: "finalTechnicalValidation == 'PASS'"
  acceptance-criteria:
    - [ ] Final render matches the approved preview architecture
      tipo: acceptance
      blocker: false
      story: MOTION-SQUAD-001
      manual_check: true

**Scripts:**
- scripts/render-scene.js:
    description: Renders the approved Remotion composition
    language: javascript
    version: 1.0.0

**Error Handling:**
- strategy: abort
- abort_workflow: true
- notification: log

**Metadata:**
- story: MOTION-SQUAD-001
- version: 1.0.0
- dependencies: [Step 7]
- breaking_changes: []
- author: Motion Agent
- created_at: 2026-09-18
- updated_at: 2026-09-18
