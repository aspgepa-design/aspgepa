const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Todas as rotas são protegidas
router.use(authMiddleware);

// Listar (todos autenticados)
router.get('/', eventoController.listar);

// Criar (diretoria)
router.post('/', 
  authorize('presidente', 'diretor'),
  [
    body('data').notEmpty().withMessage('Data é obrigatória'),
    body('titulo').notEmpty().withMessage('Título é obrigatório')
  ],
  eventoController.criar
);

// Atualizar (diretoria)
router.put('/:id', authorize('presidente', 'diretor'), eventoController.atualizar);

// Excluir (diretoria)
router.delete('/:id', authorize('presidente', 'diretor'), eventoController.excluir);

// Alternar visibilidade (diretoria)
router.patch('/:id/visibilidade', authorize('presidente', 'diretor'), eventoController.alternarVisibilidade);

module.exports = router;
