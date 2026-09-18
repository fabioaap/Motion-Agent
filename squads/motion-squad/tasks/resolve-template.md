#### Step 5: Resolve Remotion Template

task: resolveTemplate()
responsável: Template Resolver
responsavel_type: Agente
atomic_layer: Strategy

**Entrada:**
- campo: motionStrategy
  tipo: object
  origem: Step 4 (resolveMotionStrategy)
  obrigatório: true
- campo: techniqueRequired
  tipo: array<string>
  origem: Step 4 (resolveMotionStrategy)
  obrigatório: true
- campo: templateRegistry
  tipo: object
  origem: config (.motion/template-recipes.json)
  obrigatório: true

**Saída:**
- campo: selectedTemplate
  tipo: object
  destino: Step 6 (buildMotionScene)
  persistido: true

**Checklist:**
  pre-conditions:
    - [ ] Motion strategy is defined before template selection
      tipo: pre-condition
      blocker: true
      validação: "motionStrategy != null"
  post-conditions:
    - [ ] A single primary technical baseline is selected
      tipo: post-condition
      blocker: true
      validação: "selectedTemplate.templateId != null"
    - [ ] Three is selected only for genuine 3D requirements
      tipo: post-condition
      blocker: true
      validação: "selectedTemplate.templateId != 'three' || techniqueRequired.some(x => /3d|r3f|three/i.test(x))"
    - [ ] Template selection does not alter Layerability requirements
      tipo: post-condition
      blocker: true
      validação: "selectedTemplate.layerabilityGateUnchanged == true"
  acceptance-criteria:
    - [ ] Template acts as a technical reference rather than a visual style source
      tipo: acceptance
      blocker: false
      story: MOTION-SQUAD-001
      manual_check: true

**Template:**
- path: data/remotion-templates.json
  type: input
  version: 1.0.0
  variables: [techniqueRequired]

**Error Handling:**
- strategy: fallback
- fallback: "Use blank as the technical baseline."
- abort_workflow: false
- notification: log

**Metadata:**
- story: MOTION-SQUAD-001
- version: 1.0.0
- dependencies: [Step 4]
- breaking_changes: []
- author: Motion Agent
- created_at: 2026-09-18
- updated_at: 2026-09-18
