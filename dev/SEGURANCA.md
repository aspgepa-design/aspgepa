# Guia de Segurança - ASPGE-PA

## Visão Geral

Este documento descreve as práticas de segurança implementadas no sistema ASPGE-PA e diretrizes para manter a segurança da aplicação.

## Autenticação

### JWT (JSON Web Tokens)

O sistema usa JWT para autenticação stateless.

**Configuração:**
- **Algoritmo:** HS256
- **Expiração:** 24h (configurável via `JWT_EXPIRES_IN`)
- **Secret:** Mínimo 32 caracteres (configurar via `JWT_SECRET`)

**Implementação:**
```javascript
const jwt = require('jsonwebtoken');

// Gerar token
const token = jwt.sign(
  { id: user.id, perfil: user.perfil },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

// Verificar token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### Senhas

**Hash:**
- **Algoritmo:** bcrypt
- **Rounds:** 10
- **Salt:** Gerado automaticamente

**Implementação:**
```javascript
const bcrypt = require('bcrypt');

// Hash de senha
const senhaHash = await bcrypt.hash(senha, 10);

// Verificar senha
const senhaValida = await bcrypt.compare(senha, senhaHash);
```

### Middleware de Autenticação

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ erro: 'Token inválido' });
  }
};
```

## Autorização

### Perfis de Acesso

| Perfil | Permissões |
|--------|------------|
| Associado | Acesso ao portal, atualização cadastral |
| Tesoureiro | Gestão financeira |
| Diretor | Gestão de eventos e convênios |
| Presidente | Todas as permissões + exclusão |

### Middleware de Autorização

```javascript
const autorizar = (perfisPermitidos) => {
  return (req, res, next) => {
    if (!perfisPermitidos.includes(req.user.perfil)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    next();
  };
};

// Uso
router.delete('/associados/:id', auth, autorizar(['Presidente']), controller.excluir);
```

## Validação de Input

### express-validator

Todos os inputs são validados antes do processamento.

**Exemplo:**
```javascript
const { body, validationResult } = require('express-validator');

exports.criar = [
  body('nome').notEmpty().withMessage('Nome é obrigatório'),
  body('cpf').isLength({ min: 11, max: 11 }).withMessage('CPF inválido'),
  body('email').isEmail().withMessage('Email inválido').optional(),
  
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ erros: errors.array() });
    }
    // ... processar
  }
];
```

## Headers de Segurança

### Helmet.js

Helmet.js configura headers HTTP seguros automaticamente.

**Headers configurados:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

**CSP desabilitado** para permitir inline scripts do sistema legado GAS.

## CORS

### Configuração

```javascript
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true
}));
```

**Em produção:** Configurar com domínio específico.

## SQL Injection

### Proteção via Prisma ORM

Prisma ORM protege automaticamente contra SQL injection usando parameterized queries.

**✅ Seguro:**
```javascript
const associado = await prisma.associado.findUnique({
  where: { cpf: req.params.cpf }
});
```

**❌ Inseguro (não usar):**
```javascript
const query = `SELECT * FROM associados WHERE cpf = '${req.params.cpf}'`;
```

## XSS (Cross-Site Scripting)

### Proteção

- **EJS:** Escapa automaticamente variáveis por padrão
- **Helmet:** Headers de segurança
- **Validação:** Sanitização de inputs

**Exemplo seguro:**
```ejs
<%= nome %> <!-- Escapado automaticamente -->
<%- html %> <!-- Não escapado (cuidado!) -->
```

## CSRF (Cross-Site Request Forgery)

### Status

CSRF protection **não implementado** atualmente. Considerar implementar para formulários públicos.

## Upload de Arquivos

### Limitações

- **Tamanho máximo:** 5MB (configurável via `MAX_FILE_SIZE`)
- **Tipos permitidos:** Imagens (JPG, PNG) e PDFs
- **Validação:** Verificação de MIME type

### Implementação

```javascript
// src/middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: process.env.MAX_FILE_SIZE }
});
```

## Rate Limiting

### Status

Rate limiting **não implementado** atualmente. Considerar implementar para prevenir abuso.

**Recomendação:** Usar `express-rate-limit`

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições
});

