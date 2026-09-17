# Motion Director Orchestrator

Runtime multiagente do comando `@motion`, com direção de motion, fidelidade de assets, QA e execução em Remotion.

## Estrutura

```text
apps/
  remotion-studio/       preview e render reais
packages/
  runtime/               contratos, grafo, agentes, QA e supervisor
skills/custom/           skills próprias do Motion Agent
vendor/remotion-skills/  skills oficiais do Remotion
```

## Package manager

O projeto usa pnpm `12.4.2` e Node 22 ou superior.

```bash
corepack enable
corepack prepare pnpm@12.4.2 --activate
pnpm install
```

## Comandos principais

Validar todo o workspace:

```bash
pnpm typecheck
```

Executar o demo do runtime:

```bash
pnpm demo
```

Abrir o Remotion Studio:

```bash
pnpm studio
```

Renderizar a composição de smoke test:

```bash
pnpm render:demo
```

Instalar ou atualizar as skills oficiais do Remotion no ambiente do agente:

```bash
pnpm skills:remotion
```

## `@motion`

`@motion` é o entrypoint humano do sistema. O gateway vive em `packages/runtime/src/command.ts` e deve sempre encaminhar o pedido ao grafo do Orquestrador.

```text
@motion
@motion --auto crie uma abertura premium para esse logo
@motion --interactive quero explorar maneiras de animar esse produto
```

## Runtime

`packages/runtime` contém os contratos Zod, máquina de estados, roteamento, memória de tentativas, Orquestrador, Supervisor e críticos de QA.

Os `AgentHandler` continuam independentes do fornecedor de modelo e podem ser conectados a OpenAI Agents SDK, Claude Agent SDK, Codex, MCP ou ferramentas locais.

## Remotion Studio

`apps/remotion-studio` é a primeira superfície de execução audiovisual. Ele consome `MotionSpecSchema` do runtime e registra a composição `MotionAgentDemo`.

Os pacotes `remotion` e `@remotion/cli` ficam fixados na mesma versão para evitar incompatibilidades entre pacotes Remotion.

## Skills

As skills próprias ficam em `skills/custom`.

As skills oficiais são rastreadas em `vendor/remotion-skills` e também podem ser instaladas via `pnpm skills:remotion`.

Antes de escrever código Remotion, carregue `remotion-best-practices` e a skill específica da tarefa.

## Próximos módulos

Conectar `AgentHandler` a modelos reais.

Adicionar persistência de jobs, issues e tentativas.

Adicionar `render_preview` e captura de frames para o grafo de QA.

Implementar comparação visual por overlay e pixel diff.

Adicionar ingestão de Figma e Design System.

Evoluir o Motion Design System persistente.
