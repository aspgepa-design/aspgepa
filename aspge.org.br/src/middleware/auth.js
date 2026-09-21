const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const logger = require('../config/logger');

// Em produção, JWT_SECRET é obrigatório — falhar no boot em vez de usar fallback inseguro
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'fallback_secret_dev_only');

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não configurado. Defina a variável de ambiente JWT_SECRET.');
}

/**
 * Middleware de autenticação JWT
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar associado no banco
    const associado = await prisma.associado.findUnique({
      where: { id: decoded.id }
    });

    if (!associado) {
      return res.status(401).json({ erro: 'Usuário não encontrado' });
    }

    // Adicionar usuário à requisição
    req.user = {
      id: associado.id,
      cpf: associado.cpf,
      nome: associado.nomeCompleto,
      perfil: associado.perfil,
      role: obterRole(associado.perfil)
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ erro: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Token expirado' });
    }
    
    logger.error('Erro na autenticação:', error);
    return res.status(500).json({ erro: 'Erro interno na autenticação' });
  }
};

/**
 * Middleware de autorização por role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ erro: 'Não autenticado' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    
    next();
  };
};

/**
 * Obter role baseado no perfil
 */
function obterRole(perfil) {
  const perfilLower = (perfil || '').toLowerCase();
  
  if (perfilLower.includes('tesourei')) return 'tesoureiro';
  if (perfilLower.includes('presidente')) return 'presidente';
  if (perfilLower.includes('diretor') || perfilLower.includes('diretora')) return 'diretor';
  if (perfilLower.includes('secretári')) return 'diretor';
  
  return 'associado';
}

/**
 * Gerar token JWT
 */
function gerarToken(associado) {
  return jwt.sign(
    { 
      id: associado.id, 
      cpf: associado.cpf,
      perfil: associado.perfil 
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

/**
 * Middleware para log de ações
 */
const logMiddleware = (acao) => {
  return async (req, res, next) => {
    // Guardar resposta original
    const originalJson = res.json;
    
    res.json = function(data) {
      // Registrar log após resposta
      if (req.user) {
        prisma.log.create({
          data: {
            acao: acao,
            detalhes: JSON.stringify({
              body: req.body,
              params: req.params,
              query: req.query,
              resultado: data
            }),
            associadoId: req.user.id,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        }).catch(err => logger.error('Erro ao registrar log:', err));
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authMiddleware,
  authorize,
  gerarToken,
  obterRole,
  logMiddleware
};
