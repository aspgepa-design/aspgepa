#!/usr/bin/env node
/**
 * Marca carteirinhaEmitidaEm nos associados cujas carteirinhas físicas
 * já foram emitidas (PDFs gerados anteriormente, listados em
 * scripts/carteirinhas-emitidas.txt no formato "NOME COMPLETO|dataISO").
 *
 * Uso:
 *   node scripts/marcar-carteirinhas-emitidas.js          # dry-run: só lista o casamento
 *   node scripts/marcar-carteirinhas-emitidas.js --apply  # grava carteirinhaEmitidaEm
 *
 * Casamento por nome normalizado (sem acentos, maiúsculas, espaços colapsados).
 */
const fs = require('fs');
const path = require('path');
const prisma = require('../src/config/database');

const ARQUIVO = path.join(__dirname, 'carteirinhas-emitidas.txt');
const APPLY = process.argv.includes('--apply');

function normalizar(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase().replace(/\s+/g, ' ').trim();
}

async function main() {
  const linhas = fs.readFileSync(ARQUIVO, 'utf8')
    .split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const entradas = linhas.map(l => {
    const [nome, data] = l.split('|');
    return { nome: nome.trim(), dataEmissao: new Date(data || Date.now()) };
  });

  const associados = await prisma.associado.findMany({
    select: { id: true, nomeCompleto: true, carteirinhaEmitidaEm: true }
  });
  const porNome = new Map(associados.map(a => [normalizar(a.nomeCompleto), a]));

  const casados = [];
  const naoEncontrados = [];
  const jaEmitidos = [];

  for (const e of entradas) {
    const a = porNome.get(normalizar(e.nome));
    if (!a) { naoEncontrados.push(e.nome); continue; }
    if (a.carteirinhaEmitidaEm) { jaEmitidos.push(`${e.nome} (já: ${a.carteirinhaEmitidaEm.toISOString().slice(0, 10)})`); continue; }
    casados.push({ id: a.id, nome: a.nomeCompleto, dataEmissao: e.dataEmissao });
  }

  console.log(`\nEntradas no arquivo: ${entradas.length}`);
  console.log(`Casados (a marcar):  ${casados.length}`);
  console.log(`Já emitidos (skip):  ${jaEmitidos.length}`);
  console.log(`Não encontrados:     ${naoEncontrados.length}`);

  if (naoEncontrados.length) {
    console.log('\n--- SEM CORRESPONDÊNCIA (revisar nome no cadastro) ---');
    naoEncontrados.forEach(n => console.log('  ' + n));
  }
  if (jaEmitidos.length) {
    console.log('\n--- JÁ MARCADOS ---');
    jaEmitidos.forEach(n => console.log('  ' + n));
  }

  if (!APPLY) {
    console.log('\nDry-run. Rode com --apply para gravar.');
    casados.slice(0, 10).forEach(c => console.log(`  → ${c.nome} [${c.dataEmissao.toISOString().slice(0, 10)}]`));
    if (casados.length > 10) console.log(`  ... +${casados.length - 10}`);
    return;
  }

  let ok = 0, falhas = 0;
  for (const c of casados) {
    try {
      await prisma.associado.update({
        where: { id: c.id },
        data: { carteirinhaEmitidaEm: c.dataEmissao }
      });
      ok++;
    } catch (e) {
      falhas++;
      console.error(`  ✗ ${c.nome}: ${e.message}`);
    }
  }
  console.log(`\nGravados: ${ok} | Falhas: ${falhas}`);
}

main()
  .catch(e => { console.error('Erro:', e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
