# Revisão Geral do Projeto — 2026-09-21

Revisão orquestrada por especialidade, frentes com escopo disjunto e somente leitura.
Baseline: `validate-syntax.ps1` OK (JS + schema Prisma válidos).

## Resumo

| Severidade | Quantidade |
|------------|-----------|
| 🔴 Bloqueante | 8 |
| 🟡 Recomendado | 12 |
| 🟢 Ok/Observação | 6 |

---

## 🔴 Bloqueantes

### Segurança (security-reviewer)

1. **`GET /api/associados/cpf/:cpf` público vaza cadastro completo** — `routes/associados.js:9` + `associadoController.js:108-141`. Retorna o registro inteiro (endereço, RG, matrícula, whatsapp, email, documentos, gestões) para qualquer pessoa com um CPF. LGPD. Deveria retornar apenas campos mínimos para a página de atualização.
2. **`POST /api/associados/:id/foto` sem verificação de propriedade** — `routes/associados.js:50-54`. Qualquer autenticado troca a foto de qualquer associado. Falta `isProprioCadastro || isAdmin` como em `atualizar()`.
3. **CRUD de notícias sem `authorize()`** — `routes/noticias.js:11-14`. `POST/PUT/DELETE` e `GET /admin/todas` exigem só `authMiddleware` — qualquer associado gerencia notícias.
4. **`PUT /api/site-config` sem `authorize()`** — `routes/siteConfig.js:10`. Qualquer autenticado altera o conteúdo da página pública.
5. **`GET /api/carteirinhas/preview/:cpf` expõe dados+foto de qualquer CPF** — `routes/carteirinhas.js:31` + `carteirinhaController.js:256`. Autenticado, mas sem restrição de escopo (próprio CPF ou diretoria).
6. **Sem rate limiting** em `/api/auth/login`, `/api/associados/cpf/:cpf` e `/api/associados/:id/atualizar-cadastro` — brute-force de senha viável (a página pública autentica por CPF+senha no body).
7. **User enumeration no login** — `authController.js:31,59`: "CPF não encontrado" vs "Senha incorreta" permite descobrir CPFs cadastrados.
8. **`JWT_SECRET` com fallback em produção** — `middleware/auth.js:5`: `'fallback_secret_dev_only'` é usado silenciosamente se a env faltar. Deve falhar no boot quando `NODE_ENV=production`.

### Funcional (qa-reviewer)

9. **`PUT /api/auth/perfil` não existe — formulário de atualização do portal sempre falha** — `portal.ejs:1409` chama `PUT /api/auth/perfil`; `routes/auth.js` só tem `GET /perfil`. Deveria chamar `PUT /api/associados/:id`.
10. **Ficha de inscrição pública quebrada** — `inscricao.ejs:317` faz `POST /api/associados` sem token; a rota exige `authMiddleware + authorize('presidente','diretor')` → sempre 401. Lacuna de paridade com `GAS/Formulario.html` (que era público).
11. **`calcularCompletude()` quebra com `dataNascimento` Date** — `associadoController.js:553`: `valor.trim()` em campo `DateTime` lança TypeError → `PUT /api/associados/:id` retorna 500 para qualquer associado com data de nascimento preenchida.
12. **Upload de foto salva com CPF errado** — `middleware/upload.js:23`: filename usa `req.body.cpf || req.user.cpf` (CPF de quem envia), não o do associado `:id` da rota. Diretor subindo foto de outro associado grava arquivo com nome errado e quebra o regex de preview (`carteirinhaController.js:288`).

---

## 🟡 Recomendados

### Backend / QA

- **`noticiasController.js:1-4` e `siteConfigController.js:1-4`** instanciam `new PrismaClient()` próprio em vez de `require('../config/database')` — viola convenção e cria pool extra de conexões.
- **`votacaoController` e `gestaoController`** não chamam `validationResult(req)` — validators das rotas são decorativos.
- **`bcrypt` importado dentro de funções** — `associadoController.js:306,379`. Mover para o topo.
- **`gestaoController.ativar` reseta perfis com case errado** — `gestaoController.js:59-62`: `notIn: ['associado']` não casa `'Associado'` (case-sensitive no Postgres) e regrava tudo como minúsculo, gerando casing inconsistente na tabela.
- **`gestaoController.adicionarMembro`** não valida se `gestaoId` existe → erro 500 de FK em vez de 404.
- **Respostas de API inconsistentes** — `convenioController.listar` e `eventoController.listar` retornam array puro; o resto usa `{ sucesso, dados }`.
- **`bcrypt.compare` sem guarda de senha nula** — `associadoController.js:380` (`atualizarCadastro`): se `senha` for null no banco → 500. `login()` trata, `atualizarCadastro()` não.
- **`excluirTemplate` monta path errado** — `carteirinhaController.js:214`: `path.join(uploadDir, templatePath)` onde `templatePath` já é `/uploads/templates/x.png` → arquivo nunca é removido do disco (órfãos).
- **Path de template inconsistente** — `obterDadosExport` usa `process.cwd()/public` (`:380`) enquanto preview usa `UPLOAD_DIR` (`:285`). Quebra se `UPLOAD_DIR` for customizado.
- **`logMiddleware` é dead code com risco latente** — `middleware/auth.js:103`: nenhuma rota o usa; se um dia for aplicado em rotas de auth, loga `req.body` inteiro (senha em claro) no banco.
- **`obterRole` aceita 'secretári'→diretor** — `auth.js:80`: regra de negócio a confirmar (secretário tem poderes de diretor?).

