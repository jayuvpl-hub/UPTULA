const nodemailer = require('nodemailer');

// Use flexible SMTP settings so it works both locally (Gmail)
// and on hosting (e.g. cPanel SMTP) without changing route logic.
const port = Number(process.env.SMTP_PORT || 465);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port,
  // If SMTP_SECURE is not explicitly set, infer from port (465 => SSL, others => STARTTLS)
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;