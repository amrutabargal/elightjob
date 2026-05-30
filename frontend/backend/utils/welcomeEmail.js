import { sendEmail } from '../config/email.js';
import { BRAND_NAME } from '../config/brand.js';
import { emailFooterHtml, SUPPORT_EMAIL } from '../config/support.js';

export async function sendWelcomeEmail(user, options = {}) {
  const { afterVerification = true } = options;
  const loginUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const intro = afterVerification
    ? 'Your email is <strong>verified</strong> and registration is complete. You can login anytime.'
    : 'Your registration is <strong>successful</strong>. Please verify your email using the <strong>OTP</strong> we sent in a separate email, then login.';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#ea580c;margin:0 0 8px">${BRAND_NAME}</h2>
      <p style="color:#334155">Hi <strong>${user.name}</strong>,</p>
      <p style="color:#334155">${intro}</p>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin:20px 0">
        <p style="margin:0 0 10px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700">Your login details</p>
        <p style="margin:0 0 8px;color:#0f172a;font-size:15px"><strong>Login Email:</strong> ${user.email}</p>
        <p style="margin:0 0 8px;color:#0f172a;font-size:15px"><strong>User ID:</strong> ${user.userId}</p>
        <p style="margin:0;color:#0f172a;font-size:15px"><strong>Password:</strong> Use the password you set during registration</p>
      </div>

      <p style="margin:20px 0">
        <a href="${loginUrl}" style="background:#ea580c;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Login to Dashboard</a>
      </p>
      <p style="color:#64748b;font-size:13px">Or open: <a href="${loginUrl}" style="color:#0d4f5c">${loginUrl}</a></p>

      <p style="color:#64748b;font-size:13px;margin-top:20px">
        <strong>Note:</strong> This email is sent from our official address
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#ea580c">${SUPPORT_EMAIL}</a>.
        Do not share your password with anyone.
      </p>
      ${emailFooterHtml()}
    </div>
  `;

  const result = await sendEmail({
    to: user.email,
    subject: afterVerification
      ? `Welcome to ${BRAND_NAME} — Email Verified`
      : `Welcome to ${BRAND_NAME} — Registration Successful`,
    html,
  });

  if (result?.previewUrl) {
    console.log(`\n>>> Welcome email preview for ${user.email}: ${result.previewUrl}\n`);
  }

  return result;
}
