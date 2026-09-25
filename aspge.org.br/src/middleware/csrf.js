/**
 * Proteção CSRF para a API.
 *
 * A autenticação usa JWT no header Authorization (não há cookies de sessão),
 * então o vetor clássico de CSRF não se aplica. Ainda assim, este middleware
 * bloqueia requisições de escrita vindas de origens externas — ex.: um
 * formulário hospedado em outro domínio apontando para a nossa API — usando
 * os headers Origin/Referer que browsers sempre enviam em posts cross-site.
 *
 * Requisições sem Origin/Referer (curl, Postman, apps mobile, server-to-server)
 * passam: não são vetor de CSRF pois não carregam credenciais do browser.
 */
const logger = require('../config/logger');

const METODOS_ESCRITA = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const ORIGENS_PADRAO = [
  'aspgepa.org.br',
  'www.aspgepa.org.br',
  'aspge.org.br',
  'www.aspge.org.br',
  'localhost:3000',
  '127.0.0.1:3000'
];

function hostDe(url) {
  try { return new URL(url).host; } catch (_) { return null; }
}

/**
 * Monta o conjunto de origens permitidas:
 * APP_URL + ALLOWED_ORIGINS (csv, no .env) + domínios de produção + localhost.
 */
function origensPermitidas() {
  const origens = new Set(ORIGENS_PADRAO);
  [process.env.APP_URL, ...(process.env.ALLOWED_ORIGINS || '').split(',')]
    .map(o => (o || '').trim())
    .filter(Boolean)
    .forEach(o => {
      const host = hostDe(o);
      origens.add(host || o);
    });
  return origens;
}

function csrfProtection(req, res, next) {
  if (!METODOS_ESCRITA.has(req.method)) return next();

  const origem = req.headers.origin || req.headers.referer;
  if (!origem) return next(); // cliente não-browser — fora do vetor CSRF

  const host = hostDe(origem);
  if (host && origensPermitidas().has(host)) return next();

  logger.warn(`CSRF bloqueado: ${req.method} ${req.originalUrl} origem=${origem} ip=${req.ip}`);
  return res.status(403).json({ erro: 'Origem não autorizada' });
}

module.exports = { csrfProtection, origensPermitidas };
