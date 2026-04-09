# ASPGE-PA — Portal do Associado

Sistema web desenvolvido em **Google Apps Script** para a **Associação dos Servidores da Procuradoria Geral do Estado do Pará (ASPGE-PA)**.

## Visão Geral

Aplicação web (Web App) que funciona como portal completo para gestão de associados, com autenticação por CPF, painel administrativo e páginas públicas de inscrição e atualização cadastral.

## Funcionalidades

### Portal do Associado (login por CPF)
- **Dashboard** — Carteira digital do associado, situação cadastral, próximos eventos
- **Transparência Financeira** — Visualização pública de receitas, despesas e saldo
- **Convênios** — Listagem de parceiros e benefícios disponíveis
- **Votações** — Consulta de pautas abertas e encerradas
- **Meu Cadastro** — Atualização de dados pessoais, upload de foto 3x4 e documentos

### Perfis de Acesso
| Perfil | Permissões extras |
|---|---|
| **Associado** | Acesso padrão ao portal |
| **Tesoureiro** | Gestão financeira (lançar/excluir entradas e saídas) |
| **Diretor** | Painéis de gestão de eventos e convênios |

### Páginas Públicas
- **Ficha de Inscrição** (`?p=inscricao`) — Formulário para novos associados
- **Atualização Cadastral** (`?p=atualizar`) — Busca por CPF ou nome para completar dados pendentes

## Estrutura do Projeto

```
src/
├── appsscript.json            # Manifesto (escopos OAuth, timezone, config webapp)
├── Código.js                  # Backend (rotas, CRUD, upload, setup)
├── Portal.html                # Frontend principal (login + SPA com sidebar)
├── Formulario.html            # Página pública de inscrição
└── FormularioAtualizacao.html # Página pública de atualização cadastral
```

## Integrações

- **Google Sheets** — Base de dados (abas: Associados, Financeiro, Convenios, Votacoes, Eventos, Inscrições)
- **Google Drive** — Armazenamento de fotos e documentos dos associados (pastas: `Fotos Associados`, `Documentos/[CPF]`)

## Escopos OAuth

- `spreadsheets` — Leitura/escrita na planilha
- `drive` / `drive.file` — Upload e gerenciamento de arquivos
- `script.external_request` — Requisições externas

## Pré-requisitos

- [Node.js](https://nodejs.org/)
- [clasp](https://github.com/google/clasp) (`npm install -g @google/clasp`)
- Conta Google com acesso ao projeto Apps Script

## Desenvolvimento

```bash
# Login no Google
clasp login

# Clonar o projeto
clasp clone <SCRIPT_ID> --rootDir src

# Enviar alterações
clasp push

# Abrir no editor online
clasp open

# Criar novo deploy
clasp deploy
```

## Setup Inicial

Execute a função `setupInicial()` no editor do Apps Script para criar automaticamente as abas necessárias na planilha (Financeiro, Convenios, Votacoes, Eventos) com dados de exemplo e as pastas no Google Drive.

## Configuração

As constantes de ID ficam em `Código.js`:

- `PASTA_RAIZ_ID` — ID da pasta raiz no Google Drive
- `PLANILHA_ID` — ID da planilha Google Sheets principal

## Deploy

A aplicação é implantada como **Web App** do Google Apps Script:
- **Executa como:** Usuário que implantou
- **Acesso:** Qualquer pessoa (anônimo)
- **Timezone:** America/Sao_Paulo
