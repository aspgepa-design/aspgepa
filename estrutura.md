Vou criar o guia baseado na estrutura agêntica que este projeto já usa (subagentes, skills, hooks, schedules, MCP, curadores) — documento canônico em `docs/01-projeto/`:

Documento criado e no ar — **v2.71.0**.

## `docs/01-projeto/ESTRUTURA_AGENTICA_DEVIN.md`

Guia instrutivo completo, já visível em `/admin/documentacao` (57 docs sincronizados). Conteúdo:

1. **As duas camadas** — agentes de produto (`backend/src/agents/` → LIA, CRIA...) vs. agentes de desenvolvimento (`.devin/agents/` → perfis Devin)
2. **Anatomia de um perfil** — frontmatter com gatilhos ("Use para:"), escopo exclusivo, limites, formato de saída, permissão de escrita
3. **O padrão de orquestração** — o fluxo que usamos na revisão de UX: decompor → frentes com arquivos disjuntos → paralelo → consolidar → security review → curadores → deploy
4. **Regras de ouro** — propriedade de arquivos + prompt auto-contido (o subagente não vê a conversa)
5. **Skills, hooks de custo zero, cron, MCP** — lazy loading, determinismo nos scripts, `mcp_list_tools` antes de chamar
6. **Checklist do que funcionou aqui** — 7 agentes / 35 arquivos sem conflito, security-review barrando o OTP, curadores mantendo docs/KB
7. **Erros comuns** — escopo sobreposto, agente revisor editando, commits parciais, contexto vago
8. **Template de nova demanda** — passo a passo replicável

O doc é mantido pelo `docs-curator` — quando a estrutura evoluir (novos perfis, hooks, skills), ele atualiza automaticamente.

Aqui está o blueprint genérico — a estrutura agêntica de **desenvolvimento** para qualquer projeto no Devin, destilada do que funcionou no Conectados:

## 1. Layout de diretórios

```
projeto/
├── AGENTS.md                      ← índice central (lido por Devin/Cursor/etc.)
├── .devin/
│   ├── agents/                    ← perfis de subagentes (um .md por perfil)
│   │   ├── orchestrator.md
│   │   ├── backend-developer.md
│   │   ├── frontend-developer.md
│   │   ├── qa-reviewer.md
│   │   ├── security-reviewer.md
│   │   └── ...
│   ├── hooks.v1.json              ← hooks de automação (guard, etc.)
│   └── mcp_config.json            ← conectores MCP (DB, etc.)
├── .agents/                       ← camada agnóstica de ferramenta
│   ├── skills/<nome>/SKILL.md     ← receitas reutilizáveis
│   ├── hooks/                     ← scripts de validação (custo zero)
│   └── schedules/cron.yaml        ← rotinas agendadas
├── scripts/                       ← utilitários determinísticos
└── docs/                          ← documentação viva
```

**Separação:** `.devin/` = config específica do Devin; `.agents/` = portável entre ferramentas (skills, hooks, schedules).

## 2. Anatomia de um perfil de agente

Todo `.devin/agents/<nome>.md` segue a mesma forma:

```markdown
---
name: backend-developer
description: Implementa módulos em <stack>. Use para: <gatilhos claros>.
---

## Papel
(o que ele é responsável por fazer)

## Escopo exclusivo
- PODE editar: `src/server/**`
- NÃO toca: `schema`, `frontend/**`

## Convenções
(idioma, nomenclatura, camadas, libs do projeto)

## Validação obrigatória antes de reportar
- `npm run build` / `npm run lint`

## Formato de saída
(o que reportar: arquivos alterados, decisões, pendências)
```

A `description` é o **roteador** — o modelo decide quando delegar por ela. Escreva com gatilhos de uso, não só o que o agente é.

## 3. O elenco mínimo viável

| Perfil | Papel | Escreve? |
|--------|-------|----------|
| `orchestrator` | Decompõe demanda, delega, consolida | Não |
| `<stack>-developer` (1 por domínio) | Implementa | Sim |
| `database-migrator` | Schema/migrations seguras | Sim |
| `qa-reviewer` | Lint, typecheck, revisão de diff | **Não** |
| `security-reviewer` | Audita falhas antes de deploy | **Não** |
| `docs-curator` | Mantém docs/ alinhada ao código | Sim |
| Dev extras conforme o produto | (ex.: `lia-kb-curator` aqui) | — |

**Regra de ouro:** agentes de revisão **nunca editam** — reportam; quem corrige é o desenvolvedor do domínio.

## 4. Skills vs. agentes

- **Skill** (`SKILL.md`) = *receita* — processo repetível invocado por `skill` (ex.: "scaffold de módulo", "migration segura"). Conhecimento, não trabalhador.
- **Agente** = *trabalhador* — janela de contexto separada que executa.

Lazy loading obrigatório: leia a `description`, invoque só o necessário.

## 5. Hooks de custo zero

Tudo verificável por script vira script — não LLM:

- **Pre-commit/post-commit**: atualizar páginas de versão, registrar atividade
- **Guard**: bloquear comandos destrutivos (`hook-guard` em `hooks.v1.json`)
- **Validate**: lint+typecheck num comando único chamável
- **Geradores determinísticos**: nunca incluir `new Date()`/`random` em saída commitada (suja o git a cada run — erro que cometi e corrigi no `sync-docs`)

## 6. O fluxo de orquestração que funciona

```
Demanda → decompor por domínio → frentes com ARQUIVOS DISJUNTOS
→ subagentes em paralelo (background), prompts auto-contidos
→ cada um valida seu escopo → consolidar: typecheck global
→ security-reviewer (se tocou auth/endpoints/migrations)
→ corrigir achados → commit único → deploy → curadores
```

**Duas regras que salvam tudo:**
1. **Arquivos disjuntos** — liste no prompt o que cada agente *pode* e *não pode* tocar
2. **Prompt auto-contido** — o subagente não vê sua conversa; inclua paths absolutos, arquivo:linha, convenções e comando de validação

## 7. AGENTS.md — o índice

Enxuto, só apontadores:
- stack + comandos de validação/deploy
- tabela de subagentes e domínios
- tabela de skills
- regras de execução (produção compartilhada, registro de atividade, curadoria pós-mudança)

Detalhe de convenções vai em `copilot-instructions.md`/`project-instructions.md` — AGENTS.md não duplica.

## 8. Checklist para replicar em outro projeto

1. Criar `.devin/agents/` com orchestrator + 1 dev por domínio + qa + security
2. `AGENTS.md` índice + convenções canônicas
3. `.agents/skills/` para os 2-3 processos mais repetidos do projeto
4. `hook-guard` + hook de validação
5. Script de deploy/documentado
6. Curador de docs (o mais barato e mais esquecido)
7. Testar com uma demanda multi-domínio em paralelo pra calibrar os prompts

Quer que eu gere essa estrutura-base como template copiável (os `.md` de perfil genéricos já preenchidos)?