---
name: auth-rbac
description: "Aplica autenticação JWT e autorização por perfil (presidente/diretor/tesoureiro/associado) nas rotas do ASPGE-PA."
disable-model-invocation: false
allowed-tools:
  - "read_file"
  - "edit"
  - "grep_search"
effort-level: "low"
---

# Procedimento: Auth & RBAC

Base: `aspge.org.br/src/middleware/auth.js` exporta `authMiddleware`, `authorize`, `gerarToken`, `obterRole`, `logMiddleware`.

## Roles derivadas do perfil (`obterRole`)
- `presidente` — perfil contém "presidente"
- `diretor` — contém "diretor/diretora/secretári"
- `tesoureiro` — contém "tesourei"
- `associado` — demais

## Regras de aplicação
1. **Rotas totalmente protegidas:** `router.use(authMiddleware)` no topo do arquivo de rota.
2. **Restrição por perfil:** `authorize('presidente', 'diretor', 'tesoureiro')` — passe somente os roles permitidos.
3. **Ações destrutivas** (delete): normalmente `authorize('presidente')`.
4. **Dados do próprio usuário:** valide `req.user.id` contra o recurso quando o associado acessa dados próprios.
5. **Auditoria:** em ações sensíveis (criar/editar/excluir, aprovações), adicione `logMiddleware('<acao>')`.
6. **Token:** emitido no login via `gerarToken(associado)`; expiração por `JWT_EXPIRES_IN` (default 24h). Nunca logar o token nem o `JWT_SECRET`.

## Checklist de segurança
- Nenhuma rota administrativa sem `authorize`.
- Nenhum endpoint retorna `senha`, hash ou CPF completo desnecessariamente.
- `JWT_SECRET` sempre via `process.env` (o fallback é só para dev).
