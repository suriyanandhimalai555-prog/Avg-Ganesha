import { useEffect, useState } from 'react';
import { CalendarDays, Coins, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import { API_ROUTES } from '../../config/api';
import { commonStyles } from '../../styles/index.styles';
import { istDateString, istToday, formatIstDate } from '../../config/coins';

/*
  Change a seva's date (ADMIN only).
  ----------------------------------
  The seva date decides the 1.5 Ft statue coin rate (500 up to 7 Sep 2026 IST,
  100 after) and the 5-year lock. Before saving, this modal fetches a server
  preview (GET …/date-change) built by the same planner that performs the change,
  so the coin claw-back / top-up shown here is exactly what will be written.
*/
const SevaDateChangeModal = ({ donation, onClose, onChanged }) => {
  const currentDate = istDateString(donation.created_at);
  const [newDate, setNewDate] = useState(currentDate);
  // undefined = server default (re-price automatic rows, keep admin overrides)
  const [recalculate, setRecalculate] = useState(undefined);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!newDate || newDate === currentDate) {
      setPreview(null);
      setPreviewError('');
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError('');
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ date: newDate });
        if (recalculate !== undefined) qs.set('recalculate', String(recalculate));
        const res = await api.get(`${API_ROUTES.DONATIONS.ADMIN_DATE_CHANGE_PREVIEW(donation.id)}?${qs}`);
        if (!cancelled) setPreview(res.data);
      } catch (err) {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(err.response?.data?.error || 'Could not preview this change.');
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [newDate, recalculate, currentDate, donation.id]);

  const coin = preview?.coin;
  const canSave = !!preview && !preview.unchanged && !previewLoading && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const res = await api.patch(API_ROUTES.DONATIONS.ADMIN_CHANGE_DATE(donation.id), {
        date: newDate,
        // Send exactly what the preview showed so the write matches it.
        recalculate: coin?.hasRow ? coin.recalculate : undefined,
      });
      onChanged(res.data?.message || 'Seva date changed.');
    } catch (err) {
      setPreviewError(err.response?.data?.error || 'Failed to change the seva date.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={commonStyles.modalOverlay} onClick={onClose}>
      <div
        className="bg-[#060B28] border border-[#FBDB8C]/30 rounded-3xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(0,0,0,0.8)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-serif font-black text-[#FBDB8C] tracking-widest uppercase mb-1 flex items-center gap-2">
          <CalendarDays size={18} /> Change Seva Date
        </h3>
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.15em] mb-5">
          {donation.full_name} · {donation.category_name} · ₹
          {parseFloat(donation.amount).toLocaleString('en-IN')} · {donation.status}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em] mb-2 block">
              Current date
            </label>
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/60">
              {formatIstDate(donation.created_at)}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em] mb-2 block">
              New date
            </label>
            <input
              type="date"
              value={newDate}
              max={istToday()}
              onChange={(e) => { setNewDate(e.target.value); setRecalculate(undefined); }}
              className="w-full bg-white/5 border border-[#FBDB8C]/20 rounded-xl px-4 py-3 text-sm text-white focus:border-[#FBDB8C]/50 outline-none [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Impact */}
        <div className="min-h-[96px] mb-6">
          {newDate === currentDate ? (
            <p className="text-[11px] text-white/30">Pick a different date to see the impact.</p>
          ) : previewLoading ? (
            <p className="text-[11px] text-white/40">Calculating impact…</p>
          ) : previewError ? (
            <p className="text-[11px] text-rose-400 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {previewError}
            </p>
          ) : preview ? (
            <div className="space-y-3">
              <p className="text-sm text-white/80 flex items-center gap-2 flex-wrap">
                {formatIstDate(preview.oldCreatedAt)} <ArrowRight size={14} className="text-[#FBDB8C]" />
                <span className="text-[#FBDB8C] font-bold">{formatIstDate(preview.newCreatedAt)}</span>
              </p>

              {!preview.isStatue && (
                <p className="text-[11px] text-white/40">Not a 1.5 Ft statue seva — no AVG coin impact.</p>
              )}

              {preview.isStatue && coin && !coin.hasRow && (
                <p className="text-[11px] text-white/50">{coin.note}</p>
              )}

              {preview.isStatue && coin?.hasRow && (
                <div
                  className={`rounded-2xl border p-4 space-y-2 ${
                    coin.delta < 0
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : coin.delta > 0
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FBDB8C]/60 flex items-center gap-1.5">
                    <Coins size={12} /> AVG coins
                  </p>
                  <p className="text-lg font-bold text-white tabular-nums">
                    {coin.currentAmount} → {coin.newAmount}{' '}
                    <span
                      className={`text-sm ${
                        coin.delta < 0 ? 'text-rose-400' : coin.delta > 0 ? 'text-emerald-400' : 'text-white/40'
                      }`}
                    >
                      {coin.delta < 0
                        ? `(${-coin.delta} clawed back)`
                        : coin.delta > 0
                        ? `(+${coin.delta} added)`
                        : '(no change)'}
                    </span>
                  </p>
                  <p className="text-[11px] text-white/50">
                    Lock: {formatIstDate(coin.oldLockedUntil)} → {formatIstDate(coin.newLockedUntil)}
                  </p>
                  {!coin.wasAutomatic && (
                    <label className="flex items-start gap-2 text-[11px] text-amber-300/80 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={coin.recalculate}
                        onChange={(e) => setRecalculate(e.target.checked)}
                        className="mt-0.5 accent-[#FBDB8C]"
                      />
                      <span>
                        This seva has an admin-set amount ({coin.currentAmount}, auto rate was{' '}
                        {coin.oldAutoRate}), so it is kept by default. Tick to reset it to the
                        standard rate for the new date ({coin.newAutoRate}).
                      </span>
                    </label>
                  )}
                </div>
              )}

              <p className="text-[10px] text-white/30">
                Statue number is not changed. This change is recorded in the audit log.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className={commonStyles.buttonSecondary + ' !px-6 !py-3'}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="px-6 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all active:scale-95 text-[9px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : coin?.hasRow && coin.delta !== 0 ? 'Change Date & Coins' : 'Change Date'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SevaDateChangeModal;
