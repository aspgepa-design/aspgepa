module.exports = {
  testEnvironment: 'node',
  // Variáveis de ambiente carregadas antes de qualquer módulo (JWT_SECRET etc.)
  setupFiles: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'server.js',
    '!src/config/swagger.js'
  ],
  coverageDirectory: 'coverage',
  // Cada arquivo de teste roda isolado; o mock do Prisma é opt-in via jest.mock()
  clearMocks: true,
  verbose: true
};
