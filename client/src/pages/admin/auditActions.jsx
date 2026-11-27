// Shared labels/colours for audit-log action types (Audit Log page + devotee detail).
/* eslint-disable react-refresh/only-export-components */

export const AUDIT_ACTIONS = {
  COIN_ADJUST: { label: 'Coins adjusted', color: 'text-[#FBDB8C] bg-[#FBDB8C]/10 border-[#FBDB8C]/30' },
  SEVA_CONFIRM: { label: 'Seva confirmed', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  SEVA_REJECT: { label: 'Seva rejected', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  SEVA_RECORD: { label: 'Seva recorded', color: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
  SEVA_DELETE: { label: 'Seva removed', color: 'text-red-300 bg-red-500/15 border-red-400/40' },
  SEVA_DATE_CHANGE: { label: 'Seva date', color: 'text-orange-300 bg-orange-300/10 border-orange-300/20' },
  STATUE_NUMBER_CHANGE: { label: 'Statue #', color: 'text-orange-300 bg-orange-300/10 border-orange-300/20' },
  KYC_REVIEW: { label: 'KYC review', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  KYC_SUBMIT_ON_BEHALF: { label: 'KYC uploaded', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  USER_EDIT: { label: 'Contact edited', color: 'text-violet-300 bg-violet-300/10 border-violet-300/20' },
  ROLE_CHANGE: { label: 'Role changed', color: 'text-pink-300 bg-pink-300/10 border-pink-300/20' },
  PASSWORD_RESET: { label: 'Password reset', color: 'text-pink-300 bg-pink-300/10 border-pink-300/20' },
  SETTINGS_UPDATE: { label: 'Settings', color: 'text-white/70 bg-white/5 border-white/15' },
  PLANS_UPDATE: { label: 'Plans', color: 'text-white/70 bg-white/5 border-white/15' },
};

export const AuditActionChip = ({ action }) => {
  const cfg = AUDIT_ACTIONS[action] || { label: action, color: 'text-white/60 bg-white/5 border-white/10' };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${cfg.color}`}
    >
      {cfg.label}
    </span>
  );
};
