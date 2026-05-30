import nodemailer from 'nodemailer';
import { Resend } from 'resend';

let transporter = null;
let transporterMode = null;
let initPromise = null;
let gmailReady = false;
let resendReady = false;

const isDev = process.env.NODE_ENV !== 'production';

const useTempMailOnly = () => process.env.USE_TEMP_MAIL === 'true';

const getSmtpUser = () => process.env.SMTP_USER?.trim() || '';

const getSmtpPass = () =>
  String(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s/g, '');

const hasSmtpConfig = () => Boolean(getSmtpUser() && getSmtpPass());

const hasResendKey = () => Boolean(process.env.RESEND_API_KEY?.trim());

function extractOtp(html) {
  return html.match(/>(\d{6})</)?.[1];
}

async function createEtherealTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  transporterMode = 'ethereal';
  gmailReady = false;

  console.log('\n========================================');
  console.log('  ⚠ REAL EMAIL NOT CONFIGURED');
  console.log('  OTP only in green toast / preview link');
  console.log('  FIX (choose one):');
  console.log('  1) Gmail App Password → SMTP_PASS in .env');
  console.log('     https://myaccount.google.com/apppasswords');
  console.log('  2) Resend API key → RESEND_API_KEY in .env');
  console.log('     https://resend.com/api-keys (free)');
  console.log('========================================\n');

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

async function createGmailTransporter() {
  const user = getSmtpUser();
  const pass = getSmtpPass();

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS required');
  }

  if (pass.length < 16 || pass.includes('@')) {
    throw new Error(
      'SMTP_PASS must be Google App Password (16 chars), not login password Elite@hub123'
    );
  }

  const configs = [
    { host: 'smtp.gmail.com', port: 465, secure: true },
    { host: 'smtp.gmail.com', port: 587, secure: false },
  ];

  let lastErr;
  for (const cfg of configs) {
    try {
      const transport = nodemailer.createTransport({
        ...cfg,
        auth: { user, pass },
      });
      await transport.verify();
      transporterMode = 'gmail';
      gmailReady = true;
      console.log('\n✓ Gmail OK — OTP will arrive in real inbox from', user, '\n');
      return transport;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function sendViaResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY.trim();
  const from =
    process.env.RESEND_FROM?.trim() || 'Elite Placement Hub <onboarding@resend.dev>';

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }

  resendReady = true;
  console.log(`✓ Email sent via Resend to ${to} (id: ${data?.id || 'ok'})`);
  return { sent: true, gmail: true, resend: true, to, id: data?.id };
}

async function sendViaEthereal({ to, subject, html }) {
  if (!transporter || transporterMode !== 'ethereal') {
    transporter = await createEtherealTransporter();
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Elite Placement Hub <noreply@test.local>',
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  const devOtp = extractOtp(html);

  console.log('\n>>> TEST OTP (not in real inbox)');
  console.log(`    To: ${to}`);
  if (devOtp) console.log(`    OTP: ${devOtp}`);
  if (previewUrl) console.log(`    OPEN: ${previewUrl}`);
  console.log('');

  return {
    sent: true,
    gmail: false,
    ethereal: true,
    previewUrl,
    to,
    devOtp,
    emailWarning:
      'Real email not configured. Use OTP from green toast. Set Gmail App Password OR RESEND_API_KEY in backend/.env',
  };
}

async function getGmailTransport() {
  if (transporter && transporterMode === 'gmail' && gmailReady) {
    return transporter;
  }
  transporter = await createGmailTransporter();
  return transporter;
}

/** Send to real inbox: Gmail → Resend → (dev only) Ethereal test */
export const sendEmail = async ({ to, subject, html }) => {
  const devOtp = extractOtp(html);

  if (!useTempMailOnly() && hasSmtpConfig()) {
    try {
      const transport = await getGmailTransport();
      const from = process.env.EMAIL_FROM || `Elite Placement Hub <${getSmtpUser()}>`;
      await transport.sendMail({ from, to, subject, html });
      return { sent: true, gmail: true, to, devOtp };
    } catch (err) {
      console.warn('Gmail failed:', err.message?.split('\n')[0]);
      gmailReady = false;
      transporter = null;
      transporterMode = null;
    }
  }

  if (hasResendKey()) {
    try {
      const result = await sendViaResend({ to, subject, html });
      return { ...result, devOtp };
    } catch (err) {
      console.warn('Resend failed:', err.message);
      resendReady = false;
    }
  }

  if (isDev || useTempMailOnly()) {
    return sendViaEthereal({ to, subject, html });
  }

  console.log('\n--- EMAIL FAILED ---');
  console.log(`To: ${to}`);
  if (devOtp) console.log(`OTP: ${devOtp}`);
  console.log('Configure Gmail App Password or RESEND_API_KEY in .env\n');
  return { sent: false, dev: true, devOtp, emailWarning: 'Email not configured on server' };
};

async function ensureTransporter() {
  if (useTempMailOnly()) {
    transporter = await createEtherealTransporter();
    return transporter;
  }
  if (hasSmtpConfig()) {
    try {
      transporter = await createGmailTransporter();
      return transporter;
    } catch {
      /* fall through */
    }
  }
  if (hasResendKey()) {
    resendReady = true;
    console.log('\n✓ Resend API configured — OTP will go to real inbox\n');
    return null;
  }
  if (isDev) {
    transporter = await createEtherealTransporter();
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

export const isGmailReady = () => gmailReady;
export const isResendReady = () => resendReady || hasResendKey();

export async function initEmailOnStartup() {
  try {
    await getEmailTransporter();
    if (!gmailReady && hasResendKey()) {
      console.log('Email mode: Resend (real inbox)');
    }
  } catch (err) {
    console.error('Email init:', err.message);
  }
}
