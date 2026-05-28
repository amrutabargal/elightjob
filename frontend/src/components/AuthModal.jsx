import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { scrollToSection } from '../utils/scroll';
import Icon from './Icon';
import RegisterForm from './RegisterForm';
import Logo from './Logo';
import AuthSupportHelp from './AuthSupportHelp';

const MODAL_META = {
  login: {
    title: 'Welcome Back',
    subtitle: 'Login to your Elite Placement Hub account',
    accent: 'login',
  },
  register: {
    title: 'Create Account',
    subtitle: 'Join India’s premium placement portal',
    accent: 'register',
  },
  forgot: {
    title: 'Forgot Password',
    subtitle: 'We will send a reset link to your email',
    accent: 'login',
  },
  reset: {
    title: 'Reset Password',
    subtitle: 'Choose a new secure password',
    accent: 'login',
  },
  verify: {
    title: 'Verify Email',
    subtitle: 'Enter the 6-digit OTP sent to your inbox',
    accent: 'verify',
  },
};

export default function AuthModal({ mode, onClose, onSwitch, verifyToken, resetToken, defaultEmail = '' }) {
  const { login, register, verifyOtp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [verifyStatus, setVerifyStatus] = useState(verifyToken ? 'verifying' : 'pending');

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    if (mode === 'verify' && verifyToken) {
      api
        .get(`/auth/verify-email/${verifyToken}`)
        .then((res) => {
          setVerifyStatus('success');
          toast.success(res.data.message);
        })
        .catch((err) => {
          setVerifyStatus('error');
          toast.error(err.response?.data?.message || 'Verification failed');
        });
    }
  }, [mode, verifyToken]);

  if (!mode) return null;

  const meta = MODAL_META[mode] || MODAL_META.login;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      onClose();
      scrollToSection('dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.needsVerification) {
        toast.error('Enter OTP sent to your email first');
        onSwitch('verify', data.email || email);
      } else {
        toast.error(data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (payload, clientError) => {
    if (clientError) {
      toast.error(clientError);
      return;
    }
    setLoading(true);
    try {
      const data = await register(payload);
      if (data.emailMode === 'gmail') {
        toast.success(data.message || 'OTP sent to your email!', { duration: 10000 });
      } else {
        if (data.devOtp) {
          toast.success(`Your OTP: ${data.devOtp}`, { duration: 20000 });
        }
        if (data.emailWarning) {
          toast(data.emailWarning, { icon: '⚠️', duration: 12000 });
        }
        if (data.previewUrl) {
          window.open(data.previewUrl, '_blank', 'noopener');
        }
        toast.success(data.message || 'Use OTP shown above', { duration: 8000 });
      }
      if (data.userId) toast(`User ID: ${data.userId}`, { icon: 'ℹ️', duration: 8000 });
      setOtp('');
      setVerifyStatus('pending');
      onSwitch('verify', payload.email);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data.emailMode === 'gmail') {
        toast.success(data.message || 'Reset link sent! Check inbox & spam.', { duration: 10000 });
      } else {
        if (data.previewUrl) window.open(data.previewUrl, '_blank', 'noopener');
        toast.success(data.message);
      }
      onSwitch('login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetToken) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${resetToken}`, { password });
      toast.success(data.message);
      onSwitch('login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!email?.trim()) {
      toast.error('Enter your email');
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error('Enter the 6-digit OTP from your email');
      return;
    }
    setLoading(true);
    try {
      const data = await verifyOtp(email.trim(), otp.trim());
      setVerifyStatus('success');
      toast.success(data.message);
      if (data.token) {
        onClose();
        scrollToSection('dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      toast.error('Enter your email');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/resend-verification', { email });
      if (data.emailMode === 'gmail') {
        toast.success(data.message || 'New OTP sent! Check inbox & spam.', { duration: 10000 });
      } else if (data.previewUrl) {
        toast.success(`New OTP: ${data.devOtp}`);
        window.open(data.previewUrl, '_blank', 'noopener');
      } else if (data.devOtp) {
        toast.success(`New OTP: ${data.devOtp}`, { duration: 12000 });
      } else {
        toast.success(data.message);
      }
      setOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  const modalSize = mode === 'register' ? 'auth-modal--wide' : '';

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className={`auth-modal ${modalSize}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={`auth-modal-header auth-modal-header--${meta.accent}`}>
          <div className="auth-modal-brand">
            <Logo size="sm" light />
            <div>
              <h2 className="auth-modal-title">{meta.title}</h2>
              <p className="auth-modal-subtitle">{meta.subtitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="auth-modal-close" aria-label="Close">
            <Icon name="close" size={22} />
          </button>
        </div>

        <div className="auth-modal-body">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="auth-form">
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  className="input-field input-field-premium"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  className="input-field input-field-premium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                <Icon name="login" size={18} />
                {loading ? 'Please wait...' : 'Login'}
              </button>
              <p className="auth-form-footer">
                <button type="button" onClick={() => onSwitch('forgot')} className="auth-link">
                  Forgot password?
                </button>
              </p>
              <p className="auth-form-switch">
                No account?{' '}
                <button type="button" onClick={() => onSwitch('register')} className="auth-link">
                  Register free
                </button>
              </p>
              <AuthSupportHelp />
            </form>
          )}

          {mode === 'register' && (
            <RegisterForm
              onSubmit={handleRegister}
              loading={loading}
              premium
              footer={
                <p className="auth-form-switch text-center">
                  Have an account?{' '}
                  <button type="button" onClick={() => onSwitch('login')} className="auth-link">
                    Login
                  </button>
                </p>
              }
            />
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="auth-form">
              <label className="auth-field">
                <span>Email</span>
                <input
                  type="email"
                  className="input-field input-field-premium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => onSwitch('login')} className="auth-link w-full text-center">
                Back to Login
              </button>
              <AuthSupportHelp />
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleReset} className="auth-form">
              <label className="auth-field">
                <span>New Password</span>
                <input
                  type="password"
                  className="input-field input-field-premium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? '...' : 'Reset Password'}
              </button>
            </form>
          )}

          {mode === 'verify' && (
            <div className="auth-verify">
              {verifyStatus === 'verifying' && (
                <div className="auth-verify-state">
                  <div className="auth-spinner" />
                  <p>Verifying your email...</p>
                </div>
              )}
              {verifyStatus === 'success' && (
                <div className="auth-verify-state auth-verify-state--success">
                  <div className="auth-verify-icon-wrap auth-verify-icon-wrap--ok">
                    <Icon name="check_circle" size={40} />
                  </div>
                  <h3>Email Verified!</h3>
                  <p>You can login and access your dashboard.</p>
                  <button type="button" onClick={() => onSwitch('login')} className="btn-primary">
                    <Icon name="login" size={18} />
                    Login Now
                  </button>
                </div>
              )}
              {verifyStatus === 'error' && (
                <div className="auth-verify-state auth-verify-state--error">
                  <div className="auth-verify-icon-wrap auth-verify-icon-wrap--err">
                    <Icon name="cancel" size={40} />
                  </div>
                  <h3>Verification Failed</h3>
                  <p>OTP expired or invalid. Request a new code.</p>
                  <button type="button" onClick={() => setVerifyStatus('pending')} className="btn-secondary">
                    Try Again
                  </button>
                </div>
              )}
              {verifyStatus === 'pending' && (
                <form onSubmit={handleVerifyOtp} className="auth-form">
                  <div className="auth-otp-hero">
                    <div className="auth-verify-icon-wrap">
                      <Icon name="mark_email_read" size={36} />
                    </div>
                    <p>
                      Enter the <strong>6-digit OTP</strong> sent from{' '}
                      <strong>Eliteplacementhubhiring@gmail.com</strong> to{' '}
                      <strong>{email || 'your email'}</strong>.
                    </p>
                    <p className="auth-otp-hint" style={{ marginTop: '0.5rem' }}>
                      Check inbox & spam. If Gmail is not set up yet, OTP appears in the green toast / preview link.
                    </p>
                  </div>
                  <label className="auth-field">
                    <span>Email</span>
                    <input
                      type="email"
                      className="input-field input-field-premium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label className="auth-field">
                    <span>OTP Code</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="input-field input-field-premium auth-otp-input"
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                    />
                  </label>
                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={loading}
                    className="btn-secondary w-full"
                  >
                    {loading ? 'Sending...' : 'Resend OTP'}
                  </button>
                  <p className="auth-otp-hint">Code expires in 10 minutes. Check inbox & spam.</p>
                  <AuthSupportHelp />
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
