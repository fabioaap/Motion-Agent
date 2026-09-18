# Motion Agent workspace

This directory is managed by the Motion Agent installer.

The default mode is **Codex-hosted**: Codex provides the reasoning, while this workspace provides Remotion, preview/render tooling and deterministic project-local execution. No `OPENAI_API_KEY` is required for this mode.

## Commands

From the host repository root:

```bash
pnpm motion:studio
pnpm motion:typecheck
pnpm motion:compositions
pnpm motion:render
```

Generated renders belong in `remotion/out/` and are ignored by git.

Project-specific source components, SVGs, fonts, tokens and assets remain in the host repository. Prefer consuming those exact sources instead of duplicating or approximating them inside this directory.

## Official Remotion templates

The installer ships `template-recipes.json`, a reviewed registry of the official free templates listed at https://www.remotion.dev/templates.

The `@motion` pipeline consults this registry after the Layerability Gate and before implementation.

Templates are technical references, not visual style sources. They must not overwrite the host app, replace approved UI or bypass source fidelity.

The default for custom product motion is `blank`. Specialized recipes include `three`, `skia`, `overlay`, `code-hike`, `audiogram`, `music-visualization`, `tiktok`, `prompt-to-motion-graphics` and `prompt-to-video`.

`three` is only for genuine React Three Fiber / 3D requirements. It must never be used to fake layer separation on a flattened styleframe.
