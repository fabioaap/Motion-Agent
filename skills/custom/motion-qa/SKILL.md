---
name: motion-qa
description: Runs independent fidelity, layer separation, motion, composition, brand and technical validation before delivery
version: 1.2.0
---

# Motion QA

Use this skill after every preview and after every corrective build.

## Critics

Run the critics required by context:

Fidelity Critic

Layer Separation Critic when component-level motion is required

Motion Critic

Composition Critic

Brand Critic when a brand or design system applies

Technical Validator

## Layer Separation Critic

This critic is mandatory whenever the request expects separate elements, internal UI motion, product-component motion or scene decomposition.

Fail the preview when any of these conditions is true:

- a flattened full-scene image is carrying the major foreground animation;
- camera movement, parallax, zoom, blur or Three.js displacement is being counted as independent component motion;
- a major moving object cannot be addressed independently in the implementation;
- the Layer Map says an object is independent but the source code or asset structure does not support that claim;
- the recomposed frame depends on hidden duplicate full-scene imagery to create the illusion of separation.

The critic should inspect both rendered frames and implementation structure.

A visually attractive preview can still fail Layer Separation Critic.

## Template compatibility check

When a `template_selection` exists, validate that:

- the selected template solves a real technical need identified by Motion Direction;
- the template is used as an implementation reference, not a visual style source;
- approved typography, brand, UI, layout and exact assets were not replaced by template defaults;
- the host application architecture was not overwritten to fit the template;
- specialized dependencies are justified by the scene;
- `three` is not being used to disguise a flattened styleframe as component motion;
- Layer Separation Critic still passes independently of the template.

A specialized template that introduces unnecessary architecture or changes the approved visual language is a QA failure.

## Approval

Do not average critic results.

Any mandatory critic failure blocks the job.

Critical issues always block delivery.

Major fidelity issues always block delivery.

Layer Separation Critic failure always blocks delivery when applicable.

Wrong source icons always block delivery.

Missing assets, render errors and type errors always block delivery.

CI green does not replace visual or structural approval.

## Correction routing

Route each issue to the specialist responsible for that category.

After a fix, rerun required QA and Regression Check.

If the same issue fails three equivalent attempts, move to Strategy Review.
