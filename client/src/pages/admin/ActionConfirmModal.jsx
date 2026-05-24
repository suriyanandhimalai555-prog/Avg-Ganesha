import { commonStyles, adminStyles } from '../../styles/index.styles';

/**
 * Shared confirmation modal for admin approve/reject actions.
 * The reject branch shows a free-text reason input.
 */
const ActionConfirmModal = ({
  isOpen,
  targetStatus,
  reason,
  onReasonChange,
  loading,
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const isReject = targetStatus === 'REJECTED';
  const confirmBtnClass = isReject ? adminStyles.actionBtnReject : adminStyles.actionBtnApprove;

  return (
    <div className={commonStyles.modalOverlay} onClick={onCancel}>
      <div
        className="bg-[#060B28] border border-[#FBDB8C]/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_60px_rgba(0,0,0,0.8)] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-serif font-black text-[#FBDB8C] tracking-widest uppercase mb-4">
          Confirm Action
        </h3>
        <p className="text-sm text-white/60 mb-6">
          Are you sure you want to <strong>{isReject ? 'REJECT' : 'APPROVE'}</strong> this?
        </p>

        {isReject && (
          <div className="mb-6 space-y-2">
            <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">
              Rejection Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl px-4 py-3 text-sm text-white focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20"
              placeholder="Provide a reason..."
              rows={3}
            />
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className={commonStyles.buttonSecondary + ' !px-6 !py-3'}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={confirmBtnClass + ' !px-6 !py-3'}
          >
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActionConfirmModal;
