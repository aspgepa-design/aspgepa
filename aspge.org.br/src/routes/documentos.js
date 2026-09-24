const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');
const { authMiddleware } = require('../middleware/auth');
const { uploadDocumento, handleUploadError } = require('../middleware/upload');

// Todas as rotas exigem autenticação (escopo próprio ou diretoria no controller)
router.use(authMiddleware);

router.get('/', documentoController.listar);
router.post('/', uploadDocumento.single('arquivo'), handleUploadError, documentoController.upload);
router.get('/:id/download', documentoController.download);
router.delete('/:id', documentoController.excluir);

module.exports = router;
