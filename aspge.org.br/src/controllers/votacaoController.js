const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');

const votacaoController = {
  async listar(req, res) {
    try {
      const votacoes = await prisma.votacao.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          opcoes: { include: { _count: { select: { votos: true } } } }
        }
      });

      // Se autenticado, marca em quais o usuário já votou
      let votosDoUsuario = [];
      if (req.user?.id) {
        votosDoUsuario = await prisma.voto.findMany({
          where: { associadoId: req.user.id },
          select: { votacaoId: true, opcaoId: true }
        });
      }
      const mapaVotos = Object.fromEntries(votosDoUsuario.map(v => [v.votacaoId, v.opcaoId]));

      const dados = votacoes.map(v => ({
        ...v,
        totalVotos: v.opcoes.reduce((s, o) => s + o._count.votos, 0),
        jaVotou: mapaVotos[v.id] !== undefined,
        opcaoVotada: mapaVotos[v.id] || null
      }));

      res.json({ sucesso: true, dados });
    } catch (error) {
      logger.error('Erro ao listar votações:', error);
      res.status(500).json({ erro: 'Erro ao listar votações' });
    }
  },

  async criar(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
      }
      const { titulo, status, dataFim, opcoes } = req.body;

      const listaOpcoes = Array.isArray(opcoes)
        ? opcoes.map(o => String(o).trim()).filter(Boolean)
        : [];
      if (listaOpcoes.length < 2) {
        return res.status(400).json({ erro: 'Informe ao menos 2 opções de voto' });
      }

      const votacao = await prisma.votacao.create({
        data: {
          titulo,
          status: status || 'Aberta',
          dataFim,
          opcoes: { create: listaOpcoes.map(texto => ({ texto })) }
        },
        include: { opcoes: true }
      });
      res.status(201).json({ sucesso: true, dados: votacao });
    } catch (error) {
      logger.error('Erro ao criar votação:', error);
      res.status(500).json({ erro: 'Erro ao criar votação' });
    }
  },

  async atualizar(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
      }
      const { id } = req.params;
      const { titulo, status, dataFim } = req.body;

      const existente = await prisma.votacao.findUnique({ where: { id: parseInt(id) } });
      if (!existente) {
        return res.status(404).json({ erro: 'Votação não encontrada' });
      }

      const dados = {};
      if (titulo !== undefined) dados.titulo = titulo;
      if (status !== undefined) dados.status = status;
      if (dataFim !== undefined) dados.dataFim = dataFim;

      const votacao = await prisma.votacao.update({
        where: { id: parseInt(id) },
        data: dados
      });
      res.json({ sucesso: true, dados: votacao });
    } catch (error) {
      logger.error('Erro ao atualizar votação:', error);
      res.status(500).json({ erro: 'Erro ao atualizar votação' });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const existente = await prisma.votacao.findUnique({ where: { id: parseInt(id) } });
      if (!existente) {
        return res.status(404).json({ erro: 'Votação não encontrada' });
      }
      await prisma.votacao.delete({ where: { id: parseInt(id) } });
      res.json({ sucesso: true });
    } catch (error) {
      logger.error('Erro ao excluir votação:', error);
      res.status(500).json({ erro: 'Erro ao excluir votação' });
    }
  },

  // Registrar voto do associado (1 voto por votação, só se Aberta)
  async votar(req, res) {
    try {
      const votacaoId = parseInt(req.params.id);
      const opcaoId = parseInt(req.body.opcaoId);
      const associadoId = req.user.id;

      if (!opcaoId) {
        return res.status(400).json({ erro: 'opção é obrigatória' });
      }

      const votacao = await prisma.votacao.findUnique({ where: { id: votacaoId } });
      if (!votacao) {
        return res.status(404).json({ erro: 'Votação não encontrada' });
      }
      if (votacao.status !== 'Aberta') {
        return res.status(400).json({ erro: 'Votação encerrada' });
      }

      const opcao = await prisma.opcaoVoto.findFirst({
        where: { id: opcaoId, votacaoId }
      });
      if (!opcao) {
        return res.status(400).json({ erro: 'Opção inválida para esta votação' });
      }

      const jaVotou = await prisma.voto.findUnique({
        where: { votacaoId_associadoId: { votacaoId, associadoId } }
      });
      if (jaVotou) {
        return res.status(409).json({ erro: 'Você já votou nesta votação' });
      }

      await prisma.$transaction([
        prisma.voto.create({ data: { votacaoId, opcaoId, associadoId } }),
        prisma.votacao.update({ where: { id: votacaoId }, data: { votos: { increment: 1 } } })
      ]);

      await prisma.log.create({
        data: {
          acao: 'Votou',
          detalhes: `Votação: ${votacao.titulo}`,
          associadoId,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      }).catch(() => {});

      res.json({ sucesso: true, mensagem: 'Voto registrado' });
    } catch (error) {
      logger.error('Erro ao votar:', error);
      res.status(500).json({ erro: 'Erro ao registrar voto' });
    }
  },

  // Resultado agregado (diretoria ou após encerrar)
  async resultado(req, res) {
    try {
      const votacaoId = parseInt(req.params.id);
      const votacao = await prisma.votacao.findUnique({
        where: { id: votacaoId },
        include: { opcoes: { include: { _count: { select: { votos: true } } } } }
      });
      if (!votacao) {
        return res.status(404).json({ erro: 'Votação não encontrada' });
      }

      const total = votacao.opcoes.reduce((s, o) => s + o._count.votos, 0);
      const resultado = votacao.opcoes.map(o => ({
        opcaoId: o.id,
        texto: o.texto,
        votos: o._count.votos,
        percentual: total ? Math.round((o._count.votos / total) * 100) : 0
      }));

      res.json({ sucesso: true, dados: { votacao: votacao.titulo, status: votacao.status, total, resultado } });
    } catch (error) {
      logger.error('Erro ao obter resultado:', error);
      res.status(500).json({ erro: 'Erro ao obter resultado' });
    }
  }
};

module.exports = votacaoController;
