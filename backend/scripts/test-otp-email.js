/**
 * Test OTP email — run: node scripts/test-otp-email.js your@email.com
 * Requires .env SMTP_USER + SMTP_PASS (Google App Password, 16 chars)
 */
import 'dotenv/config';
import { initEmailOnStartup } from '../config/email.js';
import { sendOtpEmail } from '../utils/emailOtp.js';

const to = process.argv[2] || process.env.SMTP_USER;
const fakeUser = { name: 'Test User', email: to, userId: 'ELITE00001' };
const otp = '123456';

await initEmailOnStartup();
const result = await sendOtpEmail(fakeUser, otp);

console.log('\n--- OTP email test ---');
console.log('To:', to);
console.log('OTP:', otp);
if (result.sent) console.log('Status: Sent via', result.provider || 'email', '✓');
else if (result.previewUrl) console.log('Status: Test inbox — open:', result.previewUrl);
else console.log('Result:', result);
console.log('');
