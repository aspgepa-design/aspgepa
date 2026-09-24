const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const dependenteController = require('../controllers/dependenteController');
const { authMiddleware } = require('../middleware/auth');

// Todas as rotas exigem autenticação (escopo próprio ou diretoria no controller)
router.use(authMiddleware);

router.get('/', dependenteController.listar);
router.post('/',
  [body('nome').notEmpty().withMessage('Nome é obrigatório')],
  dependenteController.criar
);
router.put('/:id', dependenteController.atualizar);
router.delete('/:id', dependenteController.excluir);

module.exports = router;
