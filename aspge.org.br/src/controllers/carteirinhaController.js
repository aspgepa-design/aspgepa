const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs');

// Configurações padrão
const CONFIG_PADRAO = {
  frame: {
    left: 5,
    top: 20,
    width: 30,
    height: 60
  },
  campos: {
    cardNome: { left: 45, top: 30, fontSize: 3.5, color: '#1e3a5f', fontWeight: 700 },
    cardMatricula: { left: 45, top: 50, fontSize: 3, color: '#333', fontWeight: 400 },
    cardCargo: { left: 45, top: 62, fontSize: 3, color: '#555', fontWeight: 400 },
    cardEmissao: { left: 45, top: 75, fontSize: 2.5, color: '#666', fontWeight: 400 },
    cardValidade: { left: 70, top: 75, fontSize: 2.5, color: '#666', fontWeight: 400 },
    cardCpf: { left: 10, top: 45, fontSize: 3, color: '#333', fontWeight: 400 },
    cardRg: { left: 10, top: 55, fontSize: 3, color: '#333', fontWeight: 400 },
    cardLblNome: { left: 45, top: 22, fontSize: 2.5, color: '#666', fontWeight: 600, text: 'ASSOCIADO:' },
    cardLblMatricula: { left: 45, top: 44, fontSize: 2.5, color: '#666', fontWeight: 600, text: 'MATRÍCULA:' },
    cardLblCargo: { left: 45, top: 56, fontSize: 2.5, color: '#666', fontWeight: 600, text: 'CARGO:' },
    cardLblEmissao: { left: 45, top: 70, fontSize: 2, color: '#888', fontWeight: 400, text: 'EMISSÃO:' },
    cardLblValidade: { left: 70, top: 70, fontSize: 2, color: '#888', fontWeight: 400, text: 'VALIDADE:' },
    cardLblDadosPessoais: { left: 10, top: 20, fontSize: 3, color: '#1e3a5f', fontWeight: 700, text: 'DADOS PESSOAIS' },
    cardLblCpf: { left: 10, top: 38, fontSize: 2.5, color: '#666', fontWeight: 600, text: 'CPF:' },
    cardLblRg: { left: 10, top: 48, fontSize: 2.5, color: '#666', fontWeight: 600, text: 'RG:' }
  }
};

/**
 * Carregar configuração da carteirinha
 */
