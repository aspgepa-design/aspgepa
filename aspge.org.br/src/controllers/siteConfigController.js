const prisma = require('../config/database');
const logger = require('../config/logger');

// Buscar configurações do site
async function getConfig(req, res) {
  try {
    let config = await prisma.siteConfig.findFirst();
    
    // Se não existir, criar config padrão
    if (!config) {
      config = await prisma.siteConfig.create({
        data: {
          sobreTexto: 'Sobre a ASPGE-PA',
          missao: 'Nossa missão',
          visao: 'Nossa visão',
          valores: 'Nossos valores',
          estatutos: 'Estatutos da associação',
          mostrarEnquetes: true,
          mostrarNoticias: true,
          mostrarEventos: true,
          linksRapidos: JSON.stringify([
            { titulo: 'Portal do Associado', url: '/login' },
            { titulo: 'Ficha de Inscrição', url: '/inscricao' },
            { titulo: 'Contato', url: '#contato' }
          ])
        }
      });
    }
    
    // Parse JSON fields
    const configParsed = {
      ...config,
      linksRapidos: config.linksRapidos ? JSON.parse(config.linksRapidos) : [],
      redesSociais: config.redesSociais ? JSON.parse(config.redesSociais) : []
    };
    
    res.json({ sucesso: true, dados: configParsed });
  } catch (error) {
    logger.error('Erro ao buscar configurações do site:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

// Atualizar configurações do site (admin)
async function updateConfig(req, res) {
  try {
    const dados = req.body;
    
    // Parse campos JSON se vierem como string
    if (dados.linksRapidos && typeof dados.linksRapidos === 'string') {
      dados.linksRapidos = JSON.parse(dados.linksRapidos);
    }
    if (dados.redesSociais && typeof dados.redesSociais === 'string') {
      dados.redesSociais = JSON.parse(dados.redesSociais);
    }
    
    // Stringify campos JSON para salvar
    const dadosAtualizacao = {
      ...dados,
      linksRapidos: dados.linksRapidos ? JSON.stringify(dados.linksRapidos) : null,
      redesSociais: dados.redesSociais ? JSON.stringify(dados.redesSociais) : null
    };
    
    let config = await prisma.siteConfig.findFirst();
    
    if (config) {
      config = await prisma.siteConfig.update({
        where: { id: config.id },
        data: dadosAtualizacao
      });
    } else {
      config = await prisma.siteConfig.create({
        data: dadosAtualizacao
      });
    }
    
    // Log (apenas se usuário autenticado)
    if (req.user?.id) {
      try {
        await prisma.log.create({
          data: {
            acao: 'Atualizou Configurações do Site',
            detalhes: 'Configurações da página pública atualizadas',
            associadoId: req.user.id,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (logError) {
        // Ignorar erro de log para não quebrar a operação principal
        logger.error('Erro ao criar log:', logError);
      }
    }
    
    const configParsed = {
      ...config,
      linksRapidos: config.linksRapidos ? JSON.parse(config.linksRapidos) : [],
      redesSociais: config.redesSociais ? JSON.parse(config.redesSociais) : []
    };
    
    res.json({ sucesso: true, dados: configParsed });
  } catch (error) {
    logger.error('Erro ao atualizar configurações do site:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

module.exports = {
  getConfig,
  updateConfig
};
