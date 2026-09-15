# Documentação da API ASPGE-PA

## Base URL

**Desenvolvimento:** `http://localhost:3000`  
**Produção:** `http://129.121.49.246` ou `https://aspgepa.org.br`

## Autenticação

A maioria dos endpoints requer autenticação via **JWT Bearer Token**.

### Header de Autenticação
```
Authorization: Bearer <token_jwt>
```

### Obter Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "cpf": "12345678900",
  "senha": "senha123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nome": "João da Silva",
    "cpf": "12345678900",
    "perfil": "Associado"
  }
}
```

## Endpoints

### Autenticação (`/api/auth`)

#### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "cpf": "string",
  "senha": "string"
}
```

**Resposta:** `200 OK`
```json
{
  "token": "string",
  "user": {
    "id": "number",
    "nome": "string",
    "cpf": "string",
    "perfil": "string"
  }
}
```

#### Obter Perfil
```http
GET /api/auth/perfil
Authorization: Bearer <token>
```

**Resposta:** `200 OK`
```json
{
  "id": 1,
  "nomeCompleto": "string",
  "cpf": "string",
  "email": "string",
  "perfil": "string",
  "cadastroCompleto": "boolean",
  "camposPreenchidos": "number"
}
```

#### Alterar Senha
```http
POST /api/auth/alterar-senha
Authorization: Bearer <token>
```

**Body:**
```json
{
  "senhaAtual": "string",
  "novaSenha": "string"
}
```

#### Definir Senha (Admin)
```http
POST /api/auth/definir-senha
Authorization: Bearer <token>
Perfil: Presidente/Diretor
```

**Body:**
```json
{
  "cpf": "string",
  "novaSenha": "string"
}
```

---

### Associados (`/api/associados`)

#### Listar Todos (Diretoria)
```http
GET /api/associados
Authorization: Bearer <token>
Perfil: Diretor/Tesoureiro/Presidente
```

**Query Params:**
- `page`: número da página (default: 1)
- `limit`: itens por página (default: 50)
- `buscar`: termo de busca (nome, CPF)

**Resposta:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "nomeCompleto": "string",
      "cpf": "string",
      "email": "string",
      "perfil": "string",
      "situacao": "string"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

#### Listar Resumido
```http
GET /api/associados/resumido
Authorization: Bearer <token>
```

**Resposta:** `200 OK`
```json
[
  {
    "id": 1,
    "nome": "string",
    "cpf": "string"
  }
]
```

#### Buscar por CPF
```http
GET /api/associados/cpf/:cpf
Authorization: Bearer <token>
```

**Resposta:** `200 OK`
```json
{
  "id": 1,
  "nomeCompleto": "string",
  "cpf": "string",
  "email": "string",
  "whatsapp": "string",
  "cargo": "string",
  "lotacao": "string",
  "perfil": "string",
  "situacao": "string",
  "fotoUrl": "string",
  "cadastroCompleto": "boolean"
}
```

#### Buscar por ID
```http
GET /api/associados/:id
Authorization: Bearer <token>
```

#### Criar Associado (Diretoria)
```http
POST /api/associados
Authorization: Bearer <token>
Perfil: Diretor/Presidente
```

**Body:**
```json
{
  "nomeCompleto": "string",
  "cpf": "string",
  "email": "string",
  "whatsapp": "string",
  "senha": "string",
  "cargo": "string",
  "lotacao": "string",
  "perfil": "Associado"
}
```

#### Atualizar Associado
```http
PUT /api/associados/:id
Authorization: Bearer <token>
```

**Body:** Mesmo que criar, todos os campos são opcionais.

#### Excluir Associado (Presidente)
```http
DELETE /api/associados/:id
Authorization: Bearer <token>
Perfil: Presidente
```

#### Upload de Foto
```http
POST /api/associados/:id/foto
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
foto: <file>
```

**Resposta:** `200 OK`
```json
{
  "fotoUrl": "/uploads/fotos/12345678900.jpg"
}
```

---

### Eventos (`/api/eventos`)

#### Listar Eventos
```http
GET /api/eventos
```

**Query Params:**
- `visivel`: `true` ou `false` (default: true)

**Resposta:** `200 OK`
```json
[
  {
    "id": 1,
    "titulo": "string",
    "data": "2024-01-01T00:00:00Z",
    "local": "string",
    "horario": "string",
    "descricao": "string",
    "visivel": "boolean"
  }
]
```

#### Criar Evento (Diretoria)
```http
POST /api/eventos
Authorization: Bearer <token>
Perfil: Diretor/Presidente
```

