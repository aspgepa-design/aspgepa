const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const associadoController = require('../controllers/associadoController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { uploadFoto, handleUploadError } = require('../middleware/upload');
const { rateLimit } = require('../middleware/rateLimit');

// Limites para rotas públicas (proteção contra brute-force/enumeração)
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });
const cadastroLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

// Permite acesso ao próprio cadastro ou à diretoria
const proprioOuDiretoria = (req, res, next) => {
  const isAdmin = ['presidente', 'diretor', 'tesoureiro'].includes(req.user.role);
  if (req.user.id === parseInt(req.params.id) || isAdmin) return next();
  return res.status(403).json({ erro: 'Acesso negado' });
};

// Buscar por CPF (público - usado na página de atualização cadastral)
router.get('/cpf/:cpf', publicLimiter, associadoController.buscarPorCpf);

// Inscrição pública (ficha de inscrição - sem autenticação)
router.post('/inscricao', publicLimiter, associadoController.inscricaoPublica);

// Atualizar cadastro próprio (público - página de atualização cadastral)
// Requer CPF e senha no body para autenticação
router.post('/:id/atualizar-cadastro', cadastroLimiter, associadoController.atualizarCadastro);

// Todas as rotas abaixo são protegidas
router.use(authMiddleware);

// Listar todos (apenas diretoria)
router.get('/', authorize('presidente', 'diretor', 'tesoureiro'), associadoController.listarTodos);

// Listar resumido (diretoria - para seleção de carteirinhas)
router.get('/resumido', authorize('presidente', 'diretor'), associadoController.listarResumido);

// Aprovação de inscrições públicas (diretoria)
router.get('/pendentes', authorize('presidente', 'diretor'), associadoController.listarPendentes);
router.post('/:id/aprovar', authorize('presidente', 'diretor'), associadoController.aprovar);
router.post('/:id/rejeitar', authorize('presidente', 'diretor'), associadoController.rejeitar);

// Buscar por ID (próprio cadastro ou diretoria)
router.get('/:id', proprioOuDiretoria, associadoController.buscarPorId);

// Criar novo (apenas diretoria)
router.post('/', 
  authorize('presidente', 'diretor'),
  [
    body('nomeCompleto').notEmpty().withMessage('Nome é obrigatório'),
    body('cpf').notEmpty().withMessage('CPF é obrigatório'),
    body('email').optional().isEmail().withMessage('Email inválido')
  ],
  associadoController.criar
);

// Atualizar
router.put('/:id', 
  [
    body('email').optional().isEmail().withMessage('Email inválido')
  ],
  associadoController.atualizar
);

// Excluir (apenas presidente)
router.delete('/:id', authorize('presidente'), associadoController.excluir);

// Upload de foto (próprio cadastro ou diretoria)
router.post('/:id/foto',
  proprioOuDiretoria,
  uploadFoto.single('foto'),
  handleUploadError,
  associadoController.uploadFoto
);

module.exports = router;
