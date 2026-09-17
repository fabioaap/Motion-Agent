# @motion production pipeline

## Responsibilities

The runtime owns state, contracts, routing and convergence. The OpenAI agent package owns cognitive decisions. Node tools own local files, rendering and deterministic visual comparison. Remotion owns audiovisual rendering.

This separation prevents model judgment from becoming the only quality gate.

## Cognitive agents

The real model backed handlers cover brief normalization, asset decomposition, creative direction, motion direction, motion specification, specialist repairs and subjective critics.

Responses are parsed through Zod structured outputs before they are allowed back into the graph.

## Deterministic controls

The following checks are code controlled:

* state transitions
* maximum QA cycles
* asset source identity
* SHA 256 source metadata
* preview render success
* pixel diff
* unsafe reconstruction detection
* required critic presence
* critical and major issue blocking
* human approval gate

## Visual QA

After BUILD, the preview hook creates two static fidelity scenes.

The reference scene uses the exact source from the asset manifest.

The actual scene uses the generated scene plan.

Both are rendered through the same Remotion composition. Pixelmatch compares the resulting PNGs and a diff image is written to the job QA output directory.

The deterministic `visual_fidelity_critic` fails when source identity differs or the diff ratio exceeds `MOTION_VISUAL_MAX_DIFF`.

## Correction loop

Critic issues receive stable IDs and are routed to the responsible specialist. Attempts are recorded. Repeated equivalent failure triggers strategy review and fallback. The job stops rather than looping forever after the configured QA cycle limit.

## External prerequisite

Live cognitive execution requires `OPENAI_API_KEY` in the local environment or deployment secret store. The key is deliberately not created or committed by this repository.
