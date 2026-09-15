# Quick Start - ASPGE-PA API

## Desenvolvimento Local

### 1. Pré-requisitos

- Node.js 18+ (`node --version`)
- PostgreSQL 14+ (`psql --version`)
- npm ou yarn

### 2. Instalação Rápida

```bash
# Clone o projeto (ou use os arquivos locais)
cd aspge-node

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env
# Edite .env com suas configurações
```

### 3. Configurar Banco de Dados

```bash
# Criar banco de dados
createdb aspge
# ou: sudo -u postgres createdb aspge

# Rodar migrações
npx prisma migrate dev --name init

# Gerar cliente Prisma
npx prisma generate

# (Opcional) Abrir Prisma Studio
npx prisma studio
```

### 4. Iniciar Servidor

```bash
# Modo desenvolvimento (com auto-reload)
npm run dev

# Modo produção
npm start
```

O servidor estará disponível em: **http://localhost:3000**

---

## Testes Rápidos

### Health Check
```bash
curl http://localhost:3000/health
```

### Criar Associado de Teste
```bash
curl -X POST http://localhost:3000/api/associados \
  -H "Content-Type: application/json" \
  -d '{
    "nomeCompleto": "João da Silva",
    "cpf": "123.456.789-00",
    "email": "joao@email.com",
    "whatsapp": "(91) 98765-4321"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678900",
    "senha": "senha123"
  }'
```

---

## Migração de Dados (Local)

### 1. Preparar CSVs

Coloque os arquivos em `scripts/csv/`:
- `associados.csv`
- `eventos.csv`
- `convenios.csv`

### 2. Executar Migração

```bash
node scripts/migrar-dados.js
```

---

## Estrutura do Projeto

```
aspge-node/
├── src/
│   ├── config/          # Database, Logger
│   ├── controllers/     # Lógica de negócio
│   ├── middleware/    # Auth, Upload
│   ├── routes/         # Rotas API
│   ├── views/           # Templates EJS
│   └── services/        # Serviços (PDF, etc.)
├── prisma/
│   └── schema.prisma    # Modelo de dados
├── public/
│   └── uploads/         # Arquivos locais
├── scripts/             # Scripts de utilidade
└── server.js            # Entry point
```

---

## Comandos Úteis

```bash
# Prisma
npx prisma migrate dev      # Criar migração
npx prisma migrate deploy   # Aplicar migrações
npx prisma studio           # GUI do banco
npx prisma db seed          # Seed de dados

# Testes
npm run dev                 # Servidor com nodemon
npm start                   # Servidor produção

# Logs
pm2 logs aspge-api          # (se usar PM2)
tail -f logs/combined.log   # Logs Winston
```

---

## Variáveis de Ambiente (.env)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:pass@localhost:5432/aspge?schema=public"
JWT_SECRET="sua-chave-secreta-aqui"
JWT_EXPIRES_IN=24h
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880
LOG_LEVEL=debug
APP_URL=http://localhost:3000
```

---

## Solução de Problemas

### Erro: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Erro: "Database does not exist"
```bash
createdb aspge
```

### Erro: "Permission denied" em uploads
```bash
# Linux/Mac
chmod -R 755 public/uploads

# Windows (PowerShell como Admin)
$path = "public\uploads"
$acl = Get-Acl $path
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("Users", "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($rule)
Set-Acl $path $acl
```

### Erro de conexão PostgreSQL
```bash
# Verificar se PostgreSQL está rodando
# Linux:
sudo systemctl status postgresql

# Windows:
# Verificar Services → postgresql-x64

# Mac:
brew services list
```

---

## Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/auth/login | Login |
| GET | /api/auth/perfil | Perfil do usuário |
| GET | /api/associados | Listar associados |
| POST | /api/associados | Criar associado |
| PUT | /api/associados/:id | Atualizar associado |
| GET | /api/eventos | Listar eventos |
| GET | /api/convenios | Listar convênios |
| GET | /api/financeiro | Dados financeiros |
| GET | /health | Health check |

---

## Dicas

1. **Use Prisma Studio** para visualizar/editar dados: `npx prisma studio`
2. **Logs** são salvos em `logs/` com Winston
3. **Uploads** ficam em `public/uploads/`
4. **Token JWT** expira em 24h (configurável)

---

## Próximos Passos

1. [ ] Testar localmente
2. [ ] Migrar dados dos CSVs
3. [ ] Copiar fotos para `public/uploads/fotos/`
4. [ ] Copiar templates para `public/uploads/templates/`
5. [ ] Fazer deploy no VPS

Veja **DEPLOY.md** para instruções de deploy em produção.
