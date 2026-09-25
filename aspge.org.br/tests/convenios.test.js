jest.mock('../src/config/database');

const request = require('supertest');
const prisma = require('../src/config/database');
const app = require('../server');
const { tokenPara, usuario, diretor } = require('./helpers/auth');

const convenioVisivel = {
  id: 1,
  nome: 'Restaurante Govinda',
  descricao: 'Desconto em refeições',
  categoria: 'Alimentação',
  link: '#',
  visivel: true,
  numeroConvenio: '001/2024',
  desconto: '10%',
  endereco: 'Rua Exemplo, 123',
  cnpj: '00.000.000/0001-00',
  telefone: '(91) 99999-9999',
  condicoes: 'Apresentar carteirinha',
  comoUsar: 'Informar ser associado',
  vigencia: '31/12/2026'
};

describe('Convênios', () => {
  describe('Endpoints públicos', () => {
    test('GET /api/convenios/publicos lista convênios visíveis', async () => {
      prisma.convenio.findMany.mockResolvedValue([convenioVisivel]);
      const res = await request(app).get('/api/convenios/publicos');
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(Array.isArray(res.body.dados)).toBe(true);
      expect(res.body.dados[0].nome).toBe('Restaurante Govinda');
    });

    test('GET /api/convenios/publicos/:id retorna detalhe do convênio', async () => {
      prisma.convenio.findFirst.mockResolvedValue(convenioVisivel);
      const res = await request(app).get('/api/convenios/publicos/1');
      expect(res.status).toBe(200);
      expect(res.body.sucesso).toBe(true);
      expect(res.body.dados.desconto).toBe('10%');
      expect(res.body.dados.condicoes).toBe('Apresentar carteirinha');
    });

    test('GET /api/convenios/publicos/:id inexistente retorna 404', async () => {
      prisma.convenio.findFirst.mockResolvedValue(null);
      const res = await request(app).get('/api/convenios/publicos/999');
      expect(res.status).toBe(404);
    });
  });

  describe('Rotas protegidas (RBAC)', () => {
    test('GET /api/convenios sem token retorna 401', async () => {
      const res = await request(app).get('/api/convenios');
      expect(res.status).toBe(401);
    });

    test('GET /api/convenios autenticado lista convênios', async () => {
      const user = usuario();
      prisma.associado.findUnique.mockResolvedValue(user);
      prisma.convenio.findMany.mockResolvedValue([convenioVisivel]);

      const res = await request(app)
        .get('/api/convenios')
        .set('Authorization', `Bearer ${tokenPara(user)}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('POST /api/convenios como associado retorna 403', async () => {
      const user = usuario(); // perfil Associado → role 'associado'
      prisma.associado.findUnique.mockResolvedValue(user);

      const res = await request(app)
        .post('/api/convenios')
        .set('Authorization', `Bearer ${tokenPara(user)}`)
        .send({ nome: 'Novo Convênio' });

      expect(res.status).toBe(403);
    });

    test('POST /api/convenios como diretor cria convênio', async () => {
      const dir = diretor();
      prisma.associado.findUnique.mockResolvedValue(dir);
      prisma.convenio.create.mockResolvedValue({ id: 5, ...convenioVisivel, nome: 'Novo' });
      prisma.log.create.mockResolvedValue({});

      const res = await request(app)
        .post('/api/convenios')
        .set('Authorization', `Bearer ${tokenPara(dir)}`)
        .send({ nome: 'Novo Convênio', categoria: 'Saúde' });

      expect(res.status).toBe(201);
      expect(res.body.sucesso).toBe(true);
    });

    test('POST /api/convenios sem nome retorna 400', async () => {
      const dir = diretor();
      prisma.associado.findUnique.mockResolvedValue(dir);

      const res = await request(app)
        .post('/api/convenios')
        .set('Authorization', `Bearer ${tokenPara(dir)}`)
        .send({ categoria: 'Saúde' });

      expect(res.status).toBe(400);
    });
  });
});
