const express = require('express');
const router = express.Router();
const { listarNoticias, listarTodasNoticias, buscarNoticia, criarNoticia, atualizarNoticia, excluirNoticia } = require('../controllers/noticiasController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Rotas públicas
router.get('/', listarNoticias);
router.get('/:id', buscarNoticia);

// Rotas protegidas (admin)
router.get('/admin/todas', authMiddleware, authorize('presidente', 'diretor'), listarTodasNoticias);
router.post('/', authMiddleware, authorize('presidente', 'diretor'), criarNoticia);
router.put('/:id', authMiddleware, authorize('presidente', 'diretor'), atualizarNoticia);
router.delete('/:id', authMiddleware, authorize('presidente', 'diretor'), excluirNoticia);

module.exports = router;
