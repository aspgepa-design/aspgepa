/**
 * Mock do bcrypt para testes (Jest).
 *
 * O bcrypt real é um módulo nativo (bcrypt_lib.node) que pode não estar
 * compilado para o ambiente de teste. Este mock é aplicado automaticamente
 * por estar em __mocks__/ adjacente a node_modules.
 *
 * Preserva a semântica: hash(data) -> 'mock$<data>' e compare(data, hash)
 * valida se o hash corresponde ao dado. Assim os testes exercitam a lógica
 * real de verificação de senha sem depender de código nativo.
 */

const PREFIX = 'mock$';

const bcrypt = {
  genSalt: jest.fn().mockResolvedValue('salt'),
  genSaltSync: jest.fn().mockReturnValue('salt'),
  hash: jest.fn((data) => Promise.resolve(PREFIX + data)),
  hashSync: jest.fn((data) => PREFIX + data),
  compare: jest.fn((data, hash) => Promise.resolve(hash === PREFIX + data)),
  compareSync: jest.fn((data, hash) => hash === PREFIX + data),
  getRounds: jest.fn().mockReturnValue(10)
};

module.exports = bcrypt;
