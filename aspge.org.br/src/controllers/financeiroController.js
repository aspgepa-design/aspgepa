const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Listar lançamentos financeiros
 */
async function listar(req, res) {
  try {
    const lancamentos = await prisma.lancamento.findMany({
      orderBy: { data: 'desc' }
    });

    let receitas = 0;
    let despesas = 0;

    const resultado = lancamentos.map(l => {
      const valor = parseFloat(l.valor);
      const tipo = (l.tipo || '').toLowerCase() === 'entrada' ? 'entrada' : 'saida';
      
      if (tipo === 'entrada') {
        receitas += valor;
      } else {
        despesas += valor;
      }

      return {
        linha: l.id,
        data: formatarData(l.data),
        desc: l.descricao,
        valor: valor,
        tipo: tipo,
        user: l.responsavel || ''
      };
    });

    res.json({
      lancamentos: resultado,
      receitas,
      despesas,
      saldo: receitas - despesas
    });
  } catch (error) {
    logger.error('Erro ao listar lançamentos:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Criar lançamento
 */
async function criar(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const { data, descricao, valor, tipo, responsavel } = req.body;

    // Validar tipo
    const tipoNormalizado = tipo.toLowerCase();
    if (!['entrada', 'saida', 'saída'].includes(tipoNormalizado)) {
      return res.status(400).json({ erro: 'Tipo deve ser Entrada ou Saída' });
    }

    // Converter data
    const dataObj = parseData(data);
    if (!dataObj) {
      return res.status(400).json({ erro: 'Data inválida. Use formato dd/MM/yyyy' });
    }

    const lancamento = await prisma.lancamento.create({
      data: {
        data: dataObj,
        descricao,
        valor: Math.abs(parseFloat(valor)),
        tipo: tipoNormalizado === 'entrada' ? 'Entrada' : 'Saída',
        responsavel: responsavel || req.user?.nome || 'Sistema'
      }
    });

    await prisma.log.create({
      data: {
        acao: 'Lançamento Financeiro',
        detalhes: `${tipo}: R$ ${valor} - ${descricao}`,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.status(201).json({
      sucesso: true,
      mensagem: 'Lançamento criado com sucesso',
      lancamento: {
        ...lancamento,
        data: formatarData(lancamento.data)
      }
    });
  } catch (error) {
    logger.error('Erro ao criar lançamento:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Excluir lançamento
 */
async function excluir(req, res) {
  try {
    const { id } = req.params;

    const lancamento = await prisma.lancamento.findUnique({
      where: { id: parseInt(id) }
    });

    if (!lancamento) {
      return res.status(404).json({ erro: 'Lançamento não encontrado' });
    }

    await prisma.lancamento.delete({
      where: { id: parseInt(id) }
    });

    await prisma.log.create({
      data: {
        acao: 'Excluiu Lançamento',
        detalhes: `ID: ${id}`,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      sucesso: true,
      mensagem: 'Lançamento excluído com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao excluir lançamento:', error);
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
  
  if (data.getDate() !== dia || data.getMonth() !== mes || data.getFullYear() !== ano) {
    return null;
  }
  
  return data;
}

module.exports = {
  listar,
  criar,
  excluir
};
