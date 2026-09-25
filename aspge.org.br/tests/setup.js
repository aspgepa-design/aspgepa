// Variáveis de ambiente para o ambiente de teste.
// Executado antes de qualquer módulo ser carregado (jest.config -> setupFiles).
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'jest_test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.PORT = '0'; // evita conflito de porta caso algo tente ouvir
