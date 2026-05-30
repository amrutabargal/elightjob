import 'dotenv/config';
import { initEmailOnStartup, sendEmail } from '../config/email.js';

await initEmailOnStartup();
const result = await sendEmail({
  to: 'test@example.com',
  subject: '123456 is your Elite Placement Hub verification code',
  html: '<p>Your email verification OTP is:</p><p style="font-size:32px;font-weight:800">123456</p>',
});
console.log('Result:', result);
