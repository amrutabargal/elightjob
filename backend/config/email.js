import nodemailer from 'nodemailer';

let transporter = null;
let transporterMode = null; // 'smtp' | 'ethereal' | null
let initPromise = null;

const useTempMail = () =>
  process.env.USE_TEMP_MAIL === 'true' ||
  (process.env.NODE_ENV !== 'production' && !process.env.SMTP_USER?.trim());

async function createEtherealTransporter() {
  const testAccount = await nodemailer.createTestAccount();

  const transport = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log('\n========================================');
  console.log('  TEMP MAIL (Ethereal) — OTP emails work');
  console.log('  Login:', testAccount.user);
  console.log('  Pass: ', testAccount.pass);
  console.log('  After register, open Preview URL in terminal');
  console.log('========================================\n');

  return transport;
}

async function ensureTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_USER?.trim() && SMTP_PASS?.trim()) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    transporterMode = 'smtp';
    console.log('Email: using SMTP from .env →', SMTP_USER);
    return transporter;
  }

  if (useTempMail()) {
    transporter = await createEtherealTransporter();
    transporterMode = 'ethereal';
    return transporter;
  }

  return null;
}

export const getEmailTransporter = async () => {
  if (!initPromise) {
    initPromise = ensureTransporter().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
};

export const sendEmail = async ({ to, subject, html }) => {
  const transport = await getEmailTransporter();

  if (!transport) {
    console.log('\n--- EMAIL (no SMTP / temp mail) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    const otpMatch = html.match(/>(\d{6})</);
    if (otpMatch) console.log(`>>> OTP CODE: ${otpMatch[1]} <<<`);
    console.log('--- END ---\n');
    return { dev: true };
  }

  const from =
    process.env.EMAIL_FROM ||
    (transporterMode === 'ethereal'
      ? 'Elite Placement Hub <noreply@ethereal.email>'
      : process.env.SMTP_USER);

  const info = await transport.sendMail({ from, to, subject, html });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('\n>>> EMAIL SENT (temporary test inbox)');
    console.log(`    To: ${to}`);
    console.log(`    Subject: ${subject}`);
    const otpMatch = html.match(/>(\d{6})</);
    if (otpMatch) console.log(`    OTP: ${otpMatch[1]}`);
    console.log(`    OPEN IN BROWSER: ${previewUrl}\n`);
    return { sent: true, previewUrl, ethereal: true };
  }

  console.log(`Email sent to ${to}`);
  return { sent: true };
};
