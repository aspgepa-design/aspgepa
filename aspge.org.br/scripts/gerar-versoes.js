#!/usr/bin/env node
/**
 * Gera public/versoes.json a partir do git log.
 * Uso: node scripts/gerar-versoes.js  (ou npm run versoes)
 * Executado automaticamente pelo hook post-commit (.agents/hooks/post-commit.sh).
 */
const fs = require('fs');
const path = require('path');
const { gerarDoGit, VERSOES_JSON } = require('../src/services/versoesService');

try {
  const dados = gerarDoGit();
  fs.mkdirSync(path.dirname(VERSOES_JSON), { recursive: true });
  fs.writeFileSync(VERSOES_JSON, JSON.stringify(dados, null, 2) + '\n', 'utf8');
  const ultima = dados.versoes[0];
  console.log(`[versoes] ${dados.versoes.length} versões geradas. Atual: ${ultima.versao} (${ultima.hash})`);
} catch (e) {
  console.error('[versoes] Falha ao gerar versoes.json:', e.message);
  process.exit(1);
}
