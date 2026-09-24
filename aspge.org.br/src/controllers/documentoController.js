const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');
const logger = require('../config/logger');
const { UPLOAD_DIR } = require('../middleware/upload');

const isDiretoria = (req) => ['presidente', 'diretor', 'tesoureiro'].includes(req.user?.role);

/**
 * Upload de documento do associado logado (ou admin para outro via ?associadoId)
 */
async function upload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    }

    // Admin pode enviar para outro associado via query/body; associado só para si
    let associadoId = req.user.id;
    const alvo = parseInt(req.body.associadoId || req.query.associadoId);
    if (alvo && alvo !== req.user.id) {
      if (!isDiretoria(req)) {
        return res.status(403).json({ erro: 'Acesso negado' });
      }
      associadoId = alvo;
    }

    const nome = (req.body.nome || req.file.originalname).trim();

    const documento = await prisma.documento.create({
      data: {
        nome,
        path: req.file.path,
        mimeType: req.file.mimetype,
        tamanho: req.file.size,
        associadoId
      }
    });

    await prisma.log.create({
      data: {
        acao: 'Upload de Documento',
        detalhes: nome,
        associadoId: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    }).catch(() => {});

    res.status(201).json({ sucesso: true, dados: documento });
  } catch (error) {
    logger.error('Erro no upload de documento:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Listar documentos — próprio associado; diretoria pode filtrar por ?associadoId
 */
async function listar(req, res) {
  try {
    let where = { associadoId: req.user.id };
    const alvo = parseInt(req.query.associadoId);
    if (alvo && alvo !== req.user.id) {
      if (!isDiretoria(req)) {
        return res.status(403).json({ erro: 'Acesso negado' });
      }
      where = { associadoId: alvo };
    }

    const documentos = await prisma.documento.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, nome: true, mimeType: true, tamanho: true, createdAt: true, associadoId: true }
    });

    res.json({ sucesso: true, dados: documentos });
  } catch (error) {
    logger.error('Erro ao listar documentos:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Download de documento — próprio associado ou diretoria
 */
async function download(req, res) {
  try {
    const documento = await prisma.documento.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!documento) {
      return res.status(404).json({ erro: 'Documento não encontrado' });
    }
    if (documento.associadoId !== req.user.id && !isDiretoria(req)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    if (!fs.existsSync(documento.path)) {
      return res.status(404).json({ erro: 'Arquivo não encontrado no servidor' });
    }
    res.download(documento.path, documento.nome);
  } catch (error) {
    logger.error('Erro no download de documento:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Excluir documento — próprio associado ou diretoria
 */
async function excluir(req, res) {
  try {
    const documento = await prisma.documento.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!documento) {
      return res.status(404).json({ erro: 'Documento não encontrado' });
    }
    if (documento.associadoId !== req.user.id && !isDiretoria(req)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    await prisma.documento.delete({ where: { id: documento.id } });
    if (fs.existsSync(documento.path)) {
      fs.unlinkSync(documento.path);
    }

    res.json({ sucesso: true, mensagem: 'Documento excluído' });
  } catch (error) {
    logger.error('Erro ao excluir documento:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

module.exports = { upload, listar, download, excluir };
