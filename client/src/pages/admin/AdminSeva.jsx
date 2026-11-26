import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  CalendarDays,
  Mail,
  CheckCircle,
  Clock,
  FileText,
  Image as ImageIcon,
  X,
  ExternalLink,
  Download,
} from 'lucide-react';
import api from '../../api/axios';
import { API_ROUTES } from '../../config/api';
import { commonStyles, adminStyles } from '../../styles/index.styles';
import { S3Image, S3Anchor } from '../../utils/s3Utils.jsx';
import ActionConfirmModal from './ActionConfirmModal';
import SevaDateChangeModal from './SevaDateChangeModal';
import { statueCoinRate, formatIstDate } from '../../config/coins';
import LoadingScreen from '../../components/LoadingScreen';
import { toCsv, downloadFile } from '../../utils/csv';
import {
  AdminPageHeader,
  AdminSearchInput,
  AdminFilterChips,
  AdminCard,
  AdminPagination,
} from './AdminChrome';

const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'REJECTED'];

const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '');

// Every column the seva export endpoint returns.
const EXPORT_COLUMNS = [
  { header: 'Seva ID', key: 'id' },
  { header: 'Seva Date (IST)', key: (r) => fmtDate(r.created_at) },
  { header: 'Devotee ID', key: 'user_id' },
  { header: 'Devotee Name', key: 'full_name' },
  { header: 'Email', key: 'email' },
  { header: 'Phone', key: 'phone_number' },
  { header: 'Seva Category', key: 'category_name' },
  { header: 'Amount', key: 'amount' },
  { header: 'Status', key: 'status' },
  { header: 'Rejection Reason', key: 'rejection_reason' },
  { header: 'Statue Number', key: 'statue_number' },
  { header: 'AVG Coins', key: 'coins' },
  { header: 'Coins Locked Until', key: (r) => fmtDate(r.coins_locked_until) },
  { header: 'Recorded By', key: 'recorded_by_name' },
  { header: 'Reviewed By', key: 'reviewed_by_name' },
  { header: 'Last Updated (IST)', key: (r) => fmtDate(r.updated_at) },
  { header: 'Payment Proof (link, 7 days)', key: 'payment_proof_url' },
];

