const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const financeiroController = require('../controllers/financeiroController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Todas as rotas são protegidas
router.use(authMiddleware);

// Listar lançamentos (todos autenticados - para transparência)
router.get('/', financeiroController.listar);

// Criar lançamento (apenas tesoureiro/presidente)
router.post('/', 
  authorize('presidente', 'tesoureiro'),
  [
    body('data').notEmpty().withMessage('Data é obrigatória'),
    body('descricao').notEmpty().withMessage('Descrição é obrigatória'),
    body('valor').notEmpty().isNumeric().withMessage('Valor deve ser numérico'),
    body('tipo').notEmpty().withMessage('Tipo é obrigatório')
  ],
  financeiroController.criar
);

// Excluir lançamento (apenas tesoureiro/presidente)
router.delete('/:id', authorize('presidente', 'tesoureiro'), financeiroController.excluir);

module.exports = router;
