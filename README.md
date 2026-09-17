# Motion Director Orchestrator

Starter kit para transformar o Motion Director em um runtime multiagente auditável.

## O que já está implementado

Contratos Zod para brief, assets, decomposição, motion direction, motion spec, build, QA e memória de tentativas.

Máquina de estados explícita para o job.

Orquestrador com seleção dinâmica de especialistas.

Execução paralela de builders independentes.

Grafo de QA com críticos independentes.

Supervisor separado da execução criativa.

Roteamento de issues para o especialista responsável.

Memória de tentativas para evitar repetição cega.

Fallback de estratégia quando reconstrução falha.

Critérios formais para READY_FOR_HUMAN.

Gate de aprovação humana antes do render final.

## Package manager

O package manager oficial do projeto é pnpm.

A versão fica fixada no campo `packageManager` do `package.json` para manter o ambiente reproduzível.

O repositório já possui `pnpm-workspace.yaml` e está preparado para evoluir para um monorepo com `apps/*` e `packages/*`.

Para ativar a versão declarada no projeto com Corepack:

```bash
corepack enable
corepack prepare pnpm@12.4.2 --activate
```

## Instalação

Clone incluindo o submódulo das skills oficiais do Remotion:

```bash
git clone --recurse-submodules https://github.com/fabioaap/Motion-Agent.git
cd Motion-Agent
pnpm install
```

Se o repositório já estiver clonado:

```bash
git submodule update --init --recursive
pnpm install
```

## Validação

```bash
pnpm typecheck
pnpm demo
```

## Integração real

Os AgentHandler são adaptadores. Cada handler pode apontar para OpenAI Agents SDK, Claude Agent SDK, Codex, MCP, ferramentas locais, Remotion ou serviços internos.

O núcleo não depende de um fornecedor específico de modelo.

## Próximos módulos recomendados

Implementar adaptadores reais dos agentes.

Adicionar persistência em SQLite ou Postgres para jobs, issues e tentativas.

Integrar Remotion Studio e render_preview.

Implementar comparação visual por screenshots, overlay e pixel diff.

Adicionar ingestão de Figma e Design System.

Adicionar biblioteca persistente do Motion Design System.

Separar gradualmente o runtime em packages e as superfícies executáveis em apps conforme o projeto crescer.

## Comando oficial `@motion`

O entrypoint humano do sistema é `@motion`.

### Iniciar e deixar o Diretor conduzir

```text
@motion
```

O Director inicia o intake progressivo, com no máximo quatro perguntas relevantes por rodada.

### Já enviar a intenção

```text
@motion quero animar esse dashboard mostrando que a IA encontrou uma oportunidade
```

O sistema considera o contexto já fornecido e pergunta somente o que ainda for necessário.

### Enviar intenção e materiais

Arquivos anexados devem ser passados ao `MotionCommandGateway` como `attachments`. O Asset Inspector começa a partir desses materiais e prioriza reutilização dos originais.

### Modo autônomo

```text
@motion --auto crie uma abertura premium para esse logo
```

O sistema assume as decisões criativas sempre que puder, sem suspender Fidelity QA, Supervisor ou Regression Check.

### Modo interativo

```text
@motion --interactive quero explorar maneiras de animar esse produto
```

O Director prioriza recomendações criativas e oferece direções antes da execução.

### Integração

```ts
const motion = new MotionCommandGateway(orchestrator);

const result = await motion.invoke(
  "@motion quero animar esse dashboard",
  {
    attachments: [
      {
        name: "dashboard.png",
        path: "./dashboard.png",
        mime_type: "image/png",
        source: "user"
      }
    ]
  }
);
```

O parser só captura mensagens cujo primeiro comando seja `@motion`, evitando colisão com conversas normais.

## Skills

O repositório combina duas camadas de skills.

As skills próprias ficam em `skills/custom` e controlam orquestração, direção de cena, fidelidade de assets e QA.

As skills oficiais do Remotion ficam rastreadas no submódulo `vendor/remotion-skills` e também podem ser instaladas ou atualizadas no ambiente do agente com:

```bash
pnpm skills:remotion
```

Esse script usa `pnpm dlx skills add remotion-dev/skills`.

O arquivo `AGENTS.md` orienta agentes de código a carregar primeiro a skill de orquestração do Motion Agent e depois as skills oficiais específicas do Remotion necessárias para a tarefa.

A fonte oficial continua sendo `remotion-dev/skills`, evitando manter uma cópia privada e desatualizada.
