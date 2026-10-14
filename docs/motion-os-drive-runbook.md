# Motion OS · execução de jobs a partir do Google Drive

## Estado verificado em 13 de outubro de 2026
O adaptador `bin/motion-drive.mjs` está implementado e possui testes automatizados locais com Drive simulado. A validação do acesso OAuth real, do Remotion e da entrega final com uma marca ainda depende de execução e de evidência. Este runbook não comprova operação completa.

## Contrato
Cada job usa um arquivo `motion-job.json` validado como `motion-job.v1`. Os projetos dos clientes não precisam de um repositório Git. A origem da marca e os assets devem ser autorizados e possuir `expected_version` ou `checksum`. O logo original precisa estar listado em `inputs` e também em `brand.logo_file_ids`. O campo correto do briefing é `brief.message`, e valores de `rights_status` aceitos são `owned`, `licensed` ou `authorized`. Rejeitar `to_verify` é intencional.

## Configuração do executor
Pré requisitos: Node.js 22 ou superior, `pnpm`, `ffmpeg`, browser/Chromium, pacotes do motor e acesso permitido aos assets do cliente. O CLI `doctor` mostra pré requisitos, mas não executa renderização.

1. Use um cliente OAuth confiável, com consentimento expresso e os escopos mínimos que realmente deem acesso aos arquivos selecionados. Não copie o token do conector do ChatGPT; ele não fica disponível ao CLI.
2. No terminal local do executor, configure `GOOGLE_DRIVE_ACCESS_TOKEN` com um token **temporário**, nunca em commit, log, doc ou conversa. Armazene credenciais persistentes somente no mecanismo seguro do sistema, não no projeto.
3. Substitua os valores `SUBSTITUA_...` em `examples/motion-job.example.json`. Não autorize assets de outra marca por engano.
4. Execute os comandos abaixo apenas quando tiver um token válido e IDs verificados.

```powershell
node bin/motion-drive.mjs doctor
node --test tests/motion-drive.test.mjs
node bin/motion-drive.mjs init --manifest examples/motion-job.example.json --parent DRIVE_FOLDER_ID
node bin/motion-drive.mjs pull --folder JOB_FOLDER_ID --out ./workspaces
node bin/motion-drive.mjs status --folder JOB_FOLDER_ID
```

## Gates obrigatórios
`push --stage storyboard` cria um artefato para aprovação. Só depois de aprovação humana identificada em `approve --stage storyboard` devem ocorrer preview e QA. O relatório de QA aprovado e o arquivo editável são exigidos antes de `approve --stage final` e `push --stage final`. Apenas quem revisou os materiais pode aprovar; não automatizar consentimento humano.

## POC Adsmagic
Pasta de projeto no Drive: https://drive.google.com/drive/folders/1khtGkUOp9coB2ukxRaAZptJJHH_Cdpzi

Brand System canônico (aprovado em 10/10/2026): https://docs.google.com/document/d/1wN0HAW-ilQJoabcliSMfxSQmQcQkoxio9RZVxKy-L9g/edit

Cores: Navy `#010543`, Green `#3BB56D`, Campaign Background `#000E50`, White `#FFFFFF`. Não reutilizar o preset histórico azul `#1557FF` nem reconstruir a marca a partir de texto. Usar PNG/SVG original aprovado e verificar versão/direitos.

Não marcar como completo sem: arquivo real baixado do Drive pelo CLI, storyboard aprovado, prévia renderizada via motor correto, QA, MP4/fonte editável no Drive e teste com segunda marca.

## Diagnóstico de problemas
Sem token: autenticação não configurada. Sem acesso ao logo: interromper em `BLOCKED_MISSING_ASSETS`. Falha de checksum ou versão: interromper sem sobrescrever. Falha em renderização ou aprovação: não publicar final. Não salvar tokens ou materiais privados no repositório do motor.
