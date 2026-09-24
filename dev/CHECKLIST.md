# Checklist do Projeto — ASPGE-PA

> Fonte: `dev/API.md`, `dev/ARQUITETURA.md`, `dev/BANCO_DE_DADOS.md`, `dev/SEGURANCA.md`, `dev/DESENVOLVIMENTO.md` + estado real do código.
> Mantido pelo **orchestrator**: marcar `[x]` ao concluir e usar os `[ ]` para direcionar os subagentes.
> Legenda: `[x]` implementado · `[ ]` pendente · `[~]` parcial

## 1. Infraestrutura & Arquitetura

- [x] Stack MVC: Express 4 + EJS + Prisma + PostgreSQL
- [x] Nginx reverse proxy + SSL/TLS (Let's Encrypt) + redirect HTTP→HTTPS
- [x] PM2 process manager (`aspge-api`)
- [x] Winston logger + Morgan (HTTP)
- [x] Helmet, CORS, Compression
- [x] Health check `GET /health`
- [x] Versionamento automático via git log (`versoesService.js` + página `/versoes`)
- [x] Camada de serviços (`src/services/` — versoesService)
- [x] Rate limiting (`express-rate-limit` — geral + login)
- [ ] CSRF protection — doc: "não implementado"
- [ ] Redis (cache/sessões)
- [ ] CDN para estáticos
- [x] PM2 cluster mode / load balancing (`instances: 'max'`)
- [x] Docker (containerização — Dockerfile + docker-compose)
- [x] CI/CD (GitHub Actions `.github/workflows/deploy.yml`)
- [ ] Monitoramento Prometheus + Grafana
- [ ] WebSocket (notificações tempo real)
- [x] Swagger/OpenAPI (`/api-docs` + `/api-docs.json`)
- [ ] Webhooks

## 2. API — Endpoints

### Auth (`/api/auth`)
- [x] `POST /login`
- [x] `GET /perfil`
- [x] `POST /alterar-senha`
- [x] `POST /definir-senha` (admin)

### Associados (`/api/associados`)
- [x] `GET /` (paginado, diretoria)
- [x] `GET /resumido`
- [x] `GET /cpf/:cpf`
- [x] `GET /:id`
- [x] `POST /` (diretoria)
- [x] `PUT /:id`
- [x] `DELETE /:id` (presidente)
- [x] `POST /:id/foto` (upload)

### Eventos (`/api/eventos`)
- [x] `GET /` · `POST /` · `PUT /:id` · `DELETE /:id`

### Convênios (`/api/convenios`)
- [x] `GET /` · `POST /` · `PUT /:id` · `DELETE /:id`
- [x] `GET /publicos` (lista pública p/ home)

### Financeiro (`/api/financeiro`)
- [x] `GET /` (entradas/saídas/saldo) · `POST /` · `DELETE /:id` (tesoureiro/presidente)

### Carteirinhas (`/api/carteirinhas`)
- [x] `GET /:cpf` (gerar) · `POST /config` (template, presidente)

### Votações (`/api/votacoes`)
- [x] `GET /` · `POST /` (diretoria) · `POST /:id/votar`

### Gestões (`/api/gestoes`)
- [x] `GET /` · `GET /ativa` (com fotoUrl por CPF) · `POST /` · `PUT /:id` (presidente)

### Site Config (`/api/site-config`)
- [x] `GET /` · `PUT /` (presidente)
- [x] Contato e redes sociais do footer editáveis via site-config

### Notícias (`/api/noticias`)
- [x] `GET /` · `POST /` · `PUT /:id` · `DELETE /:id`

### Logs (`/api/logs`)
- [x] `GET /` (presidente, com filtros)

### Dependentes & Documentos
- [x] Rotas `/api/dependentes` e `/api/documentos` existem
- [x] Documentar esses endpoints em `dev/API.md`

## 3. Páginas Web (Views)

- [x] `/` Home pública (hero 2 cores, CTA Associe-se, convênios, notícias, enquetes, footer completo, skeletons, modal PWA)
- [x] Home mobile: header não-sticky + nav em linha rolável compacta
- [x] `/login`
- [x] `/portal` (menu lateral em categorias colapsáveis; versão dinâmica; aba Segurança c/ alterar senha)
- [x] `/inscricao` (ficha de inscrição)
- [x] `/atualizacao` (atualização cadastral)
- [x] `/versoes` (histórico de versões)
- [x] `/noticias` + `/noticias/:id` (público)
- [x] `/diretoria` (público, com fotos)
- [x] Carteirinha digital (renderizada dentro do `/portal`)

## 4. Banco de Dados

- [x] 12+ models no Prisma (Associado, Evento, Convenio, Lancamento, Votacao, Gestao, DiretoriaGestao, Documento, Log, ConfigCarteirinha, SiteConfig, Noticia, Dependente)
- [x] Migrations versionadas (Prisma Migrate)
- [x] Seed (`npm run db:seed`)
- [x] Índices (cpf unique, logs.associadoId, logs.createdAt)
- [x] Backup via `pg_dump`
- [x] Backup automatizado (`scripts/backup-db.sh` + cron, retenção configurável)
- [ ] Criptografia de CPF em repouso (doc: "pode ser criptografado no futuro")

## 5. Segurança

- [x] JWT (HS256, expiração configurável)
- [x] bcrypt (10 rounds)
- [x] RBAC por perfil (associado/tesoureiro/diretor/presidente)
- [x] express-validator nos inputs
- [x] Helmet headers
- [x] CORS configurado
- [x] Upload: validação MIME + limite de tamanho
- [x] Logs de auditoria no banco
- [x] SSL/TLS + UFW + Fail2ban no VPS
- [x] Rate limiting
- [ ] CSRF protection
- [~] LGPD (parcial — falta consentimento explícito, exclusão sob demanda, notificação de incidentes)

## 6. Testes & Qualidade

- [x] Validação de sintaxe via hook (`.agents/hooks/validate-syntax.*`)
- [ ] Testes unitários (Jest)
- [ ] Testes de integração (Supertest)
- [ ] Testes E2E (Playwright/Cypress)
- [x] Collection Postman (`postman/ASPGE-PA.postman_collection.json`)

## 7. Integrações Externas

- [x] Google Drive (download de fotos — script)
- [x] Google Sheets (migração de dados — script)
- [ ] Gateway de pagamento (mensalidades)
- [ ] Email service (notificações)
- [ ] SMS/WhatsApp (notificações)

## 8. Próximas Melhorias (ARQUITETURA.md §"Próximas Melhorias")

- [x] Swagger/OpenAPI
- [ ] Testing Suite (Jest + Supertest)
- [ ] Redis cache
- [x] Rate limiting
- [ ] WebSocket
- [x] Docker
- [x] CI/CD
- [ ] Prometheus + Grafana

---

## Como o orchestrator usa este arquivo

1. **Ao receber demanda**: consultar este checklist para saber o que já existe (não reimplementar) e o que falta.
2. **Ao concluir uma entrega**: instruir o `docs-curator` (ou marcar diretamente, se permitido) a atualizar o `[ ]` → `[x]` do item correspondente.
3. **Ao planejar**: priorizar os `[ ]` por impacto — segurança (rate limit, CSRF, LGPD) e testes vêm antes de integrações externas.
4. **Delegação**: pendências de backend → `backend-developer`; views → `frontend-ejs`; schema → `database-prisma`; infra → `devops-deploy`; doc → `docs-curator`.
