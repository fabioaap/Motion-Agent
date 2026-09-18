# Motion Agent

Motion Agent installs a reusable **`@motion` motion-design workflow** into an existing product repository so Codex can work with that project's real components, SVGs, fonts, tokens, routes, screenshots and design-system rules.

The Motion-Agent repository is the **distribution source and development repository**. Your product repository remains the place where the actual motion work happens.

```text
Motion-Agent
    |
    | pnpm dlx ... init
    v
Your product repository
    |
    +-- existing source code
    +-- existing design system
    +-- existing assets
    +-- .agents/skills/...      Motion Agent skills
    +-- .motion/remotion/...    isolated Remotion workspace
    +-- AGENTS.md               managed @motion instructions
    +-- @motion
```

## Install in another repository

### From GitHub — available now

Open a terminal in the repository where you want `@motion` and run:

```bash
pnpm dlx github:fabioaap/Motion-Agent init
```

The installer will:

1. create the project-local `.motion/` workspace;
2. install the Motion Agent skills under `.agents/skills/`;
3. safely merge Motion Agent instructions into `AGENTS.md`;
4. add Motion Agent generated paths to `.gitignore`;
5. add convenience motion scripts to an existing `package.json` without replacing existing scripts;
6. install the isolated Remotion workspace dependencies;
7. install the official Remotion skills for Codex through the skills CLI.

The skills CLI supports project-local Codex installation and non-interactive `--agent codex --copy --yes`, which the installer uses for the official Remotion skills.

### Future npm distribution

The package is structured for a future registry release. After publication, the shorter command will be:

```bash
pnpm dlx @fabioaap/motion-agent init
```

Do not use the npm form until that package has actually been published.

## Requirements

- Node.js 22 or newer
- pnpm
- Git
- Codex for the recommended agent-hosted workflow

If pnpm is not enabled yet:

```bash
corepack enable
corepack prepare pnpm@12.4.2 --activate
```

## What gets installed

The installer intentionally does **not** copy this entire development repository into your project.

It creates only the project-facing pieces:

```text
your-product/
  .agents/
    skills/
      motion-orchestrator/
      template-resolver/
      asset-fidelity/
      scene-director/
      motion-qa/
      ...official Remotion skills...

  .motion/
    config.json
    install-manifest.json
    template-recipes.json     curated official Remotion template registry
    README.md
    remotion/
      package.json
      tsconfig.json
      src/
      out/                 # generated, ignored by git
      jobs/                # generated, ignored by git

  AGENTS.md                # existing content preserved
  .gitignore               # existing content preserved
  package.json             # existing content preserved
```

A manifest records the Motion Agent-owned paths so update and uninstall operations know what they are allowed to change.

## Installer commands

### Initialize

```bash
pnpm dlx github:fabioaap/Motion-Agent init
```

Install into a different directory:

```bash
pnpm dlx github:fabioaap/Motion-Agent init --target ../my-product
```

For CI/testing or a deliberately minimal install, dependency and Remotion-skill installation can be skipped:

```bash
pnpm dlx github:fabioaap/Motion-Agent init --skip-install --skip-remotion-skills
```

### Update

Re-apply the current Motion Agent managed files and skills while preserving the target repository's Motion Agent config and project-owned content:

```bash
pnpm dlx github:fabioaap/Motion-Agent update
```

To test the layered-motion pipeline from the development branch before merge:

```bash
pnpm dlx "github:fabioaap/Motion-Agent#feat/adsmagic-do-clique-a-venda-motion" update
pnpm dlx "github:fabioaap/Motion-Agent#feat/adsmagic-do-clique-a-venda-motion" doctor --deep
```

The doctor output must report `pipeline version: layered-motion-templates-v1`, `Layerability Gate`, `Template Resolution`, `Three template recipe` and `Layer Separation Critic`.

### Doctor

Check Node, pnpm, manifest, Remotion workspace, custom skills and `AGENTS.md` integration:

```bash
pnpm dlx github:fabioaap/Motion-Agent doctor
```

Run the deeper Remotion typecheck too:

```bash
pnpm dlx github:fabioaap/Motion-Agent doctor --deep
```

Machine-readable output:

```bash
pnpm dlx github:fabioaap/Motion-Agent doctor --json
```

### Uninstall

Remove Motion Agent-owned project files and managed blocks while preserving the rest of the repository:

```bash
pnpm dlx github:fabioaap/Motion-Agent uninstall
```

Official Remotion skills are intentionally left in place during uninstall because another workflow in the repository may also use them.

## Using `@motion`

After installation, open the **target product repository** in Codex and work there normally.

For example:

```text
@motion anime esse dashboard mostrando que a IA encontrou uma oportunidade
```

or:

```text
@motion quero uma entrada premium desta tela. Preserve exatamente os componentes e ícones existentes.
```

The managed `AGENTS.md` block tells the host agent to read the Motion Agent orchestrator skill first and to use `.motion/remotion` as the isolated preview/render workspace.

## No API key in the normal Codex workflow

The default installed mode is:

```text
mode = codex
```

