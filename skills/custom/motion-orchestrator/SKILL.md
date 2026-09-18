---
name: motion-orchestrator
description: Routes @motion requests through intake, asset analysis, layerability gates, specialist graph, QA loops and human approval
version: 1.2.0
---

# Motion Orchestrator

Use this skill whenever a request begins with `@motion` or when the user explicitly asks to run the Motion Director system.

## Goal

Turn user intent and visual materials into a directed motion result through a multiagent graph.

Do not jump directly from prompt to Remotion code.

Do not confuse motion applied to a flattened image with motion of independent scene components.

## Flow

1. Parse the request through the Motion Command Gateway.
2. Determine whether the user already supplied objective, desired behavior, references and assets.
3. Ask only for missing information that materially changes the creative or technical direction.
4. Run Asset Audit.
5. Run Scene Topology Audit.
6. Choose an Asset Decomposition Strategy.
7. Run the Layerability Gate.
8. Run Template Resolution against `.motion/template-recipes.json`.
9. Select the smallest official Remotion template or technique reference that fits the implementation problem.
10. Define Motion Direction.
11. Produce Motion Spec with an explicit Layer Map and template selection record.
12. Route to the minimum set of specialist agents.
13. Build preview.
14. Run independent QA critics, including Layer Separation Critic when component motion is required.
15. Route each failed issue back to the responsible specialist.
16. Repeat until convergence or a real human input requirement is reached.
17. Present only a validated preview for human review.

## Scene Topology Audit

Before implementation, classify every scene using one of these states:

- `LAYERED_READY`: major foreground objects already exist as independent source components, SVGs, transparent assets or equivalent addressable elements.
- `DECOMPOSITION_REQUIRED`: the scene is visually approved but major foreground objects are flattened into a styleframe and must be separated or reconstructed.
- `BLOCKED_MISSING_SOURCE`: faithful separation cannot be achieved from the available source material.

Record the classification in the Motion Spec.

## Layerability Gate

If the requested result requires internal element motion, the build may proceed only when every major moving foreground object is independently addressable.

Valid independent layers include:

- original product/source components;
- original SVGs;
- transparent source assets;
- user-provided cutouts;
- simple shapes, typography, glows and signal paths reconstructed in React/SVG;
- a raster environmental background plate when the background itself is not the animated subject.

A full-scene styleframe may remain a visual reference, but it must not be used as the sole animated foreground when the user expects component-level motion.

Camera drift, parallax, zoom, push-in, pull-back, blur or Three.js displacement applied to one flattened scene do **not** satisfy the Layerability Gate.

If the gate fails, return to decomposition before motion implementation.

## Template Resolution

After Layerability passes and before implementation, read `.motion/template-recipes.json` and select the smallest relevant official Remotion template or technique reference.

Default to `blank` for custom product motion when no specialized runtime is required.

Use specialized templates only when their technical capability materially solves the scene:

- `three` for genuine React Three Fiber / 3D geometry and camera needs;
- `skia` for Skia-specific canvas rendering;
- `overlay` for transparent editor overlays;
- `code-hike` for code animation;
- `audiogram` or `music-visualization` for audio-led visuals;
- `tiktok` for word-by-word caption pipelines;
- app templates only when the task is actually a video-generation app or render service.

The selected template is an implementation reference, not a visual style. It must never replace approved brand, product UI or exact source assets.

The Three template does not make a flattened foreground layerable. Layerability must already be satisfied before template selection.

Record the template id, official page, reason, adaptation plan and scaffolding requirement.

## Layer Map

The Motion Spec must identify, per scene:

- background plate;
- foreground objects;
- typography;
- UI/product components;
- signal/path layers;
- masks or mattes;
- layer dependencies;
- motion responsibility for each major layer.

The Layer Map is the implementation contract for the builder and the QA critics.

## Creative guidance

When the user does not know how to animate something, propose two to four concrete directions and explain what each direction communicates.

Do not ask the user to choose implementation details such as easing curves, spring parameters, pixel distances or interpolation values unless explicitly requested.

## Dynamic graph

Use only the specialists required by the selected technique.

Independent builders may run in parallel.

QA must be independent from the builder that produced the work.

## Convergence

Critical issues, major fidelity issues, missing assets, wrong icons, render errors, type errors and Layerability Gate failures block delivery.

Repeated failure of the same technique must trigger Strategy Review instead of another equivalent retry.
