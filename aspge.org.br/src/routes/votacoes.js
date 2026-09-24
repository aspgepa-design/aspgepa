const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const votacaoController = require('../controllers/votacaoController');
const { authMiddleware, authorize, optionalAuth } = require('../middleware/auth');

// Listar (público; se autenticado, marca jaVotou/opcaoVotada)
router.get('/', optionalAuth, votacaoController.listar);

// Resultado agregado (autenticado)
router.get('/:id/resultado', authMiddleware, votacaoController.resultado);

// Votar (associado autenticado)
router.post('/:id/votar', authMiddleware, votacaoController.votar);

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
