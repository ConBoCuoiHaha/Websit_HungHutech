const nodemailer = require('nodemailer');

const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  : null;

async function sendMail(options) {
  if (!transport) {
    // Fallback: log only
    // eslint-disable-next-line no-console
    console.log('MAIL[disabled]', options.subject);
    return;
  }
  await transport.sendMail(options);
}

module.exports = { sendMail };

