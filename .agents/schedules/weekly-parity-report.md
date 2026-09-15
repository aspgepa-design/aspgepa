# Rotina: Relatório Semanal de Paridade e Saúde

- **Objetivo:** gerar um resumo semanal do estado do projeto ASPGE-PA.
- **Instruções:**
  1. Verifique `git status` e `git log origin/main -5` para mudanças recentes em `aspge.org.br/`.
  2. Rode `.agents/hooks/validate-syntax.sh` e registre o resultado.
  3. Confira paridade pendente com o piloto `GAS/` (delegar leitura ao `gas-legacy-analyst` se necessário).
  4. Liste relatórios novos em `reports/` da última semana.
  5. Gere `reports/weekly-<YYYY-MM-DD>.md` com: mudanças, pendências de paridade, riscos e próximos passos.
