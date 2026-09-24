const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');
const { gerarToken, obterRole } = require('../middleware/auth');

/**
 * Login com CPF e senha
 */
async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const { cpf, senha } = req.body;
    const cpfLimpo = cpf.replace(/\D/g, '');

    // Buscar associado pelo CPF
    const associado = await prisma.associado.findFirst({
      where: {
        OR: [
          { cpf: cpfLimpo },
          { cpf: cpf }
        ]
      }
    });

    if (!associado) {
      // Mensagem genérica para não permitir enumeração de CPFs
      return res.status(401).json({ erro: 'CPF ou senha inválidos' });
    }

    // Verificar senha
    if (!associado.senha) {
      return res.status(401).json({ 
        erro: 'Senha não configurada. Por favor, contate a diretoria para configurar sua senha.' 
      });
    }

    const senhaValida = await bcrypt.compare(senha, associado.senha);
    
    if (!senhaValida) {
      // Registrar tentativa falha
      try {
        await prisma.log.create({
          data: {
            acao: 'Tentativa de login falha',
            detalhes: `CPF: ${cpf}`,
            associadoId: associado.id,
            ip: req.ip,
            userAgent: req.headers['user-agent']
          }
        });
      } catch (logError) {
        logger.error('Erro ao criar log:', logError);
      }
      
      return res.status(401).json({ erro: 'CPF ou senha inválidos' });
    }

    // Gerar token
    const token = gerarToken(associado);

    // Registrar login
    try {
      await prisma.log.create({
        data: {
          acao: 'Login',
          detalhes: `Perfil: ${associado.perfil}`,
          associadoId: associado.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      logger.error('Erro ao criar log:', logError);
    }

    logger.info(`Login realizado: ${associado.nomeCompleto} (${associado.cpf})`);

    // Verificar se cadastro está completo
    const precisaAtualizarCadastro = !associado.cadastroCompleto || !associado.senhaAlterada;

    res.json({
      sucesso: true,
      token,
      dados: {
        id: associado.id,
        nomeCompleto: associado.nomeCompleto,
        cpf: associado.cpf,
        perfil: associado.perfil,
        role: obterRole(associado.perfil),
        situacao: associado.situacao || 'Associado',
        iniciais: obterIniciais(associado.nomeCompleto),
        cadastroCompleto: associado.cadastroCompleto,
        senhaAlterada: associado.senhaAlterada,
        precisaAtualizarCadastro
      }
    });
  } catch (error) {
    logger.error('Erro no login:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Alterar senha
 */
async function alterarSenha(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const { senhaAtual, novaSenha } = req.body;
    const associadoId = req.user.id;

    const associado = await prisma.associado.findUnique({
      where: { id: associadoId }
    });

    if (!associado) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }

    // Verificar senha atual (senha pode ser null se ainda não definida)
    if (!associado.senha) {
      return res.status(400).json({ erro: 'Senha não configurada. Use a recuperação de senha ou contate a diretoria.' });
    }
    const senhaValida = await bcrypt.compare(senhaAtual, associado.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha atual incorreta' });
    }

    // Hash da nova senha
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha
    await prisma.associado.update({
      where: { id: associadoId },
      data: { senha: novaSenhaHash }
    });

    // Registrar log
    try {
      await prisma.log.create({
        data: {
          acao: 'Alterou senha',
          associadoId: associadoId,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      logger.error('Erro ao criar log:', logError);
    }

    res.json({ sucesso: true, mensagem: 'Senha alterada com sucesso' });
  } catch (error) {
    logger.error('Erro ao alterar senha:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Definir senha (para primeiro acesso ou reset)
 */
async function definirSenha(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const { cpf, novaSenha } = req.body;
    const cpfLimpo = cpf.replace(/\D/g, '');

    // Apenas admin pode definir senha sem autenticação
    if (!req.user || req.user.role !== 'presidente') {
      return res.status(403).json({ erro: 'Acesso negado' });
    }

    const associado = await prisma.associado.findFirst({
      where: {
        OR: [
          { cpf: cpfLimpo },
          { cpf: cpf }
        ]
      }
    });

    if (!associado) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.associado.update({
      where: { id: associado.id },
      data: { senha: novaSenhaHash }
    });

    try {
      await prisma.log.create({
        data: {
          acao: 'Definiu senha (admin)',
          detalhes: `CPF: ${cpf}`,
          associadoId: associado.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      logger.error('Erro ao criar log:', logError);
    }

    res.json({ sucesso: true, mensagem: 'Senha definida com sucesso' });
  } catch (error) {
    logger.error('Erro ao definir senha:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Obter dados do usuário logado
 */
async function obterPerfil(req, res) {
  try {
    const associado = await prisma.associado.findUnique({
      where: { id: req.user.id },
      include: {
        gestoes: true,
        _count: {
          select: { documentos: true }
        }
      }
    });

    if (!associado) {
      return res.status(404).json({ erro: 'Associado não encontrado' });
    }

    // Buscar cargo na gestão ativa (DiretoriaGestao)
    let cargoGestao = null;
    try {
      const gestaoAtiva = await prisma.gestao.findFirst({ where: { ativa: true } });
      if (gestaoAtiva) {
        const membro = await prisma.diretoriaGestao.findFirst({
          where: {
            gestaoId: gestaoAtiva.id,
            cpf: { contains: associado.cpf }
          }
        });
        if (membro) {
          cargoGestao = membro.cargo;
        }
      }
    } catch (e) { /* silently ignore */ }

    // Remover senha do retorno
    const { senha, ...dados } = associado;

    res.json({
      sucesso: true,
      dados: {
        ...dados,
        cargoGestao: cargoGestao,
        role: obterRole(associado.perfil),
        iniciais: obterIniciais(associado.nomeCompleto)
      }
    });
  } catch (error) {
    logger.error('Erro ao obter perfil:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Logout (registrar no banco)
 */
async function logout(req, res) {
  try {
    try {
      await prisma.log.create({
        data: {
          acao: 'Logout',
          associadoId: req.user.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      logger.error('Erro ao criar log:', logError);
    }

    res.json({ sucesso: true, mensagem: 'Logout realizado' });
  } catch (error) {
    logger.error('Erro no logout:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Recuperação de senha self-service (sem e-mail).
 * Verifica identidade por CPF + data de nascimento + email cadastrado.
 * Fortemente rate-limited na rota para evitar enumeração/força bruta.
 */
async function recuperarSenha(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }

    const { cpf, dataNascimento, email, novaSenha } = req.body;
    const cpfLimpo = String(cpf || '').replace(/\D/g, '');

    const associado = await prisma.associado.findFirst({
      where: { OR: [{ cpf: cpfLimpo }, { cpf }] }
    });

    // Mensagem genérica — não revelar qual campo falhou (anti-enumeração)
    const falha = () => res.status(401).json({ erro: 'Dados não conferem. Verifique CPF, data de nascimento e e-mail.' });

    if (!associado) return falha();

    // Conferir data de nascimento (compara só a parte da data)
    const nascInformado = String(dataNascimento || '').substring(0, 10);
    const nascCadastro = associado.dataNascimento
      ? new Date(associado.dataNascimento).toISOString().substring(0, 10)
      : null;
    if (!nascCadastro || nascInformado !== nascCadastro) return falha();

    // Conferir e-mail (case-insensitive)
    const emailInformado = String(email || '').trim().toLowerCase();
    const emailCadastro = String(associado.email || '').trim().toLowerCase();
    if (!emailCadastro || emailInformado !== emailCadastro) return falha();

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.associado.update({
      where: { id: associado.id },
      data: { senha: novaSenhaHash, senhaAlterada: true }
    });

    try {
      await prisma.log.create({
        data: {
          acao: 'Recuperou senha',
          detalhes: `CPF: ${cpfLimpo}`,
          associadoId: associado.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      logger.error('Erro ao criar log:', logError);
    }

    res.json({ sucesso: true, mensagem: 'Senha redefinida com sucesso. Faça login com a nova senha.' });
  } catch (error) {
    logger.error('Erro na recuperação de senha:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

// Helper para obter iniciais do nome
function obterIniciais(nome) {
  if (!nome) return '??';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

module.exports = {
  login,
  alterarSenha,
  definirSenha,
  recuperarSenha,
  obterPerfil,
  logout
};
