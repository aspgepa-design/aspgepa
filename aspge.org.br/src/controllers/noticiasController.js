const prisma = require('../config/database');
const logger = require('../config/logger');
const cache = require('../services/cacheService');

// Listar notícias públicas
async function listarNoticias(req, res) {
  try {
    const { limite = 10 } = req.query;

    const noticias = await cache.envolver('noticias:publicas:' + limite, 120, () => prisma.noticia.findMany({
      where: { visivel: true },
      orderBy: { dataPublicacao: 'desc' },
      take: parseInt(limite)
    }));
    
    res.json({ sucesso: true, dados: noticias });
  } catch (error) {
    logger.error('Erro ao listar notícias:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

// Listar todas as notícias (admin)
async function listarTodasNoticias(req, res) {
  try {
    const noticias = await prisma.noticia.findMany({
      orderBy: { dataPublicacao: 'desc' }
    });
    
    res.json({ sucesso: true, dados: noticias });
  } catch (error) {
    logger.error('Erro ao listar todas as notícias:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

// Buscar notícia por ID
async function buscarNoticia(req, res) {
  try {
    const { id } = req.params;
    
    const noticia = await cache.envolver('noticias:item:' + id, 120, () => prisma.noticia.findUnique({
      where: { id: parseInt(id) }
    }));

    if (!noticia) {
      return res.status(404).json({ erro: 'Notícia não encontrada' });
    }
    
    res.json({ sucesso: true, dados: noticia });
  } catch (error) {
    logger.error('Erro ao buscar notícia:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

// Criar notícia (admin)
async function criarNoticia(req, res) {
  try {
    const { titulo, descricao, conteudo, dataPublicacao, visivel } = req.body;
    
    if (!titulo) {
      return res.status(400).json({ erro: 'Título é obrigatório' });
    }
    
    const noticia = await prisma.noticia.create({
      data: {
        titulo,
        descricao,
        conteudo,
        dataPublicacao: dataPublicacao ? new Date(dataPublicacao) : new Date(),
        visivel: visivel !== undefined ? visivel : true
      }
    });

    cache.invalidar('noticias').catch(() => {});

    // Log (apenas se usuário autenticado)
    if (req.user?.id) {
      try {
        await prisma.log.create({
          data: {
            acao: 'Criou Notícia',
            detalhes: `Título: ${titulo}`,
            associadoId: req.user.id,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (logError) {
        logger.error('Erro ao criar log:', logError);
      }
    }
    
    res.status(201).json({ sucesso: true, dados: noticia });
  } catch (error) {
    logger.error('Erro ao criar notícia:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

// Atualizar notícia (admin)
async function atualizarNoticia(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descricao, conteudo, dataPublicacao, visivel } = req.body;
    
    const noticiaExistente = await prisma.noticia.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!noticiaExistente) {
      return res.status(404).json({ erro: 'Notícia não encontrada' });
    }
    
    const dadosAtualizacao = {};
    if (titulo !== undefined) dadosAtualizacao.titulo = titulo;
    if (descricao !== undefined) dadosAtualizacao.descricao = descricao;
    if (conteudo !== undefined) dadosAtualizacao.conteudo = conteudo;
    if (dataPublicacao !== undefined) dadosAtualizacao.dataPublicacao = new Date(dataPublicacao);
    if (visivel !== undefined) dadosAtualizacao.visivel = visivel;
    
    const noticia = await prisma.noticia.update({
      where: { id: parseInt(id) },
      data: dadosAtualizacao
    });

    cache.invalidar('noticias').catch(() => {});

    // Log (apenas se usuário autenticado)
    if (req.user?.id) {
      try {
        await prisma.log.create({
          data: {
            acao: 'Atualizou Notícia',
            detalhes: `ID: ${id}`,
            associadoId: req.user.id,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (logError) {
        logger.error('Erro ao criar log:', logError);
      }
    }
    
    res.json({ sucesso: true, dados: noticia });
  } catch (error) {
    logger.error('Erro ao atualizar notícia:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

// Excluir notícia (admin)
async function excluirNoticia(req, res) {
  try {
    const { id } = req.params;
    
    const noticiaExistente = await prisma.noticia.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!noticiaExistente) {
      return res.status(404).json({ erro: 'Notícia não encontrada' });
    }
    
    await prisma.noticia.delete({
      where: { id: parseInt(id) }
    });

    cache.invalidar('noticias').catch(() => {});

    // Log (apenas se usuário autenticado)
    if (req.user?.id) {
      try {
        await prisma.log.create({
          data: {
            acao: 'Excluiu Notícia',
            detalhes: `Título: ${noticiaExistente.titulo}`,
            associadoId: req.user.id,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (logError) {
        logger.error('Erro ao criar log:', logError);
      }
    }
    
    res.json({ sucesso: true, mensagem: 'Notícia excluída com sucesso' });
  } catch (error) {
    logger.error('Erro ao excluir notícia:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

module.exports = {
  listarNoticias,
  listarTodasNoticias,
  buscarNoticia,
  criarNoticia,
  atualizarNoticia,
  excluirNoticia
};
