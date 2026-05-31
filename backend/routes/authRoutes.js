import express from 'express';
import { BRAND_NAME } from '../config/brand.js';
import { emailFooterHtml } from '../config/support.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendEmail } from '../config/email.js';
import { protect } from '../middleware/auth.js';
import { generateUniqueUserId } from '../utils/generateUserId.js';
import { setOtpOnUser, sendOtpEmailWithTimeout } from '../utils/emailOtp.js';
import { sendWelcomeEmail } from '../utils/welcomeEmail.js';
import { PRIMARY_CLIENT_URL } from '../config/client.js';

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

const isDev = process.env.NODE_ENV !== 'production';

const GENDERS = ['Male', 'Female', 'Other'];

const normalizeMobile = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  else if (digits.length > 10) digits = digits.slice(-10);
  return digits.slice(0, 10);
};

const validateRegistration = (body) => {
  const { name, dateOfBirth, gender, mobile, email, address, password } = body;

  if (!name?.trim()) return 'Name is required';
  if (!dateOfBirth) return 'Date of birth is required';
  if (!gender || !GENDERS.includes(gender)) return 'Please select a valid gender';
  if (!mobile?.trim()) return 'Mobile number is required';
  if (!email?.trim()) return 'Email is required';
  if (!address?.trim()) return 'Address is required';
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 'Invalid date of birth';

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  if (age < 18) return 'You must be at least 18 years old to register';

  const phone = normalizeMobile(mobile);
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return 'Enter a valid 10-digit Indian mobile number';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Enter a valid email address';
  }

  if (address.trim().length < 10) {
    return 'Address must be at least 10 characters';
  }

  return null;
};

async function deliverRegistrationOtp(user) {
  const { otp } = await setOtpOnUser(user);
  await sendOtpEmailWithTimeout(user, otp);
}

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, dateOfBirth, gender, mobile, email, address, password } = req.body;

    const validationError = validateRegistration(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const phone = normalizeMobile(mobile);
    const emailLower = email.toLowerCase().trim();

    const existingEmail = await User.findOne({ email: emailLower });
    if (existingEmail?.isVerified) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    const existingMobile = await User.findOne({ mobile: phone });
    if (existingMobile?.isVerified) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }
    if (
      existingMobile &&
      !existingMobile.isVerified &&
      existingMobile.email !== emailLower
    ) {
      return res.status(400).json({ message: 'Mobile number already registered' });
    }

    let user = existingEmail;
    let isNewUser = false;

    if (user) {
      user.name = name.trim();
      user.dateOfBirth = new Date(dateOfBirth);
      user.gender = gender;
      user.mobile = phone;
      user.address = address.trim();
      user.password = password;
      await user.save();
    } else {
      isNewUser = true;
      const userId = await generateUniqueUserId();
      user = await User.create({
        userId,
        name: name.trim(),
        dateOfBirth: new Date(dateOfBirth),
        gender,
        mobile: phone,
        email: emailLower,
        address: address.trim(),
        password,
        isVerified: false,
      });
    }

    try {
      await deliverRegistrationOtp(user);
    } catch (err) {
      console.error('Register OTP email failed:', err.message);
      if (isNewUser) {
        await User.findByIdAndDelete(user._id);
      }
      return res.status(503).json({
        message:
          'Could not send OTP email. Server email not configured — contact admin or try again later.',
      });
    }

    res.status(isNewUser ? 201 : 200).json({
      message: 'Registration successful',
      email: user.email,
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      const msg =
        field === 'mobile'
          ? 'Mobile number already registered'
          : field === 'email'
            ? 'Email already registered'
            : field === 'userId'
              ? 'User ID conflict — please try registering again'
              : 'Account already exists';
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: err.message || 'Registration failed' });
  }
});

// @route   GET /api/auth/verify-email/:token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const code = String(otp).trim();
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: 'Enter a valid 6-digit OTP' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+emailOtp +emailOtpExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or OTP' });
    }

    if (user.isVerified) {
      const token = signToken(user._id);
      return res.json({
        message: 'Email is already verified.',
        token,
        user: user.toJSON(),
      });
    }

    if (!user.emailOtp || user.emailOtp !== code) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (!user.emailOtpExpires || user.emailOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    user.isVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    await user.save();

    try {
      await sendWelcomeEmail(user, { afterVerification: true });
    } catch (mailErr) {
      console.warn('Welcome email after verify:', mailErr.message);
    }

    const token = signToken(user._id);

    res.json({
      message: 'Email verified! You are logged in.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/resend-verification (sends new OTP)
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      return res.json({ message: 'If the email exists, a new OTP has been sent.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified. You can login.' });
    }

    const { otp } = await setOtpOnUser(user);

    try {
      await sendOtpEmailWithTimeout(user, otp);
    } catch (err) {
      console.error('Resend OTP email failed:', err.message);
      return res.status(503).json({
        message: 'Failed to send OTP',
      });
    }

    res.json({
      message: 'OTP sent successfully',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email with the OTP sent to your inbox.',
        needsVerification: true,
        email: user.email,
      });
    }

    if (!user.userId) {
      user.userId = await generateUniqueUserId();
      await user.save();
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save();

    const url = `${PRIMARY_CLIENT_URL}/?reset=${resetToken}`;

    const mailResult = await sendEmail({
      to: user.email,
      subject: `Reset your password - ${BRAND_NAME}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
          <h2 style="color:#ea580c;margin:0 0 8px">${BRAND_NAME}</h2>
          <p style="color:#334155">Hi ${user.name},</p>
          <p style="color:#334155">Click the button below to reset your password:</p>
          <p style="margin:20px 0">
            <a href="${url}" style="background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a>
          </p>
          <p style="color:#64748b;font-size:13px">Or copy this link:<br/><a href="${url}" style="color:#0d4f5c">${url}</a></p>
          <p style="color:#64748b;font-size:13px">Link expires in <strong>1 hour</strong>. Check Spam if not in Inbox.</p>
          ${emailFooterHtml()}
        </div>
      `,
    });

    res.json({
      message: mailResult?.gmail
        ? `Password reset link sent to ${user.email}. Check inbox & spam.`
        : `If the email exists, a reset link has been sent to ${user.email}. Check inbox & spam.`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    if (!req.user.userId) {
      req.user.userId = await generateUniqueUserId();
      await req.user.save();
    }
    res.json({ user: req.user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
