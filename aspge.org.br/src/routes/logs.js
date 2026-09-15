const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Todas as rotas são protegidas e apenas diretoria pode acessar
router.use(authMiddleware);
router.use(authorize('presidente', 'diretor', 'tesoureiro'));

// Listar logs
router.get('/', logController.listar);

// Estatísticas
router.get('/estatisticas', logController.estatisticas);

module.exports = router;
