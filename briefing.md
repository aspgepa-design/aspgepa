# 📋 Briefing do Projeto — ASPGE-PA

## Escopo
Manutenção e evolução do sistema ASPGE-PA em produção: API Node.js/Express + PostgreSQL (Prisma) + views EJS, servindo o portal do associado e a administração da associação.

## Diretórios
- `aspge.org.br/` — **sistema em produção, alvo de todo o trabalho**
- `GAS/` — **projeto piloto em Google Apps Script** usado como base do sistema atual. Referência de regras de negócio e fluxos. **Somente leitura; nunca modificar.**
- `dev/` — documentação de arquitetura e desenvolvimento
- `reports/` — saídas de rotinas agendadas e relatórios de subagentes

## Funcionalidades do sistema (paridade com o piloto GAS)
- Autenticação por CPF + senha (JWT), perfis: `presidente`, `diretor`, `tesoureiro`, `associado`
- Dashboard do associado, meu cadastro / atualização cadastral
- Carteirinha digital (geração de PDF/imagem, upload de foto)
- Transparência financeira (mensalidades, comprovantes)
- Convênios, eventos, votações, notícias, configuração do site
- Logs de auditoria de ações

## Ambiente de produção
- VPS Ubuntu — app em `/var/www/aspge/app`, processo PM2 `aspge-api` (fork, porta 3000)
- Nginx: reverse proxy `aspgepa.org.br` → `localhost:3000`; `/uploads` servido de `public/uploads`
- PostgreSQL local no VPS; backups em `backups/`

## Regras do projeto
1. Todo código novo/editação acontece em `aspge.org.br/` seguindo o padrão MVC em camadas (`routes → middleware → controllers → prisma`).
2. Rotas protegidas usam `authMiddleware`; restrição por perfil via `authorize(...)`.
3. Validação de entrada com `express-validator` na definição da rota.
4. Erros retornam JSON `{ erro: 'mensagem' }`; logs via `src/config/logger.js` (winston).
5. Mudanças de schema exigem migration (`npm run db:migrate`) — nunca editar banco manualmente.
6. Não commitar `.env`, uploads, dumps ou dados pessoais.
7. Antes de finalizar qualquer alteração: rodar `./.agents/hooks/validate-syntax.sh`.
