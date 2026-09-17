---
name: motion-qa
description: Runs independent fidelity, motion, composition, brand, AI-slop and technical validation before delivery
version: 1.1.0
---

# Motion QA

Use this skill after every preview, every key visual or styleframe candidate, and after every corrective build.

## Critics

Run the critics required by context:

Fidelity Critic

Motion Critic

Composition Critic

Brand Critic when a brand or design system applies

AI Slop Critic

Technical Validator

## AI Slop Critic

Purpose: block work that looks recognizably AI-generated, template-like or generically synthetic even when it is visually attractive.

The critic must evaluate the piece as a skeptical senior art director who did not make it.

Check for:

* generic premium-SaaS aesthetics with no brand-specific authorship
* gratuitous neon, glow, glassmorphism, particles, bloom or floating cards
* excessive cinematic depth or 3D treatment that does not serve the concept
* generated or invented UI instead of verified product surfaces when real UI should exist
* malformed logos, icons, typography, glyphs, hands, devices or interface anatomy
* fake microcopy, gibberish, impossible metrics or decorative data
* repetitive AI composition patterns such as centered headline plus floating panels plus neon path by default
* overly smooth, sterile or symmetrical layouts with no deliberate editorial tension
* inconsistent perspective, lighting, shadows, reflections or material behavior
* visual detail that exists only to make the image look expensive rather than communicate
* prompt-like literalism where every noun in the script becomes an icon or card
* stock-tech or cyberpunk cues that override the brand language
* unexplained gradients, lens flares, bokeh, holographic borders or luminous edges
* text density, decorative labels or pseudo-interface chrome added only to fill empty space
* lack of negative space, restraint, crop discipline and intentional omission
* any element that a human designer would likely remove during refinement

The critic must explicitly answer:

1. Does this look authored for this brand, or could the logo be swapped for another SaaS brand with little change?
2. Which elements most strongly signal AI generation?
3. Which elements are conceptually necessary?
4. What should be removed before anything new is added?
5. Is the piece restrained enough to survive without glow, fake depth or decorative UI?

## AI Slop approval gate

AI Slop Critic is mandatory for:

* key visuals
* styleframes
* campaign stills
* generated image assets
* product films and feature reveals
* any piece that uses generative image or video tools

A FAIL blocks approval when one or more of the following is true:

* the work reads as generic AI or template-first rather than brand-authored
* generated artifacts or fake UI are visible
* decorative effects dominate the message
* the design depends on invented information to look complete
* the same concept would still work after swapping the brand, product and copy
* obvious AI clichés remain after one correction pass

The preferred correction order is:

1. remove unnecessary elements
2. replace invented assets with real sources
3. restore brand-specific typography, spacing, color and composition
4. simplify lighting and effects
5. re-establish one dominant idea
6. regenerate only the minimum necessary asset

Do not respond to AI Slop failure by adding more detail.

## Approval

Do not average critic results.

Any mandatory critic failure blocks the job.

Critical issues always block delivery.

Major fidelity issues always block delivery.

AI Slop Critic failure always blocks visual approval.

Wrong source icons always block delivery.

Missing assets, render errors and type errors always block delivery.

A piece can be technically correct and still fail QA for looking generic, synthetic or under-directed.

## Correction routing

Route each issue to the specialist responsible for that category.

After a fix, rerun required QA and Regression Check.

If the same issue fails three equivalent attempts, move to Strategy Review.
