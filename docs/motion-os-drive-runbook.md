# Motion OS · execução de jobs a partir do Google Drive

## Estado verificado em 13 de outubro de 2026
O adaptador `bin/motion-drive.mjs` está implementado e possui testes automatizados locais com Drive simulado. Os testes do adaptador e do OAuth por PKCE passaram no GitHub Actions. Um animatic de storyboard Remotion de 15 segundos foi renderizado pelo CI e seu ZIP foi armazenado na pasta de entregas da POC-001. **Ainda não houve autenticação OAuth real, download de assets originais pelo worker, aprovação humana de storyboard nem render final de marketing.** Este runbook não comprova operação completa.

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

## OAuth Desktop com consentimento em navegador (sem enviar credenciais pelo chat)
O wrapper `bin/motion-drive-oauth.mjs` usa OAuth 2.0 com PKCE, abre um callback local temporário em `127.0.0.1` e envia um token de curta duração somente ao processo-filho do adaptador. Não salva tokens nem refresh tokens em disco.

**Etapas humanas indispensáveis:**
1. No Google Cloud, habilite a Google Drive API e configure OAuth Consent Screen. Registre seu próprio usuário como test user, se o app ainda estiver em modo Testing.
2. Crie um OAuth Client ID do tipo **Desktop app**. Os IDs/secrets ficam no ambiente do executor, nunca em repositório público, Drive, Notion ou Trello.
3. Em PowerShell local, configure `$env:GOOGLE_OAUTH_CLIENT_ID="SEU_CLIENT_ID"` e, caso exigido pela configuração, `$env:GOOGLE_OAUTH_CLIENT_SECRET="SEGREDO"`.
4. No estado atual, o acesso à pasta pré-existente do Motion OS exige `$env:GOOGLE_DRIVE_SCOPE="drive"`, que concede permissão ampla aos arquivos do Drive. **Verifique cuidadosamente a tela de consentimento**; a redução futura de permissões requer Google Picker ou a criação de pastas pelo próprio aplicativo.
5. Execute `node bin/motion-drive-oauth.mjs -- status --folder JOB_FOLDER_ID`. Copie e abra a URL apresentada no navegador local, autorize e aguarde o callback na mesma máquina. Para criar um primeiro job, use `-- init --manifest SEU_JOB.json --parent PASTA_ID` após validar todos os assets.
6. Tokens expiram; para cada nova execução, autentique novamente. Este protótipo não implementa refresh token nem execução não assistida.

**Limites:** O conector Google Drive do ChatGPT não entrega sua credencial OAuth ao Node externo. Para acesso sem humano no futuro, será necessário um executor com identidade de serviço e delegação explícita, ou outra integração segura aprovada. Nunca tente extrair o token do conector.

## Gates obrigatórios
`push --stage storyboard` cria um artefato para aprovação. Só depois de aprovação humana identificada em `approve --stage storyboard` devem ocorrer preview e QA. O relatório de QA aprovado e o arquivo editável são exigidos antes de `approve --stage final` e `push --stage final`. Apenas quem revisou os materiais pode aprovar; não automatizar consentimento humano.

## POC Adsmagic
Pasta de projeto no Drive: https://drive.google.com/drive/folders/1khtGkUOp9coB2ukxRaAZptJJHH_Cdpzi

Brand System canônico (aprovado em 10/10/2026): https://docs.google.com/document/d/1wN0HAW-ilQJoabcliSMfxSQmQcQkoxio9RZVxKy-L9g/edit

Cores: Navy `#010543`, Green `#3BB56D`, Campaign Background `#000E50`, White `#FFFFFF`. Não reutilizar o preset histórico azul `#1557FF` nem reconstruir a marca a partir de texto. Usar PNG/SVG original aprovado e verificar versão/direitos.

Storyboard técnico 15s e QA preliminar: https://docs.google.com/document/d/1pFW9ypwjtCpMbGJ7Uje9kBEoDBNLZzaUQLimIUbKSLc/edit
Render Remotion e artefato temporário: https://github.com/fabioaap/Motion-Agent/actions/runs/38493640130
ZIP arquivado no Drive (não publicar): https://drive.google.com/file/d/1XW_1JYHiyh1brBKZCewv4v6aGZDpeWJ7/view
O artefato ZIP não representa um upload automatizado pelo CLI; foi copiado para a pasta do Drive a partir do GitHub Actions via conector.

Não marcar como completo sem: arquivo real baixado do Drive pelo CLI, storyboard aprovado, prévia renderizada via motor correto, QA, MP4/fonte editável no Drive e teste com segunda marca.

## Diagnóstico de problemas
Sem token: autenticação não configurada. Sem acesso ao logo: interromper em `BLOCKED_MISSING_ASSETS`. Falha de checksum ou versão: interromper sem sobrescrever. Falha em renderização ou aprovação: não publicar final. Não salvar tokens ou materiais privados no repositório do motor.
