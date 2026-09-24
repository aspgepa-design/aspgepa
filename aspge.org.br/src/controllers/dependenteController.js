const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');

const isDiretoria = (req) => ['presidente', 'diretor', 'tesoureiro'].includes(req.user?.role);

// Resolve o associadoId alvo: próprio usuário, ou outro se diretoria
function alvoAssociado(req) {
  const alvo = parseInt(req.query.associadoId || req.body.associadoId);
  if (alvo && alvo !== req.user.id) {
    return isDiretoria(req) ? alvo : null; // null = sem permissão
  }
  return req.user.id;
}

async function listar(req, res) {
  try {
    const associadoId = alvoAssociado(req);
    if (associadoId === null) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    const dependentes = await prisma.dependente.findMany({
      where: { associadoId },
      orderBy: { nome: 'asc' }
    });
    res.json({ sucesso: true, dados: dependentes });
  } catch (error) {
    logger.error('Erro ao listar dependentes:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

async function criar(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }
    const associadoId = alvoAssociado(req);
    if (associadoId === null) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const { nome, parentesco, dataNascimento } = req.body;
    const dependente = await prisma.dependente.create({
      data: {
        associadoId,
        nome: nome.trim(),
        parentesco: parentesco || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null
      }
    });
    res.status(201).json({ sucesso: true, dados: dependente });
  } catch (error) {
    logger.error('Erro ao criar dependente:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

async function atualizar(req, res) {
  try {
    const dependente = await prisma.dependente.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!dependente) {
      return res.status(404).json({ erro: 'Dependente não encontrado' });
    }
    if (dependente.associadoId !== req.user.id && !isDiretoria(req)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const { nome, parentesco, dataNascimento } = req.body;
    const dados = {};
    if (nome !== undefined) dados.nome = nome.trim();
    if (parentesco !== undefined) dados.parentesco = parentesco;
    if (dataNascimento !== undefined) dados.dataNascimento = dataNascimento ? new Date(dataNascimento) : null;

    const atualizado = await prisma.dependente.update({ where: { id: dependente.id }, data: dados });
    res.json({ sucesso: true, dados: atualizado });
  } catch (error) {
    logger.error('Erro ao atualizar dependente:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

async function excluir(req, res) {
  try {
    const dependente = await prisma.dependente.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!dependente) {
      return res.status(404).json({ erro: 'Dependente não encontrado' });
    }
    if (dependente.associadoId !== req.user.id && !isDiretoria(req)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    await prisma.dependente.delete({ where: { id: dependente.id } });
    res.json({ sucesso: true, mensagem: 'Dependente removido' });
  } catch (error) {
    logger.error('Erro ao excluir dependente:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

module.exports = { listar, criar, atualizar, excluir };