async function carregarConfig(req, res) {
  try {
    let config = await prisma.configCarteirinha.findFirst();

    if (!config) {
      // Criar configuração padrão
      config = await prisma.configCarteirinha.create({
        data: {
          config: JSON.stringify(CONFIG_PADRAO),
          templateFrente: null,
          templateVerso: null
        }
      });
    }

    res.json({
      config: config.config,
      templateFrente: config.templateFrente,
      templateVerso: config.templateVerso
    });
  } catch (error) {
    logger.error('Erro ao carregar config:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Salvar configuração da carteirinha
 */
async function salvarConfig(req, res) {
  try {
    const { config } = req.body;

    // Validar JSON
    let configObj;
    try {
      configObj = JSON.parse(config);
    } catch (e) {
      return res.status(400).json({ erro: 'JSON inválido' });
    }

    let configDb = await prisma.configCarteirinha.findFirst();

    if (configDb) {
      configDb = await prisma.configCarteirinha.update({
        where: { id: configDb.id },
        data: { config }
      });
    } else {
      configDb = await prisma.configCarteirinha.create({
        data: { config }
      });
    }

    try {
      await prisma.log.create({
        data: {
          acao: 'Atualizou Layout Carteirinha',
          associadoId: req.user?.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      logger.error('Erro ao criar log:', logError);
    }

    res.json({
      sucesso: true,
      mensagem: 'Configuração salva com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao salvar config:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Salvar template (frente ou verso)
 */
async function salvarTemplate(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo enviado' });
    }

    const { lado } = req.body; // 'frente' ou 'verso'
    
    if (!['frente', 'verso'].includes(lado)) {
      return res.status(400).json({ erro: 'Lado deve ser frente ou verso' });
    }

    // Renomear arquivo para o nome definitivo baseado no lado
    const ext = path.extname(req.file.filename).toLowerCase() || '.png';
    const finalFilename = `template_${lado}${ext}`;
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    const oldPath = path.join(uploadDir, 'templates', req.file.filename);
    const newPath = path.join(uploadDir, 'templates', finalFilename);
    
    // Remover arquivo antigo se existir
    if (fs.existsSync(newPath) && oldPath !== newPath) {
      fs.unlinkSync(newPath);
    }
    fs.renameSync(oldPath, newPath);

    const templatePath = `/uploads/templates/${finalFilename}`;

    let config = await prisma.configCarteirinha.findFirst();

    const dadosAtualizacao = lado === 'frente' 
      ? { templateFrente: templatePath }
      : { templateVerso: templatePath };

    if (config) {
      config = await prisma.configCarteirinha.update({
        where: { id: config.id },
        data: dadosAtualizacao
      });
    } else {
      config = await prisma.configCarteirinha.create({
        data: {
          config: JSON.stringify(CONFIG_PADRAO),
          ...dadosAtualizacao
        }
      });
    }

    try {
      await prisma.log.create({
        data: {
          acao: `Atualizou Template ${lado}`,
          associadoId: req.user?.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      logger.error('Erro ao criar log:', logError);
    }

    res.json({
      sucesso: true,
      mensagem: `Template ${lado} salvo com sucesso`,
      path: templatePath
    });
  } catch (error) {
    logger.error('Erro ao salvar template:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Excluir template (frente ou verso)
 */
async function excluirTemplate(req, res) {
  try {
    const { lado } = req.params; // 'frente' ou 'verso'
    
    if (!['frente', 'verso'].includes(lado)) {
      return res.status(400).json({ erro: 'Lado deve ser frente ou verso' });
    }

    const config = await prisma.configCarteirinha.findFirst();

    if (!config) {
      return res.status(404).json({ erro: 'Configuração não encontrada' });
    }

    const campo = lado === 'frente' ? 'templateFrente' : 'templateVerso';
    const templatePath = config[campo];

    if (!templatePath) {
      return res.status(404).json({ erro: 'Template não encontrado' });
    }

    // Remover arquivo do sistema (templatePath é '/uploads/templates/x.png' — extrair só o nome)
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    const fullPath = path.join(uploadDir, 'templates', path.basename(templatePath));
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Atualizar banco de dados
    const dadosAtualizacao = lado === 'frente' 
      ? { templateFrente: null }
      : { templateVerso: null };

    await prisma.configCarteirinha.update({
      where: { id: config.id },
      data: dadosAtualizacao
    });

    try {
      await prisma.log.create({
        data: {
          acao: `Excluiu Template ${lado}`,
          associadoId: req.user?.id,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        }
      });
    } catch (logError) {
      logger.error('Erro ao criar log:', logError);
    }

    res.json({
      sucesso: true,
      mensagem: `Template ${lado} excluído com sucesso`
    });
  } catch (error) {
    logger.error('Erro ao excluir template:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Obter dados para preview de carteirinha
 */
async function obterPreview(req, res) {
  try {
    const { cpf } = req.params;
    const cpfLimpo = cpf.replace(/\D/g, '');

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

    // Buscar config
    const config = await prisma.configCarteirinha.findFirst();

    // Buscar foto em base64
    let fotoBase64 = null;
    const fotoUrl = associado.fotoCarteirinhaUrl || associado.fotoUrl;
    
    if (fotoUrl) {
      try {
        const fs = require('fs');
        const path = require('path');
        const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
        
        // Extrair nome do arquivo da URL
        const match = fotoUrl.match(/fotos\/(\d+)\.(jpg|png|jpeg)$/);
        if (match) {
          const fotoPath = path.join(uploadDir, 'fotos', `${match[1]}.${match[2]}`);
          if (fs.existsSync(fotoPath)) {
            const buffer = fs.readFileSync(fotoPath);
            fotoBase64 = `data:image/${match[2]};base64,${buffer.toString('base64')}`;
          }
        }
      } catch (e) {
        logger.warn('Erro ao carregar foto para preview:', e.message);
      }
    }

    // Remover senha
    const { senha, ...dados } = associado;

    res.json({
      sucesso: true,
      dados,
      fotoBase64,
      config: config?.config || JSON.stringify(CONFIG_PADRAO)
    });
  } catch (error) {
    logger.error('Erro no preview:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Obter dados para exportação de múltiplas carteirinhas
 */
async function obterDadosExport(req, res) {
  try {
    const { cpfs } = req.body; // Array de CPFs

    if (!Array.isArray(cpfs) || cpfs.length === 0) {
      return res.status(400).json({ erro: 'Informe pelo menos um CPF' });
    }

    // Limitar a 50 por vez para não sobrecarregar
    const cpfsLimitados = cpfs.slice(0, 50);

    const resultados = [];
    for (const cpf of cpfsLimitados) {
      const cpfLimpo = cpf.replace(/\D/g, '');
      
      const associado = await prisma.associado.findFirst({
        where: {
          OR: [
            { cpf: cpfLimpo },
            { cpf: cpf }
          ]
        }
      });

      if (!associado) continue;

      // Carregar foto em base64
      let fotoBase64 = null;
      const fotoUrl = associado.fotoCarteirinhaUrl || associado.fotoUrl;
      
      if (fotoUrl) {
        try {
          const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
          const match = fotoUrl.match(/fotos\/(\d+)\.(jpg|png|jpeg)$/);
          if (match) {
            const fotoPath = path.join(uploadDir, 'fotos', `${match[1]}.${match[2]}`);
            if (fs.existsSync(fotoPath)) {
              const buffer = fs.readFileSync(fotoPath);
              fotoBase64 = `data:image/${match[2]};base64,${buffer.toString('base64')}`;
            }
          }
        } catch (e) {
          logger.warn('Erro ao carregar foto:', e.message);
        }
      }

      const { senha, ...dados } = associado;
      
      resultados.push({
        dados,
        fotoBase64
      });
    }

    // Buscar templates
    const config = await prisma.configCarteirinha.findFirst();
    let templateBase64Frente = null;
    let templateBase64Verso = null;

    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';

    if (config?.templateFrente) {
      try {
        const templatePath = path.join(uploadDir, 'templates', path.basename(config.templateFrente));
        if (fs.existsSync(templatePath)) {
          const buffer = fs.readFileSync(templatePath);
          const ext = path.extname(templatePath).slice(1);
          templateBase64Frente = `data:image/${ext};base64,${buffer.toString('base64')}`;
        }
      } catch (e) {
        logger.warn('Erro ao carregar template frente:', e.message);
      }
    }

    if (config?.templateVerso) {
      try {
        const templatePath = path.join(uploadDir, 'templates', path.basename(config.templateVerso));
        if (fs.existsSync(templatePath)) {
          const buffer = fs.readFileSync(templatePath);
          const ext = path.extname(templatePath).slice(1);
          templateBase64Verso = `data:image/${ext};base64,${buffer.toString('base64')}`;
        }
      } catch (e) {
        logger.warn('Erro ao carregar template verso:', e.message);
      }
    }

    await prisma.log.create({
      data: {
        acao: 'Exportou Carteirinhas',
        detalhes: `${resultados.length} carteirinha(s)`,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    res.json({
      sucesso: true,
      carteirinhas: resultados,
      templateBase64Frente,
      templateBase64Verso
    });
  } catch (error) {
    logger.error('Erro na exportação:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

/**
 * Gerar PDF de carteirinhas (TODO: implementar com Puppeteer)
 */
async function gerarPdf(req, res) {
  try {
    // TODO: Implementar geração de PDF server-side com Puppeteer
    // Por enquanto retorna erro indicando que deve usar o método antigo (frontend)
    res.status(501).json({ 
      erro: 'Geração de PDF server-side em desenvolvimento. Use o método frontend por enquanto.'
    });
  } catch (error) {
    logger.error('Erro ao gerar PDF:', error);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

module.exports = {
  carregarConfig,
  salvarConfig,
  salvarTemplate,
  excluirTemplate,
  obterPreview,
  obterDadosExport,
  gerarPdf
};
