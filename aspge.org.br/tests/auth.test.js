jest.mock('../src/config/database');

const request = require('supertest');
const bcrypt = require('bcrypt');
const prisma = require('../src/config/database');
const app = require('../server');
const { tokenPara, usuario } = require('./helpers/auth');

describe('Auth — login e proteção de rotas', () => {
  describe('POST /api/auth/login', () => {
    test('sem CPF e senha retorna 400', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('erro');
    });

    test('CPF mal formatado retorna 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ cpf: '123', senha: 'senha123' });
      expect(res.status).toBe(400);
    });

    test('senha curta retorna 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ cpf: '12345678901', senha: '123' });
      expect(res.status).toBe(400);
    });

    test('CPF não cadastrado retorna 401 (mensagem genérica)', async () => {
      prisma.associado.findFirst.mockResolvedValue(null);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ cpf: '12345678901', senha: 'senha123' });
      expect(res.status).toBe(401);
      expect(res.body.erro).toMatch(/inválidos/i);
    });

    test('senha incorreta retorna 401', async () => {
      const hash = bcrypt.hashSync('senhaCorreta', 10);
      prisma.associado.findFirst.mockResolvedValue(usuario({ senha: hash }));
      const res = await request(app)
        .post('/api/auth/login')
        .send({ cpf: '12345678901', senha: 'senhaErrada' });
      expect(res.status).toBe(401);
    });

    test('credenciais válidas retornam token e dados', async () => {
      const hash = bcrypt.hashSync('senha123', 10);
      prisma.associado.findFirst.mockResolvedValue(usuario({ senha: hash }));
      prisma.log.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/login')
        .send({ cpf: '12345678901', senha: 'senha123' });

      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.dados.cpf).toBe('12345678901');
      expect(res.body.dados.role).toBe('associado');
    });
  });

  describe('Proteção de rotas (authMiddleware)', () => {
    test('GET /api/auth/perfil sem token retorna 401', async () => {
      const res = await request(app).get('/api/auth/perfil');
      expect(res.status).toBe(401);
      expect(res.body.erro).toMatch(/token/i);
    });

    test('GET /api/auth/perfil com token inválido retorna 401', async () => {
      const res = await request(app)
        .get('/api/auth/perfil')
        .set('Authorization', 'Bearer token.invalido.aqui');
      expect(res.status).toBe(401);
    });

    test('GET /api/auth/perfil com token válido retorna o perfil', async () => {
      const user = usuario();
      prisma.associado.findUnique.mockResolvedValue(user);
      prisma.gestao.findFirst.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/auth/perfil')
        .set('Authorization', `Bearer ${tokenPara(user)}`);

      expect(res.status).toBe(200);
    });
  });
});
