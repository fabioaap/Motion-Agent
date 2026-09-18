---
name: motion-orchestrator
description: Routes @motion requests through intake, asset analysis, dynamic specialist graph, QA loops and human approval
version: 1.0.0
---

# Motion Orchestrator

Use this skill whenever a request begins with `@motion` or when the user explicitly asks to run the Motion Director system.

## Goal

Turn user intent and visual materials into a directed motion result through a multiagent graph.

Do not jump directly from prompt to Remotion code.

## Flow

1. Parse the request through the Motion Command Gateway.
2. Determine whether the user already supplied objective, desired behavior, references and assets.
3. Ask only for missing information that materially changes the creative or technical direction.
4. Run Asset Audit.
5. Choose an Asset Decomposition Strategy.
6. Run Template Router against `.motion/template-recipes.json` and select either `default-motion-agent` or a materially relevant official Remotion recipe.
7. Define Motion Direction, recording the selected recipe and what patterns are being reused.
8. Produce Motion Spec.
9. Route to the minimum set of specialist agents.
10. Build preview.
11. Run independent QA critics.
12. Route each failed issue back to the responsible specialist.
13. Repeat until convergence or a real human input requirement is reached.
14. Present only a validated preview for human review.

## Creative guidance

When the user does not know how to animate something, propose two to four concrete directions and explain what each direction communicates.

Do not ask the user to choose implementation details such as easing curves, spring parameters, pixel distances or interpolation values unless explicitly requested.

## Dynamic graph

Use only the specialists required by the selected technique.

Independent builders may run in parallel.

QA must be independent from the builder that produced the work.

## Convergence

Critical issues, major fidelity issues, missing assets, wrong icons, render errors and type errors block delivery.

Repeated failure of the same technique must trigger Strategy Review instead of another equivalent retry.

## Template routing

Templates are architectural recipes, not fidelity shortcuts. Consult `.agents/skills/template-router/SKILL.md` before selecting implementation architecture. Keep host-project components and assets authoritative, and do not vendor official template source by default.
