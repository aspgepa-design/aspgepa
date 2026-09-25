/**
 * Serviço de email (nodemailer).
 *
 * Se SMTP_HOST não estiver configurado no .env, o envio é simulado via log —
 * permite desenvolver/testar sem credenciais e não quebra os fluxos.
 *
 * Variáveis (.env):
 *   SMTP_HOST  — servidor SMTP (ex.: smtp.gmail.com, mail.aspgepa.org.br)
 *   SMTP_PORT  — 587 (TLS) ou 465 (SSL)   [padrão: 587]
 *   SMTP_USER  — usuário/conta remetente
 *   SMTP_PASS  — senha ou app password
 *   SMTP_FROM  — remetente exibido       [padrão: "ASPGE-PA <SMTP_USER>"]
 */
const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined
    });
  }
  return transporter;
}

/**
 * Envia email. Retorna { enviado: true } ou { enviado: false, simulado?: true }.
 * Nunca lança exceção — falhas são apenas logadas.
 */
async function enviarEmail({ para, assunto, texto, html }) {
  if (!para) {
    logger.warn('enviarEmail chamado sem destinatário');
    return { enviado: false };
  }
  const t = getTransporter();
  if (!t) {
    logger.info(`[email simulado] para=${para} assunto="${assunto}"`);
    return { enviado: false, simulado: true };
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || `ASPGE-PA <${process.env.SMTP_USER}>`,
      to: para,
      subject: assunto,
      text: texto,
      html
    });
    logger.info(`Email enviado para ${para}: ${assunto}`);
    return { enviado: true };
  } catch (error) {
    logger.error(`Falha ao enviar email para ${para}:`, error);
    return { enviado: false };
  }
}

function esc(s) {
  return String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
}

/**
 * Confirmação de inscrição pública recebida (fire-and-forget).
 */
function notificarInscricao(associado) {
  if (!associado || !associado.email) return;
  const nome = esc(associado.nomeCompleto);
  enviarEmail({
    para: associado.email,
    assunto: 'Inscrição recebida — ASPGE-PA',
    texto:
      `Olá, ${associado.nomeCompleto}!\n\n` +
      `Recebemos sua ficha de inscrição na ASPGE-PA. ` +
      `Seu cadastro ficará pendente até a aprovação da diretoria.\n\n` +
      `Assim que for aprovado, você poderá acessar o portal do associado ` +
      `usando seu CPF como usuário e senha inicial (recomendamos alterá-la no primeiro acesso).\n\n` +
      `ASPGE-PA — Associação dos Servidores da Procuradoria-Geral do Estado do Pará`,
    html:
      `<p>Olá, <strong>${nome}</strong>!</p>` +
      `<p>Recebemos sua ficha de inscrição na <strong>ASPGE-PA</strong>. ` +
      `Seu cadastro ficará <strong>pendente</strong> até a aprovação da diretoria.</p>` +
      `<p>Após a aprovação, acesse o portal com seu <strong>CPF</strong> como usuário e senha inicial ` +
      `(recomendamos alterá-la no primeiro acesso).</p>` +
      `<p style="color:#6b7280;font-size:12px">ASPGE-PA — Associação dos Servidores da Procuradoria-Geral do Estado do Pará</p>`
  }).catch(() => {});
}

module.exports = { enviarEmail, notificarInscricao };
