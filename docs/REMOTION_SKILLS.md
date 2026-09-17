# Remotion Agent Skills

The Motion Agent uses the official skills maintained by Remotion upstream instead of maintaining a private fork.

Upstream repository:

`remotion-dev/skills`

Install them with:

```bash
npm run skills:remotion
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
