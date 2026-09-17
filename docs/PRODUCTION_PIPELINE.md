# @motion production pipeline

## Responsibilities

The runtime owns state, contracts, routing and convergence. The OpenAI agent package owns cognitive decisions. Node tools own local files, rendering and deterministic visual comparison. Remotion owns audiovisual rendering.

This separation prevents model judgment from becoming the only quality gate.

## Creative preproduction comes first

The production pipeline must follow `docs/PREPRODUCTION_PLAYBOOK.md` before any detailed animation build.

The required creative sequence is:

1. intake and constraints
2. creative brief
3. script with visual descriptions
4. art direction and reference research
5. storyboard or rough boards
6. styleframes and key visual frames
7. animatic or timing validation when timing materially matters
8. motion direction
9. motion specification
10. build
11. QA and correction
12. human approval
13. final render

A detailed user request may eliminate some discovery questions, but it does not authorize skipping the creative artifacts above.

`--auto` may allow the orchestrator to choose its own route and continue without stopping at every checkpoint. It does not remove preproduction.

## Cognitive agents

The model backed handlers cover brief normalization, script development, reference synthesis, art direction, storyboard planning, styleframe planning, asset decomposition, motion direction, motion specification, specialist repairs and subjective critics.

Responses that participate in the runtime graph are parsed through structured contracts before they are allowed back into the graph.

The primary CLI defaults to `gpt-5.6` and can be overridden with `--model` or `MOTION_MODEL`.

## Creative readiness gate

Before entering BUILDING, the orchestrator must confirm that the job has, or has an explicit waiver for:

* creative brief
* script
* selected art direction
* storyboard or equivalent scene plan
* key visual frames or design boards
* timing plan or animatic
* verified source assets
* motion direction

Missing creative readiness is a preproduction state, not a technical build problem.

## Deterministic controls

The following checks are code controlled or must be represented as explicit graph gates:

* state transitions
* maximum QA cycles
* asset source identity
* SHA 256 source metadata
* preview render success
* static pixel diff
* multi frame motion evidence
* locked scope regression guard
* unsafe reconstruction detection
* required critic presence
* critical and major issue blocking
* human approval gate

## Visual QA

After BUILD, the preview hook creates static fidelity evidence plus a sampled sequence of motion frames.

The static reference scene uses the exact source from the asset manifest. The static actual scene uses the generated scene plan with animation disabled. Pixelmatch compares those PNGs and writes a diff image.

The dynamic motion scene is also rendered at initial, intermediate, timeline critical and final frames. These sampled motion frames are supplied to the model based Motion Critic and Composition Critic as image evidence.

Do not confuse sampled motion frames used for QA with preproduction key visual frames or styleframes. Preproduction frames define the intended look before build. QA frames verify the implemented motion after build.

The deterministic `visual_fidelity_critic` fails when source identity differs or the static diff ratio exceeds `MOTION_VISUAL_MAX_DIFF`.

## Regression QA

Every preview stores a scene snapshot. On later correction cycles, any layer explicitly marked `LOCKED` is compared against the previous snapshot for source, geometry, fit, z index, strategy and original asset identity.

A locked scope mutation becomes a critical `REGRESSION` issue and blocks delivery.

Creative regressions also block delivery when the build materially departs from the approved script, art direction or key visual frames.

## Parallel QA

Independent critics fan out in parallel after the preview is generated. Their reports fan back into QA aggregation. Critical or major issues cannot be averaged away.

## Correction loop

Critic issues receive stable IDs and are routed to the responsible specialist. Attempts are recorded. Repeated equivalent failure triggers strategy review and fallback. The job stops rather than looping forever after the configured QA cycle limit.

If the failure is caused by a flawed upstream creative decision, route back to the appropriate preproduction artifact instead of repeatedly patching animation code.

## Local production command

```bash
pnpm motion -- '@motion --auto crie um motion para este dashboard mostrando a oportunidade encontrada pela IA' --asset ./dashboard.png
```

Even with `--auto`, the orchestrator must first generate the required preproduction artifacts. Add `--approve` only when the same run may cross the human approval checkpoint and proceed to the final render.

## Live GitHub smoke test

`.github/workflows/live-motion.yml` provides a manual end to end test using the real OpenAI provider, Remotion render, visual QA and final artifact upload.

The workflow requires the repository Actions secret `OPENAI_API_KEY`. The secret is deliberately not created or committed by this repository.

## External prerequisite

Live cognitive execution requires `OPENAI_API_KEY` in the local environment or deployment secret store. Never commit the raw key.
