import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Mail,
  CheckCircle,
  Clock,
  FileText,
  Image as ImageIcon,
  X,
  ExternalLink,
} from 'lucide-react';
import api from '../../api/axios';
import { API_ROUTES } from '../../config/api';
import { commonStyles, adminStyles } from '../../styles/index.styles';
import { S3Image, S3Anchor } from '../../utils/s3Utils.jsx';
import ActionConfirmModal from './ActionConfirmModal';
import LoadingScreen from '../../components/LoadingScreen';

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'REJECTED'];

const AdminSeva = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') || 'ALL').toUpperCase();
  const initialSearch = searchParams.get('q') || '';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(
    STATUS_FILTERS.includes(initialStatus) ? initialStatus : 'ALL'
  );
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  const [actionModal, setActionModal] = useState({
    isOpen: false,
    targetId: null,
    targetStatus: '',
  });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [proofViewDonation, setProofViewDonation] = useState(null);

  // URL → state: react to navigation from stats tiles or external links.
  useEffect(() => {
    const urlStatus = (searchParams.get('status') || 'ALL').toUpperCase();
    const urlSearch = searchParams.get('q') || '';
    const urlPage = parseInt(searchParams.get('page') || '1', 10);
    if (STATUS_FILTERS.includes(urlStatus) && urlStatus !== statusFilter) setStatusFilter(urlStatus);
    if (urlSearch !== search) setSearch(urlSearch);
    if (urlPage !== page) setPage(urlPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // State → URL: keep URL in sync on user interactions.
  useEffect(() => {
    const next = new URLSearchParams();
    if (statusFilter && statusFilter !== 'ALL') next.set('status', statusFilter);
    if (search) next.set('q', search);
    if (page > 1) next.set('page', String(page));
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, page]);

  const fetchDonations = useCallback(async () => {
    try {
      setLoading(true);
      let qs = `?page=${page}&limit=15`;
      if (search) qs += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'ALL') qs += `&status=${statusFilter}`;
      const res = await api
        .get(`${API_ROUTES.DONATIONS.ADMIN_PENDING}${qs}`)
        .catch(() => ({ data: { data: [], pagination: { totalPages: 1 } } }));
      if (res.data && res.data.data) {
        setDonations(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      } else {
        setDonations([]);
      }
    } catch (err) {
      console.error('Failed to fetch donations', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  const openActionModal = (id, status) => {
    setActionModal({ isOpen: true, targetId: id, targetStatus: status });
    setActionReason('');
  };
  const closeActionModal = () =>
    setActionModal({ isOpen: false, targetId: null, targetStatus: '' });

  const executeAction = async () => {
    setActionLoading(true);
    try {
      await api.post(API_ROUTES.DONATIONS.ADMIN_REVIEW(actionModal.targetId), {
        status: actionModal.targetStatus,
        rejectionReason: actionReason,
      });
      setProofViewDonation(null);
      await fetchDonations();
      window.dispatchEvent(new CustomEvent('admin:refresh-stats'));
      closeActionModal();
    } catch {
      alert('Failed to process action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="animate-fade-in">
      {/* Section header */}
      <div className="mb-6 md:mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
          <h2 className="text-lg md:text-xl font-serif font-black text-[#FBDB8C] tracking-[0.2em] uppercase">
            Seva Offerings
          </h2>
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search by name, email, category..."
              className="w-full bg-white/5 border border-[#FBDB8C]/10 text-white rounded-2xl py-3 pl-10 pr-4 focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20 text-xs font-medium"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <Search className="w-4 h-4 text-[#FBDB8C]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border transition-all ${
                statusFilter === s
                  ? 'bg-[#FBDB8C]/20 text-[#FBDB8C] border-[#FBDB8C]/40'
                  : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
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
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 md:px-8">
                    <LoadingScreen variant="inline" size="sm" message="Loading Seva Offerings..." />
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-16 text-center text-white/30 font-medium tracking-widest uppercase text-[10px]">
                    No seva offerings found.
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className={commonStyles.tableRow}>
                    <td className={commonStyles.tableCell}>
                      <div>
                        <p className="font-black text-white tracking-widest uppercase mb-1 max-w-[220px] truncate" title={d.full_name}>
                          {d.full_name}
                        </p>
                        <p className="text-[10px] text-white/30 font-bold flex items-center gap-1.5">
                          <Mail size={12} className="text-[#FBDB8C]" /> {d.email}
                        </p>
                      </div>
                    </td>
                    <td className={commonStyles.tableCell}>
                      <span className="text-[10px] font-black text-[#FBDB8C]/60 uppercase tracking-widest">
                        {d.category_name}
                      </span>
                    </td>
                    <td className={commonStyles.tableCell}>
                      <div className="text-base md:text-lg font-sans font-semibold text-[#FBDB8C] tabular-nums tracking-tight">
                        <span className="text-[#FBDB8C]/60 mr-0.5">₹</span>
                        {parseFloat(d.amount).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className={commonStyles.tableCell}>
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        {new Date(d.created_at).toLocaleDateString()}
                      </div>
                    </td>
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
                        {d.status === 'CONFIRMED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                        {d.status || 'PENDING'}
                      </span>
                    </td>
                    <td className={commonStyles.tableCell}>
                      {d.payment_proof_path ? (
                        <button
                          type="button"
                          onClick={() => setProofViewDonation(d)}
                          className="inline-flex items-center gap-2 text-[#FBDB8C] font-black text-[9px] uppercase tracking-widest hover:text-white transition-colors"
                        >
                          <ImageIcon size={14} /> View Photo
                        </button>
                      ) : (
                        <span className="text-white/20 text-[10px] font-bold">—</span>
                      )}
                    </td>
                    <td className={commonStyles.tableCell}>
                      {d.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openActionModal(d.id, 'CONFIRMED')}
                            disabled={actionLoading}
                            className={adminStyles.actionBtnApprove}
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(d.id, 'REJECTED')}
                            disabled={actionLoading}
                            className={adminStyles.actionBtnReject}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/30 font-black uppercase tracking-widest italic opacity-40">
                          Resolved
                        </span>
                      )}
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

      {/* Payment Proof Modal */}
      {proofViewDonation && (
        <div className={commonStyles.modalOverlay} onClick={() => setProofViewDonation(null)}>
          <div className={commonStyles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/40 to-transparent" />
            <div className={commonStyles.modalHeader}>
              <div>
                <h3 className="text-xl font-serif font-black text-[#FBDB8C] tracking-widest uppercase mb-1">
                  Seva Offering Proof
                </h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
                  {proofViewDonation.full_name} · {proofViewDonation.category_name} · ₹
                  {parseFloat(proofViewDonation.amount).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <S3Anchor
                  src={proofViewDonation.payment_proof_path}
                  className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-black text-[#FBDB8C] border border-[#FBDB8C]/20 rounded-xl hover:bg-white/5 transition-all uppercase tracking-widest"
                >
                  <ExternalLink size={16} /> Original
                </S3Anchor>
                <button
                  type="button"
                  onClick={() => setProofViewDonation(null)}
                  className="p-3 rounded-2xl hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-10 bg-black/20 min-h-[300px] flex items-center justify-center">
              {proofViewDonation.payment_proof_path &&
                (() => {
                  const path = proofViewDonation.payment_proof_path || '';
                  const ext = path.split('.').pop()?.split('?')[0]?.toLowerCase();
                  const isImage =
                    ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ||
                    path.includes('amazonaws.com') ||
                    path.includes('cloudinary.com') ||
                    path.startsWith('s3://');

                  return isImage ? (
                    <div className="p-3 bg-white/5 rounded-3xl border border-white/5 shadow-2xl">
                      <S3Image
                        src={path}
                        alt="Payment proof"
                        className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-inner"
                      />
                    </div>
                  ) : (
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10 mb-6">
                        <FileText size={40} className="text-[#FBDB8C]/40" />
                      </div>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
                        Preview unavailable
                      </p>
                      <S3Anchor
                        src={path}
                        className="inline-block text-[#FBDB8C] font-black text-xs uppercase tracking-widest underline"
                      >
                        Download File
                      </S3Anchor>
                    </div>
                  );
                })()}
            </div>
            <div className={commonStyles.modalFooter}>
              <button
                type="button"
                onClick={() => setProofViewDonation(null)}
                className={commonStyles.buttonSecondary}
              >
                Return
              </button>
              <button
                type="button"
                onClick={() => openActionModal(proofViewDonation.id, 'REJECTED')}
                disabled={actionLoading}
                className={adminStyles.actionBtnReject + ' px-8 py-3.5'}
              >
                ✗ Reject Seva
              </button>
              <button
                type="button"
                onClick={() => openActionModal(proofViewDonation.id, 'CONFIRMED')}
                disabled={actionLoading}
                className={adminStyles.actionBtnApprove + ' px-8 py-3.5'}
              >
                ✓ Accept Seva
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

export default AdminSeva;
