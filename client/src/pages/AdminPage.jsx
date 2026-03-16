import React, { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [proofViewDonation, setProofViewDonation] = useState(null);
  const [kycViewUser, setKycViewUser] = useState(null);
  const [bankDetails, setBankDetails] = useState({
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_branch: '',
    bank_customer_id: '',
  });
  const [savingBank, setSavingBank] = useState(false);

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

      const [statsRes, usersRes, pendingRes, bankRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get(`/api/admin/users${queryStr}`),
        api.get(API_ROUTES.DONATIONS.ADMIN_PENDING).catch(() => ({ data: [] })),
        api.get(API_ROUTES.SETTINGS).catch(() => ({ data: {} })),
      ]);

      setStats(statsRes.data);
      setPendingDonations(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setUsers(usersRes.data.data);
      setTotalPages(usersRes.data.pagination.totalPages);
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

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveBankDetails = async () => {
    setSavingBank(true);
    try {
      await api.put(API_ROUTES.SETTINGS, bankDetails);
      alert('Account details updated.');
    } catch (err) {
      console.error('Failed to save bank details', err);
      alert('Failed to save account details.');
    } finally {
      setSavingBank(false);
    }
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
      <div className={`${adminStyles.statCardIconWrapper} ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className={commonStyles.pageContainer}>
      {/* Navbar */}
      <nav className={adminStyles.navbar}>
        <div className={adminStyles.navbarInner}>
          <div className={adminStyles.navbarContent}>
            <div className="flex items-center gap-4">
              <div className={adminStyles.navbarLogoWrapper}>
                <Shield size={20} />
              </div>
              <div>
                <p className={commonStyles.preTitle}>॥ श्री गणेशाय नमः ॥</p>
                <h1 className={adminStyles.navbarTitle}>
                  🐘 GANESHA SEVA <span className="text-gs-teal font-sans font-medium">| ADMIN</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleLogout} className={adminStyles.logoutBtn}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className={commonStyles.mainContent}>

        {/* Account details editor */}
        <div className={adminStyles.sectionBox}>
          <h2 className={commonStyles.sectionTitle}>Donation Account Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Name</label>
              <input
                type="text"
                name="bank_account_name"
                value={bankDetails.bank_account_name}
                onChange={handleBankChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
              <input
                type="text"
                name="bank_account_number"
                value={bankDetails.bank_account_number}
                onChange={handleBankChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer ID</label>
              <input
                type="text"
                name="bank_customer_id"
                value={bankDetails.bank_customer_id}
                onChange={handleBankChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IFSC Code</label>
              <input
                type="text"
                name="bank_ifsc"
                value={bankDetails.bank_ifsc}
                onChange={handleBankChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveBankDetails}
            disabled={savingBank}
            className={commonStyles.buttonPrimary + " mt-4 px-4 py-2"}
          >
            {savingBank ? 'Saving...' : 'Save Account Details'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-10">
          <StatCard title="All Devotees" value={stats.totalUsers} icon={Users} colorClass="text-blue-500" filterType="ALL" />
          <StatCard title="KYC Needs Review" value={stats.submittedKYC} icon={FileText} colorClass="text-orange-500" filterType="SUBMITTED" />
          <StatCard title="Verified" value={stats.approvedKYC} icon={CheckCircle} colorClass="text-green-500" filterType="APPROVED" />
          <StatCard title="Total Invited" value={stats.totalInvited} icon={Users} colorClass="text-purple-500" filterType="ALL" />
          <div className={adminStyles.donationStatBox}>
            <div>
              <h3 className={adminStyles.statCardLabel}>Pending Donations</h3>
              <p className={adminStyles.statCardValueAmber}>{stats.pendingDonations ?? 0}</p>
            </div>
            <div className={adminStyles.donationStatIcon}><Heart size={24} /></div>
          </div>
        </div>

        {/* Donations (pending + history) */}
        {pendingDonations?.length > 0 && (
          <div className="mb-10">
            <h2 className={commonStyles.sectionTitle}>Donations</h2>
            <div className={commonStyles.tableContainer}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className={commonStyles.tableHead}>
                    <tr>
                      <th className={commonStyles.tableHeaderCell}>Donor</th>
                      <th className={commonStyles.tableHeaderCell}>Category</th>
                      <th className={commonStyles.tableHeaderCell}>Amount</th>
                      <th className={commonStyles.tableHeaderCell}>Date</th>
                      <th className={commonStyles.tableHeaderCell}>Status</th>
                      <th className={commonStyles.tableHeaderCell}>Payment Proof</th>
                      <th className={commonStyles.tableHeaderCell}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDonations.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className={commonStyles.tableCell}>
                          <span
                            className={`${adminStyles.statusBadgeBase} ${
                              d.status === 'CONFIRMED'
                                ? adminStyles.statusConfirmed
                                : d.status === 'REJECTED'
                                ? adminStyles.statusRejected
                                : adminStyles.statusPending
                            }`}
                          >
                            {d.status || 'PENDING'}
                          </span>
                        </td>
                        <td className={commonStyles.tableCell}>
                          <div>
                            <p className="font-bold text-gs-navy">{d.full_name}</p>
                            <p className="text-xs text-gray-500">{d.email}</p>
                          </div>
                        </td>
                        <td className={commonStyles.tableCell}>{d.category_name}</td>
                        <td className={`${commonStyles.tableCell} font-bold text-gs-teal`}>₹{parseFloat(d.amount).toLocaleString('en-IN')}</td>
                        <td className={`${commonStyles.tableCell} text-gray-500`}>{new Date(d.created_at).toLocaleDateString()}</td>
                        <td className={commonStyles.tableCell}>
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
                        <td className={commonStyles.tableCell}>
                          {d.status === 'PENDING' ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDonationReview(d.id, 'CONFIRMED')}
                                disabled={donationsLoading}
                                className={adminStyles.actionBtnApprove}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleDonationReview(d.id, 'REJECTED')}
                                disabled={donationsLoading}
                                className={adminStyles.actionBtnReject}
                              >
                                ✗ Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Reviewed</span>
                          )}
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
          <div className={commonStyles.modalOverlay} onClick={() => setKycViewUser(null)}>
            <div
              className={commonStyles.modalContent + " max-w-4xl"}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={commonStyles.modalHeader}>
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
              <div className={commonStyles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setKycViewUser(null)}
                  className={commonStyles.buttonSecondary + " px-4 py-2"}
                >
                  Close
                </button>
                <button
                  onClick={() => handleKycReview(kycViewUser.id, 'REJECTED')}
                  className={adminStyles.actionBtnReject + " px-4 py-2 text-sm rounded-lg"}
                >
                  ✗ Reject KYC
                </button>
                <button
                  onClick={() => handleKycReview(kycViewUser.id, 'APPROVED')}
                  className={adminStyles.actionBtnApprove + " px-4 py-2 text-sm rounded-lg"}
                >
                  ✓ Approve KYC
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment proof viewer modal */}
        {proofViewDonation && (
          <div className={commonStyles.modalOverlay} onClick={() => setProofViewDonation(null)}>
            <div
              className={commonStyles.modalContent + " max-w-4xl"}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={commonStyles.modalHeader}>
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
              <div className={commonStyles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setProofViewDonation(null)}
                  className={commonStyles.buttonSecondary + " px-4 py-2"}
                >
                  Close
                </button>
                <button
                  onClick={() => handleDonationReview(proofViewDonation.id, 'REJECTED')}
                  disabled={donationsLoading}
                  className={adminStyles.actionBtnReject + " px-4 py-2 text-sm rounded-lg"}
                >
                  ✗ Reject
                </button>
                <button
                  onClick={() => handleDonationReview(proofViewDonation.id, 'CONFIRMED')}
                  disabled={donationsLoading}
                  className={adminStyles.actionBtnApprove + " px-4 py-2 text-sm rounded-lg"}
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
            <h2 className={commonStyles.sectionTitle + " mb-0"}>Devotee Directory</h2>
            {kycFilter !== 'ALL' && (
              <span className={commonStyles.badgeText}>
                Showing filter: {kycFilter}
              </span>
            )}
          </div>
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Search name, email, code..."
              className={commonStyles.input + " pl-10 pr-4 py-2.5 rounded-xl w-full md:w-80 shadow-sm"}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Table */}
        <div className={commonStyles.tableContainer}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className={commonStyles.tableHead}>
                <tr>
                  <th className={commonStyles.tableHeaderCell}>Devotee</th>
                  <th className={commonStyles.tableHeaderCell}>Role</th>
                  <th className={commonStyles.tableHeaderCell}>Joined</th>
                  <th className={commonStyles.tableHeaderCell}>KYC</th>
                  <th className={commonStyles.tableHeaderCell}>Invited By</th>
                  <th className={commonStyles.tableHeaderCell}>Actions</th>
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
                      <td className={commonStyles.tableCell}>
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
                      <td className={commonStyles.tableCell}>
                        <span className={`${adminStyles.roleBase} ${
                          u.role === 'ADMIN' ? adminStyles.roleAdmin : adminStyles.roleUser
                        }`}>{u.role}</span>
                      </td>
                      <td className={`${commonStyles.tableCell} text-gray-500`}>
                        <div className="flex items-center gap-2"><Calendar size={14} />{new Date(u.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className={commonStyles.tableCell}>
                        <span className={`${adminStyles.statusBadgeBase} ${
                          u.kyc_status === 'APPROVED' ? adminStyles.statusConfirmed :
                          u.kyc_status === 'SUBMITTED' ? adminStyles.statusPending :
                          adminStyles.statusRejected
                        }`}>
                          {u.kyc_status === 'APPROVED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                          {u.kyc_status || 'PENDING'}
                        </span>
                      </td>
                      <td className={`${commonStyles.tableCell} text-gray-500`}>
                        {u.invited_by_name || <span className="opacity-40">—</span>}
                      </td>
                      <td className={commonStyles.tableCell}>
                        <div className="flex items-center gap-2">
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'ADMIN')}
                              className={`${adminStyles.roleBase} ${adminStyles.roleAdmin} cursor-pointer hover:opacity-80`}
                            >
                              → Admin
                            </button>
                          )}
                          {u.role === 'ADMIN' && (
                            <button
                              onClick={() => handleRoleChange(u.id, 'USER')}
                              className={`${adminStyles.roleBase} ${adminStyles.roleUser} cursor-pointer hover:opacity-80`}
                            >
                              → User
                            </button>
                          )}
                          {(u.kyc_docs?.front || u.kyc_docs?.back) && (
                            <button
                              type="button"
                              onClick={() => setKycViewUser(u)}
                              className={commonStyles.buttonSmall}
                            >
                              <Image size={10} className="inline mr-0.5" /> View docs
                            </button>
                          )}
                          {u.kyc_status === 'SUBMITTED' && (
                            <>
                              <button
                                onClick={() => handleKycReview(u.id, 'APPROVED')}
                                className={adminStyles.actionBtnApprove}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => handleKycReview(u.id, 'REJECTED')}
                                className={adminStyles.actionBtnReject}
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
          <div className={commonStyles.tableFooter}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={commonStyles.paginationBtn}>← Previous</button>
            <span className={commonStyles.paginationText}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={commonStyles.paginationBtn}>Next →</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;