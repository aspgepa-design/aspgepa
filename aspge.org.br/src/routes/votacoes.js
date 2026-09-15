const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const votacaoController = require('../controllers/votacaoController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Todas as rotas são protegidas
router.use(authMiddleware);

// Listar (todos autenticados)
router.get('/', votacaoController.listar);

// Criar (diretoria)
router.post('/',
  authorize('presidente', 'diretor'),
  [
    body('titulo').notEmpty().withMessage('Título é obrigatório')
  ],
  votacaoController.criar
);

// Atualizar (diretoria)
router.put('/:id', authorize('presidente', 'diretor'), votacaoController.atualizar);

// Excluir (diretoria)
router.delete('/:id', authorize('presidente', 'diretor'), votacaoController.excluir);

module.exports = router;
