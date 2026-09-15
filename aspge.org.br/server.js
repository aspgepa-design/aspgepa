require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const logger = require('./src/config/logger');

// Importar rotas
const authRoutes = require('./src/routes/auth');
const associadoRoutes = require('./src/routes/associados');
const eventoRoutes = require('./src/routes/eventos');
const convenioRoutes = require('./src/routes/convenios');
const logRoutes = require('./src/routes/logs');
const financeiroRoutes = require('./src/routes/financeiro');
const carteirinhaRoutes = require('./src/routes/carteirinhas');
const votacaoRoutes = require('./src/routes/votacoes');
const gestaoRoutes = require('./src/routes/gestoes');
const siteConfigRoutes = require('./src/routes/siteConfig');
const noticiasRoutes = require('./src/routes/noticias');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações de segurança
app.use(helmet({
  contentSecurityPolicy: false, // Permitir inline scripts/styles do GAS legacy
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true
}));

// Compressão
app.use(compression());

// Logs HTTP
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Parse JSON e URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// View engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Arquivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '2.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/associados', associadoRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/convenios', convenioRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/carteirinhas', carteirinhaRoutes);
app.use('/api/votacoes', votacaoRoutes);
app.use('/api/gestoes', gestaoRoutes);
app.use('/api/site-config', siteConfigRoutes);
app.use('/api/noticias', noticiasRoutes);

// Rotas de Views (páginas HTML/EJS)

// Home (página pública)
app.get('/', (req, res) => {
  res.render('home', { title: 'ASPGE-PA - Associação dos Procuradores do Estado do Pará' });
});

// Login
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login - ASPGE-PA' });
});

// Portal (protegido)
app.get('/portal', (req, res) => {
  res.render('portal', { 
    title: 'Portal do Associado - ASPGE-PA',
    user: { nome: 'Usuário', iniciais: 'US', perfil: 'Associado', role: 'associado' },
    showSidebar: true
  });
});

// Inscrição (público)
app.get('/inscricao', (req, res) => {
  res.render('inscricao', { title: 'Ficha de Inscrição - ASPGE-PA' });
});

// Atualização cadastral (público)
app.get('/atualizar', (req, res) => {
  res.render('atualizacao', { title: 'Atualização Cadastral - ASPGE-PA' });
});

// Versões
app.get('/versoes', (req, res) => {
  res.render('versoes', { title: 'Histórico de Versões - ASPGE-PA' });
});

// Carteirinha digital
app.get('/carteirinha', (req, res) => {
  res.render('carteirinha', { title: 'Carteirinha Digital - ASPGE-PA' });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    nome: 'ASPGE-PA API',
    versao: '2.0.0',
    descricao: 'API do Sistema de Gestão de Associados',
    endpoints: {
      auth: '/api/auth',
      associados: '/api/associados',
      eventos: '/api/eventos',
      convenios: '/api/convenios',
      financeiro: '/api/financeiro',
      logs: '/api/logs',
      carteirinhas: '/api/carteirinhas',
      health: '/health'
    },
    documentacao: 'https://github.com/aspge/aspge-node'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Erro não tratado:', err);
  
  // Não enviar stack trace em produção
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    erro: err.message || 'Erro interno no servidor',
    ...(isDev && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`========================================`);
  logger.info(`Servidor ASPGE iniciado na porta ${PORT}`);
  logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`========================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido. Encerrando servidor...');
  process.exit(0);
});
