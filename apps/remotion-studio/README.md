# Remotion Studio

Aplicação de preview e render do Motion Agent.

## Studio

```bash
pnpm studio
```

## Demo fixa

```bash
pnpm render:demo
```

## Preview parametrizada por job

O `MotionJobPreview` recebe props e pode ser renderizado a partir de um JSON.

```bash
pnpm render:job
```

O exemplo usa `jobs/example-job.json`.

A arquitetura esperada para o `@motion` é:

```text
MotionCommandGateway
→ Orchestrator
→ MotionSpec / QA
→ Job Preview Props
→ Remotion MotionJobPreview
→ MP4 preview
→ READY_FOR_HUMAN
```

Isso mantém o runtime separado da engine visual e permite trocar o conteúdo do job sem reescrever a composição base.
