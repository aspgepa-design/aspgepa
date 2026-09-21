const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const votacaoController = require('../controllers/votacaoController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Listar (público — usado na página inicial)
router.get('/', votacaoController.listar);

// Criar (diretoria)
router.post('/',
  authMiddleware,
  authorize('presidente', 'diretor'),
  [
    body('titulo').notEmpty().withMessage('Título é obrigatório')
  ],
  votacaoController.criar
);

// Atualizar (diretoria)
router.put('/:id', authMiddleware, authorize('presidente', 'diretor'), votacaoController.atualizar);

// Excluir (diretoria)
router.delete('/:id', authMiddleware, authorize('presidente', 'diretor'), votacaoController.excluir);

module.exports = router;
