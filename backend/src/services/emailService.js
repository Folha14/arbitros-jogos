const nodemailer = require('nodemailer');

let transporterPromise = null;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  const configuracao = [SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS];

  if (configuracao.some((valor) => !valor || !valor.trim())) {
    throw new Error('Configuração SMTP incompleta.');
  }

  const port = Number(SMTP_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('SMTP_PORT inválido.');
  }

  transporterPromise = Promise.resolve(
    nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: SMTP_SECURE === 'true',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  );

  return transporterPromise;
}

function registarFalhaEmail(tipo, err, conteudoDev) {
  const mensagem = err instanceof Error ? err.message : String(err);
  console.error(`Falha ao enviar ${tipo}: ${mensagem}`);

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[DEV] email não enviado');
    console.log(conteudoDev);
  }

  return false;
}

async function enviarEmailVerificacao(email, token, nome) {
  const urlConfirmacao = `${process.env.FRONTEND_URL}/confirmar-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #ececea; border-radius: 12px; padding: 24px; background: #ffffff;">
      <h2 style="color: #4e8c28; margin-top: 0;">Bem-vindo ao GRIB Arbitragem! ⚽</h2>
      <p>Olá <strong>${nome}</strong>,</p>
      <p>Obrigado por te registares na plataforma oficial de arbitragem do GRIB.</p>
      <p>Para ativar a tua conta e poderes aceder aos teus jogos e histórico, por favor confirma o teu email clicando no botão abaixo:</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${urlConfirmacao}" style="background-color: #4e8c28; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Confirmar a minha conta</a>
      </div>
      <p style="font-size: 0.85rem; color: #6f6f6c;">Ou copia e cola este link no teu navegador:<br><a href="${urlConfirmacao}">${urlConfirmacao}</a></p>
    </div>
  `;

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: '"GRIB Arbitragem" <no-reply@grib.pt>',
      to: email,
      subject: 'Confirma a tua conta - GRIB Arbitragem',
      html,
    });
    return true;
  } catch (err) {
    registarFalhaEmail('de confirmação', err, `Link de confirmação: ${urlConfirmacao}`);
    return false;
  }
}

async function enviarCodigo2FA(email, codigo, nome) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; border: 1px solid #ececea; border-radius: 12px; padding: 24px; background: #ffffff;">
      <h2 style="color: #16170f; margin-top: 0;">Código de Segurança 🔑</h2>
      <p>Olá <strong>${nome}</strong>,</p>
      <p>Foi solicitada uma autenticação na tua conta do GRIB Arbitragem.</p>
      <p>O teu código de verificação de 2 fatores é:</p>
      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 2.2rem; font-weight: 800; letter-spacing: 6px; color: #4e8c28; background: #f2f8ee; padding: 12px 28px; border-radius: 10px; border: 1px dashed #4e8c28; display: inline-block;">${codigo}</span>
      </div>
      <p style="font-size: 0.85rem; color: #6f6f6c;">Este código é válido por 10 minutos. Se não tentaste entrar na tua conta, ignora este email.</p>
    </div>
  `;

  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: '"GRIB Segurança" <no-reply@grib.pt>',
      to: email,
      subject: `${codigo} é o teu código de verificação 2FA - GRIB`,
      html,
    });
    return true;
  } catch (err) {
    registarFalhaEmail('do código 2FA', err, `Código 2FA: ${codigo}`);
    return false;
  }
}

module.exports = {
  enviarEmailVerificacao,
  enviarCodigo2FA,
};
