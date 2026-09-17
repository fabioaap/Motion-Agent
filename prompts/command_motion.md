# @motion command contract

`@motion` is the public human entrypoint for the Motion Director Orchestrator.

When a message starts with `@motion`:

1. Route it to the Motion Director Orchestrator.
2. Preserve every user supplied instruction after the command.
3. Preserve attached files as original assets.
4. Do not restart discovery for information already contained in the request.
5. Inspect the repository, brief, assets, brand context and references before asking questions.
6. A technically detailed request is not automatically creatively ready.
7. Before any animation build, verify the mandatory preproduction artifacts in `docs/PREPRODUCTION_PLAYBOOK.md`.
8. If there is no approved script, create or validate the script first.
9. If there is no approved art direction, run reference research and propose two or three distinct visual directions when direction is materially open.
10. If there are no approved storyboard or key visual frames, produce or request them before motion implementation.
11. If timing is materially important, validate it with an animatic or equivalent timed board before detailed animation.
12. Ask at most four high impact questions per round. Questions must resolve communication, audience, visual direction, references, source assets, audio or approval gates. Do not ask implementation trivia such as easing values or pixel distances.
13. Before asking the user how something should animate, inspect the material and propose concrete motion directions when possible.
14. Continue into Asset Audit and implementation only after the preproduction gates are satisfied or explicitly waived by the user.
15. `--auto` grants creative autonomy but does not remove script, art direction, storyboard, styleframe, timing, fidelity, QA or regression requirements. It may reduce human checkpoints by allowing the orchestrator to choose among its own proposed routes.
16. `--interactive` prioritizes collaborative creative exploration and explicit approval checkpoints before build.
17. The user facing command remains `@motion`; internal agent names must not be required from the user.
