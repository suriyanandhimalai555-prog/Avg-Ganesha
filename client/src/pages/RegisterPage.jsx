import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../redux/slices/authSlice';
import { Lock, Mail, User, Gift, ArrowRight, ShieldCheck } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    inviteCode: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  const queryParams = new URLSearchParams(window.location.search);
  const redirectParams = queryParams.get('redirect');
  const inviteFromUrl = queryParams.get('invite') || '';

  useEffect(() => {
    if (inviteFromUrl) {
      setFormData((prev) => ({ ...prev, inviteCode: inviteFromUrl.trim() }));
    }
  }, [inviteFromUrl]);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        registerUser({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          inviteCode: formData.inviteCode || undefined,
        })
      ).unwrap();
      // Navigation handled by useEffect when token/user update
    } catch (err) {
      alert('Registration Failed: ' + (err || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (token && user) return null;

  return (
    <div className="min-h-screen bg-floral-confetti bg-gs-cream flex items-center justify-center p-4 relative overflow-hidden py-12">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-8 shadow-[0_10px_40px_rgba(45,156,138,0.1)] relative z-10">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gs-teal to-transparent opacity-60 rounded-t-3xl" />

        <div className="text-center mb-6">
          <p className="text-gs-teal font-serif font-semibold tracking-widest text-xs mb-3">॥ श्री गणेशाय नमः ॥</p>
          <div className="text-4xl mb-2">🐘</div>
          <h1 className="text-3xl font-serif text-gs-navy font-bold tracking-tight mb-1">
            Join <span className="text-gs-teal">Ganesha Seva</span>
          </h1>
          <p className="text-gray-500 text-xs tracking-[0.2em] font-medium uppercase mt-2">New Devotee Registration</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">

          {/* Full Name */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-gs-teal transition-colors">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="text" name="fullName" required
                value={formData.fullName} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gs-navy rounded-xl py-3 pl-10 pr-4 focus:border-gs-teal focus:ring-1 focus:ring-gs-teal outline-none transition-all placeholder-gray-400"
                placeholder="Your Full Name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-gs-teal transition-colors">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="email" name="email" required
                value={formData.email} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gs-navy rounded-xl py-3 pl-10 pr-4 focus:border-gs-teal focus:ring-1 focus:ring-gs-teal outline-none transition-all placeholder-gray-400"
                placeholder="enter@email.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-gs-teal transition-colors">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gs-navy rounded-xl py-3 pl-10 pr-4 focus:border-gs-teal focus:ring-1 focus:ring-gs-teal outline-none transition-all placeholder-gray-400"
                placeholder="Your phone number"
              />
            </div>
          </div>

          {/* Password */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-gs-teal transition-colors">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="password" name="password" required minLength={6}
                value={formData.password} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gs-navy rounded-xl py-3 pl-10 pr-4 focus:border-gs-teal focus:ring-1 focus:ring-gs-teal outline-none transition-all placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-gs-teal transition-colors">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ShieldCheck size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="password" name="confirmPassword" required minLength={6}
                value={formData.confirmPassword} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gs-navy rounded-xl py-3 pl-10 pr-4 focus:border-gs-teal focus:ring-1 focus:ring-gs-teal outline-none transition-all placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Invite Code */}
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider group-focus-within:text-gs-teal transition-colors">Invite Code (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Gift size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="text" name="inviteCode"
                value={formData.inviteCode} onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 text-gs-navy rounded-xl py-3 pl-10 pr-4 focus:border-gs-teal focus:ring-1 focus:ring-gs-teal outline-none transition-all placeholder-gray-400"
                placeholder="GAN-XXXXX"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gs-teal hover:bg-[#238071] text-white font-bold py-3.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? 'Joining Seva...' : (
              <>Join Ganesha Seva <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center bg-gray-50 rounded-xl py-4 border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">
            Already a devotee?{' '}
            <Link to="/login" className="text-gs-teal font-bold hover:underline">Login Here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;