**Body:**
```json
{
  "titulo": "string",
  "data": "2024-01-01",
  "local": "string",
  "horario": "string",
  "descricao": "string",
  "visivel": true
}
```

#### Atualizar Evento
```http
PUT /api/eventos/:id
Authorization: Bearer <token>
Perfil: Diretor/Presidente
```

#### Excluir Evento
```http
DELETE /api/eventos/:id
Authorization: Bearer <token>
Perfil: Diretor/Presidente
```

---

### Convênios (`/api/convenios`)

#### Listar Convênios
```http
GET /api/convenios
```

**Query Params:**
- `visivel`: `true` ou `false` (default: true)
- `categoria`: filtro por categoria

**Resposta:** `200 OK`
```json
[
  {
    "id": 1,
    "nome": "string",
    "descricao": "string",
    "categoria": "string",
    "link": "string",
    "visivel": "boolean"
  }
]
```

#### Criar Convênio (Diretoria)
```http
POST /api/convenios
Authorization: Bearer <token>
Perfil: Diretor/Presidente
```

**Body:**
```json
{
  "nome": "string",
  "descricao": "string",
  "categoria": "string",
  "link": "string",
  "visivel": true
}
```

#### Atualizar Convênio
```http
PUT /api/convenios/:id
Authorization: Bearer <token>
Perfil: Diretor/Presidente
```

#### Excluir Convênio
```http
DELETE /api/convenios/:id
Authorization: Bearer <token>
Perfil: Diretor/Presidente
```

---

### Financeiro (`/api/financeiro`)

#### Listar Lançamentos
```http
GET /api/financeiro
Authorization: Bearer <token>
```

**Query Params:**
- `tipo`: `entrada` ou `saida`
- `ano`: filtro por ano
- `mes`: filtro por mês

**Resposta:** `200 OK`
```json
{
  "entradas": [
    {
      "id": 1,
      "data": "2024-01-01",
      "descricao": "string",
      "valor": 100.00,
      "tipo": "entrada",
      "responsavel": "string"
    }
  ],
  "saidas": [...],
  "saldo": 5000.00
}
```

#### Criar Lançamento (Tesoureiro)
```http
POST /api/financeiro
Authorization: Bearer <token>
Perfil: Tesoureiro/Presidente
```

**Body:**
```json
{
  "data": "2024-01-01",
  "descricao": "string",
  "valor": 100.00,
  "tipo": "entrada",
  "responsavel": "string"
}
```

#### Excluir Lançamento (Tesoureiro)
```http
DELETE /api/financeiro/:id
Authorization: Bearer <token>
Perfil: Tesoureiro/Presidente
```

---

### Carteirinhas (`/api/carteirinhas`)

#### Gerar Carteirinha Digital
```http
GET /api/carteirinhas/:cpf
Authorization: Bearer <token>
```

**Resposta:** `200 OK` (PDF) ou `200 OK` (JSON com URL)
```json
{
  "url": "/uploads/carteirinhas/12345678900.pdf",
  "qrCode": "data:image/png;base64,..."
}
```

#### Configurar Template (Admin)
```http
POST /api/carteirinhas/config
Authorization: Bearer <token>
Perfil: Presidente
```

**Body:**
```json
{
  "templateFrente": "string",
  "templateVerso": "string",
  "config": "string"
}
```

---

### Votações (`/api/votacoes`)

#### Listar Votações
```http
GET /api/votacoes
```

**Resposta:** `200 OK`
```json
[
  {
    "id": 1,
    "titulo": "string",
    "status": "Aberta",
    "dataFim": "2024-01-01",
    "votos": 10
  }
]
```

#### Criar Votação (Diretoria)
```http
POST /api/votacoes
Authorization: Bearer <token>
Perfil: Diretor/Presidente
```

**Body:**
```json
{
  "titulo": "string",
  "dataFim": "2024-01-01"
}
```

#### Votar
```http
POST /api/votacoes/:id/votar
Authorization: Bearer <token>
```

**Body:**
```json
{
  "opcao": "string"
}
```

---

### Gestões (`/api/gestoes`)

#### Listar Gestões
```http
GET /api/gestoes
```

**Resposta:** `200 OK`
```json
[
  {
    "id": 1,
    "nome": "Gestão 2024-2026",
    "inicio": "2024-01-01",
    "fim": "2026-12-31",
    "ativa": true,
    "membros": [
      {
        "cpf": "string",
        "nome": "string",
        "cargo": "Presidente"
      }
    ]
  }
]
```

