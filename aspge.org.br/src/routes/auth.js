const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, authorize } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

// Proteção contra brute-force no login
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Muitas tentativas de login. Tente novamente em alguns minutos.' });

// Validações
const loginValidation = [
  body('cpf')
    .notEmpty().withMessage('CPF é obrigatório')
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/).withMessage('CPF inválido'),
  body('senha')
    .notEmpty().withMessage('Senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
];

const alterarSenhaValidation = [
  body('senhaAtual').notEmpty().withMessage('Senha atual é obrigatória'),
  body('novaSenha')
    .notEmpty().withMessage('Nova senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Nova senha deve ter pelo menos 6 caracteres')
];

const definirSenhaValidation = [
  body('cpf').notEmpty().withMessage('CPF é obrigatório'),
  body('novaSenha')
    .notEmpty().withMessage('Nova senha é obrigatória')
    .isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
];

// Recuperação de senha — rate limit agressivo (verificação de identidade)
const recuperarLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: 'Muitas tentativas. Tente novamente em alguns minutos.' });

const recuperarSenhaValidation = [
  body('cpf').notEmpty().withMessage('CPF é obrigatório'),
  body('dataNascimento').notEmpty().withMessage('Data de nascimento é obrigatória'),
  body('email').isEmail().withMessage('E-mail inválido'),
  body('novaSenha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres')
];

// Rotas públicas
router.post('/login', loginLimiter, loginValidation, authController.login);
router.post('/recuperar-senha', recuperarLimiter, recuperarSenhaValidation, authController.recuperarSenha);

// Rotas protegidas
router.get('/perfil', authMiddleware, authController.obterPerfil);
router.post('/logout', authMiddleware, authController.logout);
router.post('/alterar-senha', authMiddleware, alterarSenhaValidation, authController.alterarSenha);
router.post('/definir-senha', authMiddleware, authorize('presidente'), definirSenhaValidation, authController.definirSenha);

module.exports = router;
