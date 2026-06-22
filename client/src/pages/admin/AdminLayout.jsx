import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Shield,
  Users,
  LogOut,
  CheckCircle,
  FileText,
  Heart,
  Briefcase,
  Settings,
  Network,
} from 'lucide-react';
import api from '../../api/axios';
import { logout } from '../../redux/slices/authSlice';
import { commonStyles, adminStyles } from '../../styles/index.styles';

const TABS = [
  { to: '/admin/devotees',    label: 'Devotees',         Icon: Users },
  { to: '/admin/invite-tree', label: 'Invite Tree',      Icon: Network },
  { to: '/admin/seva',        label: 'Seva Offerings',   Icon: Briefcase },
  { to: '/admin/settings',    label: 'Account Settings', Icon: Settings },
];

const AdminLayout = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    submittedKYC: 0,
    approvedKYC: 0,
    totalInvited: 0,
    pendingDonations: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api.get('/api/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setStatsLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Refetch stats whenever a child route signals an action that affects them
  // (children call window.dispatchEvent(new CustomEvent('admin:refresh-stats'))).
  useEffect(() => {
    const handler = () => fetchStats();
    window.addEventListener('admin:refresh-stats', handler);
    return () => window.removeEventListener('admin:refresh-stats', handler);
  }, [fetchStats]);

  // Clicking the "Pending Seva" stat jumps to the Seva tab with pending filter
  const goToPendingSeva = () => {
    navigate('/admin/seva?status=PENDING');
  };

  return (
    <div className={commonStyles.pageContainer}>
      {/* Navbar */}
      <nav className={adminStyles.navbar}>
        <div className={adminStyles.navbarInner}>
          <div className={adminStyles.navbarContent}>
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              <div className={adminStyles.navbarLogoWrapper}>
                <Shield size={18} className="md:hidden" />
                <Shield size={20} className="hidden md:block" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`${commonStyles.preTitle} hidden md:block`}>॥ அகில வெற்றி கணேஷா ॥</p>
                <h1 className={adminStyles.navbarTitle + ' flex items-center gap-2 min-w-0'}>
                  <img
                    src="/Ganesha.jpeg"
                    alt="Ganesha"
                    className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover shadow-sm border border-gs-teal/10 flex-shrink-0"
                  />
                  <span className="truncate">
                    <span className="md:hidden">AVG Ganesha</span>
                    <span className="hidden md:inline">World Of Agilavetri Ganesha</span>
                    <span className="text-gs-teal font-sans font-medium ml-2">| ADMIN</span>
                  </span>
                </h1>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={adminStyles.logoutBtn}
              aria-label="Logout"
            >
              <LogOut size={14} className="md:hidden" />
              <LogOut size={16} className="hidden md:block" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className={commonStyles.mainContent + ' pb-20'}>
        {/* Stats grid (sticky context for every admin page) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-8 md:mb-10">
          <StatTile
            title="ALL DEVOTEES"
            value={stats.totalUsers}
            Icon={Users}
            colorClass="text-[#FBDB8C]"
            loading={statsLoading}
            onClick={() => navigate('/admin/devotees?filter=ALL')}
          />
          <StatTile
            title="KYC REVIEW"
            value={stats.submittedKYC}
            Icon={FileText}
            colorClass="text-amber-400"
            loading={statsLoading}
            onClick={() => navigate('/admin/devotees?filter=SUBMITTED')}
          />
          <StatTile
            title="VERIFIED"
            value={stats.approvedKYC}
            Icon={CheckCircle}
            colorClass="text-emerald-400"
            loading={statsLoading}
            onClick={() => navigate('/admin/devotees?filter=APPROVED')}
          />
          <StatTile
            title="TOTAL INVITED"
            value={stats.totalInvited}
            Icon={Users}
            colorClass="text-purple-400"
            loading={statsLoading}
            onClick={() => navigate('/admin/devotees?filter=ALL')}
          />
          <div
            onClick={goToPendingSeva}
            className={`${adminStyles.donationStatBox} cursor-pointer hover:-translate-y-1 transition-all`}
          >
            <div className="relative z-10">
              <h3 className={adminStyles.statCardLabel}>PENDING SEVA</h3>
              <p className={adminStyles.statCardValueAmber}>
                {statsLoading ? '…' : (stats.pendingDonations ?? 0)}
              </p>
            </div>
            <div className={adminStyles.donationStatIcon}>
              <Heart size={20} />
            </div>
          </div>
        </div>

        {/* Tab navigation — each tab is a separate route */}
        <div className="mb-8 border-b border-[#FBDB8C]/10">
          <div className="flex flex-wrap items-center gap-1">
            {/* eslint-disable-next-line no-unused-vars */}
            {TABS.map(({ to, label, Icon }) => {
              const active = location.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={`group inline-flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-[0.25em] border-b-2 -mb-px transition-all ${
                    active
                      ? 'text-[#FBDB8C] border-[#FBDB8C] bg-[#FBDB8C]/5'
                      : 'text-white/40 border-transparent hover:text-[#FBDB8C]/80 hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-[#FBDB8C]' : 'text-white/40 group-hover:text-[#FBDB8C]/80'} />
                  {label}
                </NavLink>
              );
            })}
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const StatTile = ({ title, value, Icon, colorClass, loading, onClick }) => (
  <div
    onClick={onClick}
    className={`${adminStyles.statCardBase} ${adminStyles.statCardInactive}`}
  >
    <div className={adminStyles.statCardDecoration} />
    <div className="relative z-10">
      <h3 className={adminStyles.statCardLabel}>{title}</h3>
      <p className={adminStyles.statCardValue}>{loading ? '…' : value}</p>
    </div>
    <div className={`${adminStyles.statCardIconWrapper} ${colorClass}`}>
      <Icon size={24} />
    </div>
  </div>
);

export default AdminLayout;