app.use('/api/', limiter);
```

## Logging e Auditoria

### Winston Logger

Todas as ações são logadas para auditoria.

**Níveis de log:**
- `error` - Erros críticos
- `warn` - Avisos
- `info` - Informações gerais
- `debug` - Informações de debug

**Exemplo:**
```javascript
logger.info(`Usuário ${userId} realizou ação ${acao}`, {
  ip: req.ip,
  userAgent: req.headers['user-agent']
});
```

### Log de Auditoria no Banco

Tabela `logs` registra ações importantes:
- Login/Logout
- Alterações de dados
- Ações administrativas

## Variáveis de Ambiente

### Segurança

- **Nunca commitar** `.env`
- **Usar valores fortes** para secrets
- **Rotacionar secrets** periodicamente

**.env.example** deve conter apenas templates:
```env
JWT_SECRET=seu-secret-aqui-minimo-32-caracteres
DATABASE_URL=postgresql://user:password@localhost:5432/aspge
```

## SSL/TLS

### Produção

- **Certificado:** Let's Encrypt via Certbot
- **Configuração Nginx:** Redirecionamento HTTP → HTTPS

**Exemplo:**
```nginx
server {
    listen 80;
    server_name aspgepa.org.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name aspgepa.org.br;
    
    ssl_certificate /etc/letsencrypt/live/aspgepa.org.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aspgepa.org.br/privkey.pem;
    
    # ... resto da config
}
```

## Firewall

### UFW (Uncomplicated Firewall)

```bash
# Habilitar firewall
sudo ufw enable

# Permitir SSH
sudo ufw allow 22022/tcp

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir localhost
sudo ufw allow from 127.0.0.1

# Negar tudo else
sudo ufw default deny incoming
```

## Fail2ban

### Configuração

Fail2ban está ativo no servidor para prevenir ataques de força bruta.

**Configuração padrão:**
- Max tentativas: 5
- Tempo de ban: 10 minutos
- Serviços monitorados: SSH, Nginx

## Backup de Dados

### Banco de Dados

```bash
# Backup diário (crontab)
0 2 * * * pg_dump aspge > /backups/aspge_$(date +\%Y\%m\%d).sql
```

### Retenção

- **Diários:** 7 dias
- **Semanais:** 4 semanas
- **Mensais:** 12 meses

## Monitoramento

### Health Check

Endpoint `/health` para monitoramento:

```bash
curl http://localhost:3000/health
```

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "2.0.0"
}
```

### PM2 Monitoring

```bash
pm2 monit
```

## Atualizações de Segurança

### Dependências

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix

# Atualizar dependências
npm update
```

### Sistema Operacional

```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade

# Atualizar segurança
sudo apt unattended-upgrade
```

## Checklist de Segurança

### Antes do Deploy

- [ ] Remover `.env` do versionamento
- [ ] Configurar `JWT_SECRET` forte
- [ ] Configurar `DATABASE_URL` com usuário limitado
- [ ] Habilitar SSL/TLS
- [ ] Configurar firewall
- [ ] Verificar permissões de arquivos
- [ ] Testar autenticação
- [ ] Testar autorização
- [ ] Verificar logs

### Manutenção Mensal

- [ ] Revisar logs de auditoria
- [ ] Verificar backups
- [ ] Atualizar dependências
- [ ] Revisar permissões de usuários
- [ ] Testar recovery procedures

### Manutenção Trimestral

- [ ] Rotacionar secrets
- [ ] Revisar políticas de acesso
- [ ] Testar backup/restore
- [ ] Auditoria de segurança
- [ ] Atualizar documentação

## Incident Response

### Em Caso de Incidente

1. **Isolar sistema** se necessário
2. **Preservar logs** para análise
3. **Notificar equipe** responsável
4. **Investigar causa**
5. **Implementar correção**
6. **Documentar incidente**
7. **Revisar processos**

### Contatos

- **Equipe TI:** [email]
- **Segurança:** [email]
- **Gerência:** [email]

## Recursos

### OWASP

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)

### Ferramentas

- [npm audit](https://docs.npmjs.com/cli/audit) - Vulnerabilidades NPM
- [Snyk](https://snyk.io/) - Scanner de segurança
- [Burp Suite](https://portswigger.net/burp) - Testes de penetração

## Legislação

### LGPD

O sistema deve estar em conformidade com a Lei Geral de Proteção de Dados:
- Consentimento para coleta de dados
- Direito de acesso e correção
- Direito de exclusão
- Segurança de dados pessoais
- Notificação de incidentes
