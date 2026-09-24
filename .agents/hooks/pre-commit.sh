#!/usr/bin/env bash
# Hook pré-commit: bloqueia segredos e valida sintaxe (custo zero de tokens)
set -e

echo "🔒 Verificando segredos e arquivos proibidos no stage..."

# Bloqueia .env e dumps com dados pessoais (migration.sql do Prisma é permitido)
if git diff --cached --name-only | grep -E '(^|/)\.env$|\.dump$|\.sql$' | grep -vE '(^|/)prisma/migrations/.*\.sql$' ; then
  echo "❌ Arquivo proibido no commit (.env/dump). Remova do stage."
  exit 1
fi

# Bloqueia edições no piloto GAS
if git diff --cached --name-only | grep -E '^GAS/' ; then
  echo "❌ Alterações em GAS/ são proibidas (piloto somente leitura)."
  exit 1
fi

# Segredos hardcoded comuns
if git diff --cached -U0 | grep -iE 'jwt_secret|password|senha|BEGIN (RSA|OPENSSH) PRIVATE KEY' | grep -v '.env.example' ; then
  echo "⚠️ Possível segredo no diff — revise antes de commitar."
fi

./.agents/hooks/validate-syntax.sh
