const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');

const gestaoController = {
  async listar(req, res) {
    try {
      const gestoes = await prisma.gestao.findMany({
        orderBy: { createdAt: 'desc' },
        include: { membros: true }
      });
      res.json({ sucesso: true, dados: gestoes });
    } catch (error) {
      logger.error('Erro ao listar gestões:', error);
      res.status(500).json({ erro: 'Erro ao listar gestões' });
    }
  },

  async obterAtiva(req, res) {
    try {
      const gestao = await prisma.gestao.findFirst({
        where: { ativa: true },
        include: { membros: true }
      });
      // Anexar foto do associado (join por CPF) para exibir na home
      if (gestao && gestao.membros && gestao.membros.length) {
        const cpfs = gestao.membros.map(m => m.cpf).filter(Boolean);
        const associados = await prisma.associado.findMany({
          where: { cpf: { in: cpfs } },
          select: { cpf: true, fotoUrl: true }
        });
        const fotoPorCpf = {};
        associados.forEach(a => { fotoPorCpf[a.cpf] = a.fotoUrl; });
        gestao.membros.forEach(m => { m.fotoUrl = fotoPorCpf[m.cpf] || null; });
      }
      res.json({ sucesso: true, dados: gestao });
    } catch (error) {
      logger.error('Erro ao obter gestão ativa:', error);
      res.status(500).json({ erro: 'Erro ao obter gestão ativa' });
    }
  },

  async criar(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
      }
      const { nome, inicio, fim } = req.body;
      const gestao = await prisma.gestao.create({
        data: { nome, inicio: inicio ? new Date(inicio) : null, fim: fim ? new Date(fim) : null, ativa: false }
      });
      res.status(201).json({ sucesso: true, dados: gestao });
    } catch (error) {
      logger.error('Erro ao criar gestão:', error);
      res.status(500).json({ erro: 'Erro ao criar gestão' });
    }
  },

  async ativar(req, res) {
    try {
      const { id } = req.params;
      
      // Desativar todas
      await prisma.gestao.updateMany({ data: { ativa: false } });
      
      // Ativar a selecionada
      const gestao = await prisma.gestao.update({
        where: { id: parseInt(id) },
        data: { ativa: true },
        include: { membros: true }
      });

      // Atualizar perfis dos associados (case-sensitive no Postgres: cobrir ambas as grafias)
      await prisma.associado.updateMany({
        where: { perfil: { notIn: ['associado', 'Associado'] } },
        data: { perfil: 'Associado' }
      });

      for (const membro of gestao.membros) {
        const cpfLimpo = membro.cpf.replace(/\D/g, '');
        const perfilNovo = mapearCargoParaPerfil(membro.cargo);
        if (!perfilNovo) continue;
        
        const associado = await prisma.associado.findFirst({ where: { cpf: cpfLimpo } });
        if (associado) {
          await prisma.associado.update({
            where: { id: associado.id },
            data: { perfil: perfilNovo }
          });
        }
      }

      res.json({ sucesso: true, dados: gestao });
    } catch (error) {
      logger.error('Erro ao ativar gestão:', error);
      res.status(500).json({ erro: 'Erro ao ativar gestão' });
    }
  },

  async adicionarMembro(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
      }
      const { id } = req.params;
      const { cpf, nome, cargo } = req.body;

      const gestao = await prisma.gestao.findUnique({ where: { id: parseInt(id) } });
      if (!gestao) {
        return res.status(404).json({ erro: 'Gestão não encontrada' });
      }

      const membro = await prisma.diretoriaGestao.create({
        data: { gestaoId: parseInt(id), cpf, nome, cargo }
      });
      res.status(201).json({ sucesso: true, dados: membro });
    } catch (error) {
      logger.error('Erro ao adicionar membro:', error);
      res.status(500).json({ erro: 'Erro ao adicionar membro' });
    }
  },

  async removerMembro(req, res) {
    try {
      const { membroId } = req.params;
      await prisma.diretoriaGestao.delete({ where: { id: parseInt(membroId) } });
      res.json({ sucesso: true });
    } catch (error) {
      logger.error('Erro ao remover membro:', error);
      res.status(500).json({ erro: 'Erro ao remover membro' });
    }
  }
};

function mapearCargoParaPerfil(cargo) {
  const c = cargo.toLowerCase();
  if (c.includes('presidente') && !c.includes('vice') && !c.includes('assembl')) return 'presidente';
  if (c.includes('vice-presidente') && !c.includes('assembl')) return 'presidente';
  if (c.includes('diretor')) return 'diretor';
  if (c.includes('secretário') || c.includes('secretária') || c.includes('secretario')) return 'diretor';
  if (c.includes('tesoureiro')) return 'tesoureiro';
  if (c.includes('conselho fiscal') || c.includes('suplente')) return 'tesoureiro';
  if (c.includes('consultor')) return 'diretor';
  return null;
}

module.exports = gestaoController;
