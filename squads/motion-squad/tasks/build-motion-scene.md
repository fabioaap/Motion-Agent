#### Step 6: Build Motion Scene

task: buildMotionScene()
responsável: Remotion Builder
responsavel_type: Agente
atomic_layer: Media

**Entrada:**
- campo: buildMode
  tipo: string
  origem: Step 4 (resolveMotionStrategy)
  obrigatório: true
- campo: layerMap
  tipo: array
  origem: Step 2 (auditSceneTopology)
  obrigatório: true
- campo: motionStrategy
  tipo: object
  origem: Step 4 (resolveMotionStrategy)
  obrigatório: true
- campo: selectedTemplate
  tipo: object
  origem: Step 5 (resolveTemplate)
  obrigatório: true

**Saída:**
- campo: sceneBuild
  tipo: object
  destino: Step 7 (reviewMotionScene)
  persistido: true
- campo: preview
  tipo: string (file path)
  destino: Step 7 (reviewMotionScene)
  persistido: true
- campo: buildNotes
  tipo: object
  destino: Step 7 (reviewMotionScene)
  persistido: true

**Checklist:**
  pre-conditions:
    - [ ] Build mode is executable
      tipo: pre-condition
      blocker: true
      validação: "['LAYERED_MOTION','FLAT_MOTION_ALLOWED'].includes(buildMode)"
    - [ ] Every required moving element is independently addressable
      tipo: pre-condition
      blocker: true
      validação: "layerMap.filter(x => x.requiresAnimation).every(x => x.independentlyAddressable)"
    - [ ] No unresolved critical asset remains
      tipo: pre-condition
      blocker: true
      validação: "layerMap.every(x => !x.requiresAnimation || x.sourceKind != 'MISSING')"
  post-conditions:
    - [ ] Major moving elements remain independently addressable in implementation
      tipo: post-condition
      blocker: true
      validação: "buildNotes.independentLayers.length >= layerMap.filter(x => x.requiresAnimation).length"
    - [ ] Full styleframe is not used as a hidden foreground substitute
      tipo: post-condition
      blocker: true
      validação: "buildNotes.flattenedForegroundUsed != true"
    - [ ] Preview rendered successfully
      tipo: post-condition
      blocker: true
      validação: "preview != null"
  acceptance-criteria:
    - [ ] Scene communicates the intended event without slide-like motion
      tipo: acceptance
      blocker: false
      story: MOTION-SQUAD-001
      manual_check: true

**Tools:**
- remotionRuntime:
    version: 1.0.0
    used_for: Validate layerable builds and execute Remotion
    shared_with: [Step 8]

**Scripts:**
- scripts/prepare-scene.js:
    description: Generates layerability-ready scene metadata
    language: javascript
    version: 1.0.0
- scripts/render-scene.js:
    description: Renders a Remotion composition
    language: javascript
    version: 1.0.0

**Error Handling:**
- strategy: abort
- abort_workflow: true
- notification: log

**Metadata:**
- story: MOTION-SQUAD-001
- version: 1.0.0
- dependencies: [Step 2, Step 4, Step 5]
- breaking_changes: []
- author: Motion Agent
- created_at: 2026-09-18
- updated_at: 2026-09-18

**Execution Rule:**

HARD FAIL if the scene is not layer-ready. Do not downgrade silently to flattened slide animation.

For RECONSTRUCTION_READY, materialize each approved React/SVG layer before invoking the Remotion builder. Update the independent Layer Map entry with its `source_asset_id`, add the output to the asset manifest, and record `{element_id, asset_id}` in `metadata.reconstruction_receipts`; rerun the Layerability Gate. If the receipt or independent output asset is absent, enter WAITING_FOR_ASSETS and do not build.
