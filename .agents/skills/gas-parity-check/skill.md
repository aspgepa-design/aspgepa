---
name: gas-parity-check
description: "Compara uma funcionalidade do piloto GAS/ com a implementação atual em aspge.org.br e aponta lacunas de paridade."
disable-model-invocation: false
allowed-tools:
  - "read_file"
  - "grep_search"
  - "find_by_name"
effort-level: "medium"
---

# Procedimento: Verificação de Paridade GAS → Node

Quando for preciso confirmar se o sistema atual reproduz o comportamento do piloto:

1. **Localize no piloto** `GAS/src/` o arquivo da funcionalidade:
   - `Código.js` — lógica de backend (Sheets/Drive, regras)
   - `Portal.html`, `Carteirinha.html`, `Formulario.html`, `FormularioAtualizacao.html`, `Versoes.html` — telas/fluxos

2. **Extraia a regra de negócio:** entradas, validações, perfis permitidos, saídas, efeitos colaterais (planilha, Drive, e-mail).

3. **Mapeie o equivalente** em `aspge.org.br/`: controller + rota + view + modelo Prisma correspondente.

4. **Produza a tabela de paridade:**
   | Funcionalidade | GAS (piloto) | aspge.org.br | Status |
   |---|---|---|---|
   | ... | arquivo/fluxo | arquivo/rota | ✅ paridade / ⚠️ divergente / ❌ ausente |

5. **Reporte lacunas** ao orquestrador com prioridade sugerida. Nunca edite `GAS/`.
