/**
 * Incidentes de segurança LGPD (art. 48):
 *  - listar/criar (auditoria)
 *  - gerar comunicado à ANPD (texto pronto para envio manual — marca data)
 *  - notificar titulares afetados por e-mail (marca data + contadores)
 */
const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');
const { enviarEmail } = require('../services/emailService');
const { APP_NOME, formatarDataHora, esc } = require('../utils/format');

async function listar(req, res) {
  try {
    const incidentes = await prisma.incidenteLgpd.findMany({
      orderBy: { dataOcorrencia: 'desc' }
    });
    res.json({ sucesso: true, dados: incidentes });
  } catch (error) {
    logger.error('Erro ao listar incidentes LGPD:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

async function criar(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const { titulo, descricao, dataOcorrencia, dadosAfetados, titularesAfetados, medidasTomadas } = req.body;

    const incidente = await prisma.incidenteLgpd.create({
      data: {
        titulo,
        descricao,
        dataOcorrencia: new Date(dataOcorrencia),
        dadosAfetados: dadosAfetados || null,
        titularesAfetados: titularesAfetados || null,
        medidasTomadas: medidasTomadas || null,
        registradoPorId: req.user?.id || null,
        registradoPor: req.user?.nome || null
      }
    });

    try {
      await prisma.log.create({
        data: {
          acao: 'Registrou Incidente LGPD',
          detalhes: `Título: ${titulo}`,
          associadoId: req.user?.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (e) { /* log é secundário */ }

    res.status(201).json({ sucesso: true, dados: incidente });
  } catch (error) {
    logger.error('Erro ao criar incidente LGPD:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Gera o texto do comunicado à ANPD (para envio manual via formulário da ANPD)
 * e marca `comunicadoAnpdEm`.
 */
async function comunicadoAnpd(req, res) {
  try {
    const incidente = await prisma.incidenteLgpd.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!incidente) {
      return res.status(404).json({ erro: 'Incidente não encontrado' });
    }

    const texto =
      `COMUNICAÇÃO DE INCIDENTE DE SEGURANÇA À ANPD — LGPD Art. 48\n` +
      `Destinatário: Autoridade Nacional de Proteção de Dados (ANPD)\n` +
      `Controlador: ${APP_NOME}\n\n` +
      `Data do registro: ${formatarDataHora(new Date())}\n` +
      `Data estimada da ocorrência: ${formatarDataHora(incidente.dataOcorrencia)}\n\n` +
      `Título: ${incidente.titulo}\n\n` +
      `Descrição:\n${incidente.descricao}\n\n` +
      `Dados pessoais afetados:\n${incidente.dadosAfetados || 'Não informado'}\n\n` +
      `Titulares afetados (escopo):\n${incidente.titularesAfetados || 'Não informado'}\n\n` +
      `Medidas tomadas / em curso:\n${incidente.medidasTomadas || 'Não informado'}\n\n` +
      `Contato do encarregado (DPO): diretoria@aspgepa.org.br\n` +
      `Canal do titular: ${process.env.APP_URL || 'https://aspgepa.org.br'}/privacidade`;

    // Marca como comunicado (a segunda chamada apenas regenera o texto)
    if (!incidente.comunicadoAnpdEm) {
      await prisma.incidenteLgpd.update({
        where: { id: incidente.id },
        data: { comunicadoAnpdEm: new Date() }
      });
    }

    res.json({ sucesso: true, dados: { texto, comunicadoAnpdEm: new Date() } });
  } catch (error) {
    logger.error('Erro ao gerar comunicado ANPD:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Notifica titulares afetados por e-mail.
 * - sem `cpfs` no body → notifica todos os associados com e-mail
 * - com `cpfs` (array) → notifica só os associados daqueles CPFs
 */
async function notificarTitulares(req, res) {
  try {
    const incidente = await prisma.incidenteLgpd.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!incidente) {
      return res.status(404).json({ erro: 'Incidente não encontrado' });
    }

    const cpfs = Array.isArray(req.body.cpfs)
      ? req.body.cpfs.map(c => String(c).replace(/\D/g, ''))
      : null;

    const where = { email: { not: null } };
    if (cpfs && cpfs.length) where.cpf = { in: cpfs };

    const titulares = await prisma.associado.findMany({
      where,
      select: { id: true, nomeCompleto: true, email: true }
    });

    let enviados = 0;
    let falhados = 0;
    for (const t of titulares) {
      const r = await enviarEmail({
        para: t.email,
        assunto: `Aviso de incidente de dados — ${APP_NOME}`,
        texto:
          `Olá, ${t.nomeCompleto}!\n\n` +
          `Registramos um incidente de segurança que pode ter afetado seus dados.\n\n` +
          `O que aconteceu: ${incidente.titulo}\n` +
          `Data estimada: ${formatarDataHora(incidente.dataOcorrencia)}\n\n` +
          `Dados possivelmente afetados: ${incidente.dadosAfetados || 'Não informado'}\n\n` +
          `Medidas tomadas: ${incidente.medidasTomadas || 'Não informado'}\n\n` +
          `Seus direitos: acesso, correção e exclusão dos dados em ${process.env.APP_URL || 'https://aspgepa.org.br'}/privacidade\n\n` +
          `${APP_NOME}`,
        html:
          `<p>Olá, <strong>${esc(t.nomeCompleto)}</strong>!</p>` +
          `<p>Registramos um incidente de segurança que pode ter afetado seus dados.</p>` +
          `<p><strong>O que aconteceu:</strong> ${esc(incidente.titulo)}<br>` +
          `<strong>Data estimada:</strong> ${formatarDataHora(incidente.dataOcorrencia)}</p>` +
          `<p><strong>Dados possivelmente afetados:</strong><br>${esc(incidente.dadosAfetados || 'Não informado')}</p>` +
          `<p><strong>Medidas tomadas:</strong><br>${esc(incidente.medidasTomadas || 'Não informado')}</p>` +
          `<p style="color:#6b7280;font-size:12px">Seus direitos (acesso, correção, exclusão) em ` +
          `${process.env.APP_URL || 'https://aspgepa.org.br'}/privacidade — ${APP_NOME}</p>`
      });
      r.enviado ? enviados++ : falhados++;
    }

    const atualizado = await prisma.incidenteLgpd.update({
      where: { id: incidente.id },
      data: {
        notificadoTitularesEm: new Date(),
        emailsEnviados: { increment: enviados },
        emailsFalhados: { increment: falhados }
      }
    });

    res.json({
      sucesso: true,
      dados: {
        totalTitulares: titulares.length,
        enviados,
        falhados,
        notificadoTitularesEm: atualizado.notificadoTitularesEm
      }
    });
  } catch (error) {
    logger.error('Erro ao notificar titulares:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

module.exports = { listar, criar, comunicadoAnpd, notificarTitulares };
