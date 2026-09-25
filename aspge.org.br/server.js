require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const logger = require('./src/config/logger');
const swaggerSpec = require('./src/config/swagger');

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
const documentoRoutes = require('./src/routes/documentos');
const dependenteRoutes = require('./src/routes/dependentes');

const { obterVersoes } = require('./src/services/versoesService');

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

// Rate limiting
// Geral: protege toda a API contra abuso
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente mais tarde.' }
});
// Auth: mais restrito p/ mitigar força bruta no login
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Tente novamente em alguns minutos.' }
});
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Parse JSON e URL encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// View engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Arquivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// PWA: service worker e manifest precisam estar no escopo raiz
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'public', 'sw.js'));
});
app.get('/manifest.webmanifest', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.sendFile(path.join(__dirname, 'public', 'manifest.webmanifest'));
});

// Documentação interativa da API (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'ASPGE-PA API Docs' }));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

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
app.use('/api/documentos', documentoRoutes);
app.use('/api/dependentes', dependenteRoutes);
app.use('/api/site-config', siteConfigRoutes);
app.use('/api/noticias', noticiasRoutes);

// Rotas de Views (páginas HTML/EJS)

// Home (página pública)
app.get('/', (req, res) => {
  res.render('home', { title: 'ASPGE-PA - Associação dos Servidores da Procuradoria-Geral do Estado do Pará' });
});

// Login
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login - ASPGE-PA' });
});

// Portal (protegido — dados do usuário carregados via JS/API)
app.get('/portal', (req, res) => {
  let versaoAtual = 'v2.0.0';
  try { const v = obterVersoes().versoes; if (v && v[0] && v[0].versao) versaoAtual = v[0].versao; } catch (e) {}
  res.render('portal', { title: 'Portal do Associado - ASPGE-PA', versaoAtual });
});

// Inscrição (público)
app.get('/inscricao', (req, res) => {
  res.render('inscricao', { title: 'Ficha de Inscrição - ASPGE-PA' });
});

// Atualização cadastral (público)
app.get('/atualizacao', (req, res) => {
  res.render('atualizacao', { title: 'Atualização Cadastral - ASPGE-PA' });
});

// Versões (gerada a partir do git log — ver src/services/versoesService.js)
app.get('/versoes', (req, res) => {
  const { versoes, marcos } = obterVersoes();
  res.render('versoes', { title: 'Histórico de Versões - ASPGE-PA', versoes, marcos });
});

// Diretoria (público)
app.get('/diretoria', (req, res) => {
  res.render('diretoria', { title: 'Diretoria - ASPGE-PA' });
});

// Convênio — página de detalhe (público)
app.get('/convenios/:id', (req, res) => {
  res.render('convenio', { title: 'Convênio - ASPGE-PA' });
});

// Notícias (público): lista e detalhe
app.get('/noticias', (req, res) => {
  res.render('noticias', { title: 'Notícias - ASPGE-PA', noticiaId: null });
});
app.get('/noticias/:id', (req, res) => {
  res.render('noticias', { title: 'Notícia - ASPGE-PA', noticiaId: req.params.id });
});

// Carteirinha digital agora é renderizada dentro do /portal (aba Início)

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
