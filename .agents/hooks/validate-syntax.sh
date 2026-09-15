#!/usr/bin/env bash
# Validação de sintaxe a custo zero de tokens (ASPGE-PA)
# Uso: ./.agents/hooks/validate-syntax.sh
set -e

APP_DIR="aspge.org.br"
FAIL=0

echo "🔍 Validando sintaxe JS em $APP_DIR ..."

# Valida todos os .js do projeto (exceto node_modules)
while IFS= read -r -d '' file; do
  if ! node --check "$file" >/dev/null 2>&1; then
    echo "❌ Erro de sintaxe: $file"
    node --check "$file" || true
    FAIL=1
  fi
done < <(find "$APP_DIR" -name '*.js' -not -path '*/node_modules/*' -print0)

# Valida schema Prisma se o CLI estiver instalado
PRISMA_CLI="$APP_DIR/node_modules/prisma/build/index.js"
if [ -f "$APP_DIR/prisma/schema.prisma" ] && [ -f "$PRISMA_CLI" ]; then
  echo "🔍 Validando schema Prisma..."
  (cd "$APP_DIR" && node node_modules/prisma/build/index.js validate) || FAIL=1
elif [ -f "$APP_DIR/prisma/schema.prisma" ]; then
  echo "⚠️ Prisma CLI não instalado - validação de schema pulada."
fi

if [ "$FAIL" -eq 0 ]; then
  echo "✅ Sintaxe OK"
else
  echo "❌ Falhas encontradas"
  exit 1
fi
