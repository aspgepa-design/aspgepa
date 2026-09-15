const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const associadoController = require('../controllers/associadoController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { uploadFoto, handleUploadError } = require('../middleware/upload');

// Todas as rotas são protegidas
router.use(authMiddleware);

// Listar todos (apenas diretoria)
router.get('/', authorize('presidente', 'diretor', 'tesoureiro'), associadoController.listarTodos);

// Listar resumido (todos autenticados - para seleção de carteirinhas)
router.get('/resumido', associadoController.listarResumido);

// Buscar por CPF
router.get('/cpf/:cpf', associadoController.buscarPorCpf);

// Buscar por ID
router.get('/:id', associadoController.buscarPorId);

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

// Upload de foto
router.post('/:id/foto', 
  uploadFoto.single('foto'),
  handleUploadError,
  associadoController.uploadFoto
);

module.exports = router;
