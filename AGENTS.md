# ASPGE-PA — Índice Agêntico

Sistema de gestão da ASPGE-PA: portal do associado, carteirinha digital, transparência financeira, convênios, votações, notícias e gestão administrativa.

- **Produção (alvo):** `aspge.org.br/` — API Node.js/Express v2.0
- **Piloto (somente leitura):** `GAS/` — Google Apps Script legado. **Nunca editar.**

## Stack & Comandos (rodar em `aspge.org.br/`)

- **Stack:** JavaScript (CommonJS) / Node.js / Express 4 / EJS / Prisma + PostgreSQL / JWT + bcrypt
- **Roles:** `presidente`, `diretor`, `tesoureiro`, `associado`
- **Produção:** VPS HostGator (`129.121.49.246:22022`, root, chave `~/.ssh/aspge_vps`), PM2 `aspge-api`, Nginx → `localhost:3000`, app em `/var/www/aspge/app`, domínio `aspgepa.org.br`
- **Dev:** `npm run dev` | **Prod local:** `npm start`
- **DB:** `npm run db:migrate` | `npm run db:generate` | `npm run db:seed`
- **Validação (custo zero):** `./.agents/hooks/validate-syntax.sh` (bash) ou `.\.agents\hooks\validate-syntax.ps1` (PowerShell)
- **Convenções detalhadas:** `dev/DESENVOLVIMENTO.md` e `dev/ARQUITETURA.md`

## Agentes (`.devin/agents/`)

| Perfil | Domínio | Escreve? |
|--------|---------|----------|
| `orchestrator` | Decompõe demanda, delega em paralelo, consolida | Não |
| `backend-developer` | Rotas, controllers, middleware, validação (`src/routes|controllers|middleware|config|services`, `server.js`) | Sim |
| `frontend-ejs` | Views, layouts, partials (`src/views/`, `public/`) | Sim |
| `database-prisma` | Schema, migrations, seeds (`prisma/`, `scripts/` de dados) | Sim |
| `devops-deploy` | VPS, PM2, Nginx, SSL, backups (`ecosystem.config.cjs`, `deploy.sh`, `nginx-config.conf`) | Sim |
| `qa-reviewer` | Sintaxe, convenções, validação de entrada, padrão MVC | **Não** |
| `security-reviewer` | JWT, RBAC, injeção, dados pessoais, segredos | **Não** |
| `docs-curator` | Docs alinhadas ao código (`AGENTS.md`, `README*`, `dev/`, `docs/`, `reports/`) | Sim |
| `version-curator` | Página `/versoes` derivada dos commits (`versoesService.js`, `versoes.ejs`, `gerar-versoes.js`, `versoes.json`, hooks post-commit) | Sim |
| `gas-legacy-analyst` | Regras de negócio do piloto `GAS/` | **Não** |

## Skills (`.agents/skills/<nome>/SKILL.md`)

| Skill | Quando usar |
|-------|-------------|
| `create-endpoint` | Rota + controller + validação + registro no `server.js` |
| `prisma-migration` | Alterar schema e gerar migration com segurança |
| `ejs-view` | Criar view EJS seguindo layout/partials |
| `auth-rbac` | Aplicar `authMiddleware`/`authorize` e roles |
| `deploy-vps` | Deploy no VPS (PM2/Nginx) |
| `gas-parity-check` | Paridade funcional com o piloto `GAS/` |

## Automação

- **Hooks:** `.devin/hooks.v1.json` — `hook-guard` (comandos destrutivos), `hook-guard-gas` (bloqueia escrita em `GAS/`), `hook-guard-secrets`, `hook-validate`, `hook-activity-log`, `hook-versoes` (regenera `versoes.json` pós-commit)
- **MCP:** `.devin/mcp_config.json` — filesystem + PostgreSQL (`${DATABASE_URL}`)
- **Schedules:** `.agents/schedules/cron.yaml` — relatório semanal de paridade (`weekly-parity-report`)
- **Cron runner:** `scripts/run-cron.sh` / `run-cron.ps1`
- **Versionamento:** cada commit gera uma versão `vx.y.z` (base `v2.0.0`; `feat`→minor, `fix`/demais→patch, `BREAKING`→major). Página pública `/versoes`; regenere com `npm run versoes` em `aspge.org.br/`.

## Regras de execução

1. **Lazy loading** — leia a `description` do perfil/skill e invoque só o necessário.
2. **Arquivos disjuntos** — ao delegar em paralelo, liste no prompt o que cada agente PODE e NÃO PODE tocar.
3. **Prompt auto-contido** — o subagente não vê a conversa; inclua paths absolutos, arquivo:linha, convenções e comando de validação.
4. **Revisores nunca editam** — reportam achados; quem corrige é o desenvolvedor do domínio.
5. **Custo zero** — scripts em `.agents/hooks/` em vez de inspecionar código linha por linha.
6. **Escopo de escrita** — código de produção só em `aspge.org.br/`; `GAS/` é leitura apenas.
7. **Segredos** — nunca commitar `.env`, `JWT_SECRET`, credenciais ou dumps com dados pessoais.
8. **Pós-commit** — registrar atividade na API do portfólio conforme `ATIVIDADES.md`.
9. **Pós-mudança** — `docs-curator` alinha a documentação.
