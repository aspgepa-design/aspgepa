#!/usr/bin/env bash
# Hook pós-commit: regenera public/versoes.json a partir do git log.
# Instalado via .git/hooks/post-commit — nunca falha o commit (|| true).
set -e

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT/aspge.org.br"

if node scripts/gerar-versoes.js; then
  # Deixa o JSON atualizado já no stage para o próximo commit
  git add aspge.org.br/public/versoes.json 2>/dev/null || true
else
  echo "⚠️  Falha ao gerar versoes.json (não bloqueia o commit)"
fi
