const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const convenioController = require('../controllers/convenioController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Rota pública (home): somente convênios visíveis, campos seguros
router.get('/publicos', convenioController.listarPublicos);

// Todas as demais rotas são protegidas
router.use(authMiddleware);

// Listar (todos autenticados)
router.get('/', convenioController.listar);

// Criar (diretoria)
router.post('/', 
  authorize('presidente', 'diretor'),
  [
    body('nome').notEmpty().withMessage('Nome é obrigatório')
  ],
  convenioController.criar
);

// Atualizar (diretoria)
router.put('/:id', authorize('presidente', 'diretor'), convenioController.atualizar);

// Excluir (diretoria)
router.delete('/:id', authorize('presidente', 'diretor'), convenioController.excluir);

// Alternar visibilidade (diretoria)
router.patch('/:id/visibilidade', authorize('presidente', 'diretor'), convenioController.alternarVisibilidade);

module.exports = router;
