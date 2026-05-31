import nodemailer from 'nodemailer';
import { Resend } from 'resend';

let transporter = null;
let transporterMode = null;
let initPromise = null;
let gmailReady = false;

const isDev = process.env.NODE_ENV !== 'production';

const useTempMailOnly = () => process.env.USE_TEMP_MAIL === 'true';

const getSmtpUser = () => process.env.SMTP_USER?.trim() || '';

const getSmtpPass = () =>
  String(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s/g, '');

const hasSmtpConfig = () => Boolean(getSmtpUser() && getSmtpPass());

const hasResendKey = () => Boolean(process.env.RESEND_API_KEY?.trim());

const getBrevoApiKeyRaw = () => process.env.BREVO_API_KEY?.trim() || '';

const getBrevoHttpKey = () => {
  const key = getBrevoApiKeyRaw();
  return key.startsWith('xkeysib-') ? key : '';
};

const getBrevoSmtpKey = () => {
  const smtpKey = process.env.BREVO_SMTP_KEY?.trim();
  if (smtpKey) return smtpKey;
  const key = getBrevoApiKeyRaw();
  return key.startsWith('xsmtpsib-') ? key : '';
};

const hasBrevoHttpKey = () => Boolean(getBrevoHttpKey());
const hasBrevoSmtpKey = () => Boolean(getBrevoSmtpKey());
const hasBrevoKey = () => hasBrevoHttpKey() || hasBrevoSmtpKey();

function extractOtp(html) {
  return html.match(/>(\d{6})</)?.[1];
}

function getSenderEmail() {
  return (
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    getSmtpUser() ||
    'Eliteplacementhubhiring@gmail.com'
  );
}

function getSenderName() {
  return process.env.BREVO_SENDER_NAME?.trim() || 'Elite Placement Hub';
}

function getFromAddress() {
  return process.env.EMAIL_FROM?.trim() || `${getSenderName()} <${getSenderEmail()}>`;
}

async function createEtherealTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  transporterMode = 'ethereal';
  gmailReady = false;

  console.log('\n========================================');
  console.log('  ⚠ REAL EMAIL NOT CONFIGURED');
  console.log('  Add BREVO_API_KEY or RESEND_API_KEY on Render');
  console.log('  https://www.brevo.com (free 300/day)');
  console.log('========================================\n');

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

/** Brevo HTTP API — key must start with xkeysib- */
async function sendViaBrevoHttp({ to, subject, html }) {
  const apiKey = getBrevoHttpKey();
  if (!apiKey) return null;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: getSenderName(), email: getSenderEmail() },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brevo HTTP failed: ${text.slice(0, 180)}`);
  }

  console.log(`✓ OTP email sent via Brevo HTTP → ${to}`);
  return { sent: true, provider: 'brevo-http', to };
}

/** Brevo SMTP relay — key starts with xsmtpsib- */
async function sendViaBrevoSmtp({ to, subject, html }) {
  const smtpKey = getBrevoSmtpKey();
  if (!smtpKey) return null;

  const login = process.env.BREVO_SMTP_LOGIN?.trim() || getSenderEmail();

  const transport = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: { user: login, pass: smtpKey },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  await transport.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
  });

  console.log(`✓ OTP email sent via Brevo SMTP → ${to}`);
  return { sent: true, provider: 'brevo-smtp', to };
}

async function sendViaResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY.trim();
  const from =
    process.env.RESEND_FROM?.trim() || `${getSenderName()} <onboarding@resend.dev>`;

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend failed: ${error.message}`);
  }

  console.log(`✓ OTP email sent via Resend → ${to} (id: ${data?.id || 'ok'})`);
  return { sent: true, provider: 'resend', to, id: data?.id };
}

/** Gmail SMTP — works locally; often blocked on Render cloud */
async function sendViaGmail({ to, subject, html }) {
  if (useTempMailOnly() || !hasSmtpConfig()) return null;

  const user = getSmtpUser();
  const pass = getSmtpPass();

  if (pass.length < 16 || pass.includes('@')) {
    throw new Error('SMTP_PASS must be 16-char Google App Password');
  }

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    family: 4,
    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });

  await transport.sendMail({
    from: getFromAddress(),
    to,
    subject,
    html,
  });

  transporterMode = 'gmail';
  gmailReady = true;
  console.log(`✓ OTP email sent via Gmail → ${to}`);
  return { sent: true, provider: 'gmail', to };
}

