# Motion Agent Repository Rules

This repository implements the `@motion` Motion Director runtime and its Remotion execution surface.

## Package manager

Use pnpm for dependency management and project scripts.

Do not use npm or npx unless a third party tool explicitly requires them and no pnpm compatible invocation exists.

Use `pnpm dlx` for one off package execution.

## Workspace map

The runtime lives in `packages/runtime`.

The Remotion execution surface lives in `apps/remotion-studio`.

Custom Motion Agent skills live in `skills/custom`.

Official Remotion skills are tracked in `vendor/remotion-skills`.

## Entrypoint

Treat user messages beginning with `@motion` as Motion Director requests.

The gateway is implemented in `packages/runtime/src/command.ts` and must route requests into the orchestrator instead of bypassing the graph.

## Required execution order

1. Load the custom Motion Orchestrator skill.
2. Inspect available assets before choosing a build technique.
3. Load the official Remotion best practices skill before writing Remotion code.
4. Load the specific official Remotion skill required by the task when applicable.
5. Build a preview in `apps/remotion-studio` when the target is Remotion.
6. Run fidelity, motion, composition and technical QA as required by the graph.
7. Route failed issues back to the responsible specialist.
8. Never present an unvalidated first attempt as final.

## Fidelity rule

Approximate reconstruction is a failure when fidelity is required.

Reuse original SVG, React components, design system assets, typography and icons whenever available.

Never replace an original icon with a visually similar icon from another library.

## Remotion version rule

Keep `remotion` and every `@remotion/*` package on the exact same version.

Do not add caret ranges to Remotion packages.

## Remotion skills

Install or refresh official skills with:

```bash
pnpm skills:remotion
```

The upstream source is `remotion-dev/skills`.

## Preserve user changes

Do not overwrite unexpected user changes. Treat them as intentional unless there is clear evidence otherwise.
