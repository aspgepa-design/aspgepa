# Guia de Desenvolvimento - ASPGE-PA

## Configuração do Ambiente

### Pré-requisitos

- Node.js 18+ 
- PostgreSQL 14+
- Git
- VS Code (recomendado)

### Instalação

```bash
# Clonar repositório
git clone https://github.com/leonjames-san/aspge.git
cd aspge/aspge.org.br

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar banco de dados
createdb aspge
npx prisma migrate dev
npx prisma generate
```

### Variáveis de Ambiente (.env)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/aspge?schema=public"
JWT_SECRET="sua-chave-secreta-minimo-32-caracteres"
JWT_EXPIRES_IN=24h
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880
LOG_LEVEL=debug
LOG_DIR=./logs
APP_URL=http://localhost:3000
```

## Scripts NPM

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia servidor em produção |
| `npm run dev` | Inicia servidor com nodemon (hot reload) |
| `npm run db:migrate` | Cria nova migração Prisma |
| `npm run db:generate` | Gera cliente Prisma |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:seed` | Executa seed de dados |
| `npm run test:local` | Teste local completo |

## Estrutura de Código

### Criar Novo Controller

1. Criar arquivo em `src/controllers/`
2. Exportar funções para cada ação
3. Adicionar validações com express-validator
4. Usar Prisma para acesso a dados

**Exemplo:**
```javascript
// src/controllers/novoController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.listar = async (req, res) => {
  try {
    const dados = await prisma.modelo.findMany();
    res.json(dados);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

exports.criar = async (req, res) => {
  try {
    const { campo } = req.body;
    const novo = await prisma.modelo.create({
      data: { campo }
    });
    res.status(201).json(novo);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};
```

### Criar Nova Rota

1. Criar arquivo em `src/routes/`
2. Importar controller
3. Definir endpoints
4. Adicionar middleware de autenticação se necessário

**Exemplo:**
```javascript
// src/routes/novo.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/novoController');
const auth = require('../middleware/auth');

router.get('/', auth, controller.listar);
router.post('/', auth, controller.criar);

module.exports = router;
```

### Adicionar Rota no server.js

```javascript
// server.js
const novaRota = require('./src/routes/novo');

app.use('/api/novo', novaRota);
```

### Criar Nova Migration

```bash
npx prisma migrate dev --name descricao_da_migration
```

Isso criará:
- Arquivo de migration em `prisma/migrations/`
- Atualizará `schema.prisma`

### Adicionar Novo Model no Schema

```prisma
// prisma/schema.prisma
model NovoModel {
  id        Int      @id @default(autoincrement())
  campo     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("novo_model")
}
```

## Convenções de Código

### JavaScript

- Usar **camelCase** para variáveis e funções
- Usar **PascalCase** para classes/models
- Usar **UPPER_SNAKE_CASE** para constantes
- Usar **async/await** para código assíncrono
- Usar **arrow functions** para callbacks curtos

**Exemplo:**
```javascript
const nomeCompleto = 'João Silva';
const MAX_TENTATIVAS = 3;

const buscarUsuario = async (id) => {
  const usuario = await prisma.associado.findUnique({
    where: { id }
  });
  return usuario;
};
```

### Nomenclatura de Arquivos

- **Controllers:** `nomeController.js` (ex: `authController.js`)
- **Routes:** `nome.js` (ex: `auth.js`)
- **Middleware:** `nome.js` (ex: `auth.js`)
- **Views:** `nome.ejs` (ex: `login.ejs`)

### Estrutura de Funções

```javascript
exports.nomeFuncao = async (req, res) => {
  try {
    // 1. Validar input
    // 2. Processar lógica
    // 3. Retornar resposta
  } catch (error) {
    // 4. Tratar erro
    res.status(500).json({ erro: error.message });
  }
};
```

## Validação de Dados

Usar **express-validator** para validação:

```javascript
const { body, validationResult } = require('express-validator');

exports.criar = [
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ erros: errors.array() });
    }
    // ... lógica
  }
];
```

