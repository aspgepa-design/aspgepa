// Especificação OpenAPI 3.0 da API ASPGE-PA
// Servida em /api-docs via swagger-ui-express e em /api-docs.json
const spec = {
  openapi: '3.0.3',
  info: {
    title: 'ASPGE-PA API',
    version: '2.0.0',
    description: 'API do Sistema de Gestão de Associados da ASPGE-PA. Autenticação via JWT Bearer.'
  },
  servers: [
    { url: '/', description: 'Servidor atual' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      Erro: {
        type: 'object',
        properties: { erro: { type: 'string' } }
      },
      LoginRequest: {
        type: 'object',
        required: ['cpf', 'senha'],
        properties: {
          cpf: { type: 'string', example: '123.456.789-00' },
          senha: { type: 'string', example: 'senha123' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          sucesso: { type: 'boolean' },
          token: { type: 'string' },
          usuario: { type: 'object' }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth' }, { name: 'Associados' }, { name: 'Eventos' },
    { name: 'Convênios' }, { name: 'Financeiro' }, { name: 'Carteirinhas' },
    { name: 'Votações' }, { name: 'Gestões' }, { name: 'Site Config' },
    { name: 'Notícias' }, { name: 'Logs' }, { name: 'Dependentes' },
    { name: 'Documentos' }, { name: 'Sistema' }
  ],
  paths: {
    '/health': {
      get: { tags: ['Sistema'], summary: 'Health check', security: [], responses: { '200': { description: 'OK' } } }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: { '200': { description: 'Token JWT', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } }, '401': { description: 'Credenciais inválidas' } }
      }
    },
    '/api/auth/perfil': { get: { tags: ['Auth'], summary: 'Perfil do usuário logado', responses: { '200': { description: 'Perfil' }, '401': { description: 'Não autenticado' } } } },
    '/api/auth/alterar-senha': { post: { tags: ['Auth'], summary: 'Alterar própria senha', responses: { '200': { description: 'Senha alterada' } } } },
    '/api/auth/definir-senha': { post: { tags: ['Auth'], summary: 'Definir senha de associado (admin)', responses: { '200': { description: 'Senha definida' } } } },
    '/api/associados': {
      get: { tags: ['Associados'], summary: 'Listar associados (paginado, diretoria)', responses: { '200': { description: 'Lista' } } },
      post: { tags: ['Associados'], summary: 'Criar associado (diretoria)', responses: { '201': { description: 'Criado' } } }
    },
    '/api/associados/resumido': { get: { tags: ['Associados'], summary: 'Lista resumida', responses: { '200': { description: 'Lista' } } } },
    '/api/associados/cpf/{cpf}': { get: { tags: ['Associados'], summary: 'Buscar por CPF', parameters: [{ name: 'cpf', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Associado' }, '404': { description: 'Não encontrado' } } } },
    '/api/associados/{id}': {
      get: { tags: ['Associados'], summary: 'Buscar por ID', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Associado' } } },
      put: { tags: ['Associados'], summary: 'Atualizar associado', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Atualizado' } } },
      delete: { tags: ['Associados'], summary: 'Excluir associado (presidente)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Excluído' } } }
    },
    '/api/associados/{id}/foto': { post: { tags: ['Associados'], summary: 'Upload de foto', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Foto enviada' } } } },
    '/api/eventos': {
      get: { tags: ['Eventos'], summary: 'Listar eventos', responses: { '200': { description: 'Lista' } } },
      post: { tags: ['Eventos'], summary: 'Criar evento', responses: { '201': { description: 'Criado' } } }
    },
    '/api/eventos/{id}': {
      put: { tags: ['Eventos'], summary: 'Atualizar evento', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Atualizado' } } },
      delete: { tags: ['Eventos'], summary: 'Excluir evento', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Excluído' } } }
    },
    '/api/convenios': {
      get: { tags: ['Convênios'], summary: 'Listar convênios', responses: { '200': { description: 'Lista' } } },
      post: { tags: ['Convênios'], summary: 'Criar convênio', responses: { '201': { description: 'Criado' } } }
    },
    '/api/convenios/publicos': { get: { tags: ['Convênios'], summary: 'Convênios públicos (home)', security: [], responses: { '200': { description: 'Lista pública' } } } },
    '/api/convenios/{id}': {
      put: { tags: ['Convênios'], summary: 'Atualizar convênio', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Atualizado' } } },
      delete: { tags: ['Convênios'], summary: 'Excluir convênio', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Excluído' } } }
    },
    '/api/financeiro': {
      get: { tags: ['Financeiro'], summary: 'Lançamentos + saldo', responses: { '200': { description: 'Dados' } } },
      post: { tags: ['Financeiro'], summary: 'Criar lançamento (tesoureiro/presidente)', responses: { '201': { description: 'Criado' } } }
    },
    '/api/financeiro/{id}': { delete: { tags: ['Financeiro'], summary: 'Excluir lançamento (tesoureiro/presidente)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Excluído' } } } },
    '/api/carteirinhas/{cpf}': { get: { tags: ['Carteirinhas'], summary: 'Gerar carteirinha', parameters: [{ name: 'cpf', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Carteirinha' } } } },
    '/api/carteirinhas/config': { post: { tags: ['Carteirinhas'], summary: 'Configurar template (presidente)', responses: { '200': { description: 'Salvo' } } } },
    '/api/votacoes': {
      get: { tags: ['Votações'], summary: 'Listar votações', responses: { '200': { description: 'Lista' } } },
      post: { tags: ['Votações'], summary: 'Criar votação (diretoria)', responses: { '201': { description: 'Criada' } } }
    },
    '/api/votacoes/{id}/votar': { post: { tags: ['Votações'], summary: 'Registrar voto', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Voto registrado' } } } },
    '/api/gestoes': {
      get: { tags: ['Gestões'], summary: 'Listar gestões', responses: { '200': { description: 'Lista' } } },
      post: { tags: ['Gestões'], summary: 'Criar gestão (presidente)', responses: { '201': { description: 'Criada' } } }
    },
    '/api/gestoes/ativa': { get: { tags: ['Gestões'], summary: 'Gestão ativa (com diretoria)', security: [], responses: { '200': { description: 'Gestão' } } } },
    '/api/gestoes/{id}': { put: { tags: ['Gestões'], summary: 'Atualizar gestão (presidente)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Atualizada' } } } },
    '/api/site-config': {
      get: { tags: ['Site Config'], summary: 'Configurações públicas', security: [], responses: { '200': { description: 'Config' } } },
      put: { tags: ['Site Config'], summary: 'Atualizar configurações (presidente)', responses: { '200': { description: 'Salvo' } } }
    },
    '/api/noticias': {
      get: { tags: ['Notícias'], summary: 'Listar notícias', security: [], responses: { '200': { description: 'Lista' } } },
      post: { tags: ['Notícias'], summary: 'Criar notícia', responses: { '201': { description: 'Criada' } } }
    },
    '/api/noticias/{id}': {
      get: { tags: ['Notícias'], summary: 'Detalhe da notícia', security: [], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Notícia' } } },
      put: { tags: ['Notícias'], summary: 'Atualizar notícia', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Atualizada' } } },
      delete: { tags: ['Notícias'], summary: 'Excluir notícia', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Excluída' } } }
    },
    '/api/logs': { get: { tags: ['Logs'], summary: 'Logs de auditoria (presidente)', responses: { '200': { description: 'Lista' } } } },
    '/api/dependentes': {
      get: { tags: ['Dependentes'], summary: 'Listar dependentes', responses: { '200': { description: 'Lista' } } },
      post: { tags: ['Dependentes'], summary: 'Adicionar dependente', responses: { '201': { description: 'Criado' } } }
    },
    '/api/dependentes/{id}': {
      put: { tags: ['Dependentes'], summary: 'Atualizar dependente', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Atualizado' } } },
      delete: { tags: ['Dependentes'], summary: 'Excluir dependente', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Excluído' } } }
    },
    '/api/documentos': {
      get: { tags: ['Documentos'], summary: 'Listar documentos', responses: { '200': { description: 'Lista' } } },
      post: { tags: ['Documentos'], summary: 'Upload de documento', responses: { '201': { description: 'Enviado' } } }
    },
    '/api/documentos/{id}': { delete: { tags: ['Documentos'], summary: 'Excluir documento', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Excluído' } } } }
  }
};

module.exports = spec;
