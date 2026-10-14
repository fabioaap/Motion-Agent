# Motion OS · execução de jobs a partir do Google Drive

## Estado verificado em 13 de outubro de 2026
O adaptador `bin/motion-drive.mjs` está implementado e possui testes automatizados locais com Drive simulado. Os testes do adaptador e do OAuth por PKCE passaram no GitHub Actions. Um animatic de storyboard Remotion de 15 segundos foi renderizado pelo CI e seu ZIP foi armazenado na pasta de entregas da POC-001. **Ainda não houve autenticação OAuth real, download de assets originais pelo worker, aprovação humana de storyboard nem render final de marketing.** Este runbook não comprova operação completa.

## GitHub Actions sem consumo de Actions Storage · atualização em 14 de outubro de 2026

Na branch `feat/aiox-motion-os-drive-first`, o workflow de storyboard e o Live Motion agora **enviam os arquivos direto ao Google Drive**, usando `scripts/upload-motion-render-to-drive.mjs`. O CI deixa de salvar bundles de preview e evidências como artifacts. Os arquivos continuam **temporariamente no runner** até a finalização do job; não são armazenados no GitHub Actions Storage. Renderização continua consumindo minutos de Actions. Os outros repositórios, incluindo `Adsmagic-Workspace`, não foram alterados.

A alteração de código **não comprova upload real**. Para habilitar a entrega, uma pessoa com acesso ao Google Drive precisa configurar a autorização uma vez no repositório, sem enviar credenciais ao chat.

### Configuração necessária no GitHub

1. Em `Settings > Secrets and variables > Actions > Secrets` no repositório `fabioaap/Motion-Agent`, configurar os segredos `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` e `GOOGLE_OAUTH_REFRESH_TOKEN`. São credenciais de um cliente OAuth controlado pelo dono do Drive. **Nunca** colocá-los no YAML, commits, Drive, Trello, issues ou mensagens.
2. Em `Settings > Secrets and variables > Actions > Variables`, configurar `MOTION_OS_DRIVE_FOLDER_ID` com o ID da pasta privada de destino. Para reutilizar a pasta POC-001 existente, ela tem ID `1khtGkUOp9coB2ukxRaAZptJJHH_Cdpzi`, desde que o usuário OAuth tenha acesso de escrita.
3. No Google Cloud, habilitar a Drive API, configurar a tela de consentimento, criar um cliente OAuth próprio e conceder acesso explicitamente. Se for usar o OAuth Playground no iPad, criar um cliente **Web application** com o redirect permitido `https://developers.google.com/oauthplayground`; no Playground ativar **Use your own OAuth credentials**, selecionar o escopo e trocar o código pelo refresh token. Não usar um client ID Desktop com callback local nesse fluxo Web. O adaptador de OAuth Desktop descrito abaixo é uma alternativa **para uso interativo local**, não produz por si só credenciais automáticas para GitHub Actions.
4. Para a pasta do Drive já existente, o adaptador atual demanda escopo amplo `https://www.googleapis.com/auth/drive`. Isso dá acesso amplo aos arquivos da conta que autoriza. Preferir uma **conta Google dedicada ao Motion OS** com só os materiais necessários, ou futuramente um escopo `drive.file` e uma pasta criada/autorizada pelo próprio aplicativo. Nunca usar uma credencial de administrador sem necessidade.
5. Se o app OAuth externo estiver com status **Testing**, o refresh token normalmente expira em **sete dias** para escopos do Drive. Verificar o status de publicação e os requisitos de verificação da Google antes de contar com execução autônoma contínua. Consulte https://developers.google.com/identity/protocols/oauth2/.

### Comportamento dos workflows

* `Motion OS POC-001 storyboard render` passa a rodar somente por `workflow_dispatch` na branch `feat/aiox-motion-os-drive-first`. A etapa inicial **interrompe antes do render** se faltar configuração. Depois do FFprobe, publica o MP4, `technical-qa.json` e `contact-sheet.png` numa subpasta do Drive identificada por execução e tentativa.
* `Live Motion Smoke` envia MP4 e relatórios de QA selecionados para outra subpasta privada; interrompe se não houver MP4. O prompt é repassado por variável de ambiente, evitando interpolação direta de texto no shell.
* `CI` e `Motion OS Drive adapter tests` não fazem upload de artifacts. O teste do adaptador usa simulação local, sem conexão OAuth.
* Se houver erro de upload ou discrepância de tamanho/SHA-256, o job falha. Não há fallback que grave o vídeo no Actions Storage. Para versões revisáveis e finais, os gates de aprovação humana do `motion-job.v1` continuam obrigatórios; **upload automático de um animatic não é aprovação para publicação**.
* Os uploads respeitam a visibilidade privada da pasta e não alteram permissões de compartilhamento. O script cria subpastas privadas por `GITHUB_RUN_ID` e `GITHUB_RUN_ATTEMPT` e impede sobrescrever arquivos diferentes com o mesmo nome.

### Checklist de validação real após autorizar o Google

1. Disparar manualmente o workflow de storyboard em qualidade `draft` e conferir que ele conclui render, QA e envio.
2. Abrir a nova subpasta no Drive e conferir MP4, JSON, PNG, resolução e SHA-256.
3. Confirmar que a execução **não possui seção de artifacts** e que o link para a subpasta aparece no resumo do job.
4. Simular falta de segredo ou falha de upload e verificar que o workflow termina com erro **sem** criar artifact.
5. Manter o PR em draft e não fazer merge na main até validação humana.

Observação: contas de serviço do Google não têm cota própria de armazenamento e não podem assumir a propriedade de arquivos em My Drive. Para autenticação federada GitHub OIDC com contas de serviço, o destino recomendado é um **Drive compartilhado**, que pode depender de Google Workspace. Veja https://developers.google.com/workspace/drive/api/guides/about-shareddrives.

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
