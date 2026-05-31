import nodemailer from 'nodemailer';
import { Resend } from 'resend';

let transporter = null;
let transporterMode = null;
let initPromise = null;
let gmailReady = false;

/** Render sets RENDER=true; without NODE_ENV=production email was using dev/Gmail path */
const isProductionHost =
  process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
const isLocalDev = !isProductionHost;

const useTempMailOnly = () => process.env.USE_TEMP_MAIL === 'true';

const getSmtpUser = () => process.env.SMTP_USER?.trim() || '';

const getSmtpPass = () =>
  String(process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '').replace(/\s/g, '');

const hasSmtpConfig = () => Boolean(getSmtpUser() && getSmtpPass());

const hasResendKey = () => Boolean(process.env.RESEND_API_KEY?.trim());

const getBrevoHttpKey = () => {
  const v3 = process.env.BREVO_V3_API_KEY?.trim() || '';
  if (v3.startsWith('xkeysib-')) return v3;
  const key = process.env.BREVO_API_KEY?.trim() || '';
  return key.startsWith('xkeysib-') ? key : '';
};

const getBrevoSmtpKey = () => {
  const smtpKey = process.env.BREVO_SMTP_KEY?.trim() || '';
  if (smtpKey.startsWith('xsmtpsib-')) return smtpKey;
  const key = process.env.BREVO_API_KEY?.trim() || '';
  return key.startsWith('xsmtpsib-') ? key : '';
};

const getBrevoSmtpLogin = () =>
  process.env.BREVO_SMTP_LOGIN?.trim() ||
  process.env.BREVO_ACCOUNT_EMAIL?.trim() ||
  '';

const hasBrevoHttpKey = () => Boolean(getBrevoHttpKey());
const hasBrevoSmtpKey = () => Boolean(getBrevoSmtpKey());
const hasBrevoKey = () => hasBrevoHttpKey() || hasBrevoSmtpKey();

function extractOtp(html) {
  return html.match(/>(\d{6})</)?.[1];
}

function getSenderEmail() {
  const email =
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    getSmtpUser() ||
    'eliteplacementhubhiring@gmail.com';
  return email.toLowerCase();
}

function getSenderName() {
  return process.env.BREVO_SENDER_NAME?.trim() || 'Elite Placement Hub';
}

function getFromAddress() {
  const raw = process.env.EMAIL_FROM?.trim();
  if (raw) {
    const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
    if (match) {
      return `${match[1].trim()} <${match[2].trim().toLowerCase()}>`;
    }
    return raw.includes('@') ? raw.toLowerCase() : raw;
  }
  return `${getSenderName()} <${getSenderEmail()}>`;
}

