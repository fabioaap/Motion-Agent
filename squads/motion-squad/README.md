# Motion Squad

AIOX Squad for asset-first motion design and Remotion production.

## Core rule

If a scene requires component-level motion, the squad MUST NOT animate a flattened full-scene image as if its internal objects were independent layers.

A flattened styleframe may be used as:
- a visual reference;
- an environmental background plate;
- an explicitly approved flat-motion animatic.

It may not be used as the main animated foreground for component motion.

## User-facing contract

When the user asks for motion, the squad first determines what must move independently.

If required layers are missing, the squad must say exactly what is missing and what can be reconstructed before build begins.

Example:

> To create this as component motion, I need the ad card, cursor, WhatsApp card and tracking card as independent assets. I can reconstruct the headline, signal path, simple vectors and glows. Without the missing assets, the result would be flat slide motion, so the build is blocked.

## Workflow

```text
@motion
  -> intake-motion-request
  -> audit-scene-topology
  -> Missing Assets Gate
       -> BLOCKED_MISSING_ASSETS -> request-missing-assets -> WAITING_FOR_ASSETS
       -> LAYERED_READY
       -> RECONSTRUCTION_READY
       -> FLAT_MOTION_ONLY only with explicit user authorization
  -> resolve-motion-strategy
  -> motion direction
  -> resolve-template
  -> build-motion-scene
  -> review-motion-scene
  -> READY_FOR_HUMAN
  -> human approval
  -> render-final-motion
```

## Hard gates

1. No fake layer motion.
2. Missing critical assets block the build.
3. Reconstruction is allowed only when fidelity can be verified.
4. Flat motion requires explicit user authorization.
5. A specialized Remotion template never bypasses the Layerability Gate.
6. READY_FOR_HUMAN requires all mandatory checklists to pass.

## Remotion templates

The squad consumes the Motion Agent official registry at `.motion/template-recipes.json`.

- `blank`: default product-motion baseline.
- `three`: true React Three Fiber / 3D only.
- `skia`: Skia-specific canvas work.
- `overlay`: alpha overlays.
- `code-hike`: code animation.
- audio/caption templates only when the scene requires them.

## AIOX

This package follows the AIOX Squad architecture:
- task-first entry points;
- agents as roles;
- workflows for multi-step orchestration;
- checklists for gates;
- local distribution under `./squads/`.
