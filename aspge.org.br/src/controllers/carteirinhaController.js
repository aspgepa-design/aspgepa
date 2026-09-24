const { validationResult } = require('express-validator');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
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
 * Gerar PDF de carteirinhas (server-side com pdf-lib).
 * Body: { cpfs: [...] } — renderiza frente (e verso se houver template) em grade A4.
 */
async function gerarPdf(req, res) {
  try {
    const { cpfs } = req.body;
    if (!Array.isArray(cpfs) || cpfs.length === 0) {
      return res.status(400).json({ erro: 'Informe pelo menos um CPF' });
    }

    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    const config = await prisma.configCarteirinha.findFirst();
    const cfg = config?.config ? JSON.parse(config.config) : CONFIG_PADRAO;

    // Dimensões do cartão CR80 em pontos (1mm = 2.83465pt)
    const CARD_W = 85.6 * 2.83465;
    const CARD_H = 53.98 * 2.83465;
    const PAGE_W = 595.28, PAGE_H = 841.89; // A4
    const MARGIN = 28;
    const COLS = 2, ROWS = 5;
    const GAP_X = (PAGE_W - 2 * MARGIN - COLS * CARD_W) / (COLS - 1);
    const GAP_Y = (PAGE_H - 2 * MARGIN - ROWS * CARD_H) / (ROWS - 1);

    const doc = await PDFDocument.create();
    const fonteNormal = await doc.embedFont(StandardFonts.Helvetica);
    const fonteBold = await doc.embedFont(StandardFonts.HelveticaBold);

    // Embute templates (se existirem)
    const embutir = async (rel) => {
      if (!rel) return null;
      const p = path.join(uploadDir, 'templates', path.basename(rel));
      if (!fs.existsSync(p)) return null;
      const buf = fs.readFileSync(p);
      const ext = path.extname(p).toLowerCase();
      return ext === '.png' ? doc.embedPng(buf) : doc.embedJpg(buf);
    };
    const tplFrente = await embutir(config?.templateFrente);
    const tplVerso = await embutir(config?.templateVerso);

    // Carrega associados
    const associados = [];
    for (const cpf of cpfs.slice(0, 50)) {
      const cpfLimpo = String(cpf).replace(/\D/g, '');
      const a = await prisma.associado.findFirst({ where: { OR: [{ cpf: cpfLimpo }, { cpf }] } });
      if (a) associados.push(a);
    }
    if (associados.length === 0) {
      return res.status(404).json({ erro: 'Nenhum associado encontrado' });
    }

    const hexToRgb = (hex) => {
      const m = String(hex || '#000000').replace('#', '');
      const n = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
      return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
    };

    const valorCampo = (key, a) => {
      const hoje = new Date();
      const emissao = `${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
      const validade = `${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear() + 2}`;
      const mapa = {
        cardNome: a.nomeCompleto,
        cardMatricula: a.matricula,
        cardCargo: a.cargo,
        cardEmissao: emissao,
        cardValidade: validade,
        cardCpf: a.cpf,
        cardRg: a.rg
      };
      return mapa[key];
    };

    const desenharFrente = async (page, a, ox, oy) => {
      if (tplFrente) {
        page.drawImage(tplFrente, { x: ox, y: oy, width: CARD_W, height: CARD_H });
      } else {
        page.drawRectangle({ x: ox, y: oy, width: CARD_W, height: CARD_H, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 0.5 });
      }
      // Foto no frame
      const fotoUrl = a.fotoCarteirinhaUrl || a.fotoUrl;
      if (fotoUrl) {
        const m = fotoUrl.match(/fotos\/(\d+)\.(jpg|jpeg|png)$/i);
        if (m) {
          const fp = path.join(uploadDir, 'fotos', `${m[1]}.${m[2]}`);
          if (fs.existsSync(fp)) {
            try {
              const img = m[2].toLowerCase() === 'png' ? await doc.embedPng(fs.readFileSync(fp)) : await doc.embedJpg(fs.readFileSync(fp));
              const f = cfg.frame || CONFIG_PADRAO.frame;
              page.drawImage(img, {
                x: ox + (f.left / 100) * CARD_W,
                y: oy + CARD_H - ((f.top + f.height) / 100) * CARD_H,
                width: (f.width / 100) * CARD_W,
                height: (f.height / 100) * CARD_H
              });
            } catch (e) { logger.warn('Foto não embutida:', e.message); }
          }
        }
      }
      // Campos de texto
      for (const [key, c] of Object.entries(cfg.campos || {})) {
        const texto = c.text !== undefined ? c.text : valorCampo(key, a);
        if (!texto) continue;
        const size = Math.max(4, (c.fontSize / 100) * CARD_H);
        page.drawText(String(texto), {
          x: ox + (c.left / 100) * CARD_W,
          y: oy + CARD_H - (c.top / 100) * CARD_H - size,
          size,
          font: (c.fontWeight >= 600) ? fonteBold : fonteNormal,
          color: hexToRgb(c.color)
        });
      }
    };

    // Paginação: frente (e verso espelhado p/ duplex) por página
    for (let i = 0; i < associados.length; i += COLS * ROWS) {
      const lote = associados.slice(i, i + COLS * ROWS);
      const pagFrente = doc.addPage([PAGE_W, PAGE_H]);
      for (let j = 0; j < lote.length; j++) {
        const col = j % COLS, row = Math.floor(j / COLS);
        const ox = MARGIN + col * (CARD_W + GAP_X);
        const oy = PAGE_H - MARGIN - (row + 1) * CARD_H - row * GAP_Y;
        await desenharFrente(pagFrente, lote[j], ox, oy);
      }
      if (tplVerso) {
        const pagVerso = doc.addPage([PAGE_W, PAGE_H]);
        for (let j = 0; j < lote.length; j++) {
          const col = j % COLS, row = Math.floor(j / COLS);
          // Espelha horizontalmente para impressão frente-e-verso
          const ox = MARGIN + (COLS - 1 - col) * (CARD_W + GAP_X);
          const oy = PAGE_H - MARGIN - (row + 1) * CARD_H - row * GAP_Y;
          pagVerso.drawImage(tplVerso, { x: ox, y: oy, width: CARD_W, height: CARD_H });
        }
      }
    }

    await prisma.log.create({
      data: {
        acao: 'Gerou PDF de Carteirinhas',
        detalhes: `${associados.length} carteirinha(s)`,
        associadoId: req.user?.id,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    }).catch(() => {});

    const pdfBytes = await doc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="carteirinhas.pdf"');
    res.send(Buffer.from(pdfBytes));
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
