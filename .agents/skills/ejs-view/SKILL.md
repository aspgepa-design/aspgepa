---
name: ejs-view
description: "Cria ou ajusta views EJS em aspge.org.br/src/views seguindo o layout main.ejs e os partials existentes."
disable-model-invocation: false
allowed-tools:
  - "read_file"
  - "edit"
  - "write_to_file"
effort-level: "medium"
---

# Procedimento: View EJS

Quando for criada/alterada uma página do portal:

1. **Estude** `src/views/layouts/main.ejs` e os partials `partials/head.ejs`, `partials/header.ejs`, `partials/sidebar.ejs`. Replique a estrutura de `portal.ejs` ou `home.ejs`.

2. **Estrutura padrão:**
   ```ejs
   <%- include('partials/head', { titulo: 'Título' }) %>
   <%- include('partials/header') %>
   <div class="container">
     <%- include('partials/sidebar') %>
     <main>
       <!-- conteúdo -->
     </main>
   </div>
   ```
   (Ajuste conforme o padrão real do projeto — leia uma view existente primeiro.)

3. **Escape:** `<%= var %>` para texto; `<%- include(...) %>` apenas para partials/HTML confiável.

4. **Dados:** a view recebe tudo via `res.render('view', { user, dados, ... })`. Se faltar dado, peça ajuste no controller — não consulte banco na view.

5. **Formulários:** aponte para rotas `/api/...` existentes ou páginas GET; inclua tratamento de erro/flash conforme o padrão das views atuais.

6. **Arquivos estáticos:** referencie `/logo.png`, `/uploads/...` e assets de `public/` com caminhos absolutos.
