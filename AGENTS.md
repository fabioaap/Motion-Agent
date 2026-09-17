# Motion Agent instructions

## Entrypoint

`@motion` is the human entrypoint for all motion work in this repository.

When a request begins with `@motion`, route it through the Motion Agent graph rather than directly producing an unvalidated animation.

## Package manager

Use pnpm only.

```bash
pnpm install
pnpm typecheck
pnpm studio
pnpm motion -- "@motion ..."
```

Use `pnpm dlx` instead of `npx` for temporary package execution unless a tool explicitly requires otherwise.

## Skills

Before editing Remotion code, load the official Remotion best practices skill and any task specific Remotion skill available under `vendor/remotion-skills` or installed through `pnpm skills:remotion`.

Custom workflow skills live under `skills/custom`.

## Fidelity invariant

Creativity can be bold. Fidelity cannot be approximate.

Never substitute an exact source logo, icon, component, SVG, typeface, chart or UI element with a merely similar alternative.

Preference order:

1. USE_ORIGINAL
2. REUSE_SVG or REUSE_COMPONENT
3. SEGMENT_ORIGINAL
4. HYBRID, MASK or OVERLAY
5. reconstruction only with exact source and validation
6. REQUEST_SOURCE when exact reconstruction cannot be validated

A strict fidelity failure blocks delivery.

## QA graph

No first build is final.

Every converged job must pass the required critics. When visual QA metadata is available, `visual_fidelity_critic` is mandatory and has deterministic veto power.

The preview hook runs between BUILD and QA. It renders reference and actual frames, calculates pixel diff and records asset identity mismatches.

Do not bypass the human approval state for publishing or other irreversible actions.

## OpenAI agents

Real cognitive handlers live in `packages/openai-agents` and use structured Zod outputs. Keep the runtime provider independent and keep API keys out of source control.

## Generated files

Do not commit production jobs, user assets, API keys, QA stills or renders. Those paths are excluded by `.gitignore`.
