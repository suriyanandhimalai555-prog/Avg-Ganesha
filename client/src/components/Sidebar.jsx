import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { LayoutDashboard, Heart, Gift, Phone, User, Users, LogOut, X, ShieldCheck } from 'lucide-react';
import { commonStyles, sidebarStyles } from '../styles/index.styles';

// Defined at module level (not inside Sidebar) so React doesn't remount every item
// on each render.
const NavItem = ({ icon, label, to, isSpecial = false, pathname, onNavigate }) => {
  const Icon = icon;
  const isActive = pathname === to || (to !== '/dashboard' && pathname.startsWith(to));

  return (
    <button
      onClick={() => onNavigate(to)}
      className={`${sidebarStyles.navItemBase} ${isActive ? sidebarStyles.navItemActive :
        isSpecial ? sidebarStyles.navItemSpecial : sidebarStyles.navItemInactive
        }`}
    >
      <Icon size={20} className={sidebarStyles.navItemIcon} />
      <span className={sidebarStyles.navItemLabel}>{label}</span>
    </button>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user, token } = useSelector((state) => state.auth);
  const isLoggedIn = !!token && !!user;

  const goTo = (to) => {
    navigate(to);
    if (window.innerWidth < 768) onClose();
  };
  const nav = { pathname: location.pathname, onNavigate: goTo };

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
          {isLoggedIn && <NavItem {...nav} to="/dashboard" icon={LayoutDashboard} label="DASHBOARD" />}
          <NavItem {...nav} to="/donate" icon={Heart} label="DONATE" />
          {isLoggedIn && <NavItem {...nav} to="/dashboard/kyc" icon={ShieldCheck} label="VERIFY KYC" />}
          {isLoggedIn && <NavItem {...nav} to="/dashboard/network" icon={Users} label="INVITE" />}
          <NavItem {...nav} to="/dashboard/support" icon={Phone} label="SUPPORT" />
          {isLoggedIn && <NavItem {...nav} to="/dashboard/profile" icon={User} label="PROFILE" />}
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