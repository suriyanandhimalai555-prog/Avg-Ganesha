import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { History, ChevronDown, ChevronRight, X } from 'lucide-react';
import api from '../../api/axios';
import { API_ROUTES } from '../../config/api';
import { AdminPageHeader, AdminSearchInput, AdminCard, AdminPagination } from './AdminChrome';
import { AUDIT_ACTIONS, AuditActionChip } from './auditActions.jsx';

/*
  Audit Log (ADMIN only)
  ======================
  Who changed what, across the whole console: KYC reviews, seva confirm/reject/record,
  statue number + date changes, coin adjustments, role / contact / password changes,
  settings and plan edits. Append-only — nothing here can be edited or deleted.
  Filters sync to the URL (?action=&actorId=&targetUserId=&from=&to=&search=).
*/

const PAGE_SIZE = 25;

const fmtDateTime = (v) =>
  new Date(v).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

const selectCls =
  'bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-[11px] text-white/80 focus:outline-none focus:border-[#FBDB8C]/40 [color-scheme:dark]';

const DetailsView = ({ details }) => {
  if (!details || typeof details !== 'object' || Object.keys(details).length === 0) {
    return <p className="text-white/30 text-[11px]">No extra details.</p>;
  }
  const show = (v) => (v === null || v === undefined || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-[11px]">
      {Object.entries(details).map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-white/40 font-mono">{k}</dt>
          <dd className="text-white/80 break-all">
            {v && typeof v === 'object' && !Array.isArray(v) && ('from' in v || 'to' in v) ? (
              <>
                <span className="text-red-300/70 line-through">{show(v.from)}</span>
                <span className="text-white/30"> → </span>
                <span className="text-emerald-300/90">{show(v.to)}</span>
              </>
            ) : (
              show(v)
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
};

const AdminAuditLog = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    action: searchParams.get('action') || 'ALL',
    actorId: searchParams.get('actorId') || '',
    targetUserId: searchParams.get('targetUserId') || '',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    search: searchParams.get('search') || '',
  };
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1);

  const [rows, setRows] = useState([]);
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [searchText, setSearchText] = useState(filters.search);

  const setParam = useCallback(
    (key, value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value && value !== 'ALL') next.set(key, value);
          else next.delete(key);
          if (key !== 'page') next.delete('page');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Debounce free-text search into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchText !== filters.search) setParam('search', searchText.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [searchText, filters.search, setParam]);

  const qs = searchParams.toString();
  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams(qs);
      params.set('limit', String(PAGE_SIZE));
      if (!params.get('page')) params.set('page', '1');
      const res = await api.get(`${API_ROUTES.ADMIN_AUDIT_LOG}?${params.toString()}`);
      setRows(res.data.data);
      setActors(res.data.actors || []);
      setTotalPages(res.data.pagination.totalPages);
      setTotalItems(res.data.pagination.totalItems);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [qs]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  if (currentUser && currentUser.role !== 'ADMIN') {
    return (
      <div className="w-full">
        <AdminPageHeader title="Audit Log" subtitle="Only admins can view the audit log." />
      </div>
    );
  }

  const targetName = filters.targetUserId
    ? rows.find((r) => String(r.targetUserId) === filters.targetUserId)?.targetName || `Devotee #${filters.targetUserId}`
    : null;

  return (
    <div className="w-full">
      <AdminPageHeader
        title="Audit Log"
        subtitle={loading ? 'Loading…' : `${totalItems} recorded change${totalItems !== 1 ? 's' : ''} · who changed what, and when`}
        actions={
          <AdminSearchInput
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search summary, operator, devotee…"
            className="w-56 md:w-72"
          />
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select className={selectCls} value={filters.action} onChange={(e) => setParam('action', e.target.value)}>
          <option value="ALL">All actions</option>
          {Object.entries(AUDIT_ACTIONS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select className={selectCls} value={filters.actorId} onChange={(e) => setParam('actorId', e.target.value)}>
          <option value="">All operators</option>
          {actors.map((a) => (
            <option key={a.id} value={String(a.id)}>
              {a.name || `User #${a.id}`} ({a.role})
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
          From
          <input type="date" className={selectCls} value={filters.from} onChange={(e) => setParam('from', e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest">
          To
          <input type="date" className={selectCls} value={filters.to} onChange={(e) => setParam('to', e.target.value)} />
        </label>
        {targetName && (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FBDB8C]/10 border border-[#FBDB8C]/30 text-[#FBDB8C] text-[10px] font-black uppercase tracking-widest">
            {targetName}
            <button type="button" onClick={() => setParam('targetUserId', '')} aria-label="Clear devotee filter">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>

      <AdminCard>
        {error && <p className="px-8 py-6 text-red-400 text-xs">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                {['', 'When (IST)', 'Operator', 'Action', 'Devotee', 'What changed'].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 md:px-6 py-4 text-[9px] font-black text-white/30 uppercase tracking-[0.2em]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5 animate-pulse">
                    <td colSpan={6} className="px-6 py-5">
                      <div className="h-3 w-full bg-white/5 rounded" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center">
                    <History className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="text-white/30 text-xs">No changes match these filters.</p>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const open = expanded === r.id;
                  return [
                    <tr
                      key={r.id}
                      onClick={() => setExpanded(open ? null : r.id)}
                      className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
                    >
                      <td className="pl-4 md:pl-6 py-4 text-white/30 w-6">
                        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-[11px] text-white/50 whitespace-nowrap tabular-nums">
                        {fmtDateTime(r.createdAt)}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-[12px] whitespace-nowrap">
                        <div className="text-white/90">{r.actorName || r.actorEmail || 'Unknown'}</div>
                        {r.actorRole && <div className="text-[9px] text-white/30 uppercase tracking-widest">{r.actorRole}</div>}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <AuditActionChip action={r.action} />
                      </td>
                      <td className="px-4 md:px-6 py-4 text-[12px] whitespace-nowrap">
                        {r.targetUserId ? (
                          <Link
                            to={`/admin/devotees/${r.targetUserId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#FBDB8C] hover:underline"
                          >
                            {r.targetName || `#${r.targetUserId}`}
                          </Link>
                        ) : (
                          <span className="text-white/20">—</span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-[12px] text-white/70 min-w-[280px]">{r.summary}</td>
                    </tr>,
                    open && (
                      <tr key={`${r.id}-d`} className="border-b border-white/5 bg-black/20">
                        <td />
                        <td colSpan={5} className="px-4 md:px-6 py-4">
                          <DetailsView details={r.details} />
                          {r.actorEmail && (
                            <p className="mt-3 text-[10px] text-white/30">Operator email: {r.actorEmail}</p>
                          )}
                        </td>
                      </tr>
                    ),
                  ];
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <AdminPagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setParam('page', String(Math.max(1, page - 1)))}
            onNext={() => setParam('page', String(Math.min(totalPages, page + 1)))}
          />
        )}
      </AdminCard>
    </div>
  );
};

export default AdminAuditLog;
