const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function sendMail(to, subject, html) {
  const from = process.env.FROM_EMAIL || 'no-reply@voting.local';
  const tx = getTransporter();
  return tx.sendMail({ from, to, subject, html });
}

async function sendOtpEmail(to, otp, purpose) {
  const subject = `Your ${purpose} OTP Code`;
  const html = `
    <div style="font-family: Arial, sans-serif">
      <h2>${purpose} Verification</h2>
      <p>Your one-time passcode is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px">${otp}</p>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;
  return sendMail(to, subject, html);
}

module.exports = { sendMail, sendOtpEmail };