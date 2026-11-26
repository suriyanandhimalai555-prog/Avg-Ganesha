import { useCallback, useEffect, useState } from 'react';
import { Coins, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../api/axios';
import { commonStyles } from '../../styles/index.styles';
import { toCsv, downloadFile } from '../../utils/csv';
import {
  AdminPageHeader,
  AdminSearchInput,
  AdminCard,
  AdminPagination,
} from './AdminChrome';

/*
  Admin Coin Holdings
  ===================
  Read-only table: every devotee who holds AVG coins (total > 0).
  Columns: Name | Mobile Number | KYC Status | AVG Coins held
  Actions: search by name/phone, filter by KYC status, paginate, export full filtered list as CSV.
*/

const PAGE_SIZE = 20;

const KYC_FILTERS = [
  { label: 'All',           value: 'all' },
  { label: 'KYC Done',      value: 'APPROVED' },
  { label: 'KYC Not Done',  value: 'NOT_APPROVED' },
];

const KYC_BADGE = {
  APPROVED:  { label: 'Done',     icon: CheckCircle, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  SUBMITTED: { label: 'Submitted',icon: Clock,       color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  PENDING:   { label: 'Pending',  icon: Clock,       color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  REJECTED:  { label: 'Rejected', icon: XCircle,     color: 'text-red-400 bg-red-400/10 border-red-400/20' },
};

const KycBadge = ({ status }) => {
  const cfg = KYC_BADGE[status] || KYC_BADGE.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${cfg.color}`}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
};

const COIN_HOLDINGS_COLUMNS = [
  { header: 'Name',          key: 'full_name' },
  { header: 'Mobile Number', key: 'phone_number' },
  { header: 'KYC Status',    key: 'kyc_status' },
  { header: 'AVG Coins',     key: 'total_coins' },
];

const AdminCoinHoldings = () => {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch]       = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  // Reset to page 1 whenever search or filter changes
  useEffect(() => { setPage(1); }, [search, kycFilter]);

  const buildQs = (extra = {}) => {
    const p = { page, limit: PAGE_SIZE, ...extra };
    if (search) p.search = search;
    if (kycFilter !== 'all') p.kyc = kycFilter;
    return '?' + new URLSearchParams(p).toString();
  };

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const qs = buildQs();
      const res = await api.get(`/api/admin/coin-holders${qs}`);
      setRows(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotalItems(res.data.pagination.totalItems);
    } catch (err) {
      console.error('Failed to fetch coin holders', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, kycFilter]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleExport = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const qs = buildQs({ all: 'true', page: undefined, limit: undefined });
      const res = await api.get(`/api/admin/coin-holders${qs}`);
      const csv = toCsv(res.data.data, COIN_HOLDINGS_COLUMNS);
      const date = new Date().toISOString().slice(0, 10);
      downloadFile(csv, `coin-holdings-${date}.csv`);
    } catch (err) {
      console.error('CSV export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const headerActions = (
    <>
      <AdminSearchInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name or phone…"
        className="w-48 md:w-64"
      />
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting || loading || totalItems === 0}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FBDB8C]/10 border border-[#FBDB8C]/20
                   text-[#FBDB8C] text-[10px] font-black uppercase tracking-widest
                   hover:bg-[#FBDB8C]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
      >
        <Download className="w-3.5 h-3.5" />
        {exporting ? 'Exporting…' : 'Export CSV'}
      </button>
    </>
  );

  return (
    <div className={commonStyles.pageWrapper ?? 'w-full'}>
      <AdminPageHeader
        title="Coin Holdings"
        subtitle={
          loading
            ? 'Loading…'
            : `${totalItems} devotee${totalItems !== 1 ? 's' : ''} holding AVG coins`
        }
        actions={headerActions}
      />

      {/* KYC Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {KYC_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setKycFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all
              ${kycFilter === f.value
                ? 'bg-[#FBDB8C]/20 border-[#FBDB8C]/50 text-[#FBDB8C]'
                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <AdminCard>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 md:px-8 py-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                  #
                </th>
                <th className="px-4 md:px-8 py-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                  Name
                </th>
                <th className="px-4 md:px-8 py-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                  Mobile Number
                </th>
                <th className="px-4 md:px-8 py-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                  KYC Status
                </th>
                <th className="px-4 md:px-8 py-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em] text-right">
                  AVG Coins
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5 animate-pulse">
                    <td className="px-4 md:px-8 py-5">
                      <div className="h-3 w-6 bg-white/5 rounded" />
                    </td>
                    <td className="px-4 md:px-8 py-5">
                      <div className="h-3 w-32 bg-white/5 rounded" />
                    </td>
                    <td className="px-4 md:px-8 py-5">
                      <div className="h-3 w-28 bg-white/5 rounded" />
                    </td>
                    <td className="px-4 md:px-8 py-5">
                      <div className="h-3 w-20 bg-white/5 rounded" />
                    </td>
                    <td className="px-4 md:px-8 py-5 text-right">
                      <div className="h-3 w-14 bg-white/5 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                    <Coins className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-xs font-medium tracking-wide">
                      {search || kycFilter !== 'all'
                        ? 'No coin holders match your filters.'
                        : 'No devotees hold AVG coins yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      {/* # */}
                      <td className="px-4 md:px-8 py-5">
                        <span className="text-[10px] text-white/20 font-mono tabular-nums">
                          {rowNum}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-4 md:px-8 py-5">
                        <span className="text-[13px] font-semibold text-white/90 tracking-wide">
                          {row.full_name}
                        </span>
                      </td>

                      {/* Mobile */}
                      <td className="px-4 md:px-8 py-5">
                        <span className="text-[12px] text-white/50 font-mono tracking-wider">
                          {row.phone_number || '—'}
                        </span>
                      </td>

                      {/* KYC Status */}
                      <td className="px-4 md:px-8 py-5">
                        <KycBadge status={row.kyc_status} />
                      </td>

                      {/* AVG Coins */}
                      <td className="px-4 md:px-8 py-5 text-right">
                        <span className="inline-flex items-center gap-1.5 justify-end">
                          <Coins className="w-3.5 h-3.5 text-[#FBDB8C]/60" />
                          <span className="text-[14px] font-black text-[#FBDB8C] tabular-nums">
                            {row.total_coins.toLocaleString()}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        )}
      </AdminCard>
    </div>
  );
};

export default AdminCoinHoldings;
