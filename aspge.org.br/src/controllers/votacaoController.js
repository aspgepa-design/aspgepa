const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');

const votacaoController = {
  async listar(req, res) {
    try {
      const votacoes = await prisma.votacao.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json({ sucesso: true, dados: votacoes });
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
      const { titulo, status, dataFim, votos } = req.body;
      const votacao = await prisma.votacao.create({
        data: { titulo, status: status || 'Aberta', dataFim, votos: votos || 0 }
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
      const { titulo, status, dataFim, votos } = req.body;

      const existente = await prisma.votacao.findUnique({ where: { id: parseInt(id) } });
      if (!existente) {
        return res.status(404).json({ erro: 'Votação não encontrada' });
      }

      const votacao = await prisma.votacao.update({
        where: { id: parseInt(id) },
        data: { titulo, status, dataFim, votos }
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
  }
};

module.exports = votacaoController;