### Schema / database-prisma

- **`Associado.senha` é `String` obrigatório mas o código trata como opcional** — `schema.prisma:23` vs `authController.js:35` (`!associado.senha`). Se produção tem NULLs legados, o Prisma lança erro de leitura. Tornar `String?` ou garantir NOT NULL no banco real.
- **`Gestao.associados` (relação m-n implícita) parece não utilizada** — cria tabela de junção oculta; `DiretoriaGestao` é o vínculo real. Avaliar remoção.
- **`Votacao` é só display** — sem modelos `Opcao`/`Voto`; votação real não existe (paridade com GAS, que também só exibia).
- **`Documento` + `uploadDocumento` são dead code** — nenhuma rota usa `uploadDocumento` (`middleware/upload.js:98`).

### Views / frontend-ejs

- **`layouts/main.ejs` + `partials/` são dead code** — `express-ejs-layouts` não está no `package.json` nem configurado em `server.js`; nenhuma view inclui o layout. Views são self-contained. Remover ou adotar de fato.
- **`portal.ejs:1419-1421` usa `innerHTML` com `data.erro`** — baixo risco (string do servidor), mas padrão inseguro; preferir `textContent`.
- **Token JWT em `localStorage`** — acessível a XSS; tradeoff conhecido, documentar.
- **`/portal` renderiza com usuário fake** — `server.js:96` injeta `{ nome: 'Usuário', ... }` antes do JS carregar o perfil real; flash de dados falsos.
- **`abrirModalLanc`/`abrirModalEvento` são stubs** — `portal.ejs:1428-1429` (`alert('em desenvolvimento')`).

### DevOps

- **`deploy.sh` é provisionamento, não deploy** — instala nginx/postgres/node e reconfigura tudo; nome enganoso. Renomear para `provision.sh` ou separar.
- **`deploy.sh:113-115` habilita UFW sem abrir a porta SSH 22022** — `ufw allow OpenSSH` libera só a 22; num VPS com SSH em 22022 isso **tranca o acesso**. Bloqueante operacional se rodado.
- **Path de uploads diverge** — `deploy.sh` usa `/var/www/aspge/public/uploads`; `nginx-config.conf` usa `/var/www/aspge/app/public/uploads`.
- **`redis-server` instalado mas não usado** — `deploy.sh:32`.
- **`puppeteer` e `pdf-lib` no `package.json` sem uso** — `gerarPdf` retorna 501 (TODO). Dependências pesadas ociosas.

### Docs (docs-curator)

- **`docs-curator.md` referencia `README-ASPGE.md`** — arquivo foi renomeado para `README.md`; corrigir a referência.
- **`docs/` não existe** — blueprint e AGENTS.md citam; docs vivem em `dev/` + raiz. Criar `docs/` ou ajustar referências.
- **`dev/` pode estar desatualizado** — verificar se `API.md`/`DESENVOLVIMENTO.md` citam `/atualizar` (rota antiga) em vez de `/atualizacao`.

---

## 🟢 OK

- Sintaxe JS + schema Prisma válidos (hook de custo zero).
- Views: `<%= %>` escapado; `<%-` apenas em includes/body confiáveis; sem `eval`/`document.write`.
- `helmet`, `compression`, CORS restrito a `APP_URL`, error handler sem stack em produção.
- Queries Prisma parametrizadas (sem injeção); `senha` removida dos retornos nos endpoints principais.
- Logs de auditoria com IP/user-agent nas ações sensíveis.
- Paridade macro com GAS: portal, carteirinha, atualização cadastral, inscrição, logs — todos têm equivalente (inscrição quebrada é bug, não ausência).

## Ordem sugerida de correção

1. RBAC faltante: `noticias.js`, `siteConfig.js`, `associados.js` (foto + `GET /:id`), `carteirinhas.js` (preview) — security.
2. `PUT /api/auth/perfil` → corrigir portal.ejs para `PUT /api/associados/:id` — backend+frontend.
3. Inscrição pública: criar endpoint público dedicado ou ajustar fluxo — backend.
4. `calcularCompletude` TypeError + filename de foto por CPF — backend.
5. Rate limiting + mensagem genérica de login + fail-fast do JWT_SECRET — security.
6. Limpezas: PrismaClient duplicado, dead code, paths de template, deploy.sh/UFW.
