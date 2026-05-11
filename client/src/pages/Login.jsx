import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, CheckSquare, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-primary-50 to-accent-50 p-4 text-slate-900">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 shadow-sm shadow-primary-100">
            <CheckSquare size={26} />
          </div>
          <h1 className="text-2xl font-bold text-slate-950 mb-2 tracking-tight">Sign in</h1>
          <p className="text-slate-500 text-sm">to continue to TaskFlow</p>
        </div>
        <div className="bg-white/95 border border-primary-100 rounded-lg p-6 shadow-xl shadow-primary-100/50">
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-primary-50 border border-primary-100 text-primary-700 text-sm text-center">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-sm text-center">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-primary-200 rounded-lg py-2.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition"
                placeholder="Email address"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-primary-200 rounded-lg py-2.5 pl-11 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 transition"
                placeholder="Password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-2.5 rounded-lg transition-all text-base flex items-center justify-center gap-2 shadow-sm shadow-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
            </button>
          </form>
          <p className="mt-6 text-center text-slate-500 text-xs">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent-600 hover:text-accent-700 hover:underline font-medium">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
