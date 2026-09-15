# Guia de Deploy ASPGE-PA v2.0

## Preparação

### 1. Exportar Dados do Google Sheets

1. Acesse a planilha do Google Sheets
2. Exporte cada aba como CSV:
   - **Associados** → `associados.csv`
   - **Eventos** → `eventos.csv`
   - **Convênios** → `convenios.csv`
   - **Financeiro** → `financeiro.csv` (opcional)
   - **Gestões** → `gestoes.csv` (opcional)

3. Coloque os arquivos em `aspge-node/scripts/csv/`

### 2. Preparar Fotos (Google Drive)

Opção A - Manual:
1. Acesse a pasta "Fotos Associados" no Google Drive
2. Faça download de todas as fotos
3. Coloque em `aspge-node/public/uploads/fotos/`

Opção B - Script (com Service Account):
```bash
# Configure o Google Cloud Service Account primeiro
node scripts/download-fotos.js "URL_DA_PASTA_DRIVE"
```

### 3. Preparar Templates

1. Faça download dos templates de carteirinha (frente e verso)
2. Renomeie para:
   - `template_frente.png`
   - `template_verso.png`
3. Coloque em `aspge-node/public/uploads/templates/`

---

## Deploy no VPS

### 1. Acessar o VPS

Use os dados fornecidos pelo HostGator:
```bash
ssh root@129.121.49.246 -p 22022
```

### 2. Executar Script de Setup

```bash
# Clone ou copie o projeto
git clone https://github.com/seu-repo/aspge-node.git /var/www/aspge
# ou use SCP para transferir

# Execute o script de deploy
cd /var/www/aspge
chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh
```

### 3. Configurar Variáveis de Ambiente

```bash
cd /var/www/aspge
cp .env.example .env
nano .env
```

Edite o arquivo `.env`:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://postgres:SENHA@localhost:5432/aspge?schema=public"
JWT_SECRET="chave-secreta-muito-forte-aqui-minimo-32-caracteres"
JWT_EXPIRES_IN=24h
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880
LOG_LEVEL=info
LOG_DIR=./logs
APP_URL=http://129.121.49.246
```

### 4. Instalar Dependências e Migrar Banco

```bash
cd /var/www/aspge
npm install --production

# Gerar cliente Prisma
npx prisma generate

# Executar migrações
npx prisma migrate deploy

# (Opcional) Verificar conexão com banco
npx prisma db pull
```

### 5. Migrar Dados

```bash
# Migração de CSVs
node scripts/migrar-dados.js
```

### 6. Iniciar Aplicação

```bash
# Iniciar com PM2
pm2 start server.js --name aspge-api

# Salvar configuração
pm2 save
pm2 startup

# Verificar status
pm2 status
pm2 logs aspge-api
```

### 7. Configurar SSL (Certbot)

```bash
# Instalar Certbot
apt-get install certbot python3-certbot-nginx

# Obter certificado (substitua pelo seu domínio)
certbot --nginx -d seusite.com -d www.seusite.com

# Testar renovação automática
certbot renew --dry-run
```

---

## Comandos de Manutenção

### Logs
```bash
# Logs da aplicação
pm2 logs aspge-api
pm2 logs aspge-api --lines 100

# Logs do Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs do sistema
journalctl -u nginx -f
```

### Restart/Reload
```bash
# Reiniciar aplicação
pm2 restart aspge-api

# Recarregar Nginx
nginx -t && systemctl reload nginx

# Reiniciar PostgreSQL
systemctl restart postgresql
```

### Backup
```bash
# Backup do banco de dados
sudo -u postgres pg_dump aspge > backup_$(date +%Y%m%d).sql

# Backup das fotos
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz /var/www/aspge/public/uploads/
```

---

## Solução de Problemas

### Erro: "Cannot find module '@prisma/client'"
```bash
cd /var/www/aspge
npx prisma generate
```

### Erro: "Permission denied" nas fotos
```bash
chown -R www-data:www-data /var/www/aspge/public/uploads
chmod -R 755 /var/www/aspge/public/uploads
```

### Erro: "Connection refused" no PostgreSQL
```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Verificar configuração de conexão
sudo -u postgres psql -c "SHOW listen_addresses;"

# Verificar firewall
ufw status
```

### Erro: "Port 3000 already in use"
```bash
# Verificar processo
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou reiniciar PM2
pm2 delete all
pm2 start server.js --name aspge-api
```

---

## Atualizações

### Atualizar Código
```bash
cd /var/www/aspge
git pull origin main  # ou copie novos arquivos
npm install
npx prisma migrate deploy
pm2 restart aspge-api
```

### Atualizar Node.js
```bash
# Usando n (gerenciador de versões)
npm install -g n
n 20  # ou versão desejada
pm2 restart aspge-api
```

---

## Monitoramento

### PM2 Plus (Opcional)
```bash
# Para monitoramento avançado
pm2 plus
```

### Scripts de Health Check
```bash
# Adicione ao crontab
crontab -e

# Verificar aplicação a cada 5 minutos
*/5 * * * * curl -f http://localhost:3000/health || pm2 restart aspge-api
```

---

## Configuração de Domínio

### DNS A Record
```
subdomain.seudominio.com  A  129.121.49.246
```

### Nginx com Domínio
```nginx
server {
    listen 80;
    server_name subdomain.seudominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /uploads {
        alias /var/www/aspge/public/uploads;
        expires 30d;
    }
}
```

---

## Checklist Pré-Deploy

- [ ] Arquivos CSV exportados e na pasta `scripts/csv/`
- [ ] Fotos baixadas e em `public/uploads/fotos/`
- [ ] Templates em `public/uploads/templates/`
- [ ] `.env` configurado com dados corretos
- [ ] `DATABASE_URL` apontando para PostgreSQL local
- [ ] `JWT_SECRET` seguro (32+ caracteres)
- [ ] Node.js 18+ instalado
- [ ] PostgreSQL 14+ instalado e rodando
- [ ] Porta 3000 liberada no firewall
- [ ] Nginx configurado
- [ ] PM2 instalado

---

## Contato e Suporte

Em caso de problemas:
1. Verifique os logs: `pm2 logs aspge-api`
2. Verifique o health: `curl http://localhost:3000/health`
3. Consulte este guia
4. Entre em contato com a equipe de TI

**Versão:** 2.0.0
**Data:** Maio 2026
