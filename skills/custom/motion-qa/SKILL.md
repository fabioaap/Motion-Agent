---
name: motion-qa
description: Runs independent fidelity, motion, composition, brand and technical validation before delivery
version: 1.0.0
---

# Motion QA

Use this skill after every preview and after every corrective build.

## Critics

Run the critics required by context:

Fidelity Critic

Motion Critic

Composition Critic

Brand Critic when a brand or design system applies

Technical Validator

## Approval

Do not average critic results.

Any mandatory critic failure blocks the job.

Critical issues always block delivery.

Major fidelity issues always block delivery.

Wrong source icons always block delivery.

Missing assets, render errors and type errors always block delivery.

## Correction routing

Route each issue to the specialist responsible for that category.

After a fix, rerun required QA and Regression Check.

If the same issue fails three equivalent attempts, move to Strategy Review.
