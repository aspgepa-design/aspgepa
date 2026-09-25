/**
 * Utilitários de formatação compartilhados.
 */

const APP_NOME = 'ASPGE-PA — Associação dos Servidores da Procuradoria-Geral do Estado do Pará';

/** Escapa HTML para uso em templates de email/views */
function esc(s) {
  return String(s == null ? '' : s).replace(/[<>&"]/g,
    c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}

/** dd/mm/aaaa HH:mm em pt-BR (aceita Date ou string) */
function formatarDataHora(data) {
  const d = data instanceof Date ? data : new Date(data);
  if (isNaN(d)) return '-';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

module.exports = { APP_NOME, esc, formatarDataHora };
