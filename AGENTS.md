# Motion Agent Repository Rules

This repository implements the `@motion` Motion Director runtime.

## Package manager

Use pnpm for dependency management and project scripts.

Do not use npm or npx unless a third party tool explicitly requires them and no pnpm compatible invocation exists.

Use `pnpm dlx` for one off package execution.

The repository version is declared in `package.json` through `packageManager`.

## Entrypoint

Treat user messages beginning with `@motion` as Motion Director requests.

The gateway is implemented in `src/command.ts` and must route the request into the orchestrator instead of bypassing the graph.

## Required execution order

1. Load the custom Motion Orchestrator skill.
2. Inspect available assets before choosing a build technique.
3. Load the official Remotion best practices skill before writing Remotion code.
4. Load the specific official Remotion skill required by the task when applicable.
5. Build a preview.
6. Run fidelity, motion, composition and technical QA as required by the graph.
7. Route failed issues back to the responsible specialist.
8. Never present an unvalidated first attempt as final.

## Fidelity rule

Approximate reconstruction is a failure when fidelity is required.

Reuse original SVG, React components, design system assets, typography and icons whenever available.

Never replace an original icon with a visually similar icon from another library.

## Remotion skills

Install or refresh the official Remotion skills with:

```bash
pnpm skills:remotion
```

The installer uses `pnpm dlx skills add remotion-dev/skills`.

The upstream source is `remotion-dev/skills` and is also tracked as the `vendor/remotion-skills` submodule.

## Workspace direction

The root `pnpm-workspace.yaml` reserves `apps/*` and `packages/*` for the project evolution.

Prefer reusable runtime code inside packages and executable surfaces inside apps as the repository grows.

## Preserve user changes

Do not overwrite unexpected user changes. Treat them as intentional unless there is clear evidence otherwise.
