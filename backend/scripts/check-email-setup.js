/**
 * Check why OTP email does not reach inbox.
 * Run: node scripts/check-email-setup.js
 */
import 'dotenv/config';
import { getEmailStatus } from '../config/email.js';

const status = getEmailStatus();
const pass = String(process.env.SMTP_PASS || '').replace(/\s/g, '');

console.log('\n=== Email setup check ===\n');
console.log('Status:', status);

if (process.env.NODE_ENV === 'production' && !status.brevo && !status.resend) {
  console.log('\n❌ PRODUCTION: Gmail SMTP usually fails on Render.');
  console.log('   FIX (5 min, free): https://www.brevo.com');
  console.log('   1) Sign up → SMTP & API → Create API key');
  console.log('   2) Senders → verify Eliteplacementhubhiring@gmail.com');
  console.log('   3) Render → BREVO_API_KEY = your key');
  console.log('   4) Redeploy backend\n');
}

if (status.brevo) {
  console.log('✓ BREVO_API_KEY set — OTP will work on Render\n');
}

if (status.resend) {
  console.log('✓ RESEND_API_KEY set — OTP will work on Render\n');
}

if (pass.includes('@') || (pass && pass.length < 16)) {
  console.log('❌ SMTP_PASS looks like login password, not App Password');
  console.log('   Fix: https://myaccount.google.com/apppasswords\n');
} else if (status.gmail) {
  console.log('✓ Gmail App Password configured (works locally)\n');
}

console.log('Test: npm run test:otp-email -- your@gmail.com\n');
