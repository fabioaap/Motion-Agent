# @motion command contract

`@motion` is the public human entrypoint for the Motion Director Orchestrator.

When a message starts with `@motion`:

1. Route it to the Motion Director Orchestrator.
2. Preserve every user supplied instruction after the command.
3. Preserve attached files as original assets.
4. Do not restart discovery for information already contained in the request.
5. If the request is vague, enter interactive intake and ask at most four high impact questions.
6. Before asking the user how something should animate, inspect the material and propose concrete motion directions when possible.
7. If the request is sufficiently defined, continue directly into Asset Audit and the execution graph.
8. `--auto` grants creative autonomy but never disables fidelity rules, QA, Supervisor or regression checks.
9. `--interactive` prioritizes creative exploration before build.
10. The user facing command remains `@motion`; internal agent names must not be required from the user.
