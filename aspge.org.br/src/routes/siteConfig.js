const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/siteConfigController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Rotas públicas
router.get('/', getConfig);

// Rotas protegidas (admin)
router.put('/', authMiddleware, authorize('presidente', 'diretor'), updateConfig);

module.exports = router;
