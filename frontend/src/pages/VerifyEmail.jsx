import { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { verifyOtp: verifyOtpAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = searchParams.get('token');
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState(token ? 'verifying' : 'pending');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      api
        .get(`/auth/verify-email/${token}`)
        .then((res) => {
          setStatus('success');
          toast.success(res.data.message);
        })
        .catch((err) => {
          setStatus('error');
          toast.error(err.response?.data?.message || 'Verification failed');
        });
    }
  }, [token]);

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!email?.trim()) {
      toast.error('Enter your email');
      return;
    }
    setLoading(true);
    try {
      const data = await verifyOtpAuth(email.trim(), otp.trim());
      setStatus('success');
      toast.success(data.message);
      if (data.token) {
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/resend-verification', { email });
      toast.success(data.message || 'New OTP sent! Check inbox & spam.');
      setOtp('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md">
        {status === 'verifying' && (
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
            <h1 className="text-xl font-bold">Verifying...</h1>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <span className="text-5xl">✅</span>
            <h1 className="text-xl font-bold mt-4">Email Verified!</h1>
            <p className="text-slate-600 mt-2">You can now login.</p>
            <Link to="/login" className="btn-primary inline-block mt-6">
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <span className="text-5xl">❌</span>
            <h1 className="text-xl font-bold mt-4">Verification Failed</h1>
            <p className="text-slate-600 mt-2">Link invalid or expired. Use OTP below.</p>
            <button type="button" onClick={() => setStatus('pending')} className="btn-primary mt-4">
              Enter OTP
            </button>
          </div>
        )}

        {status === 'pending' && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div className="text-center">
              <span className="text-5xl">📧</span>
              <h1 className="text-xl font-bold mt-4">Verify Your Email</h1>
              <p className="text-slate-600 mt-2 text-sm">
                Enter the 6-digit OTP sent from <strong>Eliteplacementhubhiring@gmail.com</strong>. Check spam too.
              </p>
            </div>
            <label className="register-field register-field-full">
              <span>Email</span>
              <input
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="register-field register-field-full">
              <span>OTP</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="input-field text-center text-2xl font-bold tracking-[0.4em]"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
              />
            </label>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button type="button" onClick={resend} disabled={loading} className="btn-secondary w-full text-sm">
              Resend OTP
            </button>
            <Link to="/login" className="text-primary-600 text-sm block text-center hover:underline">
              Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
