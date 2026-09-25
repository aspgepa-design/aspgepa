const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');
const cache = require('../services/cacheService');

/**
 * Listar convênios
 */
async function listar(req, res) {
  try {
    const { incluirOcultos } = req.query;
    const isAdmin = ['presidente', 'diretor'].includes(req.user?.role);
    
    const mostrarTodos = isAdmin && incluirOcultos === 'true';

    const convenios = await prisma.convenio.findMany({
      where: mostrarTodos ? {} : { visivel: true },
      orderBy: { nome: 'asc' }
    });

    res.json(convenios);
  } catch (error) {
    logger.error('Erro ao listar convênios:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Criar convênio
 */
async function criar(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const { nome, descricao, categoria, link, visivel, numeroConvenio, desconto, endereco, cnpj, telefone, condicoes, comoUsar, vigencia } = req.body;

    const convenio = await prisma.convenio.create({
      data: {
        nome,
        descricao: descricao || null,
        categoria: categoria || null,
        link: link || '#',
        visivel: visivel !== undefined ? visivel : true,
        numeroConvenio: numeroConvenio || null,
        desconto: desconto || null,
        endereco: endereco || null,
        cnpj: cnpj || null,
        telefone: telefone || null,
        condicoes: condicoes || null,
        comoUsar: comoUsar || null,
        vigencia: vigencia || null
      }
    });

    cache.invalidar('convenios').catch(() => {});

    await prisma.log.create({
      data: {
        acao: 'Criou Convênio',
        detalhes: nome,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Convênio criado com sucesso',
      convenio
    });
  } catch (error) {
    logger.error('Erro ao criar convênio:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Atualizar convênio
 */
async function atualizar(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const { id } = req.params;
    const { nome, descricao, categoria, link, visivel, numeroConvenio, desconto, endereco, cnpj, telefone, condicoes, comoUsar, vigencia } = req.body;

    const convenioExistente = await prisma.convenio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!convenioExistente) {
      return res.status(404).json({ erro: 'Convênio não encontrado' });
    }

    const dadosAtualizacao = {};
    if (nome !== undefined) dadosAtualizacao.nome = nome;
    if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
    if (categoria !== undefined) dadosAtualizacao.categoria = categoria;
    if (link !== undefined) dadosAtualizacao.link = link;
    if (visivel !== undefined) dadosAtualizacao.visivel = visivel;
    if (numeroConvenio !== undefined) dadosAtualizacao.numeroConvenio = numeroConvenio;
    if (desconto !== undefined) dadosAtualizacao.desconto = desconto;
    if (endereco !== undefined) dadosAtualizacao.endereco = endereco;
    if (cnpj !== undefined) dadosAtualizacao.cnpj = cnpj;
    if (telefone !== undefined) dadosAtualizacao.telefone = telefone;
    if (condicoes !== undefined) dadosAtualizacao.condicoes = condicoes;
    if (comoUsar !== undefined) dadosAtualizacao.comoUsar = comoUsar;
    if (vigencia !== undefined) dadosAtualizacao.vigencia = vigencia;

    const convenio = await prisma.convenio.update({
      where: { id: parseInt(id) },
      data: dadosAtualizacao
    });

    cache.invalidar('convenios').catch(() => {});

    await prisma.log.create({
      data: {
        acao: 'Editou Convênio',
        detalhes: nome || convenioExistente.nome,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      sucesso: true,
      mensagem: 'Convênio atualizado com sucesso',
      convenio
    });
  } catch (error) {
    logger.error('Erro ao atualizar convênio:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Excluir convênio
 */
async function excluir(req, res) {
  try {
    const { id } = req.params;

    const convenio = await prisma.convenio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!convenio) {
      return res.status(404).json({ erro: 'Convênio não encontrado' });
    }

    await prisma.convenio.delete({
      where: { id: parseInt(id) }
    });

    cache.invalidar('convenios').catch(() => {});

    await prisma.log.create({
      data: {
        acao: 'Excluiu Convênio',
        detalhes: convenio.nome,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      sucesso: true,
      mensagem: 'Convênio excluído com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao excluir convênio:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Alternar visibilidade do convênio
 */
async function alternarVisibilidade(req, res) {
  try {
    const { id } = req.params;

    const convenio = await prisma.convenio.findUnique({
      where: { id: parseInt(id) }
    });

    if (!convenio) {
      return res.status(404).json({ erro: 'Convênio não encontrado' });
    }

    const convenioAtualizado = await prisma.convenio.update({
      where: { id: parseInt(id) },
      data: { visivel: !convenio.visivel }
    });

    cache.invalidar('convenios').catch(() => {});

    res.json({
      sucesso: true,
      visivel: convenioAtualizado.visivel,
      mensagem: `Convênio ${convenioAtualizado.visivel ? 'visível' : 'oculto'}`
    });
  } catch (error) {
    logger.error('Erro ao alternar visibilidade:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Listar convênios públicos (somente visíveis, campos seguros) — para a home
 */
async function listarPublicos(req, res) {
  try {
    const convenios = await cache.envolver('convenios:publicos', 300, () => prisma.convenio.findMany({
      where: { visivel: true },
      orderBy: { nome: 'asc' },
      select: { id: true, nome: true, descricao: true, categoria: true, link: true }
    }));
    res.json({ sucesso: true, dados: convenios });
  } catch (error) {
    logger.error('Erro ao listar convênios públicos:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Detalhe pÃºblico de um convÃªnio (somente se visÃ­vel) â€” para a pÃ¡gina /convenios/:id
 */
async function obterPublico(req, res) {
  try {
    const { id } = req.params;
    const convenio = await cache.envolver('convenios:publico:' + id, 300, () => prisma.convenio.findFirst({
      where: { id: parseInt(id), visivel: true },
      select: {
        id: true, nome: true, descricao: true, categoria: true, link: true,
        numeroConvenio: true, desconto: true, endereco: true, cnpj: true,
        telefone: true, condicoes: true, comoUsar: true, vigencia: true
      }
    }));
    if (!convenio) {
      return res.status(404).json({ erro: 'ConvÃªnio nÃ£o encontrado' });
    }
    res.json({ sucesso: true, dados: convenio });
  } catch (error) {
    logger.error('Erro ao obter convÃªnio pÃºblico:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

module.exports = {
  listar,
  listarPublicos,
  obterPublico,
  criar,
  atualizar,
  excluir,
  alternarVisibilidade
};
