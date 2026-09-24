const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Diretório do app (aspge.org.br/) — o git sobe até a raiz do repo automaticamente
const APP_DIR = path.join(__dirname, '..', '..');
const VERSOES_JSON = path.join(APP_DIR, 'public', 'versoes.json');

// Commit que marca a migração GAS → Node.js (API v2.0)
const COMMIT_BASE_V2 = 'f525c2c';

// Bases de versionamento: era GAS começa em v1.0.0; migração Node = v2.0.0
const VERSAO_BASE_V1 = { major: 1, minor: 0, patch: 0 };
const VERSAO_BASE_V2 = { major: 2, minor: 0, patch: 0 };

// Itens curados do commit-base (a mensagem do commit não detalha a migração)
const ITENS_VERSAO_BASE = [
  'Nova arquitetura Node.js/Express + PostgreSQL (Prisma)',
  'Autenticação JWT com CPF e senha (perfis: presidente, diretor, tesoureiro, associado)',
  'API REST completa para integração',
  'Carteirinha digital com templates frente/verso e exportação em PDF',
  'Upload de fotos e documentos em storage local',
  'Migração do piloto Google Apps Script para VPS dedicado'
];

// Marcos históricos extras (vazio: a era GAS já é coberta pelos commits v1.x)
const MARCOS_HISTORICOS = [];

/**
 * Classifica o bump de versão pelo assunto do commit.
 * major: "major:"/"BREAKING" | minor: "feat"/"adiciona"/"nova"/"novo" | patch: resto
 */
function classificarBump(assunto) {
  const s = (assunto || '').toLowerCase();
  if (/^major[:(!]|breaking/.test(s)) return 'major';
  if (/^(feat|feature)[:(!]|\b(adiciona|nova|novo|feature|feat)\b/.test(s)) return 'minor';
  return 'patch';
}

/**
 * Ícone do item na página: added (+), fixed (✓) ou changed (~)
 */
function classificarTipo(assunto) {
  const s = (assunto || '').toLowerCase();
  if (/\b(fix|corr|bug|hotfix|erro|falha)\b/.test(s)) return 'fixed';
  if (/\b(feat|feature|adiciona|nova|novo|cria|implementa)\b/.test(s)) return 'added';
  return 'changed';
}

/**
 * Lê commits do git log (mais antigo → mais novo).
 * Separadores: \x1f entre campos, \x1e entre commits.
 */
function lerCommitsDoGit() {
  const out = execSync(
    'git log --reverse --pretty=format:"%H%x1f%ad%x1f%s%x1f%b%x1e" --date=short',
    { cwd: APP_DIR, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  );

  return out.split('\x1e')
    .map(bloco => bloco.trim())
    .filter(Boolean)
    .map(bloco => {
      const [hash, data, assunto, corpo] = bloco.split('\x1f');
      const itens = (corpo || '')
        .split('\n')
        .map(l => l.replace(/^[-*•\s]+/, '').trim())
        .filter(Boolean);
      return {
        hash: (hash || '').trim().substring(0, 7),
        hashCompleto: (hash || '').trim(),
        data: (data || '').trim(),
        assunto: (assunto || '').trim(),
        itens: itens.length ? itens : [(assunto || '').trim()]
      };
    });
}

/**
 * Atribui versões semver aos commits (mais antigo → mais novo).
 * Retorna lista mais nova → mais antiga, pronta para a view.
 */
function calcularVersoes(commits) {
  // Localiza o commit da migração Node (início da linha v2.x)
  const idxV2 = commits.findIndex(c => c.hashCompleto.startsWith(COMMIT_BASE_V2));

  // Se o commit-base não existir (clone raso), o mais antigo vira v2.0.0
  let { major, minor, patch } = idxV2 === 0 || idxV2 === -1 ? VERSAO_BASE_V2 : VERSAO_BASE_V1;

  const versoes = commits.map((commit, idx) => {
    if (idx === idxV2) {
      // Reinicia a numeração na migração para Node.js
      ({ major, minor, patch } = VERSAO_BASE_V2);
    } else if (idx > 0) {
      const bump = classificarBump(commit.assunto);
      if (bump === 'major') { major++; minor = 0; patch = 0; }
      else if (bump === 'minor') { minor++; patch = 0; }
      else { patch++; }
    }

    return {
      versao: `v${major}.${minor}.${patch}`,
      data: formatarData(commit.data),
      hash: commit.hash,
      titulo: commit.assunto,
      tipo: classificarTipo(commit.assunto),
      itens: idx === idxV2 ? ITENS_VERSAO_BASE : commit.itens
    };
  });

  return versoes.reverse();
}

function formatarData(iso) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${dia} de ${meses[parseInt(mes, 10) - 1] || mes} de ${ano}`;
}

function lerDoJson() {
  const raw = fs.readFileSync(VERSOES_JSON, 'utf8');
  return JSON.parse(raw);
}

/**
 * Versões para a página /versoes.
 * Fonte primária: git log (sempre atual no VPS, que é um clone).
 * Fallback: public/versoes.json (gerado pelo hook post-commit / npm run versoes).
 */
function obterVersoes() {
  try {
    const commits = lerCommitsDoGit();
    if (commits.length) {
      return { versoes: calcularVersoes(commits), marcos: MARCOS_HISTORICOS, fonte: 'git' };
    }
  } catch (e) {
    logger.warn('versoesService: git indisponível, usando versoes.json —', e.message);
  }

  try {
    const dados = lerDoJson();
    return { versoes: dados.versoes || [], marcos: dados.marcos || MARCOS_HISTORICOS, fonte: 'json' };
  } catch (e) {
    logger.error('versoesService: falha ao ler versoes.json —', e.message);
    return { versoes: [], marcos: MARCOS_HISTORICOS, fonte: 'vazio' };
  }
}

/**
 * Gera o conteúdo de versoes.json a partir do git (usado pelo script/hook).
 * Lança erro se o git estiver indisponível.
 */
function gerarDoGit() {
  const commits = lerCommitsDoGit();
  if (!commits.length) throw new Error('Nenhum commit encontrado no repositório');
  return {
    geradoEm: new Date().toISOString(),
    versoes: calcularVersoes(commits),
    marcos: MARCOS_HISTORICOS
  };
}

module.exports = { obterVersoes, gerarDoGit, VERSOES_JSON };