## Autenticação e Autorização

### Middleware de Autenticação

```javascript
const auth = require('../middleware/auth');

router.get('/protegido', auth, controller.listar);
```

### Verificar Perfil

```javascript
// No controller
if (req.user.perfil !== 'Presidente') {
  return res.status(403).json({ erro: 'Acesso negado' });
}
```

### Middleware de Autorização por Perfil

```javascript
const autorizar = (perfis) => {
  return (req, res, next) => {
    if (!perfis.includes(req.user.perfil)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    next();
  };
};

// Uso
router.post('/', auth, autorizar(['Presidente']), controller.criar);
```

## Upload de Arquivos

Usar **Multer** para uploads:

```javascript
const upload = require('../middleware/upload');

// Single file
router.post('/foto', auth, upload.single('foto'), controller.uploadFoto);

// Multiple files
router.post('/documentos', auth, upload.array('documentos', 5), controller.uploadDocumentos);
```

## Logging

Usar **Winston** para logging:

```javascript
const logger = require('../config/logger');

logger.info('Informação');
logger.warn('Aviso');
logger.error('Erro');
logger.debug('Debug');
```

## Testes

### Teste Manual com cURL

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cpf":"12345678900","senha":"senha123"}'

# Requisição autenticada
curl http://localhost:3000/api/associados \
  -H "Authorization: Bearer <token>"
```

### Teste com Postman/Insomnia

1. Importar collection (futuro)
2. Configurar ambiente (development/production)
3. Usar variáveis para token

## Debug

### VS Code Debugger

Criar `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/server.js"
    }
  ]
}
```

### Console.log

```javascript
console.log('Variável:', variavel);
console.log('Objeto:', JSON.stringify(objeto, null, 2));
```

### Prisma Logging

No `.env`:
```env
DATABASE_URL="postgresql://...?schema=public&logging=true"
```

## Git Workflow

### Branches

- `main` - Produção
- `develop` - Desenvolvimento
- `feature/nome-da-feature` - Nova funcionalidade
- `bugfix/nome-do-bug` - Correção de bug

### Comandos

```bash
# Criar branch
git checkout -b feature/nova-funcionalidade

# Commit
git add .
git commit -m "feat: adicionar nova funcionalidade"

# Push
git push origin feature/nova-funcionalidade

# Merge
git checkout develop
git merge feature/nova-funcionalidade
```

### Mensagens de Commit

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `style:` formatação
- `refactor:` refatoração
- `test:` testes
- `chore:` manutenção

## Boas Práticas

### Performance

- Usar `select` do Prisma para campos específicos
- Evitar N+1 queries com `include`
- Usar índices no banco de dados
- Implementar cache para dados frequentes

### Segurança

- Nunca commitar `.env`
- Validar todos os inputs
- Sanitizar dados do usuário
- Usar HTTPS em produção
- Implementar rate limiting

### Código Limpo

- Funções pequenas e focadas
- Nomes descritivos
- Comentários para lógica complexa
- Evitar código duplicado (DRY)
- Usar linters (ESLint)

## Troubleshooting

### Erro: "Cannot find module '@prisma/client'"

```bash
npx prisma generate
```

### Erro: "Database does not exist"

```bash
createdb aspge
```

### Erro: "Port 3000 already in use"

```bash
# Linux/Mac
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Erro de Migration

```bash
# Resolver migration
npx prisma migrate resolve --applied "nome_da_migration"

# Resetar (cuidado!)
npx prisma migrate reset
```

## Recursos

### Documentação

- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/docs)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [JWT](https://jwt.io/)

### Ferramentas

- [Prisma Studio](http://localhost:5555) - GUI do banco
- [Postman](https://www.postman.com/) - Testes de API
- [DBeaver](https://dbeaver.io/) - Cliente PostgreSQL

## Suporte

Em caso de dúvidas:
1. Consultar documentação em `dev/`
2. Verificar logs em `logs/`
3. Consultar README.md
4. Entrar em contato com a equipe de TI
