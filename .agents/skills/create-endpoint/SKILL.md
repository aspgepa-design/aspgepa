---
name: create-endpoint
description: "Cria um endpoint completo no aspge.org.br: rota Express + controller + validação express-validator + registro no server.js."
disable-model-invocation: false
allowed-tools:
  - "read_file"
  - "edit"
  - "write_to_file"
  - "grep_search"
effort-level: "medium"
---

# Procedimento: Criar Endpoint

Quando for solicitada uma nova rota/endpoint na API:

1. **Controller** — crie/edite `aspge.org.br/src/controllers/<recurso>Controller.js`:
   - Funções `async (req, res)` com `try/catch`
   - Acesso via `const prisma = require('../config/database')`
   - Erros: `res.status(4xx/5xx).json({ erro: 'mensagem' })`
   - Sucesso: `res.json(dados)` ou `res.status(201).json(...)`
   - Log de erro: `logger.error('contexto:', error)`

2. **Rota** — crie/edite `aspge.org.br/src/routes/<recurso>.js`:
   ```js
   const express = require('express');
   const { body, param } = require('express-validator');
   const router = express.Router();
   const controller = require('../controllers/<recurso>Controller');
   const { authMiddleware, authorize } = require('../middleware/auth');

   router.use(authMiddleware); // se todas as rotas forem protegidas
   router.get('/', authorize('presidente', 'diretor'), controller.listar);
   router.post('/', [ body('campo').notEmpty().withMessage('...') ], controller.criar);
   module.exports = router;
   ```

3. **Registro** — em `aspge.org.br/server.js`, adicione:
   - `const <recurso>Routes = require('./src/routes/<recurso>');`
   - `app.use('/api/<recurso>', <recurso>Routes);`

4. **Validação** — rode `.agents/hooks/validate-syntax.sh` na raiz do repo.
