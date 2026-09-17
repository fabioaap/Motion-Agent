# Motion Agent

`@motion` is a multi agent motion direction and Remotion production runtime with strict asset fidelity, visual QA and self correction loops.

## What is configured

The repository now includes:

* a Zod contracted orchestration runtime
* a formal state machine and dynamic specialist graph
* real OpenAI cognitive agents using the Responses API and Structured Outputs
* original asset ingestion with SHA 256 identity metadata
* Remotion scene generation and MP4 rendering
* automatic reference and actual still rendering
* deterministic pixel diff and asset identity validation
* independent motion, composition, fidelity, brand and technical critics
* issue routing, retry memory, technique fallback and maximum QA cycle protection
* a human approval gate before final delivery
* official Remotion Agent Skills plus custom Motion Agent skills

## Requirements

Node 22 or newer and pnpm 12.4.2.

```bash
corepack enable
corepack prepare pnpm@12.4.2 --activate
pnpm install
```

Copy the environment example and provide your API key locally. Never commit the real key.

```bash
cp .env.example .env
```

Required runtime variable:

```text
OPENAI_API_KEY=...
```

Optional variables:

```text
MOTION_MODEL=gpt-5.5
MOTION_REASONING_EFFORT=high
MOTION_VISUAL_MAX_DIFF=0.005
MOTION_MAX_QA_CYCLES=6
MOTION_MAX_EQUIVALENT_FAILURES=3
```

## Run `@motion`

With one asset:

```bash
pnpm motion -- "@motion --auto anime este dashboard para mostrar uma oportunidade descoberta pela IA" --asset ./dashboard.png
```

With multiple assets:

```bash
pnpm motion -- "@motion crie uma abertura de produto" --asset ./screen.png --asset ./logo.svg
```

Choose a model explicitly:

```bash
pnpm motion -- "@motion anime esta interface" --asset ./screen.png --model gpt-5.5
```

The command stops at `READY_FOR_HUMAN` after internal QA. Add `--approve` only when you intentionally want the runtime to move through the approval state after convergence.

## Production flow

```text
@motion
  -> intake
  -> asset ingestion and hashing
  -> Director
  -> Asset Inspector
  -> Motion Director
  -> Motion Spec
  -> specialist build graph
  -> Remotion preview hook
  -> reference still + actual still + pixel diff
  -> Fidelity Critic + deterministic Visual Fidelity Critic
  -> Motion Critic + Composition Critic + Technical Validator
  -> issue routing
  -> specialist correction
  -> regression and strategy loop
  -> READY_FOR_HUMAN
  -> preview MP4
```

The visual guard has veto power. A model cannot approve around a failed asset identity check or a pixel diff above the configured threshold.

## Asset fidelity

Strict assets follow these rules:

1. reuse the exact original whenever possible
2. use the original SVG or source component when available
3. use hybrid composition before approximate reconstruction
4. request exact source material when reconstruction cannot be validated
5. never replace an original icon or logo with a similar library asset

Files passed with `--asset` are copied to a job specific directory under `apps/remotion-studio/public/jobs/`. Generated job files and renders are ignored by git.

## Workspace

```text
apps/
  motion-cli/            end to end @motion command
  remotion-studio/       visual preview and video rendering
packages/
  runtime/               graph, contracts, QA, supervisor and scene model
  openai-agents/         real LLM backed cognitive agents
  node-tools/            ingestion, Remotion preview hook and pixel diff
skills/custom/           Motion Agent skills
vendor/remotion-skills/  official Remotion skills
```

## Useful commands

```bash
pnpm typecheck
pnpm tools:smoke
pnpm demo
pnpm demo:command
pnpm studio
pnpm render:scene
pnpm skills:remotion
```

## CI

GitHub Actions validates TypeScript, Node tooling, runtime demos, composition discovery, three MP4 renders and a Remotion still. It does not call a paid LLM and therefore does not require an API key.

## Security

`.env` is ignored. The repository contains only `.env.example`. Do not commit API keys, tokens, cookies or user source files. Production jobs are ignored by git by default.
