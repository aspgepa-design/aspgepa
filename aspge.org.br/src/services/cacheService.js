/**
 * Cache service — Redis (ioredis) com fallback em memória (Map com TTL).
 *
 * Uso:
 *   const dados = await cache.envolver('convenios:publicos', 300, () => prisma.convenio.findMany(...));
 *   await cache.invalidar('convenios');  // apaga todas as chaves com esse prefixo
 *
 * Comportamento:
 *  - REDIS_URL definida (ex.: redis://localhost:6379) → usa Redis compartilhado
 *    entre os processos do PM2 (cluster) — invalidação funciona para todos.
 *  - Sem REDIS_URL ou Redis indisponível → Map em memória por processo
 *    (funciona em dev/testes sem dependência externa).
 *  - Nunca lança exceção: falha do Redis degrada silenciosamente para memória.
 *
 * Env var: REDIS_URL (opcional)
 */
const logger = require('../config/logger');

const TTL_PADRAO = 300; // 5 min
const MEMORIA_MAX = 500; // proteção contra crescimento indefinido

// ---- Backend em memória (fallback) ----
const memoria = new Map(); // chave -> { valor, expira }

function memoriaObter(chave) {
  const item = memoria.get(chave);
  if (!item) return null;
  if (item.expira < Date.now()) { memoria.delete(chave); return null; }
  return item.valor;
}

function memoriaDefinir(chave, valor, ttl) {
  if (memoria.size >= MEMORIA_MAX) memoria.clear();
  memoria.set(chave, { valor, expira: Date.now() + ttl * 1000 });
}

function memoriaInvalidar(prefixo) {
  for (const k of [...memoria.keys()]) {
    if (k === prefixo || k.startsWith(prefixo)) memoria.delete(k);
  }
}

// ---- Redis (opcional) ----
let redis = null;
let redisPronto = false;

if (process.env.REDIS_URL) {
  try {
    const Redis = require('ioredis');
    redis = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null // sem reconexão infinita — fallback cobre
    });
    redis.on('ready', () => {
      redisPronto = true;
      logger.info(`Cache: Redis conectado (${process.env.REDIS_URL})`);
    });
    redis.on('error', () => {
      if (redisPronto) logger.warn('Cache: Redis perdeu conexão — usando memória');
      redisPronto = false;
    });
    redis.connect().catch(() => {
      logger.warn('Cache: Redis indisponível — usando memória');
      redisPronto = false;
    });
  } catch (_) {
    logger.warn('Cache: ioredis não instalado — usando memória');
    redis = null;
  }
}

async function obter(chave) {
  try {
    if (redis && redisPronto) {
      const v = await redis.get(chave);
      return v !== null ? JSON.parse(v) : null;
    }
  } catch (_) { redisPronto = false; }
  return memoriaObter(chave);
}

async function definir(chave, valor, ttl = TTL_PADRAO) {
  if (valor === undefined) return;
  try {
    if (redis && redisPronto) {
      await redis.set(chave, JSON.stringify(valor), 'EX', ttl);
      return;
    }
  } catch (_) { redisPronto = false; }
  memoriaDefinir(chave, valor, ttl);
}

/**
 * Remove todas as chaves cujo nome começa com o prefixo
 * (ex.: invalidar('convenios') limpa 'convenios', 'convenios:publicos', ...).
 */
async function invalidar(prefixo) {
  try {
    if (redis && redisPronto) {
      const chaves = await redis.keys(`${prefixo}*`);
      if (chaves.length) await redis.del(...chaves);
      return;
    }
  } catch (_) { redisPronto = false; }
  memoriaInvalidar(prefixo);
}

/**
 * Cache-aside: retorna o valor cacheado ou executa `buscar`, armazena e retorna.
 */
async function envolver(chave, ttl, buscar) {
  const emCache = await obter(chave);
  if (emCache !== null) return emCache;
  const valor = await buscar();
  await definir(chave, valor, ttl);
  return valor;
}

function status() {
  if (redis) return redisPronto ? 'redis' : 'memoria (redis offline)';
  return 'memoria';
}

module.exports = { obter, definir, invalidar, envolver, status };
