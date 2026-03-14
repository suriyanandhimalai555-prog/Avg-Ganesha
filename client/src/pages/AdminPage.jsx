import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, LogOut, Search, Calendar, Mail, CheckCircle, Clock, FileText, UserCog } from 'lucide-react';

const AdminPage = () => {
  const [stats, setStats] = useState({ totalUsers: 0, submittedKYC: 0, approvedKYC: 0, totalInvited: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

      const [statsRes, usersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get(`/api/admin/users${queryStr}`),
      ]);

      setStats(statsRes.data);
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
    if (!window.confirm(`Mark this user's KYC as ${status}?`)) return;
    try {
      await api.post('/api/admin/kyc-review', { userId, status });
      fetchData();
    } catch (err) {
      alert('Failed to update KYC');
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <StatCard title="All Devotees" value={stats.totalUsers} icon={Users} colorClass="text-blue-500" filterType="ALL" />
          <StatCard title="Needs Review" value={stats.submittedKYC} icon={FileText} colorClass="text-orange-500" filterType="SUBMITTED" />
          <StatCard title="Verified" value={stats.approvedKYC} icon={CheckCircle} colorClass="text-green-500" filterType="APPROVED" />
          <StatCard title="Total Invited" value={stats.totalInvited} icon={Users} colorClass="text-purple-500" filterType="ALL" />
        </div>

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