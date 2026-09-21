# ASPGE-PA - Sistema de Gestão de Associados

Sistema web completo para gestão de associados da **Associação dos Servidores da Procuradoria Geral do Estado do Pará (ASPGE-PA)**.

## 📋 Visão Geral

Este projeto consiste em dois sistemas integrados:

1. **ASPGE-PA GAS** (Google Apps Script) - Sistema legado em produção
2. **ASPGE-PA API v2.0** (Node.js/Express + PostgreSQL) - Nova API em desenvolvimento

### Stack Tecnológica

**API v2.0 (este projeto):**
- **Backend:** Node.js 18+ com Express
- **Banco de dados:** PostgreSQL 14+ com Prisma ORM
- **Autenticação:** JWT (JSON Web Tokens)
- **Upload:** Multer
- **Geração PDF:** Puppeteer + pdf-lib
- **Process Manager:** PM2
- **Web Server:** Nginx
- **View Engine:** EJS

**Servidor de Produção:**
- **VPS:** HostGator (São Paulo, Brasil)
- **IP:** 129.121.49.246:22022
- **SO:** Ubuntu 22.04
- **Recursos:** 2 vCPUs, 4GB RAM, 100GB SSD

## 🏗️ Estrutura do Projeto

```
aspge.org.br/
├── src/
│   ├── config/              # Configurações (Database, Logger)
│   │   ├── database.js      # Cliente Prisma
│   │   └── logger.js        # Winston config
│   ├── controllers/         # Lógica de negócio (11 controllers)
│   │   ├── authController.js
│   │   ├── associadoController.js
│   │   ├── eventoController.js
│   │   ├── convenioController.js
│   │   ├── financeiroController.js
│   │   ├── carteirinhaController.js
│   │   ├── votacaoController.js
│   │   ├── gestaoController.js
│   │   ├── logController.js
│   │   ├── noticiasController.js
│   │   └── siteConfigController.js
│   ├── middleware/         # Middleware de autenticação e upload
│   │   ├── auth.js          # JWT + autorização por perfil
│   │   └── upload.js        # Configuração Multer
│   ├── routes/              # Rotas da API (11 arquivos)
│   │   ├── auth.js
│   │   ├── associados.js
│   │   ├── eventos.js
│   │   ├── convenios.js
│   │   ├── financeiro.js
│   │   ├── carteirinhas.js
│   │   ├── votacoes.js
│   │   ├── gestoes.js
│   │   ├── logs.js
│   │   ├── noticias.js
│   │   └── siteConfig.js
│   └── views/               # Templates EJS
│       ├── login.ejs
│       ├── portal.ejs
│       ├── inscricao.ejs
│       ├── atualizacao.ejs
│       ├── carteirinha.ejs
│       ├── versoes.ejs
│       └── partials/       # Componentes reutilizáveis
├── prisma/
│   └── schema.prisma        # Modelo de dados (12 models)
├── public/
│   └── uploads/             # Arquivos estáticos
│       ├── fotos/           # Fotos dos associados
│       ├── documentos/      # Documentos anexados
│       ├── carteirinhas/    # Carteirinhas geradas
│       └── templates/       # Templates frente/verso
├── scripts/                # Scripts de utilidade
│   ├── migrar-dados.js      # Migração CSV → PostgreSQL
│   ├── download-fotos.js    # Download do Google Drive
│   ├── deploy.sh            # Setup automático do VPS
│   └── import-associados.js # Importação de associados
├── logs/                    # Logs da aplicação
├── dev/                     # Documentação para desenvolvedores
├── server.js                # Entry point da aplicação
├── package.json             # Dependências NPM
├── ecosystem.config.cjs     # Configuração PM2
└── .env                     # Variáveis de ambiente (não versionado)
```

## 🗄️ Modelo de Dados

**Prisma Schema (12 models):**

- **Associado** - Dados pessoais, perfil, cadastro
- **Evento** - Eventos da associação
- **Convenio** - Convênios e benefícios
- **Lancamento** - Transações financeiras
- **Votacao** - Pautas de votação
- **Gestao** - Gestões da diretoria
- **DiretoriaGestao** - Membros da diretoria
- **Documento** - Documentos dos associados
- **Log** - Logs de auditoria
- **ConfigCarteirinha** - Configuração de carteirinhas
- **SiteConfig** - Configurações do site público
- **Noticia** - Notícias e comunicados

## 🔐 Perfis de Acesso

| Perfil | Permissões |
|--------|------------|
| **Associado** | Acesso ao portal, atualização cadastral, visualização |
| **Tesoureiro** | Gestão financeira completa |
| **Diretor** | Gestão de eventos e convênios |
| **Presidente** | Todas as permissões + exclusão de associados |

## 🚀 Endpoints da API

### Autenticação
- `POST /api/auth/login` - Login com CPF e senha
- `GET /api/auth/perfil` - Obter perfil do usuário logado
- `POST /api/auth/logout` - Registrar logout
- `POST /api/auth/alterar-senha` - Alterar senha própria
- `POST /api/auth/definir-senha` - Definir senha (admin)

### Associados
- `GET /api/associados` - Listar todos (diretoria)
- `GET /api/associados/resumido` - Listar resumido
- `GET /api/associados/cpf/:cpf` - Buscar por CPF
- `GET /api/associados/:id` - Buscar por ID
- `POST /api/associados` - Criar novo (diretoria)
- `PUT /api/associados/:id` - Atualizar
- `DELETE /api/associados/:id` - Excluir (presidente)
- `POST /api/associados/:id/foto` - Upload de foto

### Eventos
- `GET /api/eventos` - Listar eventos
- `POST /api/eventos` - Criar evento (diretoria)
- `PUT /api/eventos/:id` - Atualizar evento
- `DELETE /api/eventos/:id` - Excluir evento

### Convênios
- `GET /api/convenios` - Listar convênios
- `POST /api/convenios` - Criar convênio (diretoria)
- `PUT /api/convenios/:id` - Atualizar convênio
- `DELETE /api/convenios/:id` - Excluir convênio

### Financeiro
- `GET /api/financeiro` - Listar lançamentos
- `POST /api/financeiro` - Criar lançamento (tesoureiro)
- `DELETE /api/financeiro/:id` - Excluir lançamento (tesoureiro)

### Carteirinhas
- `GET /api/carteirinhas/:cpf` - Gerar carteirinha digital
- `POST /api/carteirinhas/config` - Configurar template (admin)

### Votações
- `GET /api/votacoes` - Listar votações
- `POST /api/votacoes` - Criar votação (diretoria)
- `POST /api/votacoes/:id/votar` - Registrar voto

### Gestões
- `GET /api/gestoes` - Listar gestões
- `POST /api/gestoes` - Criar gestão (presidente)
- `PUT /api/gestoes/:id` - Atualizar gestão

### Site Config
- `GET /api/site-config` - Obter configurações
- `PUT /api/site-config` - Atualizar configurações (admin)

### Notícias
- `GET /api/noticias` - Listar notícias
- `POST /api/noticias` - Criar notícia (diretoria)
- `PUT /api/noticias/:id` - Atualizar notícia
- `DELETE /api/noticias/:id` - Excluir notícia

### Logs
- `GET /api/logs` - Listar logs (admin)

### Páginas Web
- `GET /` - Home pública
- `GET /login` - Página de login
- `GET /portal` - Portal do associado (protegido)
- `GET /inscricao` - Ficha de inscrição
- `GET /atualizar` - Atualização cadastral
- `GET /carteirinha` - Carteirinha digital
- `GET /versoes` - Histórico de versões

### Health Check
- `GET /health` - Status da aplicação
- `GET /api` - Informações da API

## ⚙️ Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| NODE_ENV | Ambiente (development/production) | development |
| PORT | Porta do servidor | 3000 |
| DATABASE_URL | URL de conexão PostgreSQL | - |
| JWT_SECRET | Segredo para JWT (mínimo 32 caracteres) | - |
| JWT_EXPIRES_IN | Expiração do token | 24h |
| UPLOAD_DIR | Diretório de uploads | ./public/uploads |
| MAX_FILE_SIZE | Tamanho máximo de arquivo | 5242880 (5MB) |
| LOG_LEVEL | Nível de log (error, warn, info, debug) | info |
| LOG_DIR | Diretório de logs | ./logs |
| APP_URL | URL base da aplicação | http://localhost:3000 |

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Passos

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# 3. Configurar banco de dados
createdb aspge
npx prisma migrate dev --name init
npx prisma generate

# 4. Iniciar servidor
npm run dev  # Desenvolvimento
npm start    # Produção
```

## 🚢 Deploy em Produção

Para instruções detalhadas de deploy, consulte:
- **[DEPLOY.md](DEPLOY.md)** - Guia completo de deploy no VPS
- **[QUICKSTART.md](QUICKSTART.md)** - Guia rápido de início

### Resumo do Deploy

```bash
# Acessar VPS
ssh root@129.121.49.246 -p 22022

# Instalar dependências
cd /var/www/aspge
npm install --production
npx prisma migrate deploy
npx prisma generate

# Iniciar com PM2
pm2 start server.js --name aspge-api
pm2 save
pm2 startup
```

## 📚 Documentação Adicional

- **[dev/](dev/)** - Documentação técnica para desenvolvedores
- **[DEPLOY.md](DEPLOY.md)** - Guia de deploy e manutenção
- **[QUICKSTART.md](QUICKSTART.md)** - Guia rápido de início
- **[PROJETO-CRIADO.md](PROJETO-CRIADO.md)** - Resumo do projeto criado

## 🔧 Scripts NPM

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia servidor em produção |
| `npm run dev` | Inicia servidor com nodemon (dev) |
| `npm run db:migrate` | Cria nova migração Prisma |
| `npm run db:generate` | Gera cliente Prisma |
| `npm run db:studio` | Abre Prisma Studio (GUI) |
| `npm run db:seed` | Executa seed de dados |
| `npm run test:local` | Teste local completo |

## 🔒 Segurança

- Senhas hasheadas com bcrypt (10 rounds)
- Autenticação JWT com expiração configurável
- Helmet.js para headers de segurança
- CORS configurado
- Upload limitado a 5MB
- Validação de dados com express-validator
- SQL injection protegido via Prisma ORM
- Autorização por perfil de usuário

## 📊 Servidor de Produção

**Especificações:**
- **IP:** 129.121.49.246
- **Porta SSH:** 22022
- **Localização:** São Paulo, Brasil
- **SO:** Ubuntu 22.04
- **CPU:** 2 vCPUs
- **RAM:** 4 GB
- **Armazenamento:** 100 GB SSD

**Serviços Ativos:**
- Nginx 1.18.0
- PostgreSQL 14
- Node.js (PM2)
- Fail2ban

## 📝 Licença

MIT - ASPGE-PA

## 🤝 Contribuindo

Este é um projeto interno da ASPGE-PA. Para contribuições, entre em contato com a equipe de TI.
