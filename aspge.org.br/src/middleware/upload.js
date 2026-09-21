const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';

// Criar diretórios se não existirem
const dirs = ['fotos', 'documentos', 'carteirinhas', 'templates'];
dirs.forEach(dir => {
  const fullPath = path.join(UPLOAD_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Storage para fotos de associados
const fotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_DIR, 'fotos'));
  },
  filename: (req, file, cb) => {
    // Nome do arquivo = ID do associado da rota (/:id/foto), não o CPF de quem envia
    const identificador = String(req.params.id || 'sem-id').replace(/\D/g, '');
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${identificador}${ext}`);
  }
});

// Storage para documentos
const documentoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const cpf = req.body.cpf || req.user.cpf;
    const dir = path.join(UPLOAD_DIR, 'documentos', cpf.replace(/\D/g, ''));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Storage para templates de carteirinha
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_DIR, 'templates'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    // Usar timestamp temporário; o controller renomeia com base em req.body.lado
    cb(null, `template_upload_${Date.now()}${ext}`);
  }
});

// Filtro de arquivos (apenas imagens)
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Apenas imagens (JPEG, PNG, GIF, WebP) são permitidas.'), false);
  }
};

// Filtro de documentos
const documentoFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Apenas PDF, imagens e Word são permitidos.'), false);
  }
};

// Configurações do multer
const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
};

// Middlewares
const uploadFoto = multer({
  storage: fotoStorage,
  fileFilter: imageFilter,
  limits
});

const uploadDocumento = multer({
  storage: documentoStorage,
  fileFilter: documentoFilter,
  limits
});

const uploadTemplate = multer({
  storage: templateStorage,
  fileFilter: imageFilter,
  limits
});

// Middleware de tratamento de erros do multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        erro: `Arquivo muito grande. Tamanho máximo: ${(limits.fileSize / 1024 / 1024).toFixed(1)}MB` 
      });
    }
    return res.status(400).json({ erro: `Erro no upload: ${err.message}` });
  }
  
  if (err) {
    logger.error('Erro no upload:', err);
    return res.status(400).json({ erro: err.message });
  }
  
  next();
};

// Função para obter URL pública do arquivo
function getFileUrl(tipo, filename, subpath = '') {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  
  switch (tipo) {
    case 'foto':
      return `${baseUrl}/uploads/fotos/${filename}`;
    case 'documento':
      return `${baseUrl}/uploads/documentos/${subpath}/${filename}`;
    case 'template':
      return `${baseUrl}/uploads/templates/${filename}`;
    default:
      return null;
  }
}

// Função para deletar arquivo
function deleteFile(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
  } catch (error) {
    logger.error('Erro ao deletar arquivo:', error);
  }
  return false;
}

module.exports = {
  uploadFoto,
  uploadDocumento,
  uploadTemplate,
  handleUploadError,
  getFileUrl,
  deleteFile,
  UPLOAD_DIR
};
