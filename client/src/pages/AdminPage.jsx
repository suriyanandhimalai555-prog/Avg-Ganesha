import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, API_ROUTES } from '../config/api';
import { Shield, Users, LogOut, Search, Calendar, Mail, CheckCircle, Clock, FileText, Heart, Image, X, ExternalLink } from 'lucide-react';

const AdminPage = () => {
  const [stats, setStats] = useState({ totalUsers: 0, submittedKYC: 0, approvedKYC: 0, totalInvited: 0, pendingDonations: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [proofViewDonation, setProofViewDonation] = useState(null);
  const [kycViewUser, setKycViewUser] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [page, search, kycFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let queryStr = `?page=${page}&limit=15`;
      if (search) queryStr += `&search=${search}`;
      if (kycFilter !== 'ALL') queryStr += `&kycStatus=${kycFilter}`;

      const [statsRes, usersRes, pendingRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get(`/api/admin/users${queryStr}`),
        api.get(API_ROUTES.DONATIONS.ADMIN_PENDING).catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setPendingDonations(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setUsers(usersRes.data.data);
      setTotalPages(usersRes.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
      if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await api.post('/api/admin/role', { userId, role: newRole });
      fetchData();
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const handleKycReview = async (userId, status) => {
    let rejectionReason = null;
    if (status === 'REJECTED') {
      rejectionReason = window.prompt('Rejection reason (optional):');
      if (rejectionReason === null) return;
    } else if (!window.confirm(`Mark this user's KYC as ${status}?`)) return;
    try {
      await api.post('/api/admin/kyc-review', { userId, status, rejectionReason });
      setKycViewUser(null);
      fetchData();
    } catch (err) {
      alert('Failed to update KYC');
    }
  };

  const handleDonationReview = async (donationId, status) => {
    let rejectionReason = null;
    if (status === 'REJECTED') {
      rejectionReason = window.prompt('Rejection reason (optional):');
      if (rejectionReason === null) return;
    } else if (!window.confirm('Approve this donation?')) return;
    setDonationsLoading(true);
    try {
      await api.post(API_ROUTES.DONATIONS.ADMIN_REVIEW(donationId), { status, rejectionReason });
      setProofViewDonation(null);
      fetchData();
    } catch (err) {
      alert('Failed to review donation');
    } finally {
      setDonationsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, colorClass, filterType }) => (
    <div
      onClick={() => { setKycFilter(filterType); setPage(1); }}
      className={`bg-white border ${kycFilter === filterType ? 'border-gs-teal shadow-md ring-1 ring-gs-teal' : 'border-gray-200 shadow-sm'} p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none" />
      <div className="relative z-10">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">{title}</h3>
        <p className="text-3xl font-bold font-serif text-gs-navy">{value}</p>
      </div>
      <div className={`p-4 rounded-xl border border-gray-100 bg-white shadow-sm relative z-10 ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-floral-confetti bg-gs-cream font-sans text-gs-navy">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gs-teal/10 rounded-xl flex items-center justify-center text-gs-teal font-bold border border-gs-teal/20">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-gs-teal font-serif font-semibold tracking-widest text-[10px] mb-0.5">॥ श्री गणेशाय नमः ॥</p>
                <h1 className="text-xl font-bold font-serif text-gs-navy tracking-wide">
                  🐘 GANESHA SEVA <span className="text-gs-teal font-sans font-medium">| ADMIN</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-gray-500 hover:text-gs-teal transition px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                → Devotee Portal
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-lg text-sm transition-all border border-red-100">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
          <StatCard title="All Devotees" value={stats.totalUsers} icon={Users} colorClass="text-blue-500" filterType="ALL" />
          <StatCard title="KYC Needs Review" value={stats.submittedKYC} icon={FileText} colorClass="text-orange-500" filterType="SUBMITTED" />
          <StatCard title="Verified" value={stats.approvedKYC} icon={CheckCircle} colorClass="text-green-500" filterType="APPROVED" />
          <StatCard title="Total Invited" value={stats.totalInvited} icon={Users} colorClass="text-purple-500" filterType="ALL" />
          <div className="bg-white border border-amber-200 shadow-sm p-6 rounded-2xl flex items-center justify-between relative overflow-hidden group cursor-default">
            <div>
              <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Pending Donations</h3>
              <p className="text-3xl font-bold font-serif text-amber-600">{stats.pendingDonations ?? 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 text-amber-600"><Heart size={24} /></div>
          </div>
        </div>

        {/* Pending Donations */}
        {pendingDonations?.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold font-serif text-gs-navy mb-4">Pending Donations</h2>
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gs-teal uppercase">Donor</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gs-teal uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gs-teal uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gs-teal uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gs-teal uppercase">Payment Proof</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gs-teal uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDonations.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-gs-navy">{d.full_name}</p>
                            <p className="text-xs text-gray-500">{d.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{d.category_name}</td>
                        <td className="px-6 py-4 font-bold text-gs-teal">₹{parseFloat(d.amount).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(d.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          {d.payment_proof_path ? (
                            <button
                              type="button"
                              onClick={() => setProofViewDonation(d)}
                              className="inline-flex items-center gap-1 text-gs-teal font-bold hover:underline"
                            >
                              <Image size={16} /> View photo
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDonationReview(d.id, 'CONFIRMED')}
                              disabled={donationsLoading}
                              className="text-[10px] px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded font-bold hover:bg-green-100"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleDonationReview(d.id, 'REJECTED')}
                              disabled={donationsLoading}
                              className="text-[10px] px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-bold hover:bg-red-100"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* KYC documents viewer modal */}
        {kycViewUser && (kycViewUser.kyc_docs?.front || kycViewUser.kyc_docs?.back) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setKycViewUser(null)}>
            <div
              className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gs-navy">KYC documents — {kycViewUser.full_name}</h3>
                  <p className="text-sm text-gray-500">{kycViewUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setKycViewUser(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                {kycViewUser.kyc_docs?.front && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ID Front</p>
                    <img
                      src={`${API_BASE_URL}/uploads/${kycViewUser.kyc_docs.front}`}
                      alt="ID Front"
                      className="w-full rounded-lg shadow-md bg-white object-contain max-h-[50vh]"
                    />
                    <a
                      href={`${API_BASE_URL}/uploads/${kycViewUser.kyc_docs.front}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-sm text-gs-teal font-bold hover:underline"
                    >
                      <ExternalLink size={14} /> Open in new tab
                    </a>
                  </div>
                )}
                {kycViewUser.kyc_docs?.back && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ID Back</p>
                    <img
                      src={`${API_BASE_URL}/uploads/${kycViewUser.kyc_docs.back}`}
                      alt="ID Back"
                      className="w-full rounded-lg shadow-md bg-white object-contain max-h-[50vh]"
                    />
                    <a
                      href={`${API_BASE_URL}/uploads/${kycViewUser.kyc_docs.back}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-sm text-gs-teal font-bold hover:underline"
                    >
                      <ExternalLink size={14} /> Open in new tab
                    </a>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setKycViewUser(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleKycReview(kycViewUser.id, 'REJECTED')}
                  className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg font-bold hover:bg-red-100"
                >
                  ✗ Reject KYC
                </button>
                <button
                  onClick={() => handleKycReview(kycViewUser.id, 'APPROVED')}
                  className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold hover:bg-green-100"
                >
                  ✓ Approve KYC
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment proof viewer modal */}
        {proofViewDonation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setProofViewDonation(null)}>
            <div
              className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gs-navy">Payment proof — {proofViewDonation.full_name}</h3>
                  <p className="text-sm text-gray-500">
                    {proofViewDonation.category_name} · ₹{parseFloat(proofViewDonation.amount).toLocaleString('en-IN')} · {new Date(proofViewDonation.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`${API_BASE_URL}/uploads/${proofViewDonation.payment_proof_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-bold text-gs-teal border border-gs-teal rounded-lg hover:bg-gs-teal/10"
                  >
                    <ExternalLink size={16} /> Open in new tab
                  </a>
                  <button
                    type="button"
                    onClick={() => setProofViewDonation(null)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-gray-100 min-h-[200px] flex items-center justify-center">
                {proofViewDonation.payment_proof_path && (
                  (() => {
                    const ext = (proofViewDonation.payment_proof_path || '').split('.').pop()?.toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                    const src = `${API_BASE_URL}/uploads/${proofViewDonation.payment_proof_path}`;
                    return isImage ? (
                      <img
                        src={src}
                        alt="Payment proof"
                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-md bg-white"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-gray-500 mb-2">Preview not available for this file type.</p>
                        <a href={src} target="_blank" rel="noopener noreferrer" className="text-gs-teal font-bold hover:underline">
                          Open in new tab
                        </a>
                      </div>
                    );
                  })()
                )}
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setProofViewDonation(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDonationReview(proofViewDonation.id, 'REJECTED')}
                  disabled={donationsLoading}
                  className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg font-bold hover:bg-red-100"
                >
                  ✗ Reject
                </button>
                <button
                  onClick={() => handleDonationReview(proofViewDonation.id, 'CONFIRMED')}
                  disabled={donationsLoading}
                  className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold hover:bg-green-100"
                >
                  ✓ Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold font-serif text-gs-navy">Devotee Directory</h2>
            {kycFilter !== 'ALL' && (
              <span className="px-3 py-1 bg-gs-teal/10 text-gs-teal border border-gs-teal/20 text-xs font-bold rounded-full uppercase">
                Showing filter: {kycFilter}
              </span>
            )}
          </div>
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search name, email, code..."
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gs-navy focus:border-gs-teal focus:ring-1 focus:ring-gs-teal focus:outline-none w-full md:w-80 transition-shadow shadow-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gs-teal uppercase tracking-widest bg-gray-50/50">Devotee</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gs-teal uppercase tracking-widest bg-gray-50/50">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gs-teal uppercase tracking-widest bg-gray-50/50">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gs-teal uppercase tracking-widest bg-gray-50/50">KYC</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gs-teal uppercase tracking-widest bg-gray-50/50">Invited By</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gs-teal uppercase tracking-widest bg-gray-50/50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">🐘 Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No devotees found.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gs-teal/10 border border-gs-teal/20 flex items-center justify-center text-gs-teal font-bold shadow-sm">
                            {u.full_name?.charAt(0).toUpperCase() || 'D'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gs-navy font-serif">{u.full_name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 font-medium"><Mail size={10} /> {u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border ${
                          u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        <div className="flex items-center gap-2"><Calendar size={14} />{new Date(u.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`flex items-center w-fit gap-1 px-2.5 py-1 text-[10px] uppercase tracking-wide font-bold rounded-full border ${
                          u.kyc_status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                          u.kyc_status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {u.kyc_status === 'APPROVED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                          {u.kyc_status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium tracking-wide">
                        {u.invited_by_name || <span className="opacity-40">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'ADMIN')}
                              className="text-[10px] px-2 py-1 bg-purple-50 text-purple-600 border border-purple-200 rounded font-bold hover:bg-purple-100 transition"
                            >
                              → Admin
                            </button>
                          )}
                          {u.role === 'ADMIN' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'USER')}
                              className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded font-bold hover:bg-gray-200 transition"
                            >
                              → User
                            </button>
                          )}
                          {u.kyc_status === 'SUBMITTED' && (
                            <>
                              {(u.kyc_docs?.front || u.kyc_docs?.back) && (
                                <button
                                  type="button"
                                  onClick={() => setKycViewUser(u)}
                                  className="text-[10px] px-2 py-1 bg-gs-teal/10 text-gs-teal border border-gs-teal/20 rounded font-bold hover:bg-gs-teal/20 transition"
                                >
                                  <Image size={10} className="inline mr-0.5" /> View docs
                                </button>
                              )}
                              <button
                                onClick={() => handleKycReview(u.id, 'APPROVED')}
                                className="text-[10px] px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded font-bold hover:bg-green-100 transition"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleKycReview(u.id, 'REJECTED')}
                                className="text-[10px] px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-bold hover:bg-red-100 transition"
                              >
                                ✗ Reject
                              </button>
                            </>
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
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs font-bold text-gs-teal disabled:opacity-30 hover:underline">← Previous</button>
            <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-xs font-bold text-gs-teal disabled:opacity-30 hover:underline">Next →</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;