#### Criar Gestão (Presidente)
```http
POST /api/gestoes
Authorization: Bearer <token>
Perfil: Presidente
```

**Body:**
```json
{
  "nome": "string",
  "inicio": "2024-01-01",
  "fim": "2026-12-31",
  "membros": [
    {
      "cpf": "string",
      "nome": "string",
      "cargo": "string"
    }
  ]
}
```

#### Atualizar Gestão
```http
PUT /api/gestoes/:id
Authorization: Bearer <token>
Perfil: Presidente
```

---

### Site Config (`/api/site-config`)

#### Obter Configurações
```http
GET /api/site-config
```

**Resposta:** `200 OK`
```json
{
  "sobreTexto": "string",
  "missao": "string",
  "visao": "string",
  "valores": "string",
  "estatutos": "string",
  "bannerUrl": "string",
  "bannerAlt": "string",
  "mostrarEnquetes": true,
  "mostrarNoticias": true,
  "mostrarEventos": true,
  "linksRapidos": "string"
}
```

#### Atualizar Configurações (Admin)
```http
PUT /api/site-config
Authorization: Bearer <token>
Perfil: Presidente
```

**Body:** Mesmo que obter configurações.

---

### Notícias (`/api/noticias`)

#### Listar Notícias
```http
GET /api/noticias
```

**Query Params:**
- `visivel`: `true` ou `false` (default: true)
- `limit`: número de notícias (default: 10)

**Resposta:** `200 OK`
```json
[
  {
    "id": 1,
    "titulo": "string",
    "descricao": "string",
    "conteudo": "string",
    "dataPublicacao": "2024-01-01",
    "visivel": true
  }
]
```

#### Criar Notícia (Diretoria)
```http
POST /api/noticias
Authorization: Bearer <token>
Perfil: Diretor/Presidente
```

**Body:**
```json
{
  "titulo": "string",
  "descricao": "string",
  "conteudo": "string",
  "visivel": true
}
```

#### Atualizar Notícia
```http
PUT /api/noticias/:id
Authorization: Bearer <token>
Perfil: Diretor/Presidente
```

#### Excluir Notícia
```http
DELETE /api/noticias/:id
Authorization: Bearer <token>
Perfil: Diretor/Presidente
```

---

### Logs (`/api/logs`)

#### Listar Logs (Admin)
```http
GET /api/logs
Authorization: Bearer <token>
Perfil: Presidente
```

**Query Params:**
- `acao`: filtro por ação
- `associadoId`: filtro por associado
- `dataInicio`: filtro de data inicial
- `dataFim`: filtro de data final

**Resposta:** `200 OK`
```json
[
  {
    "id": 1,
    "acao": "LOGIN",
    "detalhes": "string",
    "associadoId": 1,
    "ip": "string",
    "userAgent": "string",
    "createdAt": "2024-01-01"
  }
]
```

---

## Páginas Web

### Home Pública
```http
GET /
```

### Login
```http
GET /login
```

### Portal do Associado (Protegido)
```http
GET /portal
Authorization: Bearer <token> (via cookie)
```

### Ficha de Inscrição
```http
GET /inscricao
```

### Atualização Cadastral
```http
GET /atualizar
```

### Carteirinha Digital
```http
GET /carteirinha
```

### Histórico de Versões
```http
GET /versoes
```

---

## Health Check

### Status da Aplicação
```http
GET /health
```

**Resposta:** `200 OK`
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "2.0.0"
}
```

### Informações da API
```http
GET /api
```

**Resposta:** `200 OK`
```json
{
  "nome": "ASPGE-PA API",
  "versao": "2.0.0",
  "descricao": "API do Sistema de Gestão de Associados",
  "endpoints": {
    "auth": "/api/auth",
    "associados": "/api/associados",
    "eventos": "/api/eventos",
    "convenios": "/api/convenios",
    "financeiro": "/api/financeiro",
    "logs": "/api/logs",
    "carteirinhas": "/api/carteirinhas",
    "health": "/health"
  }
}
```

---

## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (ex: CPF duplicado) |
| 422 | Unprocessable Entity (validação) |
| 500 | Internal Server Error |

## Formato de Erro

```json
{
  "erro": "Mensagem de erro",
  "detalhes": "Detalhes adicionais (opcional)"
}
```

## Rate Limiting (Futuro)

Limites de requisição por endpoint para prevenir abuso.

## Webhooks (Futuro)

Notificações em tempo real para eventos importantes.
