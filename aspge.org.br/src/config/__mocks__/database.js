/**
 * Mock do PrismaClient para testes (Jest).
 *
 * Ativado por arquivo de teste com:  jest.mock('../src/config/database');
 * O Jest substitui automaticamente o módulo real por este __mocks__/database.js.
 *
 * Qualquer chamada `prisma.<model>.<metodo>()` vira um jest.fn() que resolve
 * `undefined` por padrão. Configure por teste, ex.:
 *   prisma.convenio.findMany.mockResolvedValue([{ id: 1, nome: 'X' }]);
 *   prisma.associado.findUnique.mockResolvedValue(associadoFake);
 */

const METODOS = [
  'findUnique', 'findFirst', 'findMany', 'create', 'createMany',
  'update', 'updateMany', 'upsert', 'delete', 'deleteMany',
  'count', 'aggregate', 'groupBy'
];

function criarModelo() {
  const modelo = {};
  METODOS.forEach((m) => { modelo[m] = jest.fn(); });
  return modelo;
}

// Proxy: cria o modelo sob demanda e o memoiza, para que a configuração
// do mock (mockResolvedValue etc.) persista entre acessos.
const prisma = new Proxy({}, {
  get(alvo, prop) {
    // Métodos de conexão/transação do Prisma
    if (prop === '$connect' || prop === '$disconnect' || prop === '$on') {
      return jest.fn().mockResolvedValue(undefined);
    }
    if (prop === '$transaction') {
      return jest.fn().mockResolvedValue([]);
    }
    if (prop === '$queryRaw' || prop === '$executeRaw' || prop === '$queryRawUnsafe') {
      return jest.fn().mockResolvedValue([]);
    }
    if (typeof prop !== 'string') return undefined;
    if (!(prop in alvo)) {
      alvo[prop] = criarModelo();
    }
    return alvo[prop];
  }
});

module.exports = prisma;
