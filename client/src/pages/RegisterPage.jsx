import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../redux/slices/authSlice';
import { Lock, Mail, User, Gift, ArrowRight, ShieldCheck, Phone } from 'lucide-react';
import { commonStyles, authStyles } from '../styles/index.styles';

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
    <div className={commonStyles.pageContainer + " flex items-center justify-center p-4 relative overflow-hidden py-12"}>
      <div className={authStyles.authCard}>
        
        <div className={authStyles.topLineDecoration} />

        <div className={authStyles.headerWrapper}>
          <p className={commonStyles.preTitle}>॥ அகில வெற்றி கணேஷா ॥</p>
          <div className={authStyles.headerEmoji}>🐘</div>
          <h1 className={authStyles.headerTitle}>
            Join <span className="text-gs-teal">Ganesha Seva</span>
          </h1>
          <p className={authStyles.headerSubtitle}>New Devotee Registration</p>
        </div>

        <form onSubmit={handleRegister} className={authStyles.form}>

          {/* Full Name */}
          <div className={authStyles.inputGroup}>
            <label className={authStyles.inputLabel}>Full Name</label>
            <div className="relative">
              <div className={authStyles.inputIconWrapper}>
                <User size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="text" name="fullName" required
                value={formData.fullName} onChange={handleChange}
                className={authStyles.inputBase}
                placeholder="Your Full Name"
              />
            </div>
          </div>

          {/* Email */}
          <div className={authStyles.inputGroup}>
            <label className={authStyles.inputLabel}>Email Address</label>
            <div className="relative">
              <div className={authStyles.inputIconWrapper}>
                <Mail size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="email" name="email" required
                value={formData.email} onChange={handleChange}
                className={authStyles.inputBase}
                placeholder="enter@email.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div className={authStyles.inputGroup}>
            <label className={authStyles.inputLabel}>Phone Number</label>
            <div className="relative">
              <div className={authStyles.inputIconWrapper}>
                <Mail size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className={authStyles.inputBase}
                placeholder="Your phone number"
              />
            </div>
          </div>

          {/* Password */}
          <div className={authStyles.inputGroup}>
            <label className={authStyles.inputLabel}>Password</label>
            <div className="relative">
              <div className={authStyles.inputIconWrapper}>
                <Lock size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="password" name="password" required minLength={6}
                value={formData.password} onChange={handleChange}
                className={authStyles.inputBase}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className={authStyles.inputGroup}>
            <label className={authStyles.inputLabel}>Confirm Password</label>
            <div className="relative">
              <div className={authStyles.inputIconWrapper}>
                <ShieldCheck size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="password" name="confirmPassword" required minLength={6}
                value={formData.confirmPassword} onChange={handleChange}
                className={authStyles.inputBase}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Invite Code */}
          <div className={authStyles.inputGroup}>
            <label className={authStyles.inputLabel}>Invite Code (Optional)</label>
            <div className="relative">
              <div className={authStyles.inputIconWrapper}>
                <Gift size={18} className="text-gray-400 group-focus-within:text-gs-teal transition-colors" />
              </div>
              <input
                type="text" name="inviteCode"
                value={formData.inviteCode} onChange={handleChange}
                className={authStyles.inputBase}
                placeholder="GAN-XXXXX"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={authStyles.submitButton}
          >
            {loading ? 'Joining Seva...' : (
              <>Join Ganesha Seva <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className={authStyles.footerBox}>
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