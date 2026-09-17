# @motion production pipeline

## Responsibilities

The runtime owns state, contracts, routing and convergence. The OpenAI agent package owns cognitive decisions. Node tools own local files, rendering and deterministic visual comparison. Remotion owns audiovisual rendering.

This separation prevents model judgment from becoming the only quality gate.

## Cognitive agents

The real model backed handlers cover brief normalization, asset decomposition, creative direction, motion direction, motion specification, specialist repairs and subjective critics.

Responses are parsed through Zod structured outputs before they are allowed back into the graph.

The primary CLI defaults to `gpt-5.6` and can be overridden with `--model` or `MOTION_MODEL`.

## Deterministic controls

The following checks are code controlled:

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

After BUILD, the preview hook creates static fidelity evidence plus a sampled sequence of motion keyframes.

The static reference scene uses the exact source from the asset manifest. The static actual scene uses the generated scene plan with animation disabled. Pixelmatch compares those PNGs and writes a diff image.

The dynamic motion scene is also rendered at initial, intermediate, timeline critical and final frames. Those keyframes are supplied to the model based Motion Critic and Composition Critic as image evidence.

The deterministic `visual_fidelity_critic` fails when source identity differs or the static diff ratio exceeds `MOTION_VISUAL_MAX_DIFF`.

## Regression QA

Every preview stores a scene snapshot. On later correction cycles, any layer explicitly marked `LOCKED` is compared against the previous snapshot for source, geometry, fit, z index, strategy and original asset identity.

A locked scope mutation becomes a critical `REGRESSION` issue and blocks delivery.

## Parallel QA

Independent critics fan out in parallel after the preview is generated. Their reports fan back into QA aggregation. Critical or major issues cannot be averaged away.

## Correction loop

Critic issues receive stable IDs and are routed to the responsible specialist. Attempts are recorded. Repeated equivalent failure triggers strategy review and fallback. The job stops rather than looping forever after the configured QA cycle limit.

## Local production command

```bash
pnpm motion -- '@motion --auto anime esse dashboard mostrando a oportunidade encontrada pela IA' --asset ./dashboard.png
```

Add `--approve` when the same run may cross the human approval checkpoint and proceed to the final render.

## Live GitHub smoke test

`.github/workflows/live-motion.yml` provides a manual end to end test using the real OpenAI provider, Remotion render, visual QA and final artifact upload.

The workflow requires the repository Actions secret `OPENAI_API_KEY`. The secret is deliberately not created or committed by this repository.

## External prerequisite

Live cognitive execution requires `OPENAI_API_KEY` in the local environment or deployment secret store. Never commit the raw key.
