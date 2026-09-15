# Troubleshooting - ASPGE-PA

## Problemas Comuns

### Erro: "Cannot find module '@prisma/client'"

**Causa:** Cliente Prisma não foi gerado.

**Solução:**
```bash
npx prisma generate
```

---

### Erro: "Database does not exist"

**Causa:** Banco de dados não foi criado.

**Solução:**
```bash
# Linux/Mac
sudo -u postgres createdb aspge

# Windows
createdb aspge
```

---

### Erro: "Connection refused" no PostgreSQL

**Causa:** PostgreSQL não está rodando ou configuração incorreta.

**Solução:**
```bash
# Verificar status
sudo systemctl status postgresql

# Iniciar PostgreSQL
sudo systemctl start postgresql

# Verificar configuração
sudo -u postgres psql -c "SHOW listen_addresses;"
```

**Verificar DATABASE_URL no .env:**
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/aspge?schema=public"
```

---

### Erro: "Port 3000 already in use"

**Causa:** Outro processo está usando a porta 3000.

**Solução:**
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

### Erro: "Permission denied" em uploads

**Causa:** Permissões incorretas na pasta de uploads.

**Solução:**
```bash
# Linux/Mac
chmod -R 755 public/uploads
chown -R www-data:www-data public/uploads

# Windows (PowerShell como Admin)
icacls "public\uploads" /grant Users:F
```

---

### Erro: "JWT malformed" ou "invalid token"

**Causa:** Token inválido ou expirado.

**Solução:**
- Verificar se o token está sendo enviado corretamente no header `Authorization: Bearer <token>`
- Verificar se `JWT_SECRET` é o mesmo no cliente e servidor
- Verificar se o token não expirou (padrão: 24h)

---

### Erro: "ECONNREFUSED" ao conectar ao VPS

**Causa:** Firewall bloqueando conexão ou SSH não configurado.

**Solução:**
```bash
# Verificar se SSH está rodando
sudo systemctl status ssh

# Verificar firewall
sudo ufw status

# Permitir porta SSH
sudo ufw allow 22022/tcp
```

---

### Erro: "Migration failed"

**Causa:** Conflito no schema ou banco em estado inconsistente.

**Solução:**
```bash
# Resolver migration específica
npx prisma migrate resolve --applied "nome_da_migration"

# Resetar banco (cuidado - apaga dados!)
npx prisma migrate reset

# Criar nova migration
npx prisma migrate dev --name nova_migration
```

---

### PM2: Process não inicia

**Causa:** Erro no código ou dependências faltando.

**Solução:**
```bash
# Verificar logs
pm2 logs aspge-api

# Verificar erro detalhado
pm2 show aspge-api

# Reiniciar
pm2 restart aspge-api

# Reinstalar
pm2 delete aspge-api
pm2 start server.js --name aspge-api
```

---

### Nginx: 502 Bad Gateway

**Causa:** Aplicação Node.js não está rodando.

**Solução:**
```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar porta
curl http://localhost:3000/health

# Reiniciar aplicação
pm2 restart aspge-api

# Verificar configuração Nginx
nginx -t
```

---

### Nginx: 403 Forbidden

**Causa:** Permissões incorretas ou configuração de usuário.

**Solução:**
```bash
# Verificar permissões
ls -la /var/www/aspge

# Corrigir permissões
chown -R www-data:www-data /var/www/aspge
chmod -R 755 /var/www/aspge

# Verificar usuário Nginx
ps aux | grep nginx
```

---

### Erro: "Insufficient storage"

**Causa:** Disco cheio.

**Solução:**
```bash
# Verificar espaço em disco
df -h

# Limpar logs antigos
rm logs/*.log

# Limpar cache NPM
npm cache clean --force

# Limpar pacotes não usados
sudo apt autoremove
```

---

### Erro: "EMFILE: too many open files"

**Causa:** Limite de arquivos abertos atingido.

**Solução:**
```bash
# Aumentar limite temporariamente
ulimit -n 4096

# Aumentar limite permanentemente
echo "* soft nofile 4096" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 4096" | sudo tee -a /etc/security/limits.conf
```

---

### Erro: "Cannot read property of undefined"

**Causa:** Tentando acessar propriedade de objeto undefined.

**Solução:**
```javascript
// Adicionar verificação
if (objeto && objeto.propriedade) {
  // usar objeto.propriedade
}

// Ou usar optional chaining
const valor = objeto?.propriedade;
```

---

### Performance lenta

**Causa:** Queries não otimizadas ou falta de índices.

**Solução:**
```bash
# Analisar queries lentas
npx prisma studio

# Adicionar índices no schema
@@index([campo])

# Usar select para campos específicos
const dados = await prisma.modelo.findMany({
  select: { id: true, nome: true }
});
```

---

### Upload de arquivo falha

**Causa:** Arquivo muito grande ou tipo não permitido.

**Solução:**
```bash
# Verificar configuração MAX_FILE_SIZE no .env
MAX_FILE_SIZE=10485760  # 10MB

# Verificar tamanho do arquivo
ls -lh arquivo.jpg

# Verificar tipo MIME
file --mime-type arquivo.jpg
```

---

### SSL/Certbot erro

**Causa:** Domínio não aponta para o IP ou porta 80 bloqueada.

**Solução:**
```bash
# Verificar DNS
dig aspgepa.org.br

# Verificar se porta 80 está aberta
sudo ufw allow 80/tcp

# Tentar novamente
certbot --nginx -d aspgepa.org.br
```

---

## Debug

### Habilitar Debug Mode

No `.env`:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Ver Logs

```bash
# Logs da aplicação
tail -f logs/combined.log
tail -f logs/error.log

# Logs PM2
pm2 logs aspge-api

# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs PostgreSQL
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Testar Conexão com Banco

```bash
# Via psql
psql -U usuario -d aspge -h localhost

# Via Prisma
npx prisma db pull
```

### Testar API

```bash
# Health check
curl http://localhost:3000/health

# Verificar resposta
curl -v http://localhost:3000/api/associados
```

## Logs de Erro Comuns

### Prisma Error

```
Error: P2024
A query failed
```

**Solução:** Verificar conexão com banco e DATABASE_URL.

### JWT Error

```
JsonWebTokenError: jwt malformed
```

**Solução:** Verificar formato do token e JWT_SECRET.

### Multer Error

```
MulterError: File too large
```

**Solução:** Aumentar MAX_FILE_SIZE no .env.

## Recursos

### Documentação

- [Prisma Troubleshooting](https://www.prisma.io/docs/guides/troubleshooting)
- [Express Debugging](https://expressjs.com/en/guide/debugging.html)
- [PostgreSQL Errors](https://www.postgresql.org/docs/current/errcodes-appendix.html)

### Ferramentas

- `pm2 logs` - Logs de processos
- `nginx -t` - Testar configuração Nginx
- `psql` - Cliente PostgreSQL
- `curl` - Testar HTTP requests
