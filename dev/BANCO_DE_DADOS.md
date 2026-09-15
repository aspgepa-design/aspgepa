# Documentação do Banco de Dados - ASPGE-PA

## Visão Geral

**SGBD:** PostgreSQL 14+  
**ORM:** Prisma  
**Migration Tool:** Prisma Migrate  
**Database Name:** aspge

## Schema Prisma

O schema completo está definido em `prisma/schema.prisma`.

## Tabelas (Models)

### 1. Associado

Tabela principal de associados da ASPGE-PA.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| nomeCompleto | String | Nome completo do associado |
| cpf | String | CPF (único) |
| rg | String? | RG |
| expeditor | String? | Órgão expedidor do RG |
| matricula | String? | Matrícula funcional |
| cargo | String? | Cargo/função |
| perfil | String | Perfil de acesso (default: Associado) |
| situacao | String? | Situação cadastral |
| sexo | String? | Sexo |
| whatsapp | String? | WhatsApp |
| email | String? | E-mail |
| senha | String | Senha hash (bcrypt) |
| dataNascimento | DateTime? | Data de nascimento |
| naturalidade | String? | Naturalidade |
| estadoCivil | String? | Estado civil |
| graduacao | String? | Graduação |
| posGraduacao | String? | Pós-graduação |
| areaAtuacao | String? | Área de atuação |
| lotacao | String? | Lotação |
| fotoUrl | String? | URL da foto de perfil |
| fotoCarteirinhaUrl | String? | URL da foto para carteirinha |
| fotoConfig | String? | Configuração da foto |
| cadastroCompleto | Boolean | Cadastro completo (default: false) |
| camposPreenchidos | Int | Contador de campos preenchidos |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data de atualização |

**Relacionamentos:**
- `documentos` - Um para muitos (Documento[])
- `logs` - Um para muitos (Log[])
- `gestoes` - Muitos para muitos (Gestao[])

**Índices:**
- Unique em `cpf`

---

### 2. Evento

Eventos da associação (assembleias, reuniões, etc.).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| data | DateTime | Data do evento |
| titulo | String | Título do evento |
| local | String? | Local do evento |
| horario | String? | Horário do evento |
| descricao | String? | Descrição detalhada |
| visivel | Boolean | Visível no portal (default: true) |
| createdAt | DateTime | Data de criação |

---

### 3. Convenio

Convênios e benefícios para associados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| nome | String | Nome do convênio |
| descricao | String? | Descrição do benefício |
| categoria | String? | Categoria (Saúde, Educação, etc.) |
| link | String? | Link externo |
| visivel | Boolean | Visível no portal (default: true) |
| createdAt | DateTime | Data de criação |

---

### 4. Lancamento

Lançamentos financeiros (entradas e saídas).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| data | DateTime | Data do lançamento |
| descricao | String | Descrição do lançamento |
| valor | Decimal | Valor (10,2) |
| tipo | String | Tipo (entrada/saída) |
| responsavel | String? | Responsável pelo lançamento |
| createdAt | DateTime | Data de criação |

---

### 5. Votacao

Pautas de votação para assembleias.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| titulo | String | Título da pauta |
| status | String | Status (Aberta/Encerrada) |
| dataFim | String? | Data de encerramento |
| votos | Int | Contador de votos (default: 0) |
| createdAt | DateTime | Data de criação |

---

### 6. Gestao

Gestões da diretoria da associação.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| ativa | Boolean | Gestão ativa (default: false) |
| createdAt | DateTime | Data de criação |
| fim | DateTime? | Data de fim da gestão |
| inicio | DateTime? | Data de início da gestão |
| nome | String | Nome da gestão |

**Relacionamentos:**
- `membros` - Um para muitos (DiretoriaGestao[])
- `associados` - Muitos para muitos (Associado[])

---

### 7. DiretoriaGestao

Membros da diretoria em cada gestão.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| gestaoId | Int | FK para Gestao |
| cpf | String | CPF do membro |
| nome | String | Nome do membro |
| cargo | String | Cargo na diretoria |

**Relacionamentos:**
- `gestao` - Muitos para um (Gestao)

**Cascade:** Delete em cascata se Gestao for excluída.

---

### 8. Documento

Documentos anexados pelos associados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| nome | String | Nome do arquivo |
| path | String | Caminho do arquivo |
| mimeType | String? | Tipo MIME |
| tamanho | Int? | Tamanho em bytes |
| associadoId | Int | FK para Associado |
| createdAt | DateTime | Data de upload |

**Relacionamentos:**
- `associado` - Muitos para um (Associado)

**Cascade:** Delete em cascata se Associado for excluído.

---

### 9. Log

Logs de auditoria do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| acao | String | Ação executada |
| detalhes | String? | Detalhes da ação |
| associadoId | Int? | FK para Associado (opcional) |
| ip | String? | IP de origem |
| userAgent | String? | User agent do navegador |
| createdAt | DateTime | Data do log |

**Relacionamentos:**
- `associado` - Muitos para um (Associado)

**Índices:**
- Index em `associadoId`
- Index em `createdAt`

---

### 10. ConfigCarteirinha