async function createEtherealTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  transporterMode = 'ethereal';
  gmailReady = false;

  console.log('\n========================================');
  console.log('  ⚠ REAL EMAIL NOT CONFIGURED (local dev)');
  console.log('  Add BREVO_V3_API_KEY (xkeysib-) or RESEND_API_KEY');
  console.log('========================================\n');

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

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
      sender: { name: getSenderName(), email: getSenderEmail().toLowerCase() },
      to: [{ email: to.toLowerCase() }],
      replyTo: { email: getSenderEmail().toLowerCase(), name: getSenderName() },
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brevo HTTP: ${text.slice(0, 200)}`);
  }

  console.log(`✓ OTP sent via Brevo HTTP → ${to}`);
  return { sent: true, provider: 'brevo-http', to };
}

async function sendViaBrevoSmtp({ to, subject, html }) {
  const smtpKey = getBrevoSmtpKey();
  if (!smtpKey) return null;

  const login = getBrevoSmtpLogin();
  if (!login) {
    throw new Error(
      'BREVO_SMTP_LOGIN missing — set to email you use to login at brevo.com (SMTP tab → Login)'
    );
  }

  const configs = [
    { host: 'smtp-relay.brevo.com', port: 587, secure: false },
    { host: 'smtp-relay.brevo.com', port: 465, secure: true },
  ];

  let lastErr;
  for (const cfg of configs) {
    try {
      const transport = nodemailer.createTransport({
        ...cfg,
        auth: { user: login, pass: smtpKey },
        connectionTimeout: 25000,
        greetingTimeout: 25000,
        socketTimeout: 25000,
      });
      await transport.sendMail({
        from: getFromAddress(),
        to,
        subject,
        html,
      });
      console.log(`✓ OTP sent via Brevo SMTP → ${to}`);
      return { sent: true, provider: 'brevo-smtp', to };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
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

  if (error) throw new Error(`Resend: ${error.message}`);

  console.log(`✓ OTP sent via Resend → ${to}`);
  return { sent: true, provider: 'resend', to, id: data?.id };
}

async function sendViaGmail({ to, subject, html }) {
  if (useTempMailOnly() || !hasSmtpConfig()) return null;

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: getSmtpUser(), pass: getSmtpPass() },
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

  gmailReady = true;
  console.log(`✓ OTP sent via Gmail → ${to}`);
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

  return {
    sent: true,
    provider: 'ethereal',
    previewUrl: nodemailer.getTestMessageUrl(info),
    to,
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
      console.warn('Brevo HTTP failed, trying SMTP:', err.message);
    }
  }
  return sendViaBrevoSmtp(payload);
}

async function tryResendSend(payload) {
  if (!hasResendKey()) return null;
  return sendViaResend(payload);
}

async function tryGmailSend(payload) {
  if (!isLocalDev || useTempMailOnly() || !hasSmtpConfig()) return null;
  return sendViaGmail(payload);
}

export const sendEmail = async ({ to, subject, html }) => {
  const devOtp = extractOtp(html);
  const failures = [];

  const providers = isLocalDev
    ? [tryGmailSend, tryBrevoSend, tryResendSend]
    : [tryBrevoSend, tryResendSend];

  for (const provider of providers) {
    try {
      const result = await provider({ to, subject, html });
      if (result?.sent) return { ...result, devOtp };
    } catch (err) {
      const msg = err.message?.split('\n')[0] || String(err);
      failures.push(msg);
      console.warn('Email failed:', msg);
    }
  }

  if (isLocalDev && (useTempMailOnly() || failures.length)) {
    return sendViaEthereal({ to, subject, html });
  }

  throw new Error(failures.join(' | ') || 'Email not configured');
};

export const getEmailSetupHint = () => {
  if (hasBrevoHttpKey() || hasResendKey()) return null;

  if (hasBrevoSmtpKey() && !getBrevoSmtpLogin()) {
    return (
      'Set BREVO_SMTP_LOGIN on Render = email you use to login at brevo.com ' +
      '(Brevo → SMTP & API → SMTP → Login field). ' +
      'Or use BREVO_V3_API_KEY with xkeysib- from API Keys tab.'
    );
  }

  if (hasBrevoSmtpKey()) {
    return (
      'Brevo SMTP auth failed. BREVO_SMTP_LOGIN must be your Brevo login email (not sender email). ' +
      'Best fix: Brevo → API Keys → generate xkeysib- key → set as BREVO_V3_API_KEY on Render.'
    );
  }

  return 'Add BREVO_V3_API_KEY (xkeysib-) or RESEND_API_KEY on Render.';
};

export const canSendRealEmail = () => {
  if (isLocalDev) return hasBrevoKey() || hasResendKey() || hasSmtpConfig();
  if (hasBrevoHttpKey() || hasResendKey()) return true;
  if (hasBrevoSmtpKey() && getBrevoSmtpLogin()) return true;
  return false;
};

export const getEmailStatus = () => {
  const setupHint = getEmailSetupHint();
  const ready = canSendRealEmail() && !setupHint;

  return {
    gmail: hasSmtpConfig(),
    brevo: hasBrevoKey(),
    brevoHttp: hasBrevoHttpKey(),
    brevoSmtp: hasBrevoSmtpKey(),
    brevoSmtpLoginSet: Boolean(getBrevoSmtpLogin()),
    resend: hasResendKey(),
    ready,
    production: isProductionHost,
    setupRequired: !ready,
    setupHint,
    setupUrl: 'https://app.brevo.com/settings/keys/api',
  };
};

async function ensureTransporter() {
  if (hasBrevoHttpKey()) {
    console.log('\n✓ Brevo HTTP API ready\n');
  } else if (hasBrevoSmtpKey()) {
    console.log(
      `\n✓ Brevo SMTP key set (login: ${getBrevoSmtpLogin() || 'MISSING — set BREVO_SMTP_LOGIN'})\n`
    );
  } else if (hasResendKey()) {
    console.log('\n✓ Resend API ready\n');
  } else if (isLocalDev && hasSmtpConfig()) {
    console.log('\n✓ Gmail ready for local dev\n');
  } else if (isProductionHost) {
    console.error('\n❌ EMAIL NOT READY — see /api/health setupHint\n');
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
export const isResendReady = () => hasResendKey();

export async function initEmailOnStartup() {
  try {
    await getEmailTransporter();
    const status = getEmailStatus();
    if (status.setupHint) console.error('EMAIL SETUP:', status.setupHint);
  } catch (err) {
    console.error('Email init:', err.message);
  }
}
