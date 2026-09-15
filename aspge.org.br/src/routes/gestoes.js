const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const gestaoController = require('../controllers/gestaoController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Rota pública para obter gestão ativa
router.get('/ativa', gestaoController.obterAtiva);

// Rotas protegidas
router.use(authMiddleware);

// Listar gestões (diretoria)
router.get('/', gestaoController.listar);

// Criar gestão (presidente)
router.post('/',
  authorize('presidente', 'diretor'),
  [
    body('nome').notEmpty().withMessage('Nome da gestão é obrigatório')
  ],
  gestaoController.criar
);

// Ativar gestão (presidente)
router.patch('/:id/ativar', authorize('presidente'), gestaoController.ativar);

// Adicionar membro à diretoria (presidente/diretor)
router.post('/:id/membros',
  authorize('presidente', 'diretor'),
  [
    body('cpf').notEmpty().withMessage('CPF é obrigatório'),
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('cargo').notEmpty().withMessage('Cargo é obrigatório')
  ],
  gestaoController.adicionarMembro
);

// Remover membro da diretoria (presidente/diretor)
router.delete('/:id/membros/:membroId', authorize('presidente', 'diretor'), gestaoController.removerMembro);

module.exports = router;
