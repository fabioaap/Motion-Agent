# Motion Agent

Motion Agent is an installable motion-design toolkit for AI coding agents such as Codex.

Its purpose is **not** to be the repository where your product lives. Instead, Motion Agent is installed into another repository so that the agent working in that repository gains an `@motion` workflow, Remotion tooling, motion-design skills, asset-fidelity rules, visual QA and correction loops.

```text
Motion-Agent
    |
    | install
    v
Your product repository
    |
    +-- product source code
    +-- design system
    +-- assets
    +-- Motion Agent tooling
    +-- Remotion
    +-- @motion
```

This lets the motion workflow operate with the real context of the product: components, SVGs, fonts, tokens, screenshots, routes and design-system rules.

## Recommended usage

The primary mode is **agent-hosted**.

You clone or install Motion Agent into the repository where you are working, open that repository in Codex or another compatible coding agent, and use `@motion` there.

In this mode the coding agent is the reasoning layer. Motion Agent provides the production system: skills, orchestration rules, Remotion runtime, asset ingestion, visual QA, regression checks and rendering.

**An OpenAI API key is not required for this primary mode.**

A separate standalone provider adapter exists for future server-side automation. It is optional and only needed when Motion Agent must call a model by itself without Codex or another host agent running.

## Requirements

- Node.js 22 or newer
- pnpm 12.4.2
- Git
- Codex or another compatible coding-agent environment for the recommended agent-hosted workflow

Enable pnpm if necessary:

```bash
corepack enable
corepack prepare pnpm@12.4.2 --activate
```

## Install today

Until the distribution CLI is published, install Motion Agent from source.

Clone it alongside the repository where you want to use it:

```bash
git clone https://github.com/fabioaap/Motion-Agent.git
cd Motion-Agent
pnpm install
pnpm skills:remotion
pnpm typecheck
```

Then open the target product repository in your coding agent and make the Motion Agent repository available to that workspace while the installer CLI is being finalized.

The intended final installation experience is:

```bash
cd your-product
pnpm dlx @fabioaap/motion-agent init
```

That command is the distribution target for this project. Do not depend on it until the installer package is released.

## What the installer will add

The installer is designed to add only the pieces required by the target repository instead of copying this entire development repository.

The target shape is:

```text
your-product/
  .motion/
    config/
    runtime/
    prompts/
    qa/
  skills/
    motion-orchestrator/
    asset-fidelity/
    scene-director/
    motion-qa/
  motion/
    remotion/
  AGENTS.md             # Motion Agent instructions merged safely
  package.json          # Motion scripts/dependencies added safely
```

Existing project files, components and design-system assets remain the source of truth.

## Planned installer commands

```bash
motion-agent init
motion-agent update
motion-agent doctor
motion-agent uninstall
```

### `init`

Installs Motion Agent into the current repository, detects the existing stack, configures Remotion, installs the Motion skills and adds the minimum required scripts and agent instructions.

### `update`

Updates Motion Agent-managed files without overwriting product-owned code or user customizations.

### `doctor`

Checks Node, pnpm, Remotion, skills, paths, agent instructions and Motion Agent-managed files.

### `uninstall`

Removes Motion Agent-managed files while preserving the product repository and user-owned assets.

## Using `@motion`

Once installed into a product repository, the intended experience is conversational.

```text
@motion anime esse dashboard mostrando que a IA encontrou uma oportunidade
```

Because the coding agent is already inside the product repository, it can inspect the actual source material before deciding how to animate it.

The workflow is expected to prefer, in order:

1. the exact original asset
2. the original SVG or source component
3. existing design-system components and tokens
4. hybrid composition
5. validated reconstruction only when necessary

Approximate replacement of a logo, icon, component or other strict asset is not allowed.

## Production flow

```text
@motion
  -> understand repository context
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
  -> fidelity / motion / composition / brand / technical critics
  -> regression guard
  -> correction loop
  -> READY_FOR_HUMAN
  -> human approval
  -> final render
```

## What is already implemented in this repository

The development repository currently includes:

- Zod-contracted orchestration runtime
- formal state machine and specialist graph
- Remotion scene generation
- MP4 rendering
- asset ingestion and SHA-256 metadata
- exact-source identity checks
- reference-vs-render pixel diff
- multi-frame motion QA
- deterministic regression guard
- issue routing and retry loops
- human approval state
- custom Motion Agent skills
- official Remotion skills integration
- optional standalone OpenAI provider adapter
- CI validation and render smoke tests

## Repository architecture

```text
apps/
  motion-cli/            standalone/local execution CLI
  remotion-studio/       preview and video rendering

packages/
  runtime/               graph, contracts, QA and supervisor
  openai-agents/         optional standalone LLM provider adapter
  node-tools/            asset ingestion, rendering and visual QA

skills/custom/           Motion Agent skills
vendor/remotion-skills/  official Remotion skills source
```

The `openai-agents` package is **optional infrastructure for standalone automation**. It is not the required reasoning path when Motion Agent is being used through Codex or another host coding agent.

## Development setup

If you are contributing to Motion Agent itself:

```bash
git clone https://github.com/fabioaap/Motion-Agent.git
cd Motion-Agent
corepack enable
pnpm install
pnpm typecheck
```

Useful development commands:

```bash
pnpm tools:smoke
pnpm demo
pnpm demo:command
pnpm studio
pnpm render:scene
pnpm skills:remotion
```

## Standalone mode

Standalone mode is for future automation such as a VPS, webhook, Trello workflow or background worker where no host coding agent is present.

Only this mode requires an AI provider credential. The existing OpenAI adapter reads:

```text
OPENAI_API_KEY=...
MOTION_MODEL=gpt-5.6
```

Provider credentials must remain in environment variables or secret stores and must never be committed.

## CI

The standard CI validates TypeScript, tooling, preview QA, composition discovery and Remotion rendering without making paid LLM calls.

A separate live workflow can exercise the standalone provider when explicitly configured with a secret.

## Security

Never commit API keys, tokens, cookies, private source assets or production credentials.

Generated job assets, QA frames and renders should remain outside version control unless intentionally added as fixtures.

## Project direction

The next distribution milestone is to make Motion Agent a true installer that can be added to an arbitrary repository with one command while preserving that repository's existing architecture.

The product principle is simple:

> Motion Agent installs motion-design capability into the project you already have.
