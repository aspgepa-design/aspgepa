---
name: deploy-vps
description: "Procedimento de deploy do aspge.org.br no VPS Ubuntu: build, migrate, PM2 reload e verificação de saúde."
disable-model-invocation: false
allowed-tools:
  - "read_file"
  - "bash"
effort-level: "high"
---

# Procedimento: Deploy no VPS

Ambiente: VPS Ubuntu, app em `/var/www/aspge/app`, PM2 `aspge-api` (porta 3000), Nginx → `aspgepa.org.br`. Referências: `DEPLOY.md`, `aspge.org.br/scripts/deploy.sh`, `aspge.org.br/ecosystem.config.cjs`.

## Passos
1. **Pré-deploy local:** `.agents/hooks/validate-syntax.sh` verde; `git status` limpo ou mudanças intencionais.
2. **Enviar código** para o VPS (rsync/git pull conforme fluxo vigente) para `/var/www/aspge/app`.
3. **No VPS:**
   ```bash
   cd /var/www/aspge/app
   npm ci --omit=dev
   npx prisma migrate deploy
   npx prisma generate
   pm2 reload aspge-api   # ou: pm2 start ecosystem.config.cjs
   ```
4. **Verificação:**
   ```bash
   pm2 status
   pm2 logs aspge-api --lines 50
   curl -s https://aspgepa.org.br/health
   ```
5. **Rollback:** manter backup anterior; restaurar via `scripts/backup.sh`/`pm2` conforme `DEPLOY.md`.

## Cuidados
- `.env` de produção fica só no VPS — nunca commitar.
- `public/uploads` e `logs/` são persistentes — não sobrescrever no envio.
- Registrar resultado em `reports/deploy-<data>.md`.
