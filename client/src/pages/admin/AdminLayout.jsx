import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  HeartHandshake,
  Network,
  Settings,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Hash,
  Upload,
} from 'lucide-react';
import api from '../../api/axios';
import { logout } from '../../redux/slices/authSlice';

/*
  Admin Console shell (Zoho-style)
  ================================
  A persistent left sidebar with grouped modules + live work-queue badges,
  a slim top bar, and a focused content area. Stats are fetched here so the
  sidebar badges stay live; children read them via <Outlet context> and can
  request a refresh by firing `admin:refresh-stats` (kept for backwards compat)
  or calling the `refreshStats` helper from context.
*/

// Nav groups. Each item computes its own `active` because two items share the
// same /admin/devotees path (Devotees = all, KYC Review = SUBMITTED filter),
// which NavLink's path-only matching can't distinguish.
const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      {
        key: 'overview',
        to: '/admin',
        label: 'Overview',
        Icon: LayoutDashboard,
        match: ({ pathname }) => pathname === '/admin',
      },
    ],
  },
  {
    label: 'Manage',
    items: [
      {
        key: 'devotees',
        to: '/admin/devotees',
        label: 'Devotees',
        Icon: Users,
        match: ({ pathname, filter }) =>
          pathname.startsWith('/admin/devotees') && filter !== 'SUBMITTED',
      },
      {
        key: 'kyc',
        to: '/admin/devotees?filter=SUBMITTED',
        label: 'KYC Review',
        Icon: ShieldCheck,
        badgeKey: 'submittedKYC',
        match: ({ pathname, filter }) =>
          pathname.startsWith('/admin/devotees') && filter === 'SUBMITTED',
      },
      {
        key: 'kyc-entry',
        to: '/admin/kyc-entry',
        label: 'Submit KYC',
        Icon: Upload,
        match: ({ pathname }) => pathname.startsWith('/admin/kyc-entry'),
      },
      {
        key: 'seva',
        to: '/admin/seva',
        label: 'Seva Offerings',
        Icon: HeartHandshake,
        badgeKey: 'pendingDonations',
        match: ({ pathname }) =>
          pathname.startsWith('/admin/seva') && !pathname.startsWith('/admin/seva-entry'),
      },
      {
        key: 'seva-entry',
        to: '/admin/seva-entry',
        label: 'Record Seva',
        Icon: PlusCircle,
        match: ({ pathname }) => pathname.startsWith('/admin/seva-entry'),
      },
      {
        key: 'statue-numbers',
        to: '/admin/statue-numbers',
        label: 'Statue Numbers',
        Icon: Hash,
        match: ({ pathname }) => pathname.startsWith('/admin/statue-numbers'),
      },
      {
        key: 'invite-tree',
        to: '/admin/invite-tree',
        label: 'Invite Tree',
        Icon: Network,
        match: ({ pathname }) => pathname.startsWith('/admin/invite-tree'),
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        key: 'settings',
        to: '/admin/settings',
        label: 'Settings',
        Icon: Settings,
        match: ({ pathname }) => pathname.startsWith('/admin/settings'),
      },
    ],
  },
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = useSelector((state) => state.auth.user);

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

  // Close the mobile drawer on navigation.
  useEffect(() => { setSidebarOpen(false); }, [location.pathname, location.search]);

  const filter = (searchParams.get('filter') || '').toUpperCase();
  const routeCtx = { pathname: location.pathname, filter };

  const activeItem = useMemo(() => {
    for (const group of NAV_GROUPS) {
      const found = group.items.find((it) => it.match(routeCtx));
      if (found) return found;
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, filter]);

  const pageTitle = activeItem?.label || 'Admin';

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#060B28] text-white font-sans">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed md:relative top-0 left-0 z-50 h-full w-72 flex-shrink-0 bg-gradient-to-b from-[#060B28] to-[#040924] border-r border-[#FBDB8C]/15 flex flex-col shadow-2xl md:shadow-none transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-16 md:h-20 px-5 flex items-center justify-between border-b border-[#FBDB8C]/10 bg-black/20 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/Ganesha.jpeg"
              alt="Ganesha"
              className="w-9 h-9 rounded-full object-cover border border-[#FBDB8C]/30 shadow-sm flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[8px] font-serif font-semibold text-[#FBDB8C]/60 uppercase tracking-[0.3em] leading-none">
                AVG Ganesha
              </p>
              <p className="text-sm font-serif font-bold text-white tracking-[0.15em] uppercase leading-tight mt-1">
                Admin<span className="text-[#FBDB8C]"> Console</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-white/40 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-5 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[9px] font-black text-[#FBDB8C]/30 uppercase tracking-[0.3em]">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const { Icon } = item;
                  const active = item.match(routeCtx);
                  const badge = item.badgeKey ? stats[item.badgeKey] : 0;
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                        active
                          ? 'bg-[#FBDB8C]/10 border-[#FBDB8C]/40 text-[#FBDB8C] font-bold shadow-[0_0_15px_rgba(251,219,140,0.08)]'
                          : 'border-transparent text-white/50 hover:text-[#FBDB8C] hover:bg-white/5 font-medium'
                      }`}
                    >
                      <Icon
                        size={17}
                        className={active ? 'text-[#FBDB8C]' : 'text-white/40 group-hover:text-[#FBDB8C]'}
                      />
                      <span className="flex-1 text-xs tracking-wide">{item.label}</span>
                      {item.badgeKey && !statsLoading && badge > 0 && (
                        <span className="min-w-[20px] px-1.5 py-0.5 text-[10px] font-black text-[#060B28] bg-[#FBDB8C] rounded-full text-center tabular-nums shadow-[0_0_10px_rgba(251,219,140,0.3)]">
                          {badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: identity + logout */}
        <div className="p-3 border-t border-[#FBDB8C]/10 bg-black/20 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 mb-2">
            <div className="h-9 w-9 rounded-full bg-[#FBDB8C]/10 border border-[#FBDB8C]/20 flex items-center justify-center text-[#FBDB8C] font-black text-sm flex-shrink-0">
              {user?.full_name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.full_name || 'Administrator'}</p>
              <p className="text-[10px] text-[#FBDB8C]/50 uppercase tracking-widest font-bold">Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top bar */}
        <header className="h-16 md:h-20 flex-shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 border-b border-[#FBDB8C]/10 bg-[#060B28]/80 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2.5 bg-[#FBDB8C]/10 text-[#FBDB8C] border border-[#FBDB8C]/20 rounded-xl transition-all hover:bg-[#FBDB8C]/20"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="text-[9px] font-serif font-semibold text-[#FBDB8C]/50 uppercase tracking-[0.3em] leading-none hidden md:block">
                ॥ அகில வெற்றி கணேஷா ॥
              </p>
              <h1 className="text-lg md:text-2xl font-serif font-bold text-white tracking-[0.1em] uppercase truncate mt-1">
                {pageTitle}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-full bg-white/5 border border-[#FBDB8C]/15">
              <div className="h-7 w-7 rounded-full bg-[#FBDB8C]/10 border border-[#FBDB8C]/20 flex items-center justify-center text-[#FBDB8C] font-black text-xs">
                {user?.full_name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-xs font-bold text-white/80 truncate max-w-[140px]">
                {user?.full_name || 'Administrator'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="sm:hidden p-2.5 text-[#FBDB8C] hover:bg-white/5 border border-[#FBDB8C]/20 rounded-xl transition-all"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full">
            <Outlet context={{ stats, statsLoading, refreshStats: fetchStats }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
