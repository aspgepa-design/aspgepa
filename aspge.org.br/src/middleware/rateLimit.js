const logger = require('../config/logger');

/**
 * Rate limiter simples em memória (por IP + rota).
 * Adequado para instância única (PM2 single process).
 * Para múltiplas instâncias, migrar para store Redis.
 */
function rateLimit({ windowMs = 15 * 60 * 1000, max = 100, message = 'Muitas requisições. Tente novamente mais tarde.' } = {}) {
  const hits = new Map();

  // Limpeza periódica para o Map não crescer indefinidamente
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, windowMs);
  cleanup.unref();

  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count++;

    if (entry.count > max) {
      logger.warn(`Rate limit excedido: ${key}`);
      return res.status(429).json({ erro: message });
    }

    next();
  };
}

module.exports = { rateLimit };
