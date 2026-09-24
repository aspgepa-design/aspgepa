const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Listar eventos
 */
async function listar(req, res) {
  try {
    const { incluirOcultos } = req.query;
    const isAdmin = ['presidente', 'diretor'].includes(req.user?.role);
    
    // Se não for admin e não pedir explicitamente, só mostra visíveis
    const mostrarTodos = isAdmin && incluirOcultos === 'true';

    const eventos = await prisma.evento.findMany({
      where: mostrarTodos ? {} : { visivel: true },
      orderBy: { data: 'desc' },
      include: { _count: { select: { inscricoes: true } } }
    });

    // Marca em quais eventos o usuário logado está inscrito
    let minhasInscricoes = [];
    if (req.user?.id) {
      minhasInscricoes = await prisma.inscricaoEvento.findMany({
        where: { associadoId: req.user.id },
        select: { eventoId: true }
      });
    }
    const setInscrito = new Set(minhasInscricoes.map(i => i.eventoId));

    // Formatar datas para string dd/MM/yyyy
    const resultado = eventos.map(e => ({
      ...e,
      data: formatarData(e.data),
      totalInscritos: e._count.inscricoes,
      inscrito: setInscrito.has(e.id)
    }));

    res.json(resultado);
  } catch (error) {
    logger.error('Erro ao listar eventos:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Criar evento
 */
async function criar(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const { data, titulo, local, horario, descricao, visivel } = req.body;

    // Converter data dd/MM/yyyy para Date
    const dataObj = parseData(data);
    if (!dataObj) {
      return res.status(400).json({ erro: 'Data inválida. Use formato dd/MM/yyyy' });
    }

    const evento = await prisma.evento.create({
      data: {
        data: dataObj,
        titulo,
        local: local || null,
        horario: horario || null,
        descricao: descricao || null,
        visivel: visivel !== undefined ? visivel : true
      }
    });

    await prisma.log.create({
      data: {
        acao: 'Criou Evento',
        detalhes: titulo,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Evento criado com sucesso',
      evento: {
        ...evento,
        data: formatarData(evento.data)
      }
    });
  } catch (error) {
    logger.error('Erro ao criar evento:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Atualizar evento
 */
async function atualizar(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const { id } = req.params;
    const { data, titulo, local, horario, descricao, visivel } = req.body;

    const eventoExistente = await prisma.evento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!eventoExistente) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }

    const dadosAtualizacao = {};
    if (data) {
      const dataObj = parseData(data);
      if (!dataObj) {
        return res.status(400).json({ erro: 'Data inválida' });
      }
      dadosAtualizacao.data = dataObj;
    }
    if (titulo !== undefined) dadosAtualizacao.titulo = titulo;
    if (local !== undefined) dadosAtualizacao.local = local;
    if (horario !== undefined) dadosAtualizacao.horario = horario;
    if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
    if (visivel !== undefined) dadosAtualizacao.visivel = visivel;

    const evento = await prisma.evento.update({
      where: { id: parseInt(id) },
      data: dadosAtualizacao
    });

    await prisma.log.create({
      data: {
        acao: 'Editou Evento',
        detalhes: titulo || eventoExistente.titulo,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      sucesso: true,
      mensagem: 'Evento atualizado com sucesso',
      evento: {
        ...evento,
        data: formatarData(evento.data)
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar evento:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Excluir evento
 */
async function excluir(req, res) {
  try {
    const { id } = req.params;

    const evento = await prisma.evento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }

    await prisma.evento.delete({
      where: { id: parseInt(id) }
    });

    await prisma.log.create({
      data: {
        acao: 'Excluiu Evento',
        detalhes: evento.titulo,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      sucesso: true,
      mensagem: 'Evento excluído com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao excluir evento:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Alternar visibilidade do evento
 */
async function alternarVisibilidade(req, res) {
  try {
    const { id } = req.params;

    const evento = await prisma.evento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }

    const eventoAtualizado = await prisma.evento.update({
      where: { id: parseInt(id) },
      data: { visivel: !evento.visivel }
    });

    res.json({
      sucesso: true,
      visivel: eventoAtualizado.visivel,
      mensagem: `Evento ${eventoAtualizado.visivel ? 'visível' : 'oculto'}`
    });
  } catch (error) {
    logger.error('Erro ao alternar visibilidade:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Inscrever o associado logado num evento
 */
async function inscrever(req, res) {
  try {
    const eventoId = parseInt(req.params.id);
    const associadoId = req.user.id;

    const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }
    if (!evento.visivel) {
      return res.status(400).json({ erro: 'Evento não está disponível para inscrição' });
    }

    const existente = await prisma.inscricaoEvento.findUnique({
      where: { eventoId_associadoId: { eventoId, associadoId } }
    });
    if (existente) {
      return res.status(409).json({ erro: 'Você já está inscrito neste evento' });
    }

    await prisma.inscricaoEvento.create({ data: { eventoId, associadoId } });

    await prisma.log.create({
      data: {
        acao: 'Inscreveu-se em Evento',
        detalhes: evento.titulo,
        associadoId,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    }).catch(() => {});

    res.status(201).json({ sucesso: true, mensagem: 'Inscrição confirmada' });
  } catch (error) {
    logger.error('Erro ao inscrever em evento:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Cancelar inscrição do associado logado num evento
 */
async function desinscrever(req, res) {
  try {
    const eventoId = parseInt(req.params.id);
    const associadoId = req.user.id;

    const existente = await prisma.inscricaoEvento.findUnique({
      where: { eventoId_associadoId: { eventoId, associadoId } }
    });
    if (!existente) {
      return res.status(404).json({ erro: 'Inscrição não encontrada' });
    }

    await prisma.inscricaoEvento.delete({ where: { id: existente.id } });
    res.json({ sucesso: true, mensagem: 'Inscrição cancelada' });
  } catch (error) {
    logger.error('Erro ao cancelar inscrição:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Listar inscritos de um evento (diretoria)
 */
async function listarInscritos(req, res) {
  try {
    const eventoId = parseInt(req.params.id);

    const evento = await prisma.evento.findUnique({ where: { id: eventoId } });
    if (!evento) {
      return res.status(404).json({ erro: 'Evento não encontrado' });
    }

    const inscritos = await prisma.inscricaoEvento.findMany({
      where: { eventoId },
      orderBy: { createdAt: 'asc' },
      include: {
        associado: { select: { id: true, nomeCompleto: true, cpf: true, whatsapp: true } }
      }
    });

    res.json({
      sucesso: true,
      evento: evento.titulo,
      total: inscritos.length,
      dados: inscritos.map(i => ({
        id: i.associado.id,
        nome: i.associado.nomeCompleto,
        cpf: i.associado.cpf,
        whatsapp: i.associado.whatsapp,
        inscritoEm: i.createdAt
      }))
    });
  } catch (error) {
    logger.error('Erro ao listar inscritos:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

// Helpers
function formatarData(data) {
  if (!data) return '';
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function parseData(dataStr) {
  if (!dataStr) return null;
  const partes = dataStr.split('/');
  if (partes.length !== 3) return null;
  
  const dia = parseInt(partes[0]);
  const mes = parseInt(partes[1]) - 1;
  const ano = parseInt(partes[2]);
  
  const data = new Date(ano, mes, dia);
  
  // Validar se a data é válida
  if (data.getDate() !== dia || data.getMonth() !== mes || data.getFullYear() !== ano) {
    return null;
  }
  
  return data;
}

module.exports = {
  listar,
  criar,
  atualizar,
  excluir,
  alternarVisibilidade,
  inscrever,
  desinscrever,
  listarInscritos
};
