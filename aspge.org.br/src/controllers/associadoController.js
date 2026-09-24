const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');
const { getFileUrl } = require('../middleware/upload');

// Campos obrigatórios para cadastro completo
const CAMPOS_OBRIGATORIOS = [
  'whatsapp', 'email', 'matricula', 'cargo', 'cpf', 'rg',
  'dataNascimento', 'estadoCivil', 'cep', 'endereco', 'numero',
  'bairro', 'cidade', 'estado', 'tipoResidencia'
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

    // Rota pública: retorna apenas os campos necessários à página de atualização cadastral (LGPD)
    const associado = await prisma.associado.findFirst({
      where: {
        OR: [
          { cpf: cpfLimpo },
          { cpf: cpf }
        ]
      },
      select: {
        id: true,
        nomeCompleto: true,
        cpf: true,
        rg: true,
        expeditor: true,
        matricula: true,
        cargo: true,
        whatsapp: true,
        email: true,
        sexo: true,
        dataNascimento: true,
        naturalidade: true,
        estadoCivil: true,
        graduacao: true,
        posGraduacao: true,
        areaAtuacao: true,
        lotacao: true,
        cep: true,
        endereco: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        estado: true,
        tipoResidencia: true,
        fotoUrl: true,
        fotoCarteirinhaUrl: true,
        senhaAlterada: true,
        cadastroCompleto: true
      }
    });

    if (!associado) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }

    res.json({
      sucesso: true,
      dados: associado
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
        // Senha sempre hasheada; padrão = CPF (primeiro acesso)
        senha: await bcrypt.hash(dados.senha || cpfLimpo, 10),
        dataNascimento: dados.dataNascimento ? new Date(dados.dataNascimento) : null,
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
      'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'tipoResidencia',
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

    // Processar alteração de senha
    if (dados.senha && dados.confirmarSenha) {
      if (dados.senha !== dados.confirmarSenha) {
        return res.status(400).json({ erro: 'Senhas não conferem' });
      }
      if (dados.senha.length < 6) {
        return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
      }
      dadosAtualizacao.senha = await bcrypt.hash(dados.senha, 10);
      dadosAtualizacao.senhaAlterada = true;
    }

    // Normalizar data (string vazia quebraria o Prisma)
    if (dadosAtualizacao.dataNascimento !== undefined) {
      dadosAtualizacao.dataNascimento = dadosAtualizacao.dataNascimento
        ? new Date(dadosAtualizacao.dataNascimento)
        : null;
    }

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
 * Atualizar cadastro próprio (público - página de atualização cadastral)
 * Requer CPF e senha no body para autenticação
 */
async function atualizarCadastro(req, res) {
  try {
    const { id } = req.params;
    const dados = req.body;
    const cpf = dados.cpf ? dados.cpf.replace(/\D/g, '') : null;
    const senha = dados.senhaAtual;

    if (!cpf || !senha) {
      return res.status(400).json({ erro: 'CPF e senha atual são obrigatórios' });
    }

    const associadoExistente = await prisma.associado.findUnique({
      where: { id: parseInt(id) }
    });

    if (!associadoExistente) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }

    // Verificar se CPF corresponde ao associado
    const cpfAssociado = associadoExistente.cpf.replace(/\D/g, '');
    if (cpf !== cpfAssociado) {
      return res.status(403).json({ erro: 'CPF não corresponde ao associado' });
    }

    // Verificar senha
    if (!associadoExistente.senha) {
      return res.status(401).json({ erro: 'Senha não configurada. Contate a diretoria.' });
    }
    const senhaValida = await bcrypt.compare(senha, associadoExistente.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta' });
    }

    // Campos que podem ser atualizados
    const camposPermitidos = [
      'rg', 'expeditor', 'matricula', 'cargo', 'whatsapp', 'email',
      'sexo', 'dataNascimento', 'naturalidade', 'estadoCivil',
      'graduacao', 'posGraduacao', 'areaAtuacao', 'lotacao',
      'cep', 'endereco', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'tipoResidencia',
      'fotoUrl', 'fotoCarteirinhaUrl', 'fotoConfig'
    ];

    const dadosAtualizacao = {};
    camposPermitidos.forEach(campo => {
      if (dados[campo] !== undefined) {
        dadosAtualizacao[campo] = dados[campo];
      }
    });

    // Processar alteração de senha
    if (dados.novaSenha && dados.confirmarNovaSenha) {
      if (dados.novaSenha !== dados.confirmarNovaSenha) {
        return res.status(400).json({ erro: 'Senhas não conferem' });
      }
      if (dados.novaSenha.length < 6) {
        return res.status(400).json({ erro: 'Senha deve ter no mínimo 6 caracteres' });
      }
      dadosAtualizacao.senha = await bcrypt.hash(dados.novaSenha, 10);
      dadosAtualizacao.senhaAlterada = true;
    }

    // Normalizar data (string vazia quebraria o Prisma)
    if (dadosAtualizacao.dataNascimento !== undefined) {
      dadosAtualizacao.dataNascimento = dadosAtualizacao.dataNascimento
        ? new Date(dadosAtualizacao.dataNascimento)
        : null;
    }

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
        detalhes: 'Próprio cadastro via página pública',
        associadoId: associado.id,
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
        cadastroCompleto: associado.cadastroCompleto,
        senhaAlterada: associado.senhaAlterada
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar cadastro:', error);
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
    // Campos DateTime (ex.: dataNascimento) chegam como Date — converter antes de trim()
    const valorStr = valor instanceof Date ? valor.toISOString() : String(valor || '');
    if (valorStr.trim() !== '' && valorStr.toLowerCase() !== 'não') {
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

/**
 * Inscrição pública (ficha de inscrição - sem autenticação)
 * Cria associado com situação 'Pendente' para aprovação da diretoria
 */
async function inscricaoPublica(req, res) {
  try {
    const dados = req.body;

    if (!dados.nomeCompleto || !dados.cpf) {
      return res.status(400).json({ erro: 'Nome completo e CPF são obrigatórios' });
    }

    const cpfLimpo = String(dados.cpf).replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      return res.status(400).json({ erro: 'CPF inválido' });
    }

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

    // Whitelist de campos — nunca confiar no body inteiro em rota pública
    const camposPermitidos = [
      'nomeCompleto', 'rg', 'expeditor', 'matricula', 'cargo', 'whatsapp', 'email',
      'sexo', 'naturalidade', 'estadoCivil', 'graduacao', 'posGraduacao',
      'areaAtuacao', 'lotacao', 'cep', 'endereco', 'numero', 'complemento',
      'bairro', 'cidade', 'estado', 'tipoResidencia'
    ];

    const dadosCriacao = {};
    camposPermitidos.forEach(campo => {
      if (dados[campo] !== undefined && dados[campo] !== '') {
        dadosCriacao[campo] = dados[campo];
      }
    });

    dadosCriacao.cpf = cpfLimpo;
    dadosCriacao.perfil = 'Associado';
    dadosCriacao.situacao = 'Pendente';
    dadosCriacao.senha = await bcrypt.hash(cpfLimpo, 10); // senha inicial = CPF
    dadosCriacao.dataNascimento = dados.dataNascimento ? new Date(dados.dataNascimento) : null;

    const { camposPreenchidos, cadastroCompleto } = calcularCompletude(dadosCriacao);
    dadosCriacao.camposPreenchidos = camposPreenchidos;
    dadosCriacao.cadastroCompleto = cadastroCompleto;

    const associado = await prisma.associado.create({ data: dadosCriacao });

    try {
      await prisma.log.create({
        data: {
          acao: 'Inscrição Pública',
          detalhes: `Nome: ${associado.nomeCompleto}`,
          associadoId: associado.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      logger.error('Erro ao criar log:', logError);
    }

    logger.info(`Inscrição pública recebida: ${associado.nomeCompleto} (${associado.cpf})`);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Inscrição enviada com sucesso! Aguarde a aprovação da diretoria.'
    });
  } catch (error) {
    logger.error('Erro na inscrição pública:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Listar inscrições pendentes de aprovação (diretoria)
 */
async function listarPendentes(req, res) {
  try {
    const pendentes = await prisma.associado.findMany({
      where: { situacao: 'Pendente' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, nomeCompleto: true, cpf: true, email: true, whatsapp: true,
        cargo: true, matricula: true, lotacao: true, createdAt: true
      }
    });
    res.json({ sucesso: true, total: pendentes.length, dados: pendentes });
  } catch (error) {
    logger.error('Erro ao listar pendentes:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Aprovar inscrição — ativa o associado (diretoria)
 */
async function aprovar(req, res) {
  try {
    const id = parseInt(req.params.id);
    const associado = await prisma.associado.findUnique({ where: { id } });
    if (!associado) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }
    if (associado.situacao !== 'Pendente') {
      return res.status(400).json({ erro: 'Cadastro não está pendente' });
    }

    await prisma.associado.update({
      where: { id },
      data: { situacao: 'Ativo' }
    });

    await prisma.log.create({
      data: {
        acao: 'Aprovou Inscrição',
        detalhes: `Nome: ${associado.nomeCompleto}`,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    }).catch(() => {});

    res.json({ sucesso: true, mensagem: `${associado.nomeCompleto} aprovado como associado` });
  } catch (error) {
    logger.error('Erro ao aprovar inscrição:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Rejeitar inscrição — remove o cadastro pendente (diretoria)
 */
async function rejeitar(req, res) {
  try {
    const id = parseInt(req.params.id);
    const associado = await prisma.associado.findUnique({ where: { id } });
    if (!associado) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }
    if (associado.situacao !== 'Pendente') {
      return res.status(400).json({ erro: 'Cadastro não está pendente' });
    }

    await prisma.associado.delete({ where: { id } });

    await prisma.log.create({
      data: {
        acao: 'Rejeitou Inscrição',
        detalhes: `Nome: ${associado.nomeCompleto}`,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    }).catch(() => {});

    res.json({ sucesso: true, mensagem: 'Inscrição rejeitada e removida' });
  } catch (error) {
    logger.error('Erro ao rejeitar inscrição:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

module.exports = {
  listarTodos,
  listarResumido,
  buscarPorCpf,
  buscarPorId,
  criar,
  atualizar,
  atualizarCadastro,
  inscricaoPublica,
  listarPendentes,
  aprovar,
  rejeitar,
  excluir,
  uploadFoto
};
