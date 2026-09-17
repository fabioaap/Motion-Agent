# Remotion Agent Skills

The Motion Agent uses the official skills maintained by Remotion upstream instead of maintaining a private fork.

Upstream repository:

`remotion-dev/skills`

The upstream repository is also tracked as the `vendor/remotion-skills` Git submodule so the exact source revision remains auditable.

Install or refresh the agent skills with:

```bash
pnpm skills:remotion
```

The project script executes:

```bash
pnpm dlx skills add remotion-dev/skills
```

The official upstream currently exposes these skills:

`remotion-best-practices`

`remotion-create`

`remotion-markup`

`remotion-studio`

`remotion-render`

`remotion-maps`

`remotion-captions`

`remotion-saas`

`remotion-interactivity`

`remotion-docs`

`remotion-upgrade`

`remotion-multimedia`

## Routing rule

Load `remotion-best-practices` as the default router before implementing Remotion scenes.

Use the more specific skill when the task clearly maps to it.

Use `remotion-docs` whenever an API, package behavior or current Remotion recommendation is uncertain.

## Local skills

The repository also contains Studio specific skills under `skills/custom`.

These skills control direction, asset fidelity, QA and the multiagent orchestration layer. They complement the official Remotion skills rather than replacing them.

## Updating the tracked upstream source

```bash
git submodule update --remote vendor/remotion-skills
```

Review the upstream changes before committing the updated submodule pointer.
