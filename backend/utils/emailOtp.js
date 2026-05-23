import crypto from 'crypto';
import { sendEmail } from '../config/email.js';
import { BRAND_NAME } from '../config/brand.js';

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export function getOtpExpiry() {
  return Date.now() + OTP_EXPIRY_MS;
}

export async function sendOtpEmail(user, otp) {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#ea580c;margin:0 0 8px">${BRAND_NAME}</h2>
      <p style="color:#334155">Hi ${user.name},</p>
      <p style="color:#334155">Your email verification OTP is:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#1e3a5f;margin:20px 0">${otp}</p>
      ${user.userId ? `<p style="color:#64748b;font-size:14px">User ID: <strong>${user.userId}</strong></p>` : ''}
      <p style="color:#64748b;font-size:13px">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">If you did not register, ignore this email.</p>
    </div>
  `;

  const result = await sendEmail({
    to: user.email,
    subject: `${otp} is your ${BRAND_NAME} verification code`,
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
  return { otp, previewUrl: mailResult?.previewUrl, ethereal: mailResult?.ethereal };
}
