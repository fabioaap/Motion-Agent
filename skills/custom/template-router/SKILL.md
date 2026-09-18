---
name: template-router
description: Selects an official Remotion template or recipe archetype when it materially improves an @motion task without replacing product source fidelity
version: 1.0.0
---

# Template Router

Use this skill after intake and asset audit, before choosing the implementation architecture.

## Goal

Choose whether the task should use the default Motion Agent composition path or borrow an architectural recipe from an official Remotion template.

Templates are **references and scaffolds**, not automatic replacements for the host repository.

Never trade source fidelity for template convenience.

## Source of truth

Read `.motion/template-recipes.json` when it exists.

The registry points to official Remotion template pages and records the intended use case for each recipe.

## Routing rules

1. Start from the user's actual objective, media, host repository and output surface.
2. Prefer the normal Motion Agent path for product UI motion, brand motion, component motion and screenshot/SVG animation.
3. Select a recipe only when its architecture directly matches the requested output.
4. Keep the host repository's exact components, design system, SVGs, fonts, tokens and assets as the source of truth.
5. Do not vendor or copy an official template into the project merely because it exists.
6. If scaffolding from an official template is useful, use the official Remotion command in an isolated workspace or study its source, then adapt only the necessary architecture.
7. Record the chosen recipe in the Motion Direction or implementation notes.
8. After implementation, run the same fidelity, motion, composition and regression QA gates as any other Motion Agent result.

## Core recipes

### prompt-to-motion-graphics

Use as an **architecture reference** for prompt-driven motion generation.

Useful patterns:
- request validation
- dynamic skill selection
- guidance skills vs example/archetype skills
- code sanitization
- compile-error self-correction
- preview-first iteration

In Codex-hosted Motion Agent, do **not** copy its SaaS-specific OpenAI/API/JIT architecture by default. Codex is already the reasoning and filesystem layer.

### prompt-to-video

Use when the result is a narrative short video driven by a prompt and needs a script, generated/found imagery and voiceover.

Do not activate paid/external media providers automatically. Treat provider selection as a separate concern.

### three

Use for real 3D scenes, cameras, meshes, lighting or React Three Fiber work.

Do not select 3D for ordinary 2D product motion just to make it look more sophisticated.

### audiogram

Use for podcast/audio snippets, waveform-driven social content and speaker-focused clips.

### music-visualization

Use when the main visual behavior should be driven by music/audio energy, waveform or track metadata.

### overlay

Use when Motion Agent is producing transparent/video overlays intended to be composited in FFmpeg, Premiere, Resolve, After Effects or another editor.

### code-hike

Use for tutorials, developer content and animated transitions between code states.

### tiktok

Use for local transcription and animated word-by-word captions. It is especially relevant for shorts/reels workflows.

### stills

Use for dynamic PNG/JPEG generation rather than a timeline video.

### render-server

Use only for server-side render orchestration, job tracking and cancellation. This is infrastructure, not a visual style.

### nextjs-video-app / react-router-video-app

Use only when the user is building a video-generation product/app rather than creating a motion asset inside an existing product repository.

### recorder

Use when the product itself needs browser-based recording/production capabilities.

### skia

Use when React Native Skia is technically justified by the visual technique.

## Non-recipes

Blank, Hello World and JavaScript starters are learning/bootstrap templates; they should not override an already configured Motion Agent workspace.

Stargazer is a narrow example. Treat it as inspiration only unless the request is specifically about repository-star celebration videos.

Paid templates such as Editor Starter, Timeline and Watercolor Map must never be copied or assumed available unless the user has obtained the appropriate product/license.

## Decision output

When a recipe is selected, capture:

- `recipe_id`
- why it matches the task
- which patterns will be reused
- which host-project sources remain authoritative
- whether any external provider/runtime is required
- whether the recipe is reference-only or scaffolded

If no recipe materially improves the job, return `recipe_id: default-motion-agent`.
