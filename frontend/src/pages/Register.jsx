import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RegisterForm from '../components/RegisterForm';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (payload, clientError) => {
    if (clientError) {
      toast.error(clientError);
      return;
    }
    setLoading(true);
    const toastId = toast.loading('Creating account… please wait.');
    try {
      const data = await register(payload);
      toast.success(data.message || 'OTP sent to your email! Check inbox & spam.', { id: toastId });
      if (data.userId) toast(`User ID: ${data.userId}`, { icon: 'ℹ️' });
      navigate('/verify-email', { state: { email: payload.email } });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Registration failed'), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-xl">
        <h1 className="text-2xl font-bold text-center mb-1">Registration</h1>
        <p className="text-slate-500 text-center mb-6">Join Elite Placement Hub</p>

        <RegisterForm
          onSubmit={handleSubmit}
          loading={loading}
          footer={
            <p className="text-center text-sm text-slate-500 pt-1">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-medium hover:underline">
                Login
              </Link>
            </p>
          }
        />
      </div>
    </div>
  );
}
