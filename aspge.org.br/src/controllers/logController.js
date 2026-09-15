const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Listar logs do sistema
 */
async function listar(req, res) {
  try {
    const { limite = 500, acao, cpf } = req.query;
    const max = Math.min(parseInt(limite) || 500, 1000);

    const where = {};
    
    if (acao && acao !== 'todos') {
      where.acao = { contains: acao, mode: 'insensitive' };
    }

    // Se CPF for informado, buscar o associado primeiro
    if (cpf) {
      const associado = await prisma.associado.findFirst({
        where: { cpf: { contains: cpf.replace(/\D/g, '') } }
      });
      
      if (associado) {
        where.associadoId = associado.id;
      }
    }

    const logs = await prisma.log.findMany({
      where,
      take: max,
      orderBy: { createdAt: 'desc' },
      include: {
        associado: {
          select: {
            nomeCompleto: true,
            cpf: true
          }
        }
      }
    });

    // Formatar para compatibilidade com frontend legado
    const resultado = logs.map(l => ({
      dataHora: formatarDataHora(l.createdAt),
      cpf: l.associado?.cpf || '',
      nome: l.associado?.nomeCompleto || '',
      acao: l.acao,
      detalhes: l.detalhes || ''
    }));

    res.json({
      logs: resultado,
      total: await prisma.log.count({ where })
    });
  } catch (error) {
    logger.error('Erro ao listar logs:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Estatísticas de logs
 */
async function estatisticas(req, res) {
  try {
    const total = await prisma.log.count();
    
    const acoes = await prisma.log.groupBy({
      by: ['acao'],
      _count: { acao: true }
    });

    const ultimas24h = await prisma.log.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    res.json({
      total,
      ultimas24h,
      acoes: acoes.map(a => ({
        acao: a.acao,
        quantidade: a._count.acao
      }))
    });
  } catch (error) {
    logger.error('Erro nas estatísticas de logs:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

// Helper
function formatarDataHora(data) {
  if (!data) return '';
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const seg = String(d.getSeconds()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`;
}

module.exports = {
  listar,
  estatisticas
};
