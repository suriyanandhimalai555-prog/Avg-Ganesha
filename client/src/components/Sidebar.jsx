import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { Home, Users, Heart, Settings, HelpCircle, Layers, LogOut, Shield, ShieldCheck, X } from 'lucide-react';
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

  const NavItem = ({ icon: Icon, label, path, isSpecial = false }) => {
    const isActive = location.pathname === path || location.pathname.startsWith(path + '/');

    return (
      <button
        onClick={() => {
          navigate(path);
          if (window.innerWidth < 768) onClose();
        }}
        className={`${sidebarStyles.navItemBase} ${
          isActive ? sidebarStyles.navItemActive : 
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
            <h1 className={sidebarStyles.logoTitle}>
              🐘 <span className="text-gs-teal">Ganesha</span> Seva
            </h1>
            <p className={commonStyles.preTitle + " mt-1"}>॥ श्री गणेशाय नमः ॥</p>
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
          {isLoggedIn && <NavItem icon={Home} label="Dashboard" path="/dashboard" />}
          {isLoggedIn && <NavItem icon={Users} label="Your Invite Network" path="/dashboard/network" />}
          <NavItem icon={Heart} label="Donate / Contribute" path="/donate" />
          <NavItem icon={Layers} label="Seva Plans" path="/plans" />
          {isLoggedIn && <NavItem icon={Shield} label="Verify Identity (KYC)" path="/dashboard/kyc" />}
          <NavItem icon={HelpCircle} label="Help" path="/dashboard/help" />
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