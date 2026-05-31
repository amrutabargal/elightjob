/**
 * Test email config and print exact Render environment variables.
 * Run: npm run setup:render-email
 */
import 'dotenv/config';
import { sendEmail, getEmailStatus } from '../config/email.js';

const testTo =
  process.argv[2] || process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'test@example.com';

process.env.NODE_ENV = 'production';
process.env.RENDER = 'true';

console.log('\n========== EMAIL SETUP CHECK ==========\n');
console.log('Status:', JSON.stringify(getEmailStatus(), null, 2));

const status = getEmailStatus();

if (status.setupHint) {
  console.log('\n⚠ ', status.setupHint);
}

console.log('\n--- Testing send to:', testTo, '---\n');

try {
  const result = await sendEmail({
    to: testTo,
    subject: 'Elite Placement Hub — OTP test',
    html: '<p>Test OTP: <strong>123456</strong></p>',
  });
  console.log('✅ SUCCESS via', result.provider);
  console.log('\nCopy these to Render → elightjob-4 → Environment:\n');
  printRenderVars(result.provider);
} catch (err) {
  console.log('❌ FAILED:', err.message);
  console.log('\n--- FIX (pick ONE) ---\n');
  console.log('OPTION 1 (BEST): Brevo → API Keys tab → xkeysib- key');
  console.log('  BREVO_V3_API_KEY = xkeysib-xxxxxxxx');
  console.log('');
  console.log('OPTION 2: Resend.com → free API key (re_...)');
  console.log('  RESEND_API_KEY = re_xxxxxxxx');
  console.log('');
  console.log('OPTION 3: Brevo SMTP key (xsmtpsib) + login from Brevo SMTP tab');
  console.log('  BREVO_SMTP_KEY = xsmtpsib-xxxxxxxx');
  console.log('  BREVO_SMTP_LOGIN = <email shown in Brevo SMTP tab Login field>');
  console.log('');
  printRenderVars('failed');
}

console.log('\nAlso set on Render:');
console.log('  NODE_ENV = production');
console.log('  BREVO_SENDER_EMAIL = Eliteplacementhubhiring@gmail.com');
console.log('  BREVO_SENDER_NAME = Elite Placement Hub');
console.log('  CLIENT_URL = https://elightplacementhub.netlify.app,https://eliteplacement.netlify.app,http://localhost:5173');
console.log('\nThen: Save → Manual Deploy → check /api/health → ready:true\n');

function printRenderVars(provider) {
  if (provider === 'brevo-http') {
    console.log('  BREVO_V3_API_KEY = <your xkeysib- key>');
  } else if (provider === 'brevo-smtp') {
    console.log('  BREVO_SMTP_KEY = <your xsmtpsib- key>');
    console.log('  BREVO_SMTP_LOGIN = <Brevo login email>');
  } else if (provider === 'resend') {
    console.log('  RESEND_API_KEY = <your re_ key>');
  }
}
