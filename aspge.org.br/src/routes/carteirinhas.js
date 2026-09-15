const express = require('express');
const router = express.Router();
const carteirinhaController = require('../controllers/carteirinhaController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { uploadTemplate, handleUploadError } = require('../middleware/upload');

// Todas as rotas são protegidas
router.use(authMiddleware);

// Carregar config (todos autenticados)
router.get('/config', carteirinhaController.carregarConfig);

// Salvar config (diretoria)
router.put('/config', authorize('presidente', 'diretor'), carteirinhaController.salvarConfig);

// Salvar template (diretoria)
router.post('/template',
  authorize('presidente', 'diretor'),
  uploadTemplate.single('template'),
  handleUploadError,
  carteirinhaController.salvarTemplate
);

// Excluir template (diretoria)
router.delete('/template/:lado',
  authorize('presidente', 'diretor'),
  carteirinhaController.excluirTemplate
);

// Preview de carteirinha (todos autenticados)
router.get('/preview/:cpf', carteirinhaController.obterPreview);

// Obter dados para exportação (diretor sociocultural)
router.post('/export', authorize('presidente', 'diretor'), carteirinhaController.obterDadosExport);

// Gerar PDF (todos autenticados - TODO: implementar)
router.post('/pdf', carteirinhaController.gerarPdf);

module.exports = router;
