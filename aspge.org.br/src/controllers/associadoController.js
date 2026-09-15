const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');
const { getFileUrl } = require('../middleware/upload');

// Campos obrigatórios para cadastro completo
const CAMPOS_OBRIGATORIOS = [
  'whatsapp', 'email', 'matricula', 'cargo', 'cpf', 'rg'
];

/**
 * Listar todos os associados (resumido)
 */
async function listarTodos(req, res) {
  try {
    const associados = await prisma.associado.findMany({
      select: {
        id: true,
        nomeCompleto: true,
        cpf: true,
        cargo: true,
        matricula: true,
        perfil: true,
        situacao: true,
        whatsapp: true,
        fotoUrl: true,
        fotoCarteirinhaUrl: true,
        cadastroCompleto: true,
        camposPreenchidos: true
      },
      orderBy: {
        nomeCompleto: 'asc'
      }
    });

    // Mapear para formato compatível com frontend
    const resultado = associados.map(a => ({
      id: a.id,
      nome: a.nomeCompleto,
      cpf: a.cpf,
      cargo: a.cargo || '',
      matricula: a.matricula || '',
      perfil: a.perfil,
      situacao: a.situacao,
      whatsapp: a.whatsapp || '',
      temFoto: !!(a.fotoUrl || a.fotoCarteirinhaUrl),
      cadastroCompleto: a.cadastroCompleto,
      camposPreenchidos: a.camposPreenchidos
    }));

    res.json({
      sucesso: true,
      associados: resultado,
      total: resultado.length
    });
  } catch (error) {
    logger.error('Erro ao listar associados:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Listar associados resumido (para seleção de carteirinhas)
 */
async function listarResumido(req, res) {
  try {
    const associados = await prisma.associado.findMany({
      where: {
        nomeCompleto: {
          not: ''
        }
      },
      select: {
        id: true,
        nomeCompleto: true,
        cpf: true,
        cargo: true,
        fotoUrl: true,
        fotoCarteirinhaUrl: true
      },
      orderBy: {
        nomeCompleto: 'asc'
      }
    });

    const resultado = associados
      .filter(a => a.cpf && a.cpf.replace(/\D/g, '').length >= 11)
      .map(a => ({
        id: a.id,
        nome: a.nomeCompleto,
        cpf: a.cpf,
        cargo: a.cargo || '',
        temFoto: !!(a.fotoUrl || a.fotoCarteirinhaUrl)
      }));

    res.json(resultado);
  } catch (error) {
    logger.error('Erro ao listar associados resumido:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Buscar associado por CPF
 */
async function buscarPorCpf(req, res) {
  try {
    const { cpf } = req.params;
    const cpfLimpo = cpf.replace(/\D/g, '');

    const associado = await prisma.associado.findFirst({
      where: {
        OR: [
          { cpf: cpfLimpo },
          { cpf: cpf }
        ]
      },
      include: {
        gestoes: true,
        documentos: true
      }
    });

    if (!associado) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }

    // Remover senha do retorno
    const { senha, ...dados } = associado;

    res.json({
      sucesso: true,
      dados
    });
  } catch (error) {
    logger.error('Erro ao buscar associado:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Buscar associado por ID
 */
async function buscarPorId(req, res) {
  try {
    const { id } = req.params;

    const associado = await prisma.associado.findUnique({
      where: { id: parseInt(id) },
      include: {
        gestoes: true,
        documentos: {
          select: {
            id: true,
            nome: true,
            createdAt: true
          }
        }
      }
    });

    if (!associado) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }

    // Remover senha do retorno
    const { senha, ...dados } = associado;

    res.json({
      sucesso: true,
      dados
    });
  } catch (error) {
    logger.error('Erro ao buscar associado por ID:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Criar novo associado
 */
async function criar(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const dados = req.body;
    const cpfLimpo = dados.cpf.replace(/\D/g, '');

    // Verificar se CPF já existe
    const existente = await prisma.associado.findFirst({
      where: {
        OR: [
          { cpf: cpfLimpo },
          { cpf: dados.cpf }
        ]
      }
    });

    if (existente) {
      return res.status(400).json({ erro: 'CPF já cadastrado' });
    }

    // Calcular campos preenchidos e cadastro completo
    const { camposPreenchidos, cadastroCompleto } = calcularCompletude(dados);

    const associado = await prisma.associado.create({
      data: {
        ...dados,
        cpf: cpfLimpo,
        camposPreenchidos,
        cadastroCompleto
      }
    });

    // Registrar log
    await prisma.log.create({
      data: {
        acao: 'Criou Associado',
        detalhes: `Nome: ${dados.nomeCompleto}`,
        associadoId: associado.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    logger.info(`Novo associado criado: ${associado.nomeCompleto} (${associado.cpf})`);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Associado criado com sucesso',
      dados: {
        id: associado.id,
        nomeCompleto: associado.nomeCompleto,
        cpf: associado.cpf
      }
    });
  } catch (error) {
    logger.error('Erro ao criar associado:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Atualizar associado
 */
async function atualizar(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const { id } = req.params;
    const dados = req.body;

    const associadoExistente = await prisma.associado.findUnique({
      where: { id: parseInt(id) }
    });

    if (!associadoExistente) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }

    // Verificar permissão (próprio cadastro ou admin)
    const isProprioCadastro = req.user.id === parseInt(id);
    const isAdmin = ['presidente', 'diretor', 'tesoureiro'].includes(req.user.role);

    if (!isProprioCadastro && !isAdmin) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    // Campos que podem ser atualizados
    const camposPermitidos = [
      'rg', 'expeditor', 'matricula', 'cargo', 'whatsapp', 'email',
      'sexo', 'dataNascimento', 'naturalidade', 'estadoCivil',
      'graduacao', 'posGraduacao', 'areaAtuacao', 'lotacao',
      'fotoUrl', 'fotoCarteirinhaUrl', 'fotoConfig'
    ];

    // Se for admin, permite atualizar mais campos
    if (isAdmin) {
      camposPermitidos.push('nomeCompleto', 'cpf', 'perfil', 'situacao');
    }

    const dadosAtualizacao = {};
    camposPermitidos.forEach(campo => {
      if (dados[campo] !== undefined) {
        dadosAtualizacao[campo] = dados[campo];
      }
    });

    // Recalcular completude
    const dadosCombinados = { ...associadoExistente, ...dadosAtualizacao };
    const { camposPreenchidos, cadastroCompleto } = calcularCompletude(dadosCombinados);
    
    dadosAtualizacao.camposPreenchidos = camposPreenchidos;
    dadosAtualizacao.cadastroCompleto = cadastroCompleto;

    const associado = await prisma.associado.update({
      where: { id: parseInt(id) },
      data: dadosAtualizacao
    });

    // Registrar log
    await prisma.log.create({
      data: {
        acao: 'Atualizou Cadastro',
        detalhes: isProprioCadastro ? 'Próprio cadastro' : `ID: ${id}`,
        associadoId: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      sucesso: true,
      mensagem: 'Cadastro atualizado com sucesso',
      dados: {
        id: associado.id,
        nomeCompleto: associado.nomeCompleto,
        cadastroCompleto: associado.cadastroCompleto
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar associado:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Excluir associado
 */
async function excluir(req, res) {
  try {
    const { id } = req.params;

    const associado = await prisma.associado.findUnique({
      where: { id: parseInt(id) }
    });

    if (!associado) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }

    await prisma.associado.delete({
      where: { id: parseInt(id) }
    });

    // Registrar log
    await prisma.log.create({
      data: {
        acao: 'Excluiu Associado',
        detalhes: `Nome: ${associado.nomeCompleto}`,
        associadoId: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    logger.info(`Associado excluído: ${associado.nomeCompleto} (${associado.cpf})`);

    res.json({
      sucesso: true,
      mensagem: 'Associado excluído com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao excluir associado:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Upload de foto do associado
 */
async function uploadFoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhuma foto enviada' });
    }

    const { id } = req.params;
    const tipo = req.body.tipo || 'perfil'; // 'perfil' ou 'carteirinha'

    const associado = await prisma.associado.findUnique({
      where: { id: parseInt(id) }
    });

    if (!associado) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }

    const fotoUrl = getFileUrl('foto', req.file.filename);

    const campoAtualizacao = tipo === 'carteirinha' 
      ? { fotoCarteirinhaUrl: fotoUrl }
      : { fotoUrl: fotoUrl };

    await prisma.associado.update({
      where: { id: parseInt(id) },
      data: campoAtualizacao
    });

    await prisma.log.create({
      data: {
        acao: `Upload Foto ${tipo}`,
        detalhes: `Arquivo: ${req.file.filename}`,
        associadoId: req.user.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      sucesso: true,
      mensagem: 'Foto enviada com sucesso',
      url: fotoUrl
    });
  } catch (error) {
    logger.error('Erro no upload de foto:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

// Helper para calcular completude do cadastro
function calcularCompletude(dados) {
  let camposPreenchidos = 0;
  const camposFaltando = [];

  CAMPOS_OBRIGATORIOS.forEach(campo => {
    const valor = dados[campo];
    if (valor && valor.trim() !== '' && valor.toLowerCase() !== 'não') {
      camposPreenchidos++;
    } else {
      camposFaltando.push(campo);
    }
  });

  return {
    camposPreenchidos,
    cadastroCompleto: camposPreenchidos === CAMPOS_OBRIGATORIOS.length
  };
}

module.exports = {
  listarTodos,
  listarResumido,
  buscarPorCpf,
  buscarPorId,
  criar,
  atualizar,
  excluir,
  uploadFoto
};
