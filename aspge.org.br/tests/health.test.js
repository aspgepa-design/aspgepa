jest.mock('../src/config/database');

const request = require('supertest');
const app = require('../server');

describe('Infraestrutura & Health', () => {
  test('GET /health retorna status OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('version');
  });

  test('GET /api retorna informações da API', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('ASPGE-PA API');
    expect(res.body.endpoints).toHaveProperty('auth');
    expect(res.body.endpoints).toHaveProperty('convenios');
  });

  test('rota inexistente retorna 404', async () => {
    const res = await request(app).get('/rota-que-nao-existe');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('erro');
  });

  test('headers de segurança do helmet estão presentes', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers).toHaveProperty('x-frame-options');
  });
});
