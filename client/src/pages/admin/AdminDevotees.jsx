import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Calendar,
  Mail,
  CheckCircle,
  Clock,
  FileText,
  X,
  ExternalLink,
  Edit,
} from 'lucide-react';
import api from '../../api/axios';
import { commonStyles, adminStyles } from '../../styles/index.styles';
import { S3Image, S3Anchor } from '../../utils/s3Utils.jsx';
import ActionConfirmModal from './ActionConfirmModal';
import LoadingScreen from '../../components/LoadingScreen';

const KYC_FILTERS = ['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PENDING'];

const AdminDevotees = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = (searchParams.get('filter') || 'ALL').toUpperCase();
  const initialSearch = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [kycFilter, setKycFilter] = useState(
    KYC_FILTERS.includes(initialFilter) ? initialFilter : 'ALL'
  );
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  const [actionModal, setActionModal] = useState({
    isOpen: false,
    actionType: '',
    targetId: null,
    targetStatus: '',
  });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [kycViewUser, setKycViewUser] = useState(null);

  const [editUserModal, setEditUserModal] = useState({
    isOpen: false,
    user: null,
    email: '',
    phone_number: '',
  });
  const [editUserLoading, setEditUserLoading] = useState(false);

  // Two-way sync between URL params and local state.
  // URL → state: needed when another part of the app (e.g. a stats tile) navigates
  // here with new query params while this component is already mounted.
  useEffect(() => {
    const urlFilter = (searchParams.get('filter') || 'ALL').toUpperCase();
    const urlSearch = searchParams.get('q') || '';
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    if (KYC_FILTERS.includes(urlFilter) && urlFilter !== kycFilter) setKycFilter(urlFilter);
    if (urlSearch !== search) setSearch(urlSearch);
    if (urlPage !== page) setPage(urlPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // State → URL: keep URL in sync on user interactions (deep links + back button).
  useEffect(() => {
    const next = new URLSearchParams();
    if (kycFilter && kycFilter !== 'ALL') next.set('filter', kycFilter);
    if (search) next.set('q', search);
    if (page > 1) next.set('page', String(page));
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kycFilter, search, page]);

  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      let queryStr = `?page=${page}&limit=15`;
      if (search) queryStr += `&search=${encodeURIComponent(search)}`;
      if (kycFilter !== 'ALL') queryStr += `&kycStatus=${kycFilter}`;
      const res = await api.get(`/api/admin/users${queryStr}`);
      setUsers(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setUsersLoading(false);
    }
  }, [page, search, kycFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openActionModal = (type, id, status) => {
    setActionModal({ isOpen: true, actionType: type, targetId: id, targetStatus: status });
    setActionReason('');
  };
  const closeActionModal = () =>
    setActionModal({ isOpen: false, actionType: '', targetId: null, targetStatus: '' });

  const executeAction = async () => {
    setActionLoading(true);
    try {
      if (actionModal.actionType === 'KYC') {
        await api.post('/api/admin/kyc-review', {
          userId: actionModal.targetId,
          status: actionModal.targetStatus,
          rejectionReason: actionReason,
        });
        setKycViewUser(null);
      } else if (actionModal.actionType === 'ROLE') {
        await api.post('/api/admin/role', {
          userId: actionModal.targetId,
          role: actionModal.targetStatus,
        });
      }
      await fetchUsers();
      window.dispatchEvent(new CustomEvent('admin:refresh-stats'));
      closeActionModal();
    } catch {
      alert('Failed to process action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditUserModal = (user) =>
    setEditUserModal({
      isOpen: true,
      user,
      email: user.email || '',
      phone_number: user.phone_number || '',
    });
  const closeEditUserModal = () =>
    setEditUserModal({ isOpen: false, user: null, email: '', phone_number: '' });

  const handleUpdateUser = async () => {
    setEditUserLoading(true);
    try {
      await api.put(`/api/admin/users/${editUserModal.user.id}`, {
        email: editUserModal.email,
        phone_number: editUserModal.phone_number,
      });
      await fetchUsers();
      closeEditUserModal();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user details.');
    } finally {
      setEditUserLoading(false);
    }
  };

  return (
    <section className="animate-fade-in">
      {/* Section header */}
      <div className="mb-6 md:mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
          <h2 className="text-lg md:text-xl font-serif font-black text-[#FBDB8C] tracking-[0.2em] uppercase">
            Devotee Directory
          </h2>
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search by name, email or code..."
              className="w-full bg-white/5 border border-[#FBDB8C]/10 text-white rounded-2xl py-3 md:py-4 pl-10 md:pl-12 pr-4 md:pr-6 focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20 text-xs font-medium tracking-wide"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <Search className="w-4 h-4 text-[#FBDB8C]/40 absolute left-3 md:left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {KYC_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setKycFilter(f); setPage(1); }}
              className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border transition-all ${
                kycFilter === f
                  ? 'bg-[#FBDB8C]/20 text-[#FBDB8C] border-[#FBDB8C]/40'
                  : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0A194E]/30 border border-[#FBDB8C]/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/20 to-transparent" />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-black/20">
              <tr>
                <th className="px-4 md:px-8 py-4 md:py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Devotee Info</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Role</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Joined</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">KYC State</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Invited By</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usersLoading ? (
                <tr>
                  <td colSpan="6" className="px-4 md:px-8">
                    <LoadingScreen variant="inline" size="sm" message="Consulting Akashic Records..." />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-white/30 font-medium tracking-widest uppercase text-[10px]">
                    No devotees found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-all group">
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-2xl bg-[#FBDB8C]/5 border border-[#FBDB8C]/10 flex items-center justify-center text-[#FBDB8C] font-black shadow-inner group-hover:bg-[#FBDB8C]/20 transition-all">
                          {u.full_name?.charAt(0).toUpperCase() || 'D'}
                        </div>
                        <div className="ml-5">
                          <div className="text-sm font-black text-white tracking-widest uppercase mb-1 max-w-[260px] truncate" title={u.full_name}>
                            {u.full_name}
                          </div>
                          <div className="text-[10px] text-white/30 flex items-center gap-1.5 font-bold">
                            <Mail size={12} className="text-[#FBDB8C]" /> {u.email}
                          </div>
                          {u.phone_number && (
                            <div className="text-[10px] text-white/30 flex items-center gap-1.5 font-bold mt-1">
                              📞 {u.phone_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                      <span
                        className={`${adminStyles.roleBase} ${
                          u.role === 'ADMIN' ? adminStyles.roleAdmin : adminStyles.roleUser
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                      <div className="flex items-center gap-2.5 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                        <Calendar size={14} className="text-[#FBDB8C]/40" />
                        {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                      <span
                        className={`${adminStyles.statusBadgeBase} ${
                          u.kyc_status === 'APPROVED'
                            ? adminStyles.statusConfirmed
                            : u.kyc_status === 'SUBMITTED'
                            ? adminStyles.statusPending
                            : adminStyles.statusRejected
                        }`}
                      >
                        {u.kyc_status === 'APPROVED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                        {u.kyc_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap text-[10px] text-white/30 font-bold uppercase tracking-widest">
                      {u.invited_by_name || <span className="opacity-20">—</span>}
                    </td>
                    <td className="px-4 md:px-8 py-4 md:py-6 whitespace-nowrap">
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <div className="flex items-center gap-2 w-full">
                          {(u.kyc_docs?.front || u.kyc_docs?.back) && (
                            <button
                              type="button"
                              onClick={() => setKycViewUser(u)}
                              className="text-[9px] flex-1 justify-center px-3 py-2 bg-[#FBDB8C]/5 text-[#FBDB8C] border border-[#FBDB8C]/20 rounded-lg font-black uppercase tracking-widest hover:bg-[#FBDB8C]/10 transition-all flex items-center gap-1.5 align-middle"
                            >
                              <FileText size={10} /> Docs
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditUserModal(u)}
                            className="text-[9px] flex-1 justify-center px-3 py-2 bg-white/5 text-white/60 border border-white/10 rounded-lg font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5 align-middle"
                          >
                            <Edit size={10} /> Edit
                          </button>
                        </div>
                        {u.kyc_status !== 'APPROVED' && (
                          <div className="flex items-center gap-2 w-full">
                            <button
                              type="button"
                              onClick={() => openActionModal('KYC', u.id, 'APPROVED')}
                              className={`${adminStyles.actionBtnApprove} flex-1 justify-center flex items-center gap-1.5 !px-2`}
                            >
                              ✓ Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => openActionModal('KYC', u.id, 'REJECTED')}
                              className={`${adminStyles.actionBtnReject} flex-1 justify-center flex items-center gap-1.5 !px-2`}
                            >
                              ✗ Reject
                            </button>
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
        <div className="bg-black/20 px-3 sm:px-8 py-4 sm:py-6 flex items-center justify-between gap-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-[10px] font-black text-[#FBDB8C] disabled:opacity-20 uppercase tracking-[0.2em] hover:bg-white/5 px-2 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap"
          >
            <span className="sm:hidden">← Prev</span>
            <span className="hidden sm:inline">← Previous</span>
          </button>
          <div className="bg-white/5 px-3 sm:px-6 py-2 rounded-full border border-white/10 shadow-inner whitespace-nowrap">
            <span className="text-[10px] font-black text-[#FBDB8C]/60 uppercase tracking-widest tabular-nums">
              Page {page} / {totalPages}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-[10px] font-black text-[#FBDB8C] disabled:opacity-20 uppercase tracking-[0.2em] hover:bg-white/5 px-2 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap"
          >
            Next →
          </button>
        </div>
      </div>

      {/* KYC Document Modal */}
      {kycViewUser && (kycViewUser.kyc_docs?.front || kycViewUser.kyc_docs?.back) && (
        <div className={commonStyles.modalOverlay} onClick={() => setKycViewUser(null)}>
          <div className={commonStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/40 to-transparent" />
            <div className={commonStyles.modalHeader}>
              <div>
                <h3 className="text-xl font-serif font-black text-[#FBDB8C] tracking-widest uppercase mb-1">
                  KYC Artifacts
                </h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
                  {kycViewUser.full_name} — {kycViewUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKycViewUser(null)}
                className="p-3 rounded-2xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-10 bg-black/20 grid grid-cols-1 md:grid-cols-2 gap-10">
              {kycViewUser.kyc_docs?.front && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.3em] mb-2">
                    Primary ID Front
                  </p>
                  <div className="bg-white/5 p-2 rounded-2xl border border-white/5 shadow-2xl">
                    <S3Image
                      src={kycViewUser.kyc_docs.front}
                      alt="ID Front"
                      className="w-full rounded-xl object-contain max-h-[50vh] shadow-inner"
                    />
                  </div>
                  <S3Anchor
                    src={kycViewUser.kyc_docs.front}
                    className="inline-flex items-center gap-2 text-[10px] text-[#FBDB8C] font-black uppercase tracking-widest hover:text-white transition-all underline decoration-[#FBDB8C]/20"
                  >
                    <ExternalLink size={14} /> Inspect Full Document
                  </S3Anchor>
                </div>
              )}
              {kycViewUser.kyc_docs?.back && (
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.3em] mb-2">
                    Primary ID Back
                  </p>
                  <div className="bg-white/5 p-2 rounded-2xl border border-white/5 shadow-2xl">
                    <S3Image
                      src={kycViewUser.kyc_docs.back}
                      alt="ID Back"
                      className="w-full rounded-xl object-contain max-h-[50vh] shadow-inner"
                    />
                  </div>
                  <S3Anchor
                    src={kycViewUser.kyc_docs.back}
                    className="inline-flex items-center gap-2 text-[10px] text-[#FBDB8C] font-black uppercase tracking-widest hover:text-white transition-all underline decoration-[#FBDB8C]/20"
                  >
                    <ExternalLink size={14} /> Inspect Full Document
                  </S3Anchor>
                </div>
              )}
            </div>
            <div className={commonStyles.modalFooter}>
              <button
                type="button"
                onClick={() => setKycViewUser(null)}
                className={commonStyles.buttonSecondary}
              >
                Return
              </button>
              {kycViewUser.kyc_status !== 'APPROVED' && (
                <>
                  <button
                    type="button"
                    onClick={() => openActionModal('KYC', kycViewUser.id, 'REJECTED')}
                    className={adminStyles.actionBtnReject + ' px-8 py-3.5'}
                  >
                    ✗ Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => openActionModal('KYC', kycViewUser.id, 'APPROVED')}
                    className={adminStyles.actionBtnApprove + ' px-8 py-3.5'}
                  >
                    ✓ Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModal.isOpen && (
        <div className={commonStyles.modalOverlay} onClick={closeEditUserModal}>
          <div
            className="bg-[#060B28] border border-[#FBDB8C]/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_60px_rgba(0,0,0,0.8)] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-serif font-black text-[#FBDB8C] tracking-widest uppercase mb-4">
              Edit Devotee Info
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em] mb-2 block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editUserModal.email}
                  onChange={(e) => setEditUserModal({ ...editUserModal, email: e.target.value })}
                  className="w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em] mb-2 block">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editUserModal.phone_number}
                  onChange={(e) =>
                    setEditUserModal({ ...editUserModal, phone_number: e.target.value })
                  }
                  className="w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditUserModal}
                className={commonStyles.buttonSecondary + ' !px-6 !py-3'}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateUser}
                disabled={editUserLoading}
                className="px-6 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all active:scale-95 text-[9px]"
              >
                {editUserLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ActionConfirmModal
        isOpen={actionModal.isOpen}
        targetStatus={actionModal.targetStatus}
        reason={actionReason}
        onReasonChange={setActionReason}
        loading={actionLoading}
        onCancel={closeActionModal}
        onConfirm={executeAction}
      />
    </section>
  );
};

export default AdminDevotees;
