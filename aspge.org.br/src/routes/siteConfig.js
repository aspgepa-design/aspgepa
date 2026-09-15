const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/siteConfigController');
const { authMiddleware } = require('../middleware/auth');

// Rotas públicas
router.get('/', getConfig);

// Rotas protegidas (admin)
router.put('/', authMiddleware, updateConfig);

module.exports = router;
