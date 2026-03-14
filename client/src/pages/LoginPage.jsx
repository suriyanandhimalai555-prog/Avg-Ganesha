import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/slices/authSlice';
import { Lock, Mail, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  // Extract ?redirect= param if present
  const queryParams = new URLSearchParams(window.location.search);
  const redirectParams = queryParams.get('redirect');

  useEffect(() => {
    if (token && user) {
      if (redirectParams) {
        navigate(redirectParams, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [token, user, navigate, redirectParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      // Navigation handled by useEffect when token/user update
    } catch (err) {
      alert('Login Failed: ' + (err || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (token && user) return null;

  return (
    <div className="min-h-screen bg-floral-confetti bg-gs-cream flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-8 shadow-[0_10px_40px_rgba(45,156,138,0.1)] relative z-10">
        
        {/* Decorative top line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gs-teal to-transparent opacity-60 rounded-t-3xl" />

        <div className="text-center mb-8">
          <p className="text-gs-teal font-serif font-semibold tracking-widest text-xs mb-3">॥ श्री गणेशाय नमः ॥</p>
          <div className="text-5xl mb-3 animate-float">🐘</div>
          <h1 className="text-3xl font-serif text-gs-navy font-bold tracking-tight mb-1">
            Ganesha <span className="text-gs-teal">Seva</span>
          </h1>
          <p className="text-gray-500 text-xs tracking-[0.2em] font-medium uppercase mt-2">Devotee Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-gs-teal transition-colors">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gs-navy rounded-xl py-3 pl-10 pr-4 focus:border-gs-teal focus:ring-1 focus:ring-gs-teal outline-none transition-all placeholder-gray-400"
                placeholder="enter@email.com"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-gs-teal transition-colors">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gs-navy rounded-xl py-3 pl-10 pr-4 focus:border-gs-teal focus:ring-1 focus:ring-gs-teal outline-none transition-all placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gs-teal hover:bg-[#238071] text-white font-bold py-3.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? 'Entering Temple...' : (
              <>Enter Temple <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center bg-gray-50 rounded-xl py-4 border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">
            New devotee?{' '}
            <Link to="/register" className="text-gs-teal font-bold hover:underline">
              Join Ganesha Seva
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;