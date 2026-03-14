import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { Home, Users, Heart, Settings, HelpCircle, Layers, LogOut, Shield, ShieldCheck, X } from 'lucide-react';

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
        className={`
          w-full flex items-center space-x-3 px-6 py-4 mb-1 transition-all duration-300 relative group overflow-hidden rounded-r-full
          ${isActive
            ? 'text-gs-teal bg-gs-teal/10 border-l-4 border-gs-teal font-bold'
            : isSpecial
              ? 'text-gs-teal border-l-4 border-gs-teal/50 bg-gs-teal/5 hover:bg-gs-teal/15 font-medium'
              : 'text-gray-600 hover:text-gs-teal hover:bg-gs-teal/5 border-l-4 border-transparent font-medium'
          }
        `}
      >
        <Icon size={20} className="relative z-10" />
        <span className="tracking-wide z-10 transition-all">{label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        className={`
          fixed md:relative top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out flex-shrink-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0 flex justify-between items-center bg-gs-cream/50">
          <div>
            <h1 className="text-2xl font-serif font-bold text-gs-navy tracking-wide">
              🐘 <span className="text-gs-teal">Ganesha</span> Seva
            </h1>
            <p className="text-xs text-gray-500 italic mt-1 font-serif tracking-widest">॥ श्री गणेशाय नमः ॥</p>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gs-navy">
            <X size={24} />
          </button>
        </div>

        {/* User Badge */}
        {isLoggedIn && user?.fullName && (
          <div className="px-6 py-4 border-b border-gray-100 bg-white">
            <p className="text-[10px] text-gs-teal uppercase tracking-widest font-bold">Devotee</p>
            <p className="text-sm text-gs-navy font-bold mt-0.5">{user.fullName}</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 mt-6 overflow-y-auto custom-scrollbar px-2 space-y-1">
          {isAdmin && (
            <div className="mb-6 mx-4 p-1 rounded-xl border-2 border-gs-teal/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gs-teal/5 group-hover:bg-gs-teal/10 transition-colors pointer-events-none" />
              <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center justify-center space-x-2 py-2.5 text-gs-teal hover:text-[#1A7566] font-bold uppercase tracking-wider text-xs transition-colors"
              >
                <ShieldCheck size={16} />
                <span>Admin Portal</span>
              </button>
            </div>
          )}

          {isLoggedIn && <NavItem icon={Home} label="Dashboard" path="/dashboard" />}
          {isLoggedIn && <NavItem icon={Users} label="Your Invite Network" path="/dashboard/network" />}
          <NavItem icon={Heart} label="Donate / Contribute" path="/donate" />
          <NavItem icon={Layers} label="Seva Plans" path="/plans" />
          {isLoggedIn && <NavItem icon={Shield} label="Verify Identity (KYC)" path="/dashboard/kyc" />}
          <NavItem icon={HelpCircle} label="Help" path="/dashboard/help" />
        </nav>

        {/* Logout */}
        <div className={`p-6 border-t border-gray-100 flex-shrink-0 transition-colors group ${isLoggedIn ? 'bg-gray-50/50 hover:bg-red-50/50' : 'bg-gs-teal/5 hover:bg-gs-teal/10'}`}>
          <button
            onClick={handleAuthAction}
            className={`flex items-center space-x-2 text-sm transition-all w-full ${isLoggedIn ? 'text-gray-500 group-hover:text-red-500' : 'text-gs-teal font-bold'}`}
          >
            <LogOut size={16} className={!isLoggedIn && "rotate-180"} />
            <span className="font-semibold">{isLoggedIn ? 'Sign Out' : 'Sign In'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;