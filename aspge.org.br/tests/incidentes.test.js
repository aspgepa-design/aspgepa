/**
 * Testes de integração — /api/incidentes (LGPD art. 48)
 * Prisma mockado via src/config/__mocks__/database.js
 */
jest.mock('../src/config/database');
jest.mock('../src/services/emailService', () => ({
  enviarEmail: jest.fn().mockResolvedValue({ enviado: true })
}));

const request = require('supertest');
const app = require('../server');
const prisma = require('../src/config/database');
const emailService = require('../src/services/emailService');
const { tokenPara, presidente, diretor, usuario } = require('./helpers/auth');

const incidenteFake = {
  id: 1,
  titulo: 'Vazamento',
  descricao: 'Acesso indevido',
  dataOcorrencia: new Date('2026-09-20'),
  dadosAfetados: 'nome, cpf',
  comunicadoAnpdEm: null,
  notificadoTitularesEm: null,
  emailsEnviados: 0,
  emailsFalhados: 0
};

describe('GET /api/incidentes', () => {
  it('bloqueia sem token', async () => {
    const res = await request(app).get('/api/incidentes');
    expect(res.status).toBe(401);
  });

  it('bloqueia associado comum (403)', async () => {
    prisma.associado.findUnique.mockResolvedValue(usuario());
    const res = await request(app)
      .get('/api/incidentes')
      .set('Authorization', `Bearer ${tokenPara(usuario())}`);
    expect(res.status).toBe(403);
  });

  it('lista incidentes para diretor', async () => {
    prisma.associado.findUnique.mockResolvedValue(diretor());
    prisma.incidenteLgpd.findMany.mockResolvedValue([incidenteFake]);
    const res = await request(app)
      .get('/api/incidentes')
      .set('Authorization', `Bearer ${tokenPara(diretor())}`);
    expect(res.status).toBe(200);
    expect(res.body.dados).toHaveLength(1);
  });
});

describe('POST /api/incidentes', () => {
  it('rejeita sem campos obrigatórios', async () => {
    prisma.associado.findUnique.mockResolvedValue(presidente());
    const res = await request(app)
      .post('/api/incidentes')
      .set('Authorization', `Bearer ${tokenPara(presidente())}`)
      .set('Origin', 'http://localhost:3000')
      .send({});
    expect(res.status).toBe(400);
  });

  it('cria incidente com payload válido', async () => {
    prisma.associado.findUnique.mockResolvedValue(presidente());
    prisma.incidenteLgpd.create.mockResolvedValue(incidenteFake);
    prisma.log.create.mockResolvedValue({});
    const res = await request(app)
      .post('/api/incidentes')
      .set('Authorization', `Bearer ${tokenPara(presidente())}`)
      .set('Origin', 'http://localhost:3000')
      .send({ titulo: 'Vazamento', descricao: 'Acesso indevido', dataOcorrencia: '2026-09-20' });
    expect(res.status).toBe(201);
    expect(res.body.sucesso).toBe(true);
  });
});

describe('POST /api/incidentes/:id/comunicado-anpd', () => {
  it('gera texto e marca comunicadoAnpdEm', async () => {
    prisma.associado.findUnique.mockResolvedValue(diretor());
    prisma.incidenteLgpd.findUnique.mockResolvedValue(incidenteFake);
    prisma.incidenteLgpd.update.mockResolvedValue({ ...incidenteFake, comunicadoAnpdEm: new Date() });
    const res = await request(app)
      .post('/api/incidentes/1/comunicado-anpd')
      .set('Authorization', `Bearer ${tokenPara(diretor())}`)
      .set('Origin', 'http://localhost:3000');
    expect(res.status).toBe(200);
    expect(res.body.dados.texto).toContain('ANPD');
    expect(res.body.dados.texto).toContain('Vazamento');
    expect(prisma.incidenteLgpd.update).toHaveBeenCalled();
  });
});

describe('POST /api/incidentes/:id/notificar-titulares', () => {
  it('envia email para titulares e contabiliza', async () => {
    prisma.associado.findUnique.mockResolvedValue(presidente());
    prisma.incidenteLgpd.findUnique.mockResolvedValue(incidenteFake);
    prisma.associado.findMany.mockResolvedValue([
      { id: 1, nomeCompleto: 'A', email: 'a@x.com' },
      { id: 2, nomeCompleto: 'B', email: 'b@x.com' }
    ]);
    prisma.incidenteLgpd.update.mockResolvedValue(incidenteFake);
    const res = await request(app)
      .post('/api/incidentes/1/notificar-titulares')
      .set('Authorization', `Bearer ${tokenPara(presidente())}`)
      .set('Origin', 'http://localhost:3000')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.dados.enviados).toBe(2);
    expect(emailService.enviarEmail).toHaveBeenCalledTimes(2);
  });
});