Configuração de templates de carteirinha.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| config | String | Configuração JSON |
| templateFrente | String? | Path do template frente |
| templateVerso | String? | Path do template verso |
| updatedAt | DateTime | Data de atualização |

---

### 11. SiteConfig

Configurações do site público.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| sobreTexto | String? | Texto sobre a associação |
| missao | String? | Missão |
| visao | String? | Visão |
| valores | String? | Valores |
| estatutos | String? | Estatutos |
| bannerUrl | String? | URL do banner |
| bannerAlt | String? | Alt text do banner |
| mostrarEnquetes | Boolean | Mostrar enquetes (default: true) |
| mostrarNoticias | Boolean | Mostrar notícias (default: true) |
| mostrarEventos | Boolean | Mostrar eventos (default: true) |
| linksRapidos | String? | Links rápidos (JSON) |
| updatedAt | DateTime | Data de atualização |

---

### 12. Noticia

Notícias e comunicados da associação.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | PK, Auto-increment |
| titulo | String | Título da notícia |
| descricao | String? | Descrição curta |
| conteudo | String? | Conteúdo completo |
| dataPublicacao | DateTime | Data de publicação |
| visivel | Boolean | Visível no portal (default: true) |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data de atualização |

---

## Relacionamentos

```
Associado (1) ----< (N) Documento
Associado (1) ----< (N) Log
Associado (N) >----< (N) Gestao
Gestao (1) ----< (N) DiretoriaGestao
Gestao (N) >----< (N) Associado
DiretoriaGestao (N) ----> (1) Gestao
Documento (N) ----> (1) Associado
Log (N) ----> (1) Associado
```

## Índices

### Índices Automáticos (Prisma)
- Primary keys em todas as tabelas
- Foreign keys automaticamente indexados

### Índices Personalizados
- `associados.cpf` - Unique index
- `logs.associadoId` - Index para consultas de logs por associado
- `logs.createdAt` - Index para consultas por data

## Constraints

### Unique Constraints
- `associados.cpf` - CPF deve ser único

### Not Null Constraints
- Todos os campos obrigatórios estão marcados no schema

### Foreign Key Constraints
- Todas as FKs têm constraints de integridade referencial
- Cascade delete configurado onde apropriado

## Migrations

### Criar Nova Migration
```bash
npx prisma migrate dev --name nome_da_migration
```

### Aplicar Migrations em Produção
```bash
npx prisma migrate deploy
```

### Visualizar Histórico de Migrations
```bash
npx prisma migrate status
```

### Resetar Banco (Cuidado!)
```bash
npx prisma migrate reset
```

## Seed (Dados Iniciais)

### Executar Seed
```bash
npm run db:seed
```

### Arquivo de Seed
`prisma/seed.js` - Contém dados iniciais para desenvolvimento.

## Backup e Restore

### Backup
```bash
pg_dump aspge > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql aspge < backup_20240101.sql
```

### Backup Apenas da Estrutura
```bash
pg_dump --schema-only aspge > schema.sql
```

### Backup Apenas dos Dados
```bash
pg_dump --data-only aspge > data.sql
```

## Performance

### Queries Otimizadas
- Usar índices em colunas frequentemente consultadas
- Evitar `SELECT *` quando possível
- Usar `select` do Prisma para campos específicos

### Connection Pooling
- Prisma gerencia connection pooling automaticamente
- Configurar `connection_limit` no DATABASE_URL se necessário

## Segurança

### Permissões
- Usuário do banco deve ter permissões mínimas necessárias
- Evitar usar superuser (postgres) em produção

### SQL Injection
- Prisma ORM protege contra SQL injection
- Nunca usar queries raw com input do usuário sem sanitização

### Dados Sensíveis
- Senhas hasheadas com bcrypt
- CPFs armazenados como texto (pode ser criptografado no futuro)

## Manutenção

### VACUUM (Reorganizar Tabelas)
```sql
VACUUM ANALYZE associados;
```

### REINDEX (Recriar Índices)
```sql
REINDEX TABLE associados;
```

### ANALYZE (Atualizar Estatísticas)
```sql
ANALYZE associados;
```

## Monitoramento

### Tamanho das Tabelas
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Conexões Ativas
```sql
SELECT count(*) FROM pg_stat_activity;
```

### Queries Lentas
```sql
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Troubleshooting

### Erro de Conexão
- Verificar se PostgreSQL está rodando: `systemctl status postgresql`
- Verificar DATABASE_URL no .env
- Verificar firewall

### Migration Falha
- Verificar se há conflitos no schema
- Usar `npx prisma migrate resolve` para resolver conflitos

### Performance Lenta
- Verificar índices faltantes
- Usar `EXPLAIN ANALYZE` para analisar queries
- Considerar aumentar recursos do servidor

## Prisma Studio

### Abrir Interface Gráfica
```bash
npx prisma studio
```

Acessível em `http://localhost:5555`

## Boas Práticas

1. **Sempre criar migration** para mudanças no schema
2. **Não editar migrations** após criadas
3. **Usar types** do Prisma para type safety
4. **Fazer backup** antes de migrations drásticas
5. **Testar migrations** em ambiente de desenvolvimento primeiro
6. **Documentar** mudanças significativas no schema
