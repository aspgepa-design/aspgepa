const express = require('express');
const router = express.Router();
const { listarNoticias, listarTodasNoticias, buscarNoticia, criarNoticia, atualizarNoticia, excluirNoticia } = require('../controllers/noticiasController');
const { authMiddleware } = require('../middleware/auth');

// Rotas públicas
router.get('/', listarNoticias);
router.get('/:id', buscarNoticia);

// Rotas protegidas (admin)
router.get('/admin/todas', authMiddleware, listarTodasNoticias);
router.post('/', authMiddleware, criarNoticia);
router.put('/:id', authMiddleware, atualizarNoticia);
router.delete('/:id', authMiddleware, excluirNoticia);

module.exports = router;
