# Remotion Template Audit for Motion Agent

Reviewed: 2026-09-18  
Official catalog: https://www.remotion.dev/templates

## Why this matters

Remotion's official template catalog now contains more than simple starters. Several templates encode production patterns that overlap with Motion Agent: prompt validation, skill routing, code generation, self-correction, 3D, captions, audiograms, overlays, render infrastructure and code animation.

Motion Agent should reuse those **architectural patterns** where they improve a job, while keeping the host repository's real components and assets authoritative.

## Most relevant findings

### Prompt to Motion Graphics SaaS Starter Kit

Official page: https://www.remotion.dev/templates/prompt-to-motion-graphics

The official implementation uses this conceptual path:

`User Prompt -> Validation -> Skill Detection -> Code Generation -> Sanitization -> Live Preview`

Its README distinguishes:
- **Guidance Skills**: best-practice knowledge for charts, typography, messaging, transitions, sequencing, spring physics, social media and 3D.
- **Example Skills**: complete implementation archetypes that can be adapted to a request.

This is highly compatible with Motion Agent's direction, but the SaaS template has a different runtime assumption. It is designed to generate and compile code inside a web app, whereas our primary mode is Codex-hosted with filesystem and repository access.

Adopt:
- request validation;
- dynamic skill/recipe detection;
- guidance vs archetype separation;
- sanitization/validation;
- compile-error self-correction;
- preview-first iteration.

Do not adopt by default:
- SaaS chat shell;
- OpenAI API requirement;
- browser JIT compilation;
- one-shot code generation as the main architecture.

### Prompt to Video

Official page: https://www.remotion.dev/templates/prompt-to-video

Useful when the desired artifact is a short narrative video composed from a script, images and voiceover. Treat this as a different production family from product-motion work.

### React Three Fiber

Official page: https://www.remotion.dev/templates/three

Useful for real 3D scenes. Route here only when 3D is technically justified.

### Audiogram

Official page: https://www.remotion.dev/templates/audiogram

Useful for podcast clips and audio-first social output.

### Overlay

Official page: https://www.remotion.dev/templates/overlay

Very relevant to the studio workflow because it creates motion overlays intended to be composited in conventional editing software. This pairs naturally with FFmpeg, Premiere, Resolve or other editing paths.

### Code Hike

Official page: https://www.remotion.dev/templates/code-hike

Useful for code explainers, tutorials and animated transitions between code states.

### TikTok captions

Official page: https://www.remotion.dev/templates/tiktok

Useful for shorts/reels workflows. The template performs local transcription with Whisper.cpp and creates animated word-by-word captions.

### Render Server

Official page: https://www.remotion.dev/templates/render-server

Relevant to the future standalone/VPS mode. It provides a server pattern for starting, tracking and canceling Remotion renders. This is infrastructure, not a motion style.

## Catalog classification

| Template | Motion Agent treatment | Typical use |
|---|---|---|
| Blank | Bootstrap only | Empty learning starter |
| Hello World | Bootstrap only | Learning / basic playground |
| Next.js | Reference | Video-generation SaaS |
| Next.js Vercel Sandbox | Reference | On-demand sandbox renders |
| Next.js no Tailwind | Reference | Video-generation SaaS without Tailwind |
| Next.js Pages | Reference | Legacy Pages Router video apps |
| Recorder | Reference | Browser recording / production tool |
| Prompt to Motion Graphics | Core architecture reference | Prompt-driven motion generation |
| JavaScript | Bootstrap only | Plain JS starter |
| Render Server | Infrastructure recipe | Server-side rendering |
| Electron | Infrastructure recipe | Desktop render application |
| React Router 7 | Reference | Video-generation app |
| 3D | Specialist recipe | React Three Fiber / 3D |
| Stills | Output recipe | Dynamic PNG/JPEG |
| Audiogram | Content recipe | Podcast/social clips |
| Music Visualization | Content recipe | Audio-driven visuals |
| Prompt to Video | Content pipeline recipe | Script + imagery + voiceover |
| Skia | Specialist recipe | React Native Skia visuals |
| Overlay | Compositing recipe | FFmpeg/NLE overlays |
| Code Hike | Content recipe | Animated code |
| Stargazer | Inspiration only | GitHub star celebration |
| TikTok | Caption recipe | Word-level social captions |
| Editor Starter (paid) | Licensed reference only | Build a video editor |
| Watercolor Map (paid) | Licensed reference only | Travel/map visuals |
| Timeline (paid) | Licensed reference only | Timeline editing UI |

## Routing principle

A template must not become the default merely because it resembles the request.

The order is:

1. inspect the host product and exact source assets;
2. determine whether native Motion Agent can satisfy the task;
3. check the template recipe registry;
4. select a recipe only if its architecture materially improves the result;
5. preserve exact host sources;
6. use the template as reference or isolated scaffold;
7. run the normal Motion Agent QA and human approval gates.

## Implementation in Motion Agent

The audit is operationalized through:

- `.agents/skills/template-router/SKILL.md`
- `.motion/template-recipes.json`
- Motion Orchestrator invoking Template Router before implementation architecture is selected.

The recipe registry contains official URLs and scaffold commands where applicable. It does not vendor third-party template source code.
