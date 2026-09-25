const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'jest_test_secret_key';

/**
 * Gera um token JWT válido para o associado informado,
 * usando o mesmo segredo que o authMiddleware valida.
 */
function tokenPara(associado) {
  return jwt.sign(
    { id: associado.id, cpf: associado.cpf, perfil: associado.perfil },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/** Fábricas de usuários fake por perfil (para testes de RBAC). */
function usuario(overrides = {}) {
  return {
    id: 1,
    cpf: '12345678901',
    nomeCompleto: 'Associado Teste',
    perfil: 'Associado',
    senha: 'hash',
    cadastroCompleto: true,
    senhaAlterada: true,
    ...overrides
  };
}

function diretor(overrides = {}) {
  return usuario({ id: 2, perfil: 'Diretor', nomeCompleto: 'Diretor Teste', ...overrides });
}

function presidente(overrides = {}) {
  return usuario({ id: 3, perfil: 'Presidente', nomeCompleto: 'Presidente Teste', ...overrides });
}

function tesoureiro(overrides = {}) {
  return usuario({ id: 4, perfil: 'Tesoureiro', nomeCompleto: 'Tesoureiro Teste', ...overrides });
}

module.exports = { tokenPara, usuario, diretor, presidente, tesoureiro };
