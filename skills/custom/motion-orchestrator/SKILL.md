---
name: motion-orchestrator
description: Routes @motion requests through creative preproduction, asset analysis, specialist execution, QA loops and human approval
version: 1.2.0
---

# Motion Orchestrator

Use this skill whenever a request begins with `@motion` or when the user explicitly asks to run the Motion Director system.

## Goal

Turn user intent and visual materials into a directed motion result through a multiagent graph.

Do not jump directly from prompt to Remotion code.

A complete technical request is not necessarily a complete creative request.

Read `docs/PREPRODUCTION_PLAYBOOK.md` before routing a new production.

## Mandatory preproduction flow

1. Parse the request through the Motion Command Gateway.
2. Inspect repository context, brand rules, user supplied references, source assets and existing approved artifacts.
3. Normalize the communication objective, audience, primary message, CTA, platform, duration and constraints.
4. Ask only for missing information that materially changes the work, with at most four high impact questions per round.
5. Create or validate the script with visual descriptions.
6. Run art direction discovery when no approved visual direction exists.
7. Research references and propose two or three distinct visual routes when the user has not chosen one.
8. Create or validate a storyboard or equivalent rough scene sequence.
9. Create or validate styleframes and key visual frames before animation implementation.
10. Run independent preproduction QA on any KV, styleframe or visual board before declaring it approved.
11. Create an animatic or timed board whenever pacing, voiceover, music or scene duration materially affects the piece.
12. Run Asset Audit and source resolution against the approved visual plan.
13. Define Motion Direction only after the visual language is established.
14. Produce Motion Spec.
15. Route to the minimum set of specialist agents.
16. Build preview.
17. Run independent QA critics.
18. Route each failed issue back to the responsible specialist.
19. Repeat until convergence or a real human input requirement is reached.
20. Present only a QA validated artifact for human review.

## Hard creative gates

The orchestrator must remain in preproduction if any required upstream artifact is missing.

Before BUILDING, verify or explicitly record a waiver for:

* creative brief
* script
* selected art direction
* storyboard or scene plan
* key visual frames or design boards
* timing plan or animatic
* verified source assets
* motion direction

`--auto` does not remove these stages. It only authorizes the orchestrator to make creative choices and continue between checkpoints when the user has delegated those choices.

## Intake priorities

When questions are necessary, prioritize:

1. What is the single message and desired viewer action?
2. Who is the audience and where will the piece be published?
3. What should the piece feel like and which references represent or contradict that feeling?
4. Which real assets, screens and product truths must appear?

A second round may resolve art direction selection, audio strategy, prohibited treatments and explicit approval frames.

Do not ask implementation details such as easing curves, spring parameters, pixel distances or interpolation values unless explicitly requested.

## Art direction

The Art Director stage translates strategy and brand into a visual roadmap before the Motion Designer decides behavior through time.

Art direction should define reference territory, visual metaphor, composition, typography, color hierarchy, asset treatment, spatial language, texture or lighting when relevant, and explicit visual no go zones.

When the user has not specified the look, do not silently invent one. Present two or three meaningfully different routes and explain what each communicates.

## Styleframes and key visual frames

Key visual frames are polished stills that define the final look of important moments. They are not technical animation keyframes.

For ChatGPT based workflows, they may be generated or edited with image generation after art direction approval.

At minimum resolve the hook, a representative middle state, a proof or hero state and the closing state when the piece contains those beats.

## Mandatory QA before approval

Every visual artifact moves through `READY_FOR_QA` before it can move to `APPROVED`.

For KV, styleframes and design boards, run at minimum:

* Fidelity Critic
* Composition Critic
* Brand Critic when a brand or design system applies
* Technical Validator when claims, metrics, source assets, icons, product UI or implementation constraints are present

For animatic or motion previews, also run Motion Critic.

QA must be independent from the creator or builder. Do not average critic results. Any mandatory critic failure blocks approval.

The Motion Director must never declare an artifact approved before the QA result is recorded.

## Motion guidance

Only after visual approval should the Motion Designer define rhythm, entries, exits, camera behavior, depth, typography motion, transition families and audio interaction.

The Motion Designer animates the approved design. The build stage must not become an accidental redesign stage.

## Dynamic graph

Use only the specialists required by the selected technique.

Independent builders may run in parallel after upstream creative dependencies are locked.

QA must be independent from the builder that produced the work.

## Convergence

Critical issues, major fidelity issues, missing assets, wrong icons, render errors and type errors block delivery.

Narrative drift, art direction drift and unapproved redesign are also blocking issues.

Repeated failure of the same technique must trigger Strategy Review instead of another equivalent retry.
