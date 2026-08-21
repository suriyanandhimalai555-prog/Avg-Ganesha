import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Hash, Pencil, X } from 'lucide-react';
import api from '../../api/axios';
import { API_ROUTES } from '../../config/api';
import {
  AdminCard,
  AdminPageHeader,
  AdminSearchInput,
} from './AdminChrome';
import { commonStyles } from '../../styles/index.styles';

/*
  Statue Numbers admin page
  ========================
  Lists every 1.5 Ft statue number assignment, highlights gaps, and lets
  the admin correct/reassign individual numbers.

  Data model from the API:
    { donation_id, statue_number, status, created_at, user_id, full_name, email }

  "Numbered" rows  → statue_number IS NOT NULL (may be CONFIRMED, REJECTED, PENDING)
  "Unnumbered"     → statue_number IS NULL AND status = 'CONFIRMED'  (bug victims)
  "Gap"            → a virtual row for integers in 1..max with no holder

  Edit mechanics (handled server-side):
    free target    → set directly
    occupied target, src has a number → swap the two rows
    occupied target, src has no number → 409 (server rejects; ask user to pick a free slot)
*/

// ── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    CONFIRMED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    PENDING:   'bg-amber-500/20  text-amber-400  border-amber-500/30',
    REJECTED:  'bg-red-500/20    text-red-400    border-red-500/30',
  }[status] || 'bg-white/10 text-white/40 border-white/10';
  return (
    <span className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border rounded-full ${cfg}`}>
      {status}
    </span>
  );
};

// ── Edit modal ────────────────────────────────────────────────────────────────
const EditModal = ({ row, onClose, onSaved }) => {
  const isGap    = row?.isGap;
  const isUnnumbered = row?.statue_number === null && !isGap;

  const [value, setValue] = useState(
    isGap ? String(row.gapNumber) : (row?.statue_number != null ? String(row.statue_number) : '')
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSave = useCallback(async () => {
    const num = parseInt(value);
    if (!Number.isInteger(num) || num < 1) {
      setError('Please enter a valid positive number.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.patch(API_ROUTES.DONATIONS.ADMIN_UPDATE_STATUE_NUMBER(row.donation_id), {
        statueNumber: num,
      });
      window.dispatchEvent(new CustomEvent('admin:refresh-stats'));
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update statue number.');
    } finally {
      setSaving(false);
    }
  }, [value, row, onSaved]);

  if (!row) return null;

  return (
    <div className={commonStyles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#060B28] border border-[#FBDB8C]/30 rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-7 pt-7 pb-5 border-b border-[#FBDB8C]/10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.3em]">
              {isGap ? 'Fill Gap' : isUnnumbered ? 'Assign Number' : 'Edit Number'}
            </p>
            <h3 className="text-base font-serif font-black text-white mt-1">
              {isGap
                ? `Slot #${row.gapNumber} is unassigned`
                : `${row.full_name}`}
            </h3>
            {!isGap && (
              <p className="text-[11px] text-white/40 mt-0.5">{row.email}</p>
            )}
            {!isGap && row.statue_number != null && (
              <p className="text-[11px] text-[#FBDB8C]/60 mt-1 font-bold">
                Current number: #{row.statue_number}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/30 hover:text-white transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {isGap && (
            <p className="text-[11px] text-white/40 mb-4">
              Slot #{row.gapNumber} is currently empty. Edit a devotee row to assign this number to them.
            </p>
          )}

          {!isGap && (
            <>
              <label className={commonStyles.label}>
                New Statue Number
              </label>
              <input
                type="number"
                min={1}
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className={`${commonStyles.input} text-base font-bold tabular-nums`}
                placeholder="Enter number…"
                autoFocus
              />
              <p className="text-[10px] text-white/30 mt-2">
                If the target number is held by another devotee their numbers will be swapped.
              </p>
            </>
          )}

          {error && (
            <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-400 leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isGap && (
          <div className="px-7 pb-7 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-[#FBDB8C]/20 text-[#FBDB8C] text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-2xl bg-[#FBDB8C] text-[#060B28] text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="animate-pulse">Saving…</span>
              ) : (
                <><Check size={13} /> Save</>
              )}
            </button>
          </div>
        )}
        {isGap && (
          <div className="px-7 pb-7">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl border border-[#FBDB8C]/20 text-[#FBDB8C] text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const AdminStatueNumbers = () => {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [editRow, setEditRow] = useState(null); // row being edited, or null

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(API_ROUTES.DONATIONS.ADMIN_STATUE_NUMBERS);
      setRows(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load statue numbers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Split: numbered rows vs confirmed-but-unnumbered (bug-victim) rows
  const { numberedRows, unnumberedRows, gapNumbers } = useMemo(() => {
    const numbered    = rows.filter((r) => r.statue_number !== null);
    const unnumbered  = rows.filter((r) => r.statue_number === null);
    const max         = numbered.reduce((m, r) => Math.max(m, r.statue_number), 0);
    const taken       = new Set(numbered.map((r) => r.statue_number));
    const gaps        = [];
    for (let n = 1; n <= max; n++) {
      if (!taken.has(n)) gaps.push(n);
    }
    return { numberedRows: numbered, unnumberedRows: unnumbered, gapNumbers: gaps };
  }, [rows]);

  // Build the combined display list: numbered rows + gap sentinels, sorted by number
  const displayList = useMemo(() => {
    const q = search.toLowerCase();
    const filterRow = (r) =>
      !q ||
      r.full_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      String(r.statue_number)?.includes(q);

    const numbered = numberedRows.filter(filterRow).map((r) => ({ ...r, _type: 'row' }));
    const gaps = search
      ? [] // don't show gap sentinels when searching (would clutter results)
      : gapNumbers.map((n) => ({ _type: 'gap', gapNumber: n }));

    // Merge and sort
    const combined = [...numbered, ...gaps].sort((a, b) => {
      const na = a._type === 'gap' ? a.gapNumber : a.statue_number;
      const nb = b._type === 'gap' ? b.gapNumber : b.statue_number;
      return na - nb;
    });
    return combined;
  }, [numberedRows, gapNumbers, search]);

  const filteredUnnumbered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return unnumberedRows;
    return unnumberedRows.filter(
      (r) => r.full_name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)
    );
  }, [unnumberedRows, search]);

  const handleSaved = useCallback(() => {
    setEditRow(null);
    fetchData();
  }, [fetchData]);

  const stats = {
    total:      numberedRows.length,
    confirmed:  numberedRows.filter((r) => r.status === 'CONFIRMED').length,
    gaps:       gapNumbers.length,
    needNumber: unnumberedRows.length,
  };

  return (
    <>
      <AdminPageHeader
        title="Statue Numbers"
        subtitle="1.5 Ft statue seat assignments — view, correct, and manage number gaps"
        actions={
          <AdminSearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search devotee…"
            className="w-56"
          />
        }
      />

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: 'Total Assigned',   value: stats.total,      color: 'text-[#FBDB8C]' },
          { label: 'Confirmed',        value: stats.confirmed,  color: 'text-emerald-400' },
          { label: 'Gaps',             value: stats.gaps,       color: stats.gaps > 0 ? 'text-amber-400' : 'text-white/30' },
          { label: 'Needs a Number',   value: stats.needNumber, color: stats.needNumber > 0 ? 'text-red-400' : 'text-white/30' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 bg-white/5 border border-[#FBDB8C]/10 rounded-2xl px-4 py-2"
          >
            <span className={`text-lg font-black tabular-nums ${color}`}>{value}</span>
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4">
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* ── Numbered / gap rows ── */}
      <AdminCard className="mb-6">
        {/* Table header */}
        <div className="grid grid-cols-[80px_1fr_130px_120px_80px] gap-0 bg-black/20 border-b border-white/5">
          {['#', 'Devotee', 'Status', 'Date', ''].map((h) => (
            <div key={h} className={commonStyles.tableHeaderCell}>{h}</div>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-white/30 text-sm">Loading…</div>
        ) : displayList.length === 0 ? (
          <div className="py-16 text-center">
            <Hash size={32} className="mx-auto mb-3 text-white/10" />
            <p className="text-white/30 text-sm">No statue numbers found.</p>
          </div>
        ) : (
          displayList.map((item) => {
            if (item._type === 'gap') {
              return (
                <div
                  key={`gap-${item.gapNumber}`}
                  className="grid grid-cols-[80px_1fr_130px_120px_80px] gap-0 border-b border-white/5 bg-amber-500/5 hover:bg-amber-500/8 transition-all"
                >
                  <div className={`${commonStyles.tableCell} font-black text-amber-400/60`}>
                    #{item.gapNumber}
                  </div>
                  <div className={`${commonStyles.tableCell} col-span-3`}>
                    <span className="text-[11px] text-amber-400/60 font-bold uppercase tracking-widest">
                      — gap / unassigned —
                    </span>
                  </div>
                  <div className={commonStyles.tableCell}>
                    <button
                      type="button"
                      onClick={() => setEditRow({ ...item, donation_id: null })}
                      className="text-[9px] font-black text-amber-400/60 hover:text-amber-400 uppercase tracking-widest transition-all"
                      title="View info about this gap"
                    >
                      Info
                    </button>
                  </div>
                </div>
              );
            }

            // Normal numbered row
            const row = item;
            return (
              <div
                key={row.donation_id}
                className={`grid grid-cols-[80px_1fr_130px_120px_80px] gap-0 border-b border-white/5 ${commonStyles.tableRow}`}
              >
                <div className={`${commonStyles.tableCell} font-black text-[#FBDB8C] tabular-nums`}>
                  #{row.statue_number}
                </div>
                <div className={commonStyles.tableCell}>
                  <p className="text-sm text-white font-bold truncate">{row.full_name}</p>
                  <p className="text-[11px] text-white/40 truncate">{row.email}</p>
                </div>
                <div className={commonStyles.tableCell}>
                  <StatusBadge status={row.status} />
                </div>
                <div className={`${commonStyles.tableCell} text-xs text-white/40 tabular-nums`}>
                  {new Date(row.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </div>
                <div className={commonStyles.tableCell}>
                  <button
                    type="button"
                    onClick={() => setEditRow(row)}
                    className="p-1.5 text-[#FBDB8C]/40 hover:text-[#FBDB8C] hover:bg-[#FBDB8C]/10 rounded-lg transition-all"
                    title="Edit statue number"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </AdminCard>

      {/* ── Unnumbered confirmed devotees (bug victims) ── */}
      {(filteredUnnumbered.length > 0 || (!loading && unnumberedRows.length > 0 && search === '')) && (
        <AdminCard>
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-red-500/5">
            <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                Confirmed Devotees Without a Number
              </p>
              <p className="text-[11px] text-white/30 mt-0.5">
                These devotees have a confirmed 1.5 Ft statue seva but no number assigned.
                Use "Assign Number" to fix each one.
              </p>
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_130px_120px_120px] gap-0 bg-black/20 border-b border-white/5">
            {['Devotee', 'Status', 'Date', ''].map((h) => (
              <div key={h} className={commonStyles.tableHeaderCell}>{h}</div>
            ))}
          </div>

          {filteredUnnumbered.length === 0 ? (
            <div className="py-10 text-center text-white/30 text-sm">
              {search ? 'No matching devotees.' : 'None — all clear!'}
            </div>
          ) : (
            filteredUnnumbered.map((row) => (
              <div
                key={row.donation_id}
                className={`grid grid-cols-[1fr_130px_120px_120px] gap-0 border-b border-white/5 ${commonStyles.tableRow}`}
              >
                <div className={commonStyles.tableCell}>
                  <p className="text-sm text-white font-bold truncate">{row.full_name}</p>
                  <p className="text-[11px] text-white/40 truncate">{row.email}</p>
                </div>
                <div className={commonStyles.tableCell}>
                  <StatusBadge status={row.status} />
                </div>
                <div className={`${commonStyles.tableCell} text-xs text-white/40 tabular-nums`}>
                  {new Date(row.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </div>
                <div className={commonStyles.tableCell}>
                  <button
                    type="button"
                    onClick={() => setEditRow(row)}
                    className={commonStyles.buttonSmall}
                  >
                    Assign #
                  </button>
                </div>
              </div>
            ))
          )}
        </AdminCard>
      )}

      {/* Edit / assign modal */}
      {editRow && (
        <EditModal
          row={editRow}
          onClose={() => setEditRow(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
};

export default AdminStatueNumbers;