async function sendViaEthereal({ to, subject, html }) {
  if (!transporter || transporterMode !== 'ethereal') {
    transporter = await createEtherealTransporter();
  }

  const info = await transporter.sendMail({
    from: getFromAddress(),
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
    provider: 'ethereal',
    ethereal: true,
    previewUrl,
    to,
    devOtp,
  };
}

async function tryBrevoSend(payload) {
  if (!hasBrevoKey()) return null;

  if (hasBrevoHttpKey()) {
    try {
      const result = await sendViaBrevoHttp(payload);
      if (result?.sent) return result;
    } catch (err) {
      if (!hasBrevoSmtpKey()) throw err;
      console.warn('Brevo HTTP failed, trying SMTP relay:', err.message);
    }
  }

  return sendViaBrevoSmtp(payload);
}

async function tryResendSend(payload) {
  if (!hasResendKey()) return null;
  return sendViaResend(payload);
}

async function tryGmailSend(payload) {
  if (useTempMailOnly() || !hasSmtpConfig()) return null;
  return sendViaGmail(payload);
}

/**
 * Production (Render): Brevo → Resend only (Gmail SMTP blocked on cloud — skip to fail fast)
 * Development: Gmail → Brevo → Resend → Ethereal test inbox
 */
export const sendEmail = async ({ to, subject, html }) => {
  const devOtp = extractOtp(html);
  const failures = [];

  const providers = isDev
    ? [tryGmailSend, tryBrevoSend, tryResendSend]
    : [tryBrevoSend, tryResendSend];

  for (const provider of providers) {
    try {
      const result = await provider({ to, subject, html });
      if (result?.sent) {
        return { ...result, devOtp };
      }
    } catch (err) {
      const msg = err.message?.split('\n')[0] || String(err);
      failures.push(msg);
      console.warn('Email provider failed:', msg);
      gmailReady = false;
      transporter = null;
      transporterMode = null;
    }
  }

  if (isDev || useTempMailOnly()) {
    return sendViaEthereal({ to, subject, html });
  }

  if (!hasBrevoKey() && !hasResendKey()) {
    throw new Error(
      'Email not configured: add BREVO_API_KEY on Render (https://www.brevo.com — free)'
    );
  }

  throw new Error(failures.join(' | ') || 'All email providers failed');
};

export const canSendRealEmail = () => {
  if (isDev) return hasBrevoKey() || hasResendKey() || hasSmtpConfig();
  return hasBrevoHttpKey() || hasResendKey();
};

export const getEmailSetupHint = () => {
  if (hasBrevoHttpKey() || hasResendKey()) return null;
  if (hasBrevoSmtpKey()) {
    return (
      'Wrong Brevo key: xsmtpsib needs BREVO_SMTP_LOGIN = Brevo account email. ' +
      'Use xkeysib- key from Brevo → API Keys tab instead.'
    );
  }
  return 'Add BREVO_API_KEY (xkeysib-) on Render — Brevo → SMTP & API → API Keys.';
};

async function ensureTransporter() {
  if (hasBrevoKey()) {
    const mode = hasBrevoHttpKey() ? 'HTTP' : 'SMTP relay';
    console.log(`\n✓ Brevo configured (${mode}) — OTP emails enabled\n`);
    return null;
  }
  if (hasResendKey()) {
    console.log('\n✓ Resend API configured — OTP via HTTP (Render-safe)\n');
    return null;
  }
  if (useTempMailOnly()) {
    transporter = await createEtherealTransporter();
    return transporter;
  }
  if (hasSmtpConfig() && isDev) {
    console.log('\n✓ Gmail configured for local dev\n');
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

export const getEmailStatus = () => {
  const productionReady = isDev
    ? hasBrevoKey() || hasResendKey() || hasSmtpConfig()
    : hasBrevoHttpKey() || hasResendKey();
  const setupHint = getEmailSetupHint();

  return {
    gmail: hasSmtpConfig(),
    brevo: hasBrevoKey(),
    brevoHttp: hasBrevoHttpKey(),
    brevoSmtp: hasBrevoSmtpKey(),
    resend: hasResendKey(),
    ready: productionReady && !setupHint,
    production: !isDev,
    setupRequired: Boolean(setupHint) || (!isDev && !productionReady),
    setupHint,
    setupUrl: 'https://app.brevo.com/settings/keys/api',
  };
};

export const isGmailReady = () => gmailReady;
export const isResendReady = () => hasResendKey();

export async function initEmailOnStartup() {
  try {
    const status = getEmailStatus();
    if (!status.ready && !isDev) {
      console.error(
        'EMAIL NOT READY: Add BREVO_API_KEY on Render → https://www.brevo.com (free)'
      );
    }
    await getEmailTransporter();
  } catch (err) {
    console.error('Email init:', err.message);
  }
}
