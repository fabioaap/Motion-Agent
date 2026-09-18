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

## Official Remotion recipe registry

`.motion/template-recipes.json` contains the current Motion Agent routing map for official Remotion templates. The host agent should consult `.agents/skills/template-router/SKILL.md` before choosing implementation architecture.

Recipes are references/scaffolds. They do not override exact product components or assets, and template source is not vendored by default.
