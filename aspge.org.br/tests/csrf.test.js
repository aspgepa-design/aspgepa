const request = require('supertest');

jest.mock('../src/config/database');

const app = require('../server');

describe('Proteção CSRF (Origin/Referer)', () => {
  test('POST com origem externa é bloqueado com 403', async () => {
    const res = await request(app)
      .post('/api/associados/inscricao')
      .set('Origin', 'https://site-malicioso.com')
      .send({ nomeCompleto: 'Teste', cpf: '12345678901' });
    expect(res.status).toBe(403);
    expect(res.body.erro).toBe('Origem não autorizada');
  });

  test('POST com Referer externo (sem Origin) também é bloqueado', async () => {
    const res = await request(app)
      .post('/api/associados/inscricao')
      .set('Referer', 'https://site-malicioso.com/form.html')
      .send({});
    expect(res.status).toBe(403);
  });

  test('POST com origem permitida passa pelo CSRF (chega na validação)', async () => {
    const res = await request(app)
      .post('/api/associados/inscricao')
      .set('Origin', 'http://localhost:3000')
      .send({});
    // 400 = validação do controller; 403 significaria bloqueio do CSRF
    expect(res.status).toBe(400);
  });

  test('POST sem Origin/Referer (curl, Postman, mobile) não é bloqueado', async () => {
    const res = await request(app)
      .post('/api/associados/inscricao')
      .send({});
    expect(res.status).not.toBe(403);
    expect(res.status).toBe(400);
  });

  test('GET não é afetado mesmo com origem externa', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'https://site-malicioso.com');
    expect(res.status).toBe(200);
  });
});
