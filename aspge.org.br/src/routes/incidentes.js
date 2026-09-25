const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const incidenteController = require('../controllers/incidenteController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Todas as rotas exigem autenticação de diretoria
router.use(authMiddleware, authorize('presidente', 'diretor'));

const criarValidation = [
  body('titulo').notEmpty().withMessage('Título é obrigatório'),
  body('descricao').notEmpty().withMessage('Descrição é obrigatória'),
  body('dataOcorrencia').isISO8601().withMessage('Data de ocorrência inválida'),
  body('dadosAfetados').optional().isString(),
  body('titularesAfetados').optional().isString(),
  body('medidasTomadas').optional().isString()
];

router.get('/', incidenteController.listar);
router.post('/', criarValidation, incidenteController.criar);
router.post('/:id/comunicado-anpd', incidenteController.comunicadoAnpd);
router.post('/:id/notificar-titulares', incidenteController.notificarTitulares);

module.exports = router;
