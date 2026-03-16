import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/slices/authSlice';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { commonStyles, authStyles } from '../styles/index.styles';

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
    <div className={commonStyles.pageContainer + " flex items-center justify-center p-4 relative overflow-hidden"}>
      <div className={authStyles.authCard}>
        
        {/* Decorative top line */}
        <div className={authStyles.topLineDecoration} />

        <div className={authStyles.headerWrapper}>
          <p className={commonStyles.preTitle}>॥ श्री गणेशाय नमः ॥</p>
          <div className={authStyles.headerEmoji}>🐘</div>
          <h1 className={authStyles.headerTitle}>
            Ganesha <span className="text-gs-teal">Seva</span>
          </h1>
          <p className={authStyles.headerSubtitle}>Devotee Portal</p>
        </div>

        <form onSubmit={handleLogin} className={authStyles.form}>
          <div className={authStyles.inputGroup}>
            <label className={authStyles.inputLabel}>Email Address</label>
            <div className="relative">
              <div className={authStyles.inputIconWrapper}>
                <Mail size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={authStyles.inputBase}
                placeholder="enter@email.com"
              />
            </div>
          </div>

          <div className={authStyles.inputGroup}>
            <label className={authStyles.inputLabel}>Password</label>
            <div className="relative">
              <div className={authStyles.inputIconWrapper}>
                <Lock size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={authStyles.inputBase}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={authStyles.submitButton}
          >
            {loading ? 'Entering Temple...' : (
              <>Enter Temple <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className={authStyles.footerBox}>
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