# Arquitetura do Sistema ASPGE-PA

## Visão Geral

O sistema ASPGE-PA segue uma arquitetura **MVC (Model-View-Controller)** com separação clara de responsabilidades, organizada em camadas.

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         Cliente                               │
│  (Browser / Mobile App - via API REST ou Views EJS)         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      Nginx (Reverse Proxy)                    │
│  - SSL/TLS termination                                         │
│  - Static file serving                                        │
│  - Load balancing (futuro)                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │ Port 3000
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js (API Server)                     │
│  - Middleware (Auth, Upload, Validation)                      │
│  - Routes                                                     │
│  - Error handling                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Controllers  │  │  Services    │  │   Views      │
│ (Lógica)     │  │  (PDF, etc)  │  │   (EJS)      │
└──────┬───────┘  └──────────────┘  └──────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Prisma ORM                                  │
│  - Query builder                                              │
│  - Type safety                                                │
│  - Migrations                                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 PostgreSQL 14                                │
│  - Banco de dados relacional                                │
│  - Índices e constraints                                     │
└─────────────────────────────────────────────────────────────┘
```

## Camadas da Aplicação

### 1. **Camada de Apresentação (Presentation Layer)**

**Arquivos:** `src/views/`, `public/`

- **EJS Templates:** Renderização de páginas HTML no servidor
- **Arquivos Estáticos:** CSS, JS, imagens servidos via Express/Nginx
- **API REST:** Endpoints JSON para consumo por frontend SPA/mobile

### 2. **Camada de Roteamento (Routing Layer)**

**Arquivos:** `src/routes/`

- Definição de endpoints HTTP
- Mapeamento de rotas para controllers
- Validação de parâmetros de rota
- Aplicação de middleware específico por rota

### 3. **Camada de Middleware (Middleware Layer)**

**Arquivos:** `src/middleware/`

- **auth.js:** Autenticação JWT e autorização por perfil
- **upload.js:** Configuração de upload de arquivos (Multer)
- **Helmet:** Headers de segurança
- **CORS:** Controle de acesso cross-origin
- **Morgan:** Logging de requisições HTTP
- **Compression:** Compressão de respostas

### 4. **Camada de Controladores (Controller Layer)**

**Arquivos:** `src/controllers/`

- **Responsabilidade:** Lógica de negócio e orquestração
- **Controllers:**
  - `authController.js`: Autenticação e gerenciamento de sessão
  - `associadoController.js`: CRUD de associados
  - `eventoController.js`: Gestão de eventos
  - `convenioController.js`: Gestão de convênios
  - `financeiroController.js`: Gestão financeira
  - `carteirinhaController.js`: Geração de carteirinhas
  - `votacaoController.js`: Sistema de votações
  - `gestaoController.js`: Gestão de diretoria
  - `logController.js`: Auditoria
  - `noticiasController.js`: Gestão de notícias
  - `siteConfigController.js`: Configurações do site

### 5. **Camada de Serviços (Service Layer)**

**Arquivos:** `src/services/` (futuro)

- Serviços reutilizáveis (ex: geração de PDF, envio de email)
- Integrações externas (Google APIs, etc.)
- Lógica de negócio complexa

### 6. **Camada de Acesso a Dados (Data Access Layer)**

**Arquivos:** `prisma/`, `src/config/database.js`

- **Prisma ORM:** Abstração do banco de dados
- **Migrations:** Versionamento do schema
- **Type Safety:** Tipagem TypeScript-like em JavaScript

### 7. **Camada de Infraestrutura (Infrastructure Layer)**

**Arquivos:** `src/config/`, `logs/`

- **logger.js:** Configuração Winston (logging)
- **database.js:** Cliente Prisma
- **PM2:** Process management
- **Nginx:** Web server e reverse proxy

## Fluxo de Requisição

### Requisição API REST

```
1. Cliente → Nginx (HTTPS)
2. Nginx → Express (Port 3000)
3. Express → Middleware (Helmet, CORS, Morgan)
4. Express → Router (routes/)
5. Router → Middleware (Auth, Validation)
6. Router → Controller
7. Controller → Prisma ORM
8. Prisma → PostgreSQL
9. PostgreSQL → Prisma
10. Prisma → Controller
11. Controller → Response
12. Express → Nginx
13. Nginx → Cliente
```

### Requisição de Página EJS

```
1. Cliente → Nginx (HTTPS)
2. Nginx → Express (Port 3000)
3. Express → Middleware
4. Express → Route Handler (server.js)
5. Route Handler → EJS Renderer
6. EJS → HTML
7. Express → Nginx
8. Nginx → Cliente
```

## Padrões Utilizados

### 1. **MVC (Model-View-Controller)**
- **Model:** Prisma Schema (banco de dados)
- **View:** EJS Templates ou JSON responses
- **Controller:** Lógica de negócio

### 2. **Middleware Pattern**
- Chain of responsibility para processamento de requisições
- Autenticação, validação, logging como middleware

### 3. **Repository Pattern (via Prisma)**
- Abstração do acesso a dados
- Queries type-safe

### 4. **Dependency Injection**
- Controllers recebem dependências (ex: Prisma client)
- Facilita testes e manutenção

### 5. **Error Handling Centralizado**
- Error handler global em `server.js`
- Logging automático de erros

## Segurança

### Autenticação e Autorização
- **JWT (JSON Web Tokens):** Stateless authentication
- **Bcrypt:** Hash de senhas (10 rounds)
- **Role-based Access Control (RBAC):** Perfis de usuário

### Headers de Segurança
- **Helmet.js:** Headers HTTP seguros
- **CORS:** Controle de origens permitidas
- **Rate Limiting:** (futuro) Prevenção de abuso

### Validação
- **express-validator:** Validação de input
- **Prisma:** SQL injection protection via ORM

## Escalabilidade

### Horizontal Scaling (Futuro)
- **PM2 Cluster Mode:** Múltiplos processos
- **Nginx Load Balancing:** Distribuição de carga
- **Redis:** Cache e sessões distribuídas

### Vertical Scaling
- **VPS atual:** 2 vCPUs, 4GB RAM
- **Upgrade possível:** Mais recursos conforme necessidade

## Monitoramento e Logging

### Winston Logger
- **Níveis:** error, warn, info, debug
- **Transports:** Console e arquivo
- **Logs HTTP:** Morgan integration

### PM2 Monitoring
- **Process status:** Online/offline, restarts
- **Resource usage:** CPU, memory
- **Logs:** Application logs

### Health Check
- **Endpoint:** `/health`
- **Retorna:** Status, timestamp, versão

## Backup e Recuperação

### Banco de Dados
- **Backup:** `pg_dump` manual ou automatizado
- **Frequência:** Diária (recomendado)
- **Retenção:** 30 dias (recomendado)

### Arquivos
- **Uploads:** Backup periódico de `public/uploads/`
- **Templates:** Versionados no Git

## Performance

### Otimizações Atuais
- **Compression:** Gzip nas respostas
- **Static files:** Servidos via Nginx
- **Database indexes:** Índices em colunas frequentemente consultadas

### Otimizações Futuras
- **Redis:** Cache de dados frequentemente acessados
- **CDN:** Distribuição de arquivos estáticos
- **Database connection pooling:** Prisma já implementa

## Integrações Externas

### Google APIs
- **Google Drive:** Download de fotos (script `download-fotos.js`)
- **Google Sheets:** Migração de dados (script `migrar-dados.js`)

### Futuras Integrações
- **Gateway de pagamento:** Para mensalidades
- **Email service:** Notificações
- **SMS service:** Notificações via WhatsApp/SMS

## Ambientes

### Development
- **NODE_ENV:** development
- **Database:** Local PostgreSQL
- **Logging:** Debug level
- **Hot reload:** Nodemon

### Production
- **NODE_ENV:** production
- **Database:** PostgreSQL no VPS
- **Logging:** Info level
- **Process manager:** PM2
- **Web server:** Nginx

## Versionamento

### Git Flow
- **main:** Branch de produção
- **develop:** Branch de desenvolvimento
- **feature/**: Branches de funcionalidades

### Migrations
- **Prisma Migrate:** Versionamento do schema
- **Deploy:** `npx prisma migrate deploy`

## Convenções de Código

### JavaScript
- **ES6+:** Features modernas
- **Async/await:** Código assíncrono
- **Arrow functions:** Funções curtas
- **Modules:** CommonJS (require/module.exports)

### Nomenclatura
- **Arquivos:** kebab-case (ex: `authController.js`)
- **Variáveis:** camelCase (ex: `nomeCompleto`)
- **Constantes:** UPPER_SNAKE_CASE (ex: `JWT_SECRET`)
- **Classes:** PascalCase (ex: `Associado`)

### Estrutura de Arquivos
- **Um arquivo por controller/route**
- **Imports no topo**
- **Exports no final**

## Testes (Futuro)

### Unit Tests
- **Jest:** Framework de testes
- **Controllers:** Testes de lógica
- **Services:** Testes de serviços

### Integration Tests
- **Supertest:** Testes de API
- **Database:** Testes com Prisma mock

### E2E Tests
- **Playwright/Cypress:** Testes de interface

## Documentação

### API Documentation
- **Swagger/OpenAPI:** (futuro) Documentação automática
- **README.md:** Visão geral
- **dev/API.md:** Detalhes dos endpoints

### Code Documentation
- **JSDoc:** Comentários de código
- **Inline comments:** Lógica complexa

## Decisões Arquiteturais

### Por que Node.js/Express?
- **Performance:** Non-blocking I/O
- **Ecosystem:** NPM com vasto ecossistema
- **JavaScript:** Mesma linguagem frontend/backend
- **Scalability:** Fácil escalar horizontalmente

### Por que PostgreSQL?
- **Relacional:** Dados estruturados com relacionamentos
- **ACID:** Transações confiáveis
- **Performance:** Ótimo para queries complexas
- **Open Source:** Sem custos de licença

### Por que Prisma?
- **Type Safety:** Erros em tempo de desenvolvimento
- **Migrations:** Versionamento do schema
- **Productivity:** Queries simples e legíveis
- **Performance:** Query builder otimizado

### Por que EJS?
- **Server-side rendering:** SEO-friendly
- **Simplicidade:** Fácil de aprender
- **Partials:** Componentes reutilizáveis
- **Express integration:** Nativo no Express

## Próximas Melhorias

1. **API Documentation:** Swagger/OpenAPI
2. **Testing Suite:** Jest + Supertest
3. **Caching:** Redis para dados frequentes
4. **Rate Limiting:** Prevenção de abuso
5. **WebSocket:** Notificações em tempo real
6. **Docker:** Containerização para deploy
7. **CI/CD:** Automatização de deploy
8. **Monitoring:** Prometheus + Grafana
