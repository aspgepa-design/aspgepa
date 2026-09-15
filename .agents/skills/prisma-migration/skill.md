---
name: prisma-migration
description: "Altera o schema Prisma e gera migrations com segurança para o PostgreSQL do ASPGE-PA."
disable-model-invocation: false
allowed-tools:
  - "read_file"
  - "edit"
  - "bash"
effort-level: "medium"
---

# Procedimento: Migration Prisma

Quando o modelo de dados precisar mudar:

1. **Edite** `aspge.org.br/prisma/schema.prisma` seguindo os modelos existentes (nomes em camelCase nos campos, `@@map` quando aplicável).

2. **Gere a migration** (em `aspge.org.br/`):
   ```bash
   npx prisma migrate dev --name <descricao_snake_case>
   npx prisma generate
   ```

3. **Verifique** o SQL gerado em `prisma/migrations/<timestamp>_<nome>/migration.sql` antes de aplicar em produção.

4. **Seed** — se o modelo novo precisar de dados iniciais, atualize `prisma/seed.js` e teste com `npm run db:seed`.

5. **Produção** — migrations são aplicadas com `npx prisma migrate deploy` no VPS (delegar a `devops-deploy`). Nunca `migrate dev` nem `db push` em produção.

6. **Dados sensíveis** — campos com CPF/dados pessoais: confirme necessidade (LGPD) e nunca os exponha em `select` de APIs públicas.
