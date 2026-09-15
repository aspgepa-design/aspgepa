# 🗺️ Diretrizes e Memória do Projeto ASPGE-PA

## 🎯 Objetivo Geral
Sistema de gestão da ASPGE-PA (Associação dos Servidores da PGE-PA): portal do associado, carteirinha digital, transparência financeira, convênios, votações, notícias e gestão administrativa.

- **Sistema em produção (alvo do trabalho):** `aspge.org.br/` — API Node.js/Express v2.0
- **Projeto piloto (referência, somente leitura):** `GAS/` — Google Apps Script legado usado como base funcional. **Nunca editar.**

## 🛠️ Stack & Ambiente
- **Linguagem / Framework:** JavaScript (CommonJS) / Node.js / Express 4
- **Banco:** PostgreSQL via Prisma ORM (`aspge.org.br/prisma/schema.prisma`)
- **Views:** EJS (`aspge.org.br/src/views/`, layout `layouts/main.ejs` + `partials/`)
- **Auth:** JWT + bcrypt, roles `presidente`, `diretor`, `tesoureiro`, `associado`
- **Produção:** VPS Ubuntu, PM2 (`ecosystem.config.cjs`), Nginx reverse proxy → `localhost:3000`, app em `/var/www/aspge/app`, domínio `aspgepa.org.br`

## 💻 Comandos Principais (rodar em `aspge.org.br/`)
- Dev: `npm run dev` (nodemon)
- Produção local: `npm start`
- Migração: `npm run db:migrate` | Generate: `npm run db:generate` | Seed: `npm run db:seed`
- Validação de sintaxe (custo zero): `./.agents/hooks/validate-syntax.sh` (Git Bash/WSL) ou `.\.agents\hooks\validate-syntax.ps1` (PowerShell)

## 👥 Subagentes Disponíveis (.agents/subagents/)
Consulte o Frontmatter do subagente antes de invocá-lo:
- **Orquestrador:** `.agents/subagents/orchestrator.md` — decompõe tarefas e delega em paralelo
- **Backend:** `.agents/subagents/backend-developer.md` — rotas, controllers, middleware, validação
- **Frontend EJS:** `.agents/subagents/frontend-ejs.md` — views, layouts, partials
- **Banco/Prisma:** `.agents/subagents/database-prisma.md` — schema, migrations, seeds
- **DevOps:** `.agents/subagents/devops-deploy.md` — deploy VPS, PM2, Nginx, backups
- **Revisor:** `.agents/subagents/code-reviewer.md` — revisão de segurança, RBAC e convenções
- **Analista GAS:** `.agents/subagents/gas-legacy-analyst.md` — lê o piloto `GAS/` para paridade de regras de negócio (somente leitura)

## 🧰 Habilidades do Projeto (.agents/skills/)
- `.agents/skills/create-endpoint/skill.md` — criar rota + controller + validação + registro no `server.js`
- `.agents/skills/prisma-migration/skill.md` — alterar schema e gerar migration com segurança
- `.agents/skills/ejs-view/skill.md` — criar view EJS seguindo layout/partials existentes
- `.agents/skills/auth-rbac/skill.md` — aplicar `authMiddleware`/`authorize` e roles corretas
- `.agents/skills/deploy-vps/skill.md` — procedimento de deploy no VPS (PM2/Nginx)
- `.agents/skills/gas-parity-check/skill.md` — conferir paridade funcional com o piloto `GAS/`

## ⚠️ Regras de Execução para Agentes
1. **Lazy Loading:** nunca carregue todas as skills de uma vez. Leia a descrição no Frontmatter e acione apenas a necessária.
2. **Delegação Paralela:** tarefas independentes devem ser delegadas a subagentes em janelas de contexto separadas.
3. **Custo Zero:** execute scripts de verificação em `.agents/hooks/` em vez de inspecionar código linha por linha com a LLM.
4. **Escopo de escrita:** código de produção só em `aspge.org.br/`. `GAS/` é referência histórica — leitura apenas.
5. **Segredos:** nunca commitar `.env`, `JWT_SECRET`, credenciais ou dumps com dados pessoais (CPF etc.).
