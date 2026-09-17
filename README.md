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

Validar o gateway humano `@motion` e a geração de scene payload:

```bash
pnpm demo:command
```

Abrir o Remotion Studio:

```bash
pnpm studio
```

Renderizar a composição de smoke test:

```bash
pnpm render:demo
```

Renderizar o painel de status de um job:

```bash
pnpm render:job
```

Renderizar a cena real parametrizada:

```bash
pnpm render:scene
```

Instalar ou atualizar as skills oficiais do Remotion no ambiente do agente:

```bash
pnpm skills:remotion
```

## `@motion`

`@motion` é o entrypoint humano do sistema. O gateway vive em `packages/runtime/src/command.ts` e sempre encaminha o pedido ao grafo do Orquestrador.

```text
@motion
@motion --auto crie uma abertura premium para esse logo
@motion --interactive quero explorar maneiras de animar esse produto
```

O gateway possui três níveis de saída:

```text
invoke()             -> JobContext
invokeWithPreview()  -> JobContext + MotionPreviewJob
invokeWithScene()    -> JobContext + MotionPreviewJob + MotionSceneJob
```

`MotionSceneJob` é a ponte entre o grafo e a composição audiovisual real.

## Runtime

`packages/runtime` contém os contratos Zod, máquina de estados, roteamento, memória de tentativas, Orquestrador, Supervisor e críticos de QA.

`packages/runtime/src/scene.ts` transforma o estado aprovado do job em uma cena declarativa com layers, assets, timing, motion family, layout e política de fidelidade.

Os `AgentHandler` continuam independentes do fornecedor de modelo e podem ser conectados a OpenAI Agents SDK, Claude Agent SDK, Codex, MCP ou ferramentas locais.

## Regra de fidelidade da cena real

O caminho genérico de `MotionScene` não reconstrói visualmente UI, logo ou ícone.

Quando a estratégia for `USE_ORIGINAL`, `REUSE_SVG`, `SEGMENT_ORIGINAL`, `MASK`, `OVERLAY` ou `HYBRID`, o asset original continua sendo a fonte visual do layer.

Reconstrução em React ou SVG precisa ser escolhida explicitamente pelo grafo, executada por especialista e validada pelo Fidelity Critic antes de substituir um original.

## Remotion Studio

`apps/remotion-studio` registra três superfícies:

`MotionAgentDemo` demonstra o sistema.

`MotionJobPreview` mostra o estado do job.

`MotionScene` renderiza a peça audiovisual real usando um `MotionSceneJob` como props.

A composição `MotionScene` já suporta assets de imagem, SVG e vídeo, além de famílias básicas como `Static`, `SoftSpring`, `ScaleReveal`, `MaskReveal`, `PanZoom`, `Focus` e entradas premium.

Os pacotes `remotion` e `@remotion/cli` ficam fixados na mesma versão para evitar incompatibilidades entre pacotes Remotion.

## Assets

Assets locais usados pelo Remotion devem ficar em `apps/remotion-studio/public` e o scene payload referencia o caminho relativo a essa pasta.

Exemplo:

```json
{
  "source": "jobs/meu-job/dashboard.svg",
  "strategy": "REUSE_SVG",
  "fidelityRequirement": "STRICT"
}
```

Assets HTTP também podem ser passados diretamente quando a política do job permitir.

## Skills

As skills próprias ficam em `skills/custom`.

As skills oficiais são rastreadas em `vendor/remotion-skills` e também podem ser instaladas via `pnpm skills:remotion`.

Antes de escrever código Remotion, carregue `remotion-best-practices` e a skill específica da tarefa.

## Próximos módulos

Conectar `AgentHandler` a modelos reais.

Adicionar ingestão automática de anexos para `public/jobs/<job_id>`.

Adicionar persistência de jobs, issues e tentativas.

Adicionar `render_preview` e captura de frames para o grafo de QA.

Implementar comparação visual por overlay e pixel diff.

Adicionar ingestão de Figma e Design System.

Evoluir o Motion Design System persistente.
