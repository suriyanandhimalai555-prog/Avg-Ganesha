import { useEffect, useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import { API_ROUTES } from '../../config/api';
import { commonStyles, adminStyles } from '../../styles/index.styles';
import { formatIstDate } from '../../config/coins';

/*
  Remove a seva (ADMIN only) — permanent, two steps.
  ------------------------------------------------
  Step 1 "details": server preview (same planner as the delete) — what the seva is,
  coins taken back, seat freed, warnings — plus a required reason.
  Step 2 "confirm": an explicit "Are you sure?" before anything is deleted.
  A full snapshot of the seva is kept in the audit log.
*/

const Row = ({ label, children, strong = false }) => (
  <div className="flex justify-between gap-4 text-[12px] py-1">
    <span className="text-white/40">{label}</span>
    <span className={`text-right tabular-nums ${strong ? 'text-[#FBDB8C] font-bold' : 'text-white/85'}`}>{children}</span>
  </div>
);

const SevaRemoveModal = ({ donationId, onClose, onRemoved }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [step, setStep] = useState('details'); // 'details' | 'confirm'
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(API_ROUTES.DONATIONS.ADMIN_REMOVE_PREVIEW(donationId));
        if (!cancelled) setPreview(res.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load this seva.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [donationId]);

  const reasonOk = reason.trim().length >= 3;
  const canContinue = !!preview && !preview.blockedReason && reasonOk;

  const handleRemove = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.delete(API_ROUTES.DONATIONS.ADMIN_REMOVE(donationId), {
        data: { reason: reason.trim() },
      });
      onRemoved(res.data?.message || 'Seva removed.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove the seva.');
      setSaving(false);
      setStep('details');
    }
  };

  return (
    <div className={commonStyles.modalOverlay} onClick={saving ? undefined : onClose}>
      <div
        className="bg-[#060B28] border border-[#FBDB8C]/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_60px_rgba(0,0,0,0.8)] relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'details' ? (
          <>
            <h3 className="text-xl font-serif font-black text-[#FBDB8C] tracking-widest uppercase mb-1">
              Remove Seva
            </h3>
            <p className="text-[11px] text-white/40 mb-6">Seva #{donationId}</p>

            {loading ? (
              <p className="text-white/40 text-xs py-6 text-center">Loading…</p>
            ) : preview ? (
              <div className="space-y-5">
                <div className="bg-white/5 border border-[#FBDB8C]/10 rounded-2xl px-4 py-3">
                  <Row label="Devotee">{preview.devoteeName}</Row>
                  <Row label="Seva">{preview.categoryName}</Row>
                  <Row label="Amount">₹{Number(preview.amount).toLocaleString('en-IN')}</Row>
                  <Row label="Date">{formatIstDate(preview.sevaDate)}</Row>
                  <Row label="Status">{preview.status}</Row>
                </div>

                {(preview.coinsOnSeva > 0 || preview.statueNumber != null) && (
                  <div className="bg-white/5 border border-[#FBDB8C]/10 rounded-2xl px-4 py-3">
                    {preview.coinsOnSeva > 0 && (
                      <>
                        <Row label="Coins taken back">−{preview.coinsOnSeva.toLocaleString()}</Row>
                        <Row label="Coin balance" strong>
                          {preview.balanceBefore.toLocaleString()} → {preview.balanceAfter.toLocaleString()}
                        </Row>
                      </>
                    )}
                    {preview.statueNumber != null && <Row label="Statue seat">#{preview.statueNumber} freed</Row>}
                  </div>
                )}

                {preview.warnings
                  ?.filter((w) => !w.startsWith('Statue seat'))
                  .map((w) => (
                    <p key={w} className="flex gap-2 text-[11px] text-amber-300/80 leading-relaxed">
                      <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {w}
                    </p>
                  ))}

                {preview.blockedReason ? (
                  <p className="text-red-400 text-xs leading-relaxed">{preview.blockedReason}</p>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">
                      Reason (required)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      maxLength={500}
                      rows={3}
                      autoFocus
                      className="w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20"
                      placeholder="e.g. Duplicate entry"
                    />
                  </div>
                )}
              </div>
            ) : null}

            {error && <p className="text-red-400 text-xs mt-4">{error}</p>}

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={onClose} className={commonStyles.buttonSecondary + ' !px-6 !py-3'}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('confirm')}
                disabled={!canContinue}
                className={adminStyles.actionBtnReject + ' !px-6 !py-3 disabled:opacity-30 disabled:cursor-not-allowed'}
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h3 className="text-xl font-serif font-black text-[#FBDB8C] tracking-widest uppercase mb-3">
              Are you sure?
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Permanently remove <strong className="text-white">{preview.categoryName}</strong> seva of{' '}
              <strong className="text-white">{preview.devoteeName}</strong> (₹
              {Number(preview.amount).toLocaleString('en-IN')})?
            </p>
            {(preview.coinsOnSeva > 0 || preview.statueNumber != null) && (
              <p className="text-[12px] text-white/50 mt-3">
                {preview.coinsOnSeva > 0 && <>{preview.coinsOnSeva.toLocaleString()} coins will be taken back. </>}
                {preview.statueNumber != null && <>Statue seat #{preview.statueNumber} will be freed.</>}
              </p>
            )}
            <p className="text-[11px] text-red-300/70 mt-3">This cannot be undone.</p>

            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={() => setStep('details')}
                disabled={saving}
                className={commonStyles.buttonSecondary + ' !px-6 !py-3'}
              >
                Go back
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={saving}
                className={adminStyles.actionBtnReject + ' !px-6 !py-3'}
              >
                {saving ? 'Removing…' : 'Yes, remove'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SevaRemoveModal;
