---
name: template-resolver
description: Selects and adapts official Remotion templates as technique references without replacing approved product visuals or bypassing layerability
version: 1.0.0
---

# Template Resolver

Use this skill after Scene Topology Audit and the Layerability Gate, before motion implementation.

## Source of truth

Read:

`.motion/template-recipes.json`

The registry mirrors the official Remotion template catalog reviewed on 2026-09-18.

Official catalog:

https://www.remotion.dev/templates

## Goal

Choose whether an official Remotion template can reduce implementation risk or accelerate a scene.

A template is a technical starting point or technique reference.

It is not a replacement for:

- the approved art direction;
- the project's design system;
- source components;
- exact icons, typography or assets;
- the Layer Map;
- the Layerability Gate.

## Selection order

1. Determine the required motion technique.
2. Check whether a specialized official template directly supports that technique.
3. Prefer the smallest template that solves the technical problem.
4. If no specialized template is needed, select `blank`.
5. Record the selected template, why it was selected and how it will be adapted.
6. Do not scaffold into the host project's application source unless the user explicitly asks for that. Work inside the isolated Motion Agent workspace or borrow only the necessary implementation pattern.

## Important mappings

### Three

Use `three` when the scene genuinely needs:

- React Three Fiber;
- true 3D geometry;
- 3D camera movement;
- spatial product mockups;
- depth that cannot be represented faithfully with 2D layers.

Do not use `three` to make a flattened styleframe look layered.

The Three template does not satisfy the Layerability Gate by itself.

### Skia

Use `skia` when the scene requires React Native Skia drawing, custom 2D canvas effects or rendering that is materially better suited to Skia than DOM/SVG.

Do not select it merely because a scene needs glow, blur or a simple path.

### Overlay

Use `overlay` for transparent overlays intended to be composited in another video editor.

### Code Hike

Use `code-hike` for animated code snippets, developer education or code-diff storytelling.

### Audiogram

Use `audiogram` for speech or podcast clips with waveform-led social video.

### Music Visualization

Use `music-visualization` for music-driven visualizations.

### TikTok

Use `tiktok` for local transcription plus animated word-by-word captions.

### Prompt to Motion Graphics

Use `prompt-to-motion-graphics` when building a product that generates Remotion motion graphics from prompts and streams generated code to a browser preview.

Do not use it as the base for a directed product film with approved styleframes.

### Prompt to Video

Use `prompt-to-video` when the desired product is a generative pipeline that creates script, images and voiceover from a prompt.

Do not use it when approved source visuals must be preserved.

### App templates

Use `next`, `vercel`, `next-no-tailwind`, `next-pages-dir`, `react-router`, `electron` or `render-server` only when the task is actually to build a video-generation application or render service.

They are not default motion-design templates.

### Blank

Use `blank` for custom product motion in an existing project when specialized infrastructure is unnecessary.

This is the preferred baseline for Motion Agent product-film work.

## Template selection record

Record:

- template id;
- official page;
- official create command;
- role;
- reason for selection;
- adaptation plan;
- whether scaffolding is needed;
- whether the template introduces dependencies;
- confirmation that brand and layerability constraints remain unchanged.

## Multi-template techniques

A job may borrow patterns from more than one template, but only one template should be marked as the primary implementation reference unless the architecture genuinely spans multiple independent systems.

For example:

- `blank` + a Code Hike pattern for one code scene;
- `blank` + a Skia effect for one specialized layer;
- `three` for the 3D stage while UI foreground objects remain independently layered React assets.

## Safety rule

Never auto-copy an entire template over an existing product repository.

Never overwrite the host app architecture to match a template.

Never let template visuals leak into the approved design language.

Never claim a scene is component-level motion merely because it uses a specialized template.
