# Configuração para Testes Locais

## 1. Pré-requisitos

Certifique-se de ter instalado:
- **Node.js** 18+ (`node --version`)
- **PostgreSQL** 14+ (`psql --version`)

Se não tiver:
- Windows: [PostgreSQL Installer](https://www.postgresql.org/download/windows/)
- Mac: `brew install postgresql`
- Linux: `sudo apt install postgresql`

---

## 2. Configuração Rápida (5 minutos)

### Passo 1: Criar arquivo .env

Crie um arquivo `.env` na pasta `aspge-node` com o conteúdo:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aspge?schema=public"
JWT_SECRET="chave-secreta-para-testes-locais-123456"
JWT_EXPIRES_IN=24h
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880
LOG_LEVEL=debug
LOG_DIR=./logs
APP_URL=http://localhost:3000
```

> **Nota:** Ajuste `DATABASE_URL` conforme seu PostgreSQL local. Formato:
> `postgresql://USUARIO:SENHA@localhost:5432/aspge?schema=public`

---

### Passo 2: Criar Banco de Dados

Abra o terminal e execute:

```bash
# Windows (PowerShell)
createdb aspge

# Se não funcionar, tente:
psql -U postgres -c "CREATE DATABASE aspge;"

# Mac/Linux
brew services start postgresql  # ou: sudo service postgresql start
sudo -u postgres createdb aspge
```

---

### Passo 3: Instalar e Configurar

No terminal, na pasta `aspge-node`:

```bash
# Instalar dependências
npm install

# Rodar migrações do banco
npx prisma migrate dev --name init

# (Será perguntado se deseja criar a migração, digite: y)

# Gerar cliente Prisma
npx prisma generate

# Criar dados de teste
npm run db:seed
```

---

### Passo 4: Iniciar Servidor

```bash
# Modo desenvolvimento (auto-reload)
npm run dev

# Ou modo produção
npm start
```

O servidor iniciará em: **http://localhost:3000**

---

## 3. Acessar o Sistema

### Testes de API

```bash
# Health check
curl http://localhost:3000/health

# Login (Admin)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"cpf":"11111111111","senha":"123456"}'
```

### Navegador

1. Abra: **http://localhost:3000**
2. Faça login com:
   - **Admin:** 111.111.111-11 / senha: 123456
   - **Diretor:** 222.222.222-22 / senha: 123456
   - **Associado:** 333.333.333-33 / senha: 123456

---

## 4. Prisma Studio (GUI do Banco)

Para visualizar/editar dados via interface web:

```bash
npx prisma studio
```

Acesse: **http://localhost:5555**

---

## 5. Estrutura de Testes

Dados criados automaticamente pelo seed:

| Tipo | Quantidade |
|------|------------|
| Associados | 3 (Admin, Diretor, Associado) |
| Eventos | 3 |
| Convênios | 3 |
| Lançamentos | 3 |

---

## 6. Comandos Úteis

```bash
# Reiniciar banco (cuidado: apaga tudo!)
npx prisma migrate reset

# Apenas recriar seed
npm run db:seed

# Ver logs
npm run dev

# Testar build de produção
npm start
```

---

## 7. Solução de Problemas

### Erro: "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### Erro: "Database does not exist"
```bash
createdb aspge
# ou
psql -U postgres -c "CREATE DATABASE aspge;"
```

### Erro: "password authentication failed"
```bash
# Edite pg_hba.conf para confiar em conexões locais
# Localização típica:
# Windows: C:\Program Files\PostgreSQL\14\data\pg_hba.conf
# Linux/Mac: /etc/postgresql/14/main/pg_hba.conf

# Altere:
# host all all 127.0.0.1/32 scram-sha-256
# para:
# host all all 127.0.0.1/32 trust

# Reinicie PostgreSQL
```

### Erro: "connection refused"
```bash
# Verifique se PostgreSQL está rodando
# Windows: Services → postgresql-x64-14
# Mac: brew services list
# Linux: sudo service postgresql status
```

---

## 8. Testando Funcionalidades

### Upload de Fotos

1. Coloque uma imagem em `public/uploads/fotos/`
2. Ou use a API de upload após login

### Templates de Carteirinha

1. Coloque as imagens em `public/uploads/templates/`
2. Nomeie como:
   - `template_frente.png`
   - `template_verso.png`

---

## 9. Próximos Passos

Após testar localmente:
1. [ ] Exportar CSVs do Google Sheets (se houver dados reais)
2. [ ] Rodar `node scripts/migrar-dados.js` para importar
3. [ ] Copiar fotos reais para `public/uploads/fotos/`
4. [ ] Fazer deploy no VPS

---

**Dúvidas?** Consulte `QUICKSTART.md` ou `README.md`
