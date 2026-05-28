/**
 * Check why OTP email does not reach inbox.
 * Run: node scripts/check-email-setup.js
 */
import 'dotenv/config';

const pass = String(process.env.SMTP_PASS || '').replace(/\s/g, '');

console.log('\n=== Email setup check ===\n');

if (process.env.USE_TEMP_MAIL === 'true') {
  console.log('USE_TEMP_MAIL=true → only test preview, not real inbox');
}

if (pass.includes('@') || pass.length < 16) {
  console.log('❌ SMTP_PASS =', pass ? `"${pass.slice(0, 3)}..."` : '(empty)');
  console.log('   This looks like LOGIN password. Gmail rejects it.');
  console.log('   Fix: https://myaccount.google.com/apppasswords');
  console.log('   Use 16-character App Password in SMTP_PASS\n');
} else {
  console.log('✓ SMTP_PASS length looks like App Password (16 chars)\n');
}

if (process.env.RESEND_API_KEY?.trim()) {
  console.log('✓ RESEND_API_KEY is set — real inbox works via Resend\n');
} else {
  console.log('○ RESEND_API_KEY not set');
  console.log('  Free fix: https://resend.com/api-keys → add to .env\n');
}

console.log('Test send: npm run test:otp-email -- your@gmail.com\n');
