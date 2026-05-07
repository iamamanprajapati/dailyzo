import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingBasket } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../store/auth';

export default function Login() {
  const [email, setEmail] = useState('admin@dailyzo.com');
  const [password, setPassword] = useState('admin@123');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuth((s) => s.setAuth);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin/login', { email, password });
      setAuth(data);
      toast.success(`Welcome back, ${data.user.name}`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 p-4">
      <div className="card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white mb-3">
            <ShoppingBasket size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Dailyzo Admin</h1>
          <p className="text-sm text-slate-500">Sign in to manage your grocery store</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6">
          Default seed credentials: <span className="font-mono">admin@dailyzo.com / admin@123</span>
        </p>
      </div>
    </div>
  );
}
