import { Search } from 'lucide-react';

/*
  Shared admin "module page" chrome (Zoho-style).
  ===============================================
  Presentational building blocks so every admin module shares one page-header,
  toolbar, card frame, filter-chip and pagination look. No data logic lives here —
  modules keep their own state/effects/API calls and just render through these.
*/

// Page header: title + optional subtitle on the left, actions (e.g. search) on the
// right, and an optional full-width `toolbar` row (e.g. filter chips) under a divider.
export const AdminPageHeader = ({ title, subtitle, actions, toolbar }) => (
  <div className="mb-6 md:mb-8">
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-5 border-b border-[#FBDB8C]/10">
      <div className="min-w-0">
        <h2 className="text-lg md:text-xl font-serif font-black text-[#FBDB8C] tracking-[0.2em] uppercase">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-white/40 font-medium tracking-wide mt-1">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
    {toolbar && <div className="mt-4">{toolbar}</div>}
  </div>
);

// Search box matching the module toolbar look.
export const AdminSearchInput = ({ value, onChange, placeholder = 'Search…', className = '' }) => (
  <div className={`relative ${className}`}>
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-[#FBDB8C]/10 text-white rounded-2xl py-3 pl-10 pr-4 focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20 text-xs font-medium tracking-wide"
      autoComplete="off"
    />
    <Search className="w-4 h-4 text-[#FBDB8C]/40 absolute left-3 top-1/2 -translate-y-1/2" />
  </div>
);

// Pill filter chips.
export const AdminFilterChips = ({ options, value, onChange }) => (
  <div className="flex items-center gap-2 flex-wrap">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest border transition-all ${
          value === opt
            ? 'bg-[#FBDB8C]/20 text-[#FBDB8C] border-[#FBDB8C]/40'
            : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
        }`}
      >
        {opt}
      </button>
    ))}
  </div>
);

// Framed dark panel with the signature top gradient line. Use for tables/content.
export const AdminCard = ({ children, className = '' }) => (
  <div
    className={`bg-[#0A194E]/30 border border-[#FBDB8C]/10 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-md relative ${className}`}
  >
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/20 to-transparent" />
    {children}
  </div>
);

// Prev / Page x of y / Next footer.
export const AdminPagination = ({ page, totalPages, onPrev, onNext }) => (
  <div className="bg-black/20 px-3 sm:px-8 py-4 sm:py-6 flex items-center justify-between gap-2 border-t border-white/5">
    <button
      type="button"
      onClick={onPrev}
      disabled={page <= 1}
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
      onClick={onNext}
      disabled={page >= totalPages}
      className="text-[10px] font-black text-[#FBDB8C] disabled:opacity-20 uppercase tracking-[0.2em] hover:bg-white/5 px-2 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap"
    >
      Next →
    </button>
  </div>
);