const AdminSeva = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const isAdmin = currentUser?.role === 'ADMIN'; // date changes re-price coins → ADMIN only
  const [dateChangeDonation, setDateChangeDonation] = useState(null);
  const [notice, setNotice] = useState('');
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
  const [exporting, setExporting] = useState(false);

  const [actionModal, setActionModal] = useState({
    isOpen: false,
    targetId: null,
    targetStatus: '',
    targetSlug: '',
    targetCreatedAt: null,
  });
  const [actionReason, setActionReason] = useState('');
  const [actionCoins, setActionCoins] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Auto coin pre-fill for a 1.5 Ft statue confirm, from its seva date (IST).
  const statueAutoCoinRate = (createdAt) => statueCoinRate(createdAt);

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

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (statusFilter !== 'ALL') qs.set('status', statusFilter);
      const res = await api.get(`${API_ROUTES.DONATIONS.ADMIN_EXPORT}${qs.toString() ? `?${qs}` : ''}`);
      const csv = toCsv(res.data.data, EXPORT_COLUMNS);
      const date = new Date().toISOString().slice(0, 10);
      const suffix = statusFilter !== 'ALL' ? `-${statusFilter.toLowerCase()}` : '';
      downloadFile(csv, `seva-offerings${suffix}-${date}.csv`);
    } catch (err) {
      console.error('Seva export failed', err);
      alert(err.response?.data?.error || 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const openActionModal = (id, status, donation = {}) => {
    const slug = donation.category_slug || '';
    const createdAt = donation.created_at || null;
    setActionModal({ isOpen: true, targetId: id, targetStatus: status, targetSlug: slug, targetCreatedAt: createdAt });
    setActionReason('');
    // Pre-fill coin amount for a confirmed statue seva; clear for anything else.
    if (status === 'CONFIRMED' && slug === 'statue_1_5_ft') {
      setActionCoins(String(statueAutoCoinRate(createdAt)));
    } else {
      setActionCoins('');
    }
  };
  const closeActionModal = () => {
    setActionModal({ isOpen: false, targetId: null, targetStatus: '', targetSlug: '', targetCreatedAt: null });
    setActionCoins('');
  };

  const executeAction = async () => {
    setActionLoading(true);
    try {
      const isStatueConfirm =
        actionModal.targetStatus === 'CONFIRMED' && actionModal.targetSlug === 'statue_1_5_ft';
      await api.post(API_ROUTES.DONATIONS.ADMIN_REVIEW(actionModal.targetId), {
        status: actionModal.targetStatus,
        rejectionReason: actionReason,
        ...(isStatueConfirm && { coins: actionCoins === '' ? 0 : parseInt(actionCoins, 10) }),
      });
      setProofViewDonation(null);
      await fetchDonations();
      window.dispatchEvent(new CustomEvent('admin:refresh-stats'));
      closeActionModal();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="animate-fade-in">
      {/* Section header */}
      <AdminPageHeader
        title="Seva Offerings"
        subtitle="Review and confirm devotee seva contributions."
        actions={
          <>
            <AdminSearchInput
              className="w-full md:w-72"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, email, category..."
            />
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || loading || donations.length === 0}
              title={`Export ${statusFilter === 'ALL' ? 'all' : statusFilter} seva offerings${search ? ' matching search' : ''} (all pages)`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FBDB8C]/10 border border-[#FBDB8C]/20 text-[#FBDB8C] text-[10px] font-black uppercase tracking-widest hover:bg-[#FBDB8C]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </>
        }
        toolbar={
          <AdminFilterChips
            options={STATUS_FILTERS}
            value={statusFilter}
            onChange={(s) => { setStatusFilter(s); setPage(1); }}
          />
        }
      />

      {notice && (
        <div className="mb-4 flex items-start justify-between gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3 text-sm text-emerald-300">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="text-white/40 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Table */}
      <AdminCard>
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
                      <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest whitespace-nowrap">
                        {formatIstDate(d.created_at)}
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setDateChangeDonation(d)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-[#FBDB8C]/50 hover:text-[#FBDB8C] transition-colors"
                          title="Change seva date (re-prices statue coins)"
                        >
                          <CalendarDays size={10} /> Change
                        </button>
                      )}
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
                      {(d.recorded_by_name || d.reviewed_by_name) && (
                        <div className="mt-1.5 space-y-0.5 text-[9px] text-white/25 font-bold tracking-wide">
                          {d.recorded_by_name && <div>entered by {d.recorded_by_name}</div>}
                          {d.reviewed_by_name && <div>reviewed by {d.reviewed_by_name}</div>}
                        </div>
                      )}
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
                            onClick={() => openActionModal(d.id, 'CONFIRMED', d)}
                            disabled={actionLoading}
                            className={adminStyles.actionBtnApprove}
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal(d.id, 'REJECTED', d)}
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
        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPrev={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </AdminCard>

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
              {proofViewDonation.status === 'PENDING' && (
              <>
              <button
                type="button"
                onClick={() => openActionModal(proofViewDonation.id, 'REJECTED', proofViewDonation)}
                disabled={actionLoading}
                className={adminStyles.actionBtnReject + ' px-8 py-3.5'}
              >
                ✗ Reject Seva
              </button>
              <button
                type="button"
                onClick={() => openActionModal(proofViewDonation.id, 'CONFIRMED', proofViewDonation)}
                disabled={actionLoading}
                className={adminStyles.actionBtnApprove + ' px-8 py-3.5'}
              >
                ✓ Accept Seva
              </button>
              </>
              )}
            </div>
          </div>
        </div>
      )}

      {dateChangeDonation && (
        <SevaDateChangeModal
          donation={dateChangeDonation}
          onClose={() => setDateChangeDonation(null)}
          onChanged={async (message) => {
            setDateChangeDonation(null);
            setNotice(message);
            await fetchDonations();
            window.dispatchEvent(new CustomEvent('admin:refresh-stats'));
          }}
        />
      )}

      <ActionConfirmModal
        isOpen={actionModal.isOpen}
        targetStatus={actionModal.targetStatus}
        reason={actionReason}
        onReasonChange={setActionReason}
        loading={actionLoading}
        onCancel={closeActionModal}
        onConfirm={executeAction}
        showCoins={actionModal.targetStatus === 'CONFIRMED' && actionModal.targetSlug === 'statue_1_5_ft'}
        coinValue={actionCoins}
        onCoinChange={setActionCoins}
        coinHint={`Pre-filled with the ${statueAutoCoinRate(actionModal.targetCreatedAt)}-coin rate for this seva's date. Edit to override, or 0 for no coins (still counts as their one-time statue reward). Awarded only on the devotee's first statue, locked 5 yrs.`}
      />
    </section>
  );
};

export default AdminSeva;