Codex is the reasoning layer. Motion Agent provides the workflow, skills, Remotion workspace and QA rules.

**You do not need `OPENAI_API_KEY` for this primary workflow.**

The optional standalone provider adapter in this development repository exists for future unattended execution on a VPS, webhook worker, Trello automation or other environment where no host coding agent is present.

## Convenience commands added to the target project

When the target has a `package.json`, the installer adds these scripts if those names are not already owned by the project:

```bash
pnpm motion:studio
pnpm motion:typecheck
pnpm motion:compositions
pnpm motion:render
```

They operate only on the isolated `.motion/remotion` workspace.

## Fidelity and layerability rules

The installed workflow prefers, in order:

1. exact source components;
2. original SVGs;
3. original transparent assets;
4. user-provided cutouts or verified segmentation;
5. existing design-system components and tokens;
6. faithful React/SVG reconstruction for simple elements;
7. raster environmental background plates when the background is not the animated subject;
8. validated reconstruction only when necessary.

Approximate replacement of strict logos, icons, typefaces, components or UI assets is not allowed.

When component-level motion is required, a flattened full-scene styleframe is reference material only. Camera drift, parallax, zoom, blur or Three.js displacement applied to that flattened frame do not count as independent component motion.

The pipeline must pass a **Layerability Gate** before implementation and a **Layer Separation Critic** before delivery.

After Layerability passes, Motion Agent resolves an implementation reference against the official Remotion templates registry stored at `.motion/template-recipes.json`. Specialized templates are used as technical patterns, not as visual styles. For example, `three` is selected only for genuine React Three Fiber / 3D needs; it is never a substitute for separating a flattened styleframe.

## Official Remotion template integration

Motion Agent carries a local registry of the current free templates from the official Remotion catalog. The resolver selects the smallest technical baseline that fits the job and preserves the host project.

Important examples:

- `blank` — default for custom product motion and AI-authored React scenes
- `three` — React Three Fiber / true 3D geometry and camera
- `skia` — React Native Skia canvas effects
- `overlay` — transparent overlays for external editors
- `code-hike` — animated code snippets
- `audiogram` — podcast and speech waveform clips
- `music-visualization` — music-driven social video
- `tiktok` — word-by-word captions with local Whisper.cpp
- `prompt-to-motion-graphics` — products that generate and preview Remotion code
- `prompt-to-video` — prompt → script/images/voiceover pipelines
- app and render-server templates — only when the task is actually a video-generation application or service

The registry is installed at:

```text
.motion/template-recipes.json
```

The selection skill is installed at:

```text
.agents/skills/template-resolver/SKILL.md
```

The catalog does not vendor or overwrite the official template source. When a specialized scaffold is actually needed, the registry records the official `pnpm create video --<template>` command and official template page.

## Motion workflow

```text
@motion
  -> inspect repository context
  -> intake
  -> asset audit
  -> scene topology audit
  -> source resolution when needed
  -> layerability gate
  -> creative direction when needed
  -> motion direction
  -> official Remotion template resolution
  -> motion spec + layer map + template selection
  -> specialist routing
  -> Remotion build
  -> preview render
  -> multi-frame visual QA
  -> fidelity / layer separation / motion / composition / brand / technical review
  -> regression guard
  -> correction loop
  -> READY_FOR_HUMAN
  -> human approval
  -> final render
```

## Motion-Agent development repository

The source repository itself contains the more complete development/runtime architecture:

```text
bin/
  motion-agent.mjs       install/update/doctor/uninstall CLI

installer/
  template/              files injected into target repositories
  smoke.mjs              installer lifecycle test

apps/
  motion-cli/            optional standalone execution CLI
  remotion-studio/       development preview/render environment

packages/
  runtime/               graph, contracts, QA and supervisor
  openai-agents/         optional standalone LLM provider
  node-tools/            ingestion, rendering and visual QA

skills/custom/           project-facing Motion Agent skills
vendor/remotion-skills/  official Remotion skills source reference
installer/template/motion/template-recipes.json  official template catalog + routing rules
```

## Contributing to Motion Agent

```bash
git clone https://github.com/fabioaap/Motion-Agent.git
cd Motion-Agent
corepack enable
pnpm install
pnpm typecheck
pnpm installer:smoke
```

Useful development commands:

```bash
pnpm installer:smoke
pnpm tools:smoke
pnpm demo
pnpm demo:command
pnpm studio
pnpm render:scene
pnpm skills:remotion
```

## Standalone mode

Standalone mode is optional infrastructure for unattended automation. Only that mode requires an AI-provider credential. The existing OpenAI adapter can read:

```text
OPENAI_API_KEY=...
MOTION_MODEL=gpt-5.6
```

Never commit provider credentials.

## Safety and ownership

The installer uses managed blocks and a manifest so it does not take ownership of unrelated project files. Existing `AGENTS.md`, `.gitignore` and package scripts are preserved outside Motion Agent-managed content.

Generated outputs such as Remotion renders, temporary jobs, caches and installed dependencies are ignored by git by default.

> **Motion Agent installs motion-design capability into the project you already have.**
