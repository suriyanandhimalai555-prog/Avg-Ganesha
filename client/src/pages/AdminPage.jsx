import React, { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, API_ROUTES } from '../config/api';
import { Shield, Users, LogOut, Search, Calendar, Mail, CheckCircle, Clock, FileText, Heart, Image, X, ExternalLink } from 'lucide-react';
import { commonStyles, adminStyles } from '../styles/index.styles';

const AdminPage = () => {
  const [stats, setStats] = useState({ totalUsers: 0, submittedKYC: 0, approvedKYC: 0, totalInvited: 0, pendingDonations: 0 });
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [allDonations, setAllDonations] = useState([]);
  const [donationSearch, setDonationSearch] = useState('');
  const [donationStatusFilter, setDonationStatusFilter] = useState('ALL');
  const [donationPage, setDonationPage] = useState(1);
  const [donationTotalPages, setDonationTotalPages] = useState(1);
  const donationsSectionRef = useRef(null);

  const [actionModal, setActionModal] = useState({ isOpen: false, actionType: '', targetId: null, targetStatus: '' });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [proofViewDonation, setProofViewDonation] = useState(null);
  const [kycViewUser, setKycViewUser] = useState(null);

  const [bankDetails, setBankDetails] = useState({
    bank_account_name: '', bank_account_number: '', bank_ifsc: '', bank_branch: '', bank_customer_id: '',
  });
  const [savingBank, setSavingBank] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => { fetchUsers(); }, [page, search, kycFilter]);
  useEffect(() => { fetchDonations(); }, [donationPage, donationSearch, donationStatusFilter]);
  useEffect(() => { fetchStatsAndSettings(); }, []);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      let queryStr = `?page=${page}&limit=15`;
      if (search) queryStr += `&search=${encodeURIComponent(search)}`;
      if (kycFilter !== 'ALL') queryStr += `&kycStatus=${kycFilter}`;
      
      const usersRes = await api.get(`/api/admin/users${queryStr}`);
      setUsers(usersRes.data.data);
      setTotalPages(usersRes.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch users', err);
      if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      setDonationsLoading(true);
      let donationQueryStr = `?page=${donationPage}&limit=15`;
      if (donationSearch) donationQueryStr += `&search=${encodeURIComponent(donationSearch)}`;
      if (donationStatusFilter !== 'ALL') donationQueryStr += `&status=${donationStatusFilter}`;

      const donationsRes = await api.get(`${API_ROUTES.DONATIONS.ADMIN_PENDING}${donationQueryStr}`).catch(() => ({ data: { data: [], pagination: { totalPages: 1 } } }));
      
      if (donationsRes.data && donationsRes.data.data) {
        setAllDonations(donationsRes.data.data);
        setDonationTotalPages(donationsRes.data.pagination?.totalPages || 1);
      } else {
        setAllDonations([]);
      }
    } catch (err) {
      console.error('Failed to fetch donations', err);
    } finally {
      setDonationsLoading(false);
    }
  };

  const fetchStatsAndSettings = async () => {
    try {
      const [statsRes, bankRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get(API_ROUTES.SETTINGS).catch(() => ({ data: {} })),
      ]);

      setStats(statsRes.data);
      setBankDetails((prev) => ({
        ...prev,
        bank_account_name: bankRes.data.bank_account_name || prev.bank_account_name,
        bank_account_number: bankRes.data.bank_account_number || prev.bank_account_number,
        bank_ifsc: bankRes.data.bank_ifsc || prev.bank_ifsc,
        bank_branch: bankRes.data.bank_branch || prev.bank_branch,
        bank_customer_id: bankRes.data.bank_customer_id || prev.bank_customer_id || '',
      }));
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    }
  };

  const handleLogout = () => { dispatch(logout()); navigate('/login'); };

  const openActionModal = (type, id, status) => {
    setActionModal({ isOpen: true, actionType: type, targetId: id, targetStatus: status });
    setActionReason('');
  };

  const closeActionModal = () => setActionModal({ isOpen: false, actionType: '', targetId: null, targetStatus: '' });

  const executeAction = async () => {
    setActionLoading(true);
    try {
      if (actionModal.actionType === 'KYC') {
        await api.post('/api/admin/kyc-review', { userId: actionModal.targetId, status: actionModal.targetStatus, rejectionReason: actionReason });
        setKycViewUser(null);
        fetchUsers();
        fetchStatsAndSettings();
      } else if (actionModal.actionType === 'DONATION') {
        await api.post(API_ROUTES.DONATIONS.ADMIN_REVIEW(actionModal.targetId), { status: actionModal.targetStatus, rejectionReason: actionReason });
        setProofViewDonation(null);
        fetchDonations();
        fetchStatsAndSettings();
      } else if (actionModal.actionType === 'ROLE') {
        await api.post('/api/admin/role', { userId: actionModal.targetId, role: actionModal.targetStatus });
        fetchUsers();
      }
      closeActionModal();
    } catch (err) {
      alert('Failed to process action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBankChange = (e) => setBankDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSaveBankDetails = async () => {
    setSavingBank(true);
    try {
      await api.put(API_ROUTES.SETTINGS, bankDetails);
      alert('Account details updated.');
    } catch (err) {
      alert('Failed to save account details.');
    } finally {
      setSavingBank(false);
    }
  };

  const scrollToDonations = (statusFilter = 'PENDING') => {
    setDonationStatusFilter(statusFilter);
    setDonationPage(1);
    setTimeout(() => donationsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, filterType }) => (
    <div
      onClick={() => { setKycFilter(filterType); setPage(1); }}
      className={`${adminStyles.statCardBase} ${kycFilter === filterType ? adminStyles.statCardActive : adminStyles.statCardInactive}`}
    >
      <div className={adminStyles.statCardDecoration} />
      <div className="relative z-10">
        <h3 className={adminStyles.statCardLabel}>{title}</h3>
        <p className={adminStyles.statCardValue}>{value}</p>
      </div>
      <div className={`${adminStyles.statCardIconWrapper} ${colorClass}`}><Icon size={24} /></div>
    </div>
  );

  return (
    <div className={commonStyles.pageContainer}>
      {/* Navbar */}
      <nav className={adminStyles.navbar}>
        <div className={adminStyles.navbarInner}>
          <div className={adminStyles.navbarContent}>
            <div className="flex items-center gap-4">
              <div className={adminStyles.navbarLogoWrapper}><Shield size={20} /></div>
              <div>
                <p className={commonStyles.preTitle}>॥ அகில வெற்றி கணேஷா ॥</p>
                <h1 className={adminStyles.navbarTitle + " flex items-center gap-2"}>
                  <img src="/Ganesha.jpeg" alt="Ganesha" className="w-8 h-8 rounded-full object-cover shadow-sm border border-gs-teal/10" />
                  World Of Agilavetri Ganesha <span className="text-gs-teal font-sans font-medium">| ADMIN</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button type="button" onClick={handleLogout} className={adminStyles.logoutBtn}><LogOut size={16} /> Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className={commonStyles.mainContent + " pb-20"}>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-12">
          <StatCard title="ALL DEVOTEES" value={stats.totalUsers} icon={Users} colorClass="text-[#FBDB8C]" filterType="ALL" />
          <StatCard title="KYC REVIEW" value={stats.submittedKYC} icon={FileText} colorClass="text-amber-400" filterType="SUBMITTED" />
          <StatCard title="VERIFIED" value={stats.approvedKYC} icon={CheckCircle} colorClass="text-emerald-400" filterType="APPROVED" />
          <StatCard title="TOTAL INVITED" value={stats.totalInvited} icon={Users} colorClass="text-purple-400" filterType="ALL" />
          <div onClick={() => scrollToDonations('PENDING')} className={`${adminStyles.donationStatBox} cursor-pointer hover:-translate-y-1 transition-all`}>
            <div className="relative z-10">
              <h3 className={adminStyles.statCardLabel}>PENDING SEVA</h3>
              <p className={adminStyles.statCardValueAmber}>{stats.pendingDonations ?? 0}</p>
            </div>
            <div className={adminStyles.donationStatIcon}><Heart size={20} /></div>
          </div>
        </div>

        {/* ── 1. DEVOTEE DIRECTORY ── */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-serif font-black text-[#FBDB8C] tracking-[0.2em] uppercase">Devotee Directory</h2>
            {kycFilter !== 'ALL' && (
              <span className="bg-[#FBDB8C]/10 text-[#FBDB8C] px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-[#FBDB8C]/20">
                FILTER: {kycFilter}
              </span>
            )}
          </div>
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search by name, email or code..."
              className="w-full md:w-96 bg-white/5 border border-[#FBDB8C]/10 text-white rounded-2xl py-4 pl-12 pr-6 focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20 text-xs font-medium tracking-wide"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <Search className="w-4 h-4 text-[#FBDB8C]/40 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="bg-[#0A194E]/30 border border-[#FBDB8C]/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md relative mb-20">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/20 to-transparent" />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-black/20">
                <tr>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Devotee Info</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Role</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Joined</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">KYC State</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Invited By</th>
                  <th className="px-8 py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersLoading ? (
                  <tr><td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <img src="/Ganesha.jpeg" alt="Loading" className="w-12 h-12 rounded-full animate-pulse border border-[#FBDB8C]/20" />
                      <p className="text-[#FBDB8C] font-serif tracking-[0.3em] animate-pulse text-xs">Consulting Akashic Records...</p>
                    </div>
                  </td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="6" className="px-8 py-20 text-center text-white/30 font-medium tracking-widest uppercase text-[10px]">No devotees found.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-all group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-2xl bg-[#FBDB8C]/5 border border-[#FBDB8C]/10 flex items-center justify-center text-[#FBDB8C] font-black shadow-inner group-hover:bg-[#FBDB8C]/20 transition-all">
                            {u.full_name?.charAt(0).toUpperCase() || 'D'}
                          </div>
                          <div className="ml-5">
                            <div className="text-sm font-black text-white tracking-widest uppercase mb-1">{u.full_name}</div>
                            <div className="text-[10px] text-white/30 flex items-center gap-1.5 font-bold"><Mail size={12} className="text-[#FBDB8C]" /> {u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`${adminStyles.roleBase} ${u.role === 'ADMIN' ? adminStyles.roleAdmin : adminStyles.roleUser}`}>{u.role}</span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-2.5 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                          <Calendar size={14} className="text-[#FBDB8C]/40" />
                          {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`${adminStyles.statusBadgeBase} ${
                          u.kyc_status === 'APPROVED' ? adminStyles.statusConfirmed :
                          u.kyc_status === 'SUBMITTED' ? adminStyles.statusPending :
                          adminStyles.statusRejected
                        }`}>
                          {u.kyc_status === 'APPROVED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                          {u.kyc_status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        {u.invited_by_name || <span className="opacity-20">—</span>}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* u.role !== 'ADMIN' && (
                            <button type="button" onClick={() => openActionModal('ROLE', u.id, 'ADMIN')}
                              className="text-[9px] px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all">
                              Make Admin
                            </button>
                          ) */}
                          {(u.kyc_docs?.front || u.kyc_docs?.back) && (
                            <button type="button" onClick={() => setKycViewUser(u)}
                              className="text-[9px] px-3 py-1.5 bg-[#FBDB8C]/5 text-[#FBDB8C] border border-[#FBDB8C]/20 rounded-lg font-black uppercase tracking-widest hover:bg-[#FBDB8C]/10 transition-all flex items-center gap-1.5">
                              <Image size={10} /> Docs
                            </button>
                          )}
                          {u.kyc_status === 'SUBMITTED' && (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => openActionModal('KYC', u.id, 'APPROVED')} className={adminStyles.actionBtnApprove}>✓ Approve</button>
                              <button type="button" onClick={() => openActionModal('KYC', u.id, 'REJECTED')} className={adminStyles.actionBtnReject}>✗ Reject</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="bg-black/20 px-8 py-6 flex items-center justify-between border-t border-white/5">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-[10px] font-black text-[#FBDB8C] disabled:opacity-20 uppercase tracking-[0.2em] hover:bg-white/5 px-4 py-2 rounded-lg transition-all">
              ← Previous
            </button>
            <div className="bg-white/5 px-6 py-2 rounded-full border border-white/10 shadow-inner">
              <span className="text-[10px] font-black text-[#FBDB8C]/60 uppercase tracking-widest">Page {page} of {totalPages}</span>
            </div>
            <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="text-[10px] font-black text-[#FBDB8C] disabled:opacity-20 uppercase tracking-[0.2em] hover:bg-white/5 px-4 py-2 rounded-lg transition-all">
              Next →
            </button>
          </div>
        </div>

        {/* ── 2. SEVA OFFERINGS ── */}
        <div ref={donationsSectionRef} className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <h2 className="text-xl font-serif font-black text-[#FBDB8C] tracking-[0.2em] uppercase">Seva Offerings</h2>
              {['ALL', 'PENDING', 'CONFIRMED', 'REJECTED'].map((s) => (
                <button key={s} type="button" onClick={() => { setDonationStatusFilter(s); setDonationPage(1); }}
                  className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border transition-all ${
                    donationStatusFilter === s ? 'bg-[#FBDB8C]/20 text-[#FBDB8C] border-[#FBDB8C]/40' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <input type="text" placeholder="Search by name, email, category..."
                className="w-full bg-white/5 border border-[#FBDB8C]/10 text-white rounded-2xl py-3 pl-10 pr-4 focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20 text-xs font-medium"
                value={donationSearch} onChange={(e) => { setDonationSearch(e.target.value); setDonationPage(1); }} />
              <Search className="w-4 h-4 text-[#FBDB8C]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className={commonStyles.tableContainer}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className={commonStyles.tableHead}>
                  <tr>
                    <th className={commonStyles.tableHeaderCell}>Devotee</th>
                    <th className={commonStyles.tableHeaderCell}>Category</th>
                    <th className={commonStyles.tableHeaderCell}>Amount</th>
                    <th className={commonStyles.tableHeaderCell}>Date</th>
                    <th className={commonStyles.tableHeaderCell}>Status</th>
                    <th className={commonStyles.tableHeaderCell}>Proof</th>
                    <th className={commonStyles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {donationsLoading ? (
                    <tr><td colSpan="7" className="px-8 py-16 text-center text-white/30 font-medium tracking-widest text-[10px]">Loading...</td></tr>
                  ) : allDonations.length === 0 ? (
                    <tr><td colSpan="7" className="px-8 py-16 text-center text-white/30 font-medium tracking-widest uppercase text-[10px]">No seva offerings found.</td></tr>
                  ) : (
                    allDonations.map((d) => (
                      <tr key={d.id} className={commonStyles.tableRow}>
                        <td className={commonStyles.tableCell}>
                          <div>
                            <p className="font-black text-white tracking-widest uppercase mb-1">{d.full_name}</p>
                            <p className="text-[10px] text-white/30 font-bold flex items-center gap-1.5"><Mail size={12} className="text-[#FBDB8C]" /> {d.email}</p>
                          </div>
                        </td>
                        <td className={commonStyles.tableCell}>
                          <span className="text-[10px] font-black text-[#FBDB8C]/60 uppercase tracking-widest">{d.category_name}</span>
                        </td>
                        <td className={commonStyles.tableCell}>
                          <div className="text-lg font-serif font-black text-[#FBDB8C]">₹{parseFloat(d.amount).toLocaleString('en-IN')}</div>
                        </td>
                        <td className={commonStyles.tableCell}>
                          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{new Date(d.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className={commonStyles.tableCell}>
                          <span className={`${adminStyles.statusBadgeBase} ${
                            d.status === 'CONFIRMED' ? adminStyles.statusConfirmed :
                            d.status === 'REJECTED' ? adminStyles.statusRejected :
                            adminStyles.statusPending
                          }`}>
                            {d.status === 'CONFIRMED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                            {d.status || 'PENDING'}
                          </span>
                        </td>
                        <td className={commonStyles.tableCell}>
                          {d.payment_proof_path ? (
                            <button type="button" onClick={() => setProofViewDonation(d)}
                              className="inline-flex items-center gap-2 text-[#FBDB8C] font-black text-[9px] uppercase tracking-widest hover:text-white transition-colors">
                              <Image size={14} /> View Photo
                            </button>
                          ) : (
                            <span className="text-white/20 text-[10px] font-bold">—</span>
                          )}
                        </td>
                        <td className={commonStyles.tableCell}>
                          {d.status === 'PENDING' ? (
                            <div className="flex gap-2">
                              <button type="button" onClick={() => openActionModal('DONATION', d.id, 'CONFIRMED')} disabled={actionLoading} className={adminStyles.actionBtnApprove}>✓ Approve</button>
                              <button type="button" onClick={() => openActionModal('DONATION', d.id, 'REJECTED')} disabled={actionLoading} className={adminStyles.actionBtnReject}>✗ Reject</button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-white/30 font-black uppercase tracking-widest italic opacity-40">Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Donations */}
            <div className="bg-black/20 px-8 py-6 flex items-center justify-between border-t border-white/5">
              <button type="button" onClick={() => setDonationPage(p => Math.max(1, p - 1))} disabled={donationPage === 1}
                className="text-[10px] font-black text-[#FBDB8C] disabled:opacity-20 uppercase tracking-[0.2em] hover:bg-white/5 px-4 py-2 rounded-lg transition-all">
                ← Previous
              </button>
              <div className="bg-white/5 px-6 py-2 rounded-full border border-white/10 shadow-inner">
                <span className="text-[10px] font-black text-[#FBDB8C]/60 uppercase tracking-widest">Page {donationPage} of {donationTotalPages}</span>
              </div>
              <button type="button" onClick={() => setDonationPage(p => Math.min(donationTotalPages, p + 1))} disabled={donationPage === donationTotalPages}
                className="text-[10px] font-black text-[#FBDB8C] disabled:opacity-20 uppercase tracking-[0.2em] hover:bg-white/5 px-4 py-2 rounded-lg transition-all">
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* ── 3. DONATION ACCOUNT SETTINGS (bottom) ── */}
        <div className={adminStyles.sectionBox}>
          <div className="flex items-center gap-4 mb-10 pb-4 border-b border-[#FBDB8C]/10">
            <Shield className="text-[#FBDB8C]" size={24} />
            <h2 className="text-xl font-serif font-black text-[#FBDB8C] tracking-[0.2em] uppercase">Donation Account Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Account Holder Name</label>
              <input type="text" name="bank_account_name" value={bankDetails.bank_account_name} onChange={handleBankChange}
                className="w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl px-5 py-3.5 text-sm text-white focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20" placeholder="Enter display name" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Bank Account Number</label>
              <input type="text" name="bank_account_number" value={bankDetails.bank_account_number} onChange={handleBankChange}
                className="w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl px-5 py-3.5 text-sm text-white focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20" placeholder="Enter account number" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Bank Customer ID</label>
              <input type="text" name="bank_customer_id" value={bankDetails.bank_customer_id} onChange={handleBankChange}
                className="w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl px-5 py-3.5 text-sm text-white focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20" placeholder="Enter customer ID" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Bank IFSC Code</label>
              <input type="text" name="bank_ifsc" value={bankDetails.bank_ifsc} onChange={handleBankChange}
                className="w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl px-5 py-3.5 text-sm text-white focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20" placeholder="Enter IFSC code" />
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/5">
            <button type="button" onClick={handleSaveBankDetails} disabled={savingBank}
              className="bg-gradient-to-r from-[#FCD34D] via-[#B45309] to-[#F59E0B] text-white font-black text-[10px] tracking-[0.3em] uppercase py-4 px-10 rounded-full shadow-lg hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all active:scale-95 disabled:opacity-50">
              {savingBank ? 'Saving...' : 'Save Account Settings'}
            </button>
          </div>
        </div>

        {/* ── KYC Document Modal ── */}
        {kycViewUser && (kycViewUser.kyc_docs?.front || kycViewUser.kyc_docs?.back) && (
          <div className={commonStyles.modalOverlay} onClick={() => setKycViewUser(null)}>
            <div className={commonStyles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/40 to-transparent" />
              <div className={commonStyles.modalHeader}>
                <div>
                  <h3 className="text-xl font-serif font-black text-[#FBDB8C] tracking-widest uppercase mb-1">KYC Artifacts</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">{kycViewUser.full_name} — {kycViewUser.email}</p>
                </div>
                <button type="button" onClick={() => setKycViewUser(null)} className="p-3 rounded-2xl hover:bg-white/10 text-white/40 hover:text-white transition-all"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-auto p-10 bg-black/20 grid grid-cols-1 md:grid-cols-2 gap-10">
                {kycViewUser.kyc_docs?.front && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.3em] mb-2">Primary ID Front</p>
                    <div className="bg-white/5 p-2 rounded-2xl border border-white/5 shadow-2xl">
                      <img src={`${API_BASE_URL}/uploads/${kycViewUser.kyc_docs.front}`} alt="ID Front" className="w-full rounded-xl object-contain max-h-[50vh] shadow-inner" />
                    </div>
                    <a href={`${API_BASE_URL}/uploads/${kycViewUser.kyc_docs.front}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[10px] text-[#FBDB8C] font-black uppercase tracking-widest hover:text-white transition-all underline decoration-[#FBDB8C]/20">
                      <ExternalLink size={14} /> Inspect Full Document
                    </a>
                  </div>
                )}
                {kycViewUser.kyc_docs?.back && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.3em] mb-2">Primary ID Back</p>
                    <div className="bg-white/5 p-2 rounded-2xl border border-white/5 shadow-2xl">
                      <img src={`${API_BASE_URL}/uploads/${kycViewUser.kyc_docs.back}`} alt="ID Back" className="w-full rounded-xl object-contain max-h-[50vh] shadow-inner" />
                    </div>
                    <a href={`${API_BASE_URL}/uploads/${kycViewUser.kyc_docs.back}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[10px] text-[#FBDB8C] font-black uppercase tracking-widest hover:text-white transition-all underline decoration-[#FBDB8C]/20">
                      <ExternalLink size={14} /> Inspect Full Document
                    </a>
                  </div>
                )}
              </div>
              <div className={commonStyles.modalFooter}>
                <button type="button" onClick={() => setKycViewUser(null)} className={commonStyles.buttonSecondary}>Return</button>
                <button type="button" onClick={() => openActionModal('KYC', kycViewUser.id, 'REJECTED')} className={adminStyles.actionBtnReject + " px-8 py-3.5"}>✗ Reject Seva</button>
                <button type="button" onClick={() => openActionModal('KYC', kycViewUser.id, 'APPROVED')} className={adminStyles.actionBtnApprove + " px-8 py-3.5"}>✓ Confirm Devotee</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Payment Proof Modal ── */}
        {proofViewDonation && (
          <div className={commonStyles.modalOverlay} onClick={() => setProofViewDonation(null)}>
            <div className={commonStyles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/40 to-transparent" />
              <div className={commonStyles.modalHeader}>
                <div>
                  <h3 className="text-xl font-serif font-black text-[#FBDB8C] tracking-widest uppercase mb-1">Seva Offering Proof</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
                    {proofViewDonation.full_name} · {proofViewDonation.category_name} · ₹{parseFloat(proofViewDonation.amount).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <a href={`${API_BASE_URL}/uploads/${proofViewDonation.payment_proof_path}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black text-[#FBDB8C] border border-[#FBDB8C]/20 rounded-xl hover:bg-white/5 transition-all uppercase tracking-widest">
                    <ExternalLink size={16} /> Original
                  </a>
                  <button type="button" onClick={() => setProofViewDonation(null)} className="p-3 rounded-2xl hover:bg-white/10 text-white/40 hover:text-white transition-all"><X size={24} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-10 bg-black/20 min-h-[300px] flex items-center justify-center">
                {proofViewDonation.payment_proof_path && (() => {
                  const ext = (proofViewDonation.payment_proof_path || '').split('.').pop()?.toLowerCase();
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                  const src = `${API_BASE_URL}/uploads/${proofViewDonation.payment_proof_path}`;
                  return isImage ? (
                    <div className="p-3 bg-white/5 rounded-3xl border border-white/5 shadow-2xl">
                      <img src={src} alt="Payment proof" className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-inner" />
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10 mb-6">
                        <FileText size={40} className="text-[#FBDB8C]/40" />
                      </div>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Preview unavailable</p>
                      <a href={src} target="_blank" rel="noopener noreferrer" className="inline-block text-[#FBDB8C] font-black text-xs uppercase tracking-widest underline">Download File</a>
                    </div>
                  );
                })()}
              </div>
              <div className={commonStyles.modalFooter}>
                <button type="button" onClick={() => setProofViewDonation(null)} className={commonStyles.buttonSecondary}>Return</button>
                <button type="button" onClick={() => openActionModal('DONATION', proofViewDonation.id, 'REJECTED')} disabled={actionLoading} className={adminStyles.actionBtnReject + " px-8 py-3.5"}>✗ Reject Seva</button>
                <button type="button" onClick={() => openActionModal('DONATION', proofViewDonation.id, 'CONFIRMED')} disabled={actionLoading} className={adminStyles.actionBtnApprove + " px-8 py-3.5"}>✓ Accept Seva</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Action Confirmation Modal ── */}
        {actionModal.isOpen && (
          <div className={commonStyles.modalOverlay} onClick={closeActionModal}>
            <div className="bg-[#060B28] border border-[#FBDB8C]/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_60px_rgba(0,0,0,0.8)] relative" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-serif font-black text-[#FBDB8C] tracking-widest uppercase mb-4">Confirm Action</h3>
              <p className="text-sm text-white/60 mb-6">
                Are you sure you want to <strong>{actionModal.targetStatus === 'REJECTED' ? 'REJECT' : 'APPROVE'}</strong> this?
              </p>
              {actionModal.targetStatus === 'REJECTED' && (
                <div className="mb-6 space-y-2">
                  <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Rejection Reason (Optional)</label>
                  <textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)}
                    className="w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20"
                    placeholder="Provide a reason..." rows={3} />
                </div>
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={closeActionModal} className={commonStyles.buttonSecondary + " !px-6 !py-3"}>Cancel</button>
                <button type="button" onClick={executeAction} disabled={actionLoading}
                  className={(actionModal.targetStatus === 'REJECTED' ? adminStyles.actionBtnReject : adminStyles.actionBtnApprove) + " !px-6 !py-3"}>
                  {actionLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;