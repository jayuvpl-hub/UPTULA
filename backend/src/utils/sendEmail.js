const transporter = require('../config/mailer');

const sendEmail = async (to, subject, html) => {
  const fromAddr = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!fromAddr) {
    throw new Error('EMAIL_USER is not configured');
  }
  try {
    await transporter.sendMail({
      from: `"Uptula Job Portal" <${fromAddr}>`,
      to,
      subject,
      html,
      text: String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });
  } catch (err) {
    console.error('[sendEmail] failed:', err.message);
    throw err;
  }
};

module.exports = sendEmail;