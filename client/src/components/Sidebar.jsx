import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { LayoutDashboard, Heart, Gift, Phone, User, Users, LogOut, X, ShieldCheck } from 'lucide-react';
import { commonStyles, sidebarStyles } from '../styles/index.styles';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user, token } = useSelector((state) => state.auth);
  const isLoggedIn = !!token && !!user;
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleAuthAction = () => {
    if (isLoggedIn) {
      handleLogout();
    } else {
      navigate('/login');
    }
  };

  const NavItem = ({ icon: Icon, label, to, isSpecial = false }) => {
    const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));

    return (
      <button
        onClick={() => {
          navigate(to);
          if (window.innerWidth < 768) onClose();
        }}
        className={`${sidebarStyles.navItemBase} ${isActive ? sidebarStyles.navItemActive :
          isSpecial ? sidebarStyles.navItemSpecial : sidebarStyles.navItemInactive
          }`}
      >
        <Icon size={20} className={sidebarStyles.navItemIcon} />
        <span className={sidebarStyles.navItemLabel}>{label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`${sidebarStyles.overlayBase} ${isOpen ? sidebarStyles.overlayOpen : sidebarStyles.overlayClosed}`}
        onClick={onClose}
      />

      <aside
        className={`${sidebarStyles.sidebarBase} ${isOpen ? sidebarStyles.sidebarOpen : sidebarStyles.sidebarClosed}`}
      >
        {/* Logo */}
        <div className={sidebarStyles.logoSection}>
          <div>
            <h1 className={sidebarStyles.logoTitle + " flex items-center gap-3"}>
              <img src="/Ganesha.jpeg" alt="Ganesha" className="w-9 h-9 rounded-full object-cover shadow-sm border border-gs-teal/10" />
              <span className="leading-tight pt-1"><span className="text-gs-teal">Agilavetri</span> Ganesha</span>
            </h1>
            <p className={commonStyles.preTitle + " mt-1"}>॥ அகில வெற்றி கணேஷா ॥</p>
          </div>
          <button onClick={onClose} className={sidebarStyles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        {/* User Badge */}
        {isLoggedIn && user?.fullName && (
          <div className={sidebarStyles.userBadge}>
            <p className={sidebarStyles.userBadgeLabel}>Devotee</p>
            <p className={sidebarStyles.userBadgeName}>{user.fullName}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className={sidebarStyles.navContainer}>
          {isLoggedIn && <NavItem to="/dashboard" icon={LayoutDashboard} label="DASHBOARD" />}
          <NavItem to="/donate" icon={Heart} label="DONATE" />
          {isLoggedIn && <NavItem to="/dashboard/kyc" icon={ShieldCheck} label="VERIFY KYC" />}
          {isLoggedIn && <NavItem to="/dashboard/network" icon={Users} label="INVITE" />}
          <NavItem to="/dashboard/support" icon={Phone} label="SUPPORT" />
          {isLoggedIn && <NavItem to="/dashboard/profile" icon={User} label="PROFILE" />}
        </nav>

        {/* Logout */}
        <div className={`${sidebarStyles.footerBase} ${isLoggedIn ? sidebarStyles.footerLoggedIn : sidebarStyles.footerLoggedOut}`}>
          <button
            onClick={handleAuthAction}
            className={`${sidebarStyles.authBtnBase} ${isLoggedIn ? sidebarStyles.authBtnLoggedIn : sidebarStyles.authBtnLoggedOut}`}
          >
            <LogOut size={16} className={!isLoggedIn ? "rotate-180" : ""} />
            <span className="font-semibold">{isLoggedIn ? 'Sign Out' : 'Sign In'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;