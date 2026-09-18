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
      template-router/
      asset-fidelity/
      scene-director/
      motion-qa/
      ...official Remotion skills...

  .motion/
    config.json
    install-manifest.json
    template-recipes.json
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

## Official Remotion template recipes

Motion Agent also audits the official Remotion template catalog and installs a project-local recipe registry at `.motion/template-recipes.json`.

The Template Router uses these templates as **architectural recipes**, not as automatic replacements for the project's real source code. The default path remains `default-motion-agent`.

Important recipe families include:

- Prompt to Motion Graphics — validation, dynamic skill selection, guidance/example skills, sanitization and self-correction;
- Prompt to Video — script + imagery + voiceover pipelines;
- React Three Fiber — real 3D scenes;
- Audiogram and Music Visualization — audio-driven social content;
- Overlay — compositing assets for FFmpeg and traditional editors;
- Code Hike — animated developer/code content;
- TikTok — local transcription and word-by-word captions;
- Render Server — future standalone/VPS render orchestration.

The full audit is in `docs/REMOTION_TEMPLATE_AUDIT.md`.

Motion Agent does not vendor official template source by default. Paid templates are treated as licensed references only.

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

## Fidelity rules

The installed workflow prefers, in order:

1. exact original assets;
2. original SVGs or source components;
3. existing design-system components and tokens;
4. hybrid composition;
5. validated reconstruction only when necessary.

Approximate replacement of strict logos, icons, typefaces, components or UI assets is not allowed.

## Motion workflow

```text
@motion
  -> inspect repository context
  -> intake
  -> asset audit
  -> source resolution
  -> creative direction when needed
  -> motion direction
  -> motion spec
  -> specialist routing
  -> Remotion build
  -> preview render
  -> multi-frame visual QA
  -> fidelity / motion / composition / brand / technical review
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
