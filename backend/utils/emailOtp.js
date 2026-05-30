import crypto from 'crypto';
import { sendEmail } from '../config/email.js';
import { BRAND_NAME } from '../config/brand.js';
import { emailFooterHtml, SUPPORT_EMAIL } from '../config/support.js';
import { PRIMARY_CLIENT_URL } from '../config/client.js';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export function getOtpExpiry() {
  return Date.now() + OTP_EXPIRY_MS;
}

export async function sendOtpEmail(user, otp) {
  const loginUrl = PRIMARY_CLIENT_URL;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#ea580c;margin:0 0 8px">${BRAND_NAME}</h2>
      <p style="color:#334155">Hi <strong>${user.name}</strong>,</p>
      <p style="color:#334155">Thank you for registering! Your account was created successfully.</p>
      <p style="color:#334155">Enter this <strong>6-digit OTP</strong> on the website to verify your email and login:</p>
      <p style="font-size:36px;font-weight:800;letter-spacing:10px;color:#ea580c;margin:24px 0;text-align:center">${otp}</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin:16px 0">
        <p style="margin:0 0 8px;color:#0f172a;font-size:15px"><strong>Login Email:</strong> ${user.email}</p>
        ${user.userId ? `<p style="margin:0;color:#0f172a;font-size:15px"><strong>User ID:</strong> ${user.userId}</p>` : ''}
      </div>
      <p style="margin:20px 0">
        <a href="${loginUrl}" style="background:#ea580c;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Open Elite Placement Hub</a>
      </p>
      <p style="color:#64748b;font-size:13px">OTP expires in <strong>10 minutes</strong>. Sent from <a href="mailto:${SUPPORT_EMAIL}" style="color:#ea580c">${SUPPORT_EMAIL}</a>.</p>
      <p style="color:#64748b;font-size:13px">Check <strong>Spam / Promotions</strong> if you do not see this email in Inbox.</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">If you did not register, ignore this email.</p>
      ${emailFooterHtml()}
    </div>
  `;

  const result = await sendEmail({
    to: user.email,
    subject: `${otp} — Verify your ${BRAND_NAME} registration`,
    html,
  });

  if (result?.dev) {
    console.log(`\n>>> EMAIL OTP for ${user.email}: ${otp} <<<\n`);
  }

  if (result?.previewUrl) {
    console.log(`>>> Preview email (see OTP): ${result.previewUrl}\n`);
  }

  return { ...result, otp };
}

export async function assignOtpToUser(user) {
  const otp = generateOtp();
  user.emailOtp = otp;
  user.emailOtpExpires = getOtpExpiry();
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();
  const mailResult = await sendOtpEmail(user, otp);
  return {
    otp,
    previewUrl: mailResult?.previewUrl,
    ethereal: mailResult?.ethereal,
    gmail: mailResult?.gmail,
    emailWarning: mailResult?.emailWarning,
    to: user.email,
  };
}
