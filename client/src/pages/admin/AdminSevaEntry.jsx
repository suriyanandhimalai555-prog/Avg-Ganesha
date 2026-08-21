import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  Mail,
  X,
  Check,
  IndianRupee,
  HeartHandshake,
  CheckCircle,
  Clock,
  Paperclip,
  Image as ImageIcon,
} from 'lucide-react';
import api from '../../api/axios';
import { API_ROUTES } from '../../config/api';
import { commonStyles } from '../../styles/index.styles';

/*
  Admin — Record Seva Entry (on behalf of a devotee)
  ==================================================
  Lets an admin log a seva/donation directly for a devotee (e.g. offline cash or
  bank transfer). Picks a devotee, a category and an amount, then posts to
  POST /api/donations/admin/entry. Entries default to CONFIRMED and behave exactly
  like a normal submission (statue number + AVG coins for the 1.5 Ft statue seva).
*/

const AdminSevaEntry = () => {
  // refreshStats lets the sidebar/overview counts update after we record an entry.
  const { refreshStats } = useOutletContext() || {};

  // Devotee search / selection
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const searchBoxRef = useRef(null);

  // Categories
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');

  // Form
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('CONFIRMED');
  const [paymentProof, setPaymentProof] = useState(null); // optional File object
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text }
  const fileInputRef = useRef(null);

  const selectedCategory = useMemo(
    () => categories.find((c) => String(c.id) === String(categoryId)) || null,
    [categories, categoryId]
  );

  // Load categories once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(API_ROUTES.DONATIONS.CATEGORIES);
        if (!cancelled) setCategories(res.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Debounced devotee search
  useEffect(() => {
    if (selectedUser) return; // don't search while a devotee is locked in
    const term = search.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get(
          `/api/admin/users?search=${encodeURIComponent(term)}&limit=8`
        );
        setResults(res.data?.data || []);
        setShowResults(true);
      } catch (err) {
        console.error('Devotee search failed', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, selectedUser]);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const pickUser = (u) => {
    setSelectedUser(u);
    setShowResults(false);
    setSearch('');
    setResults([]);
  };

  const clearUser = () => {
    setSelectedUser(null);
    setSearch('');
  };

  // Prefill amount when a fixed-price category is chosen
  const onCategoryChange = (id) => {
    setCategoryId(id);
    const cat = categories.find((c) => String(c.id) === String(id));
    if (cat?.hasFixedPrice && cat.fixedPrice) {
      setAmount(String(cat.fixedPrice));
    }
  };

  const canSubmit =
    selectedUser && categoryId && parseFloat(amount) > 0 && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      // Send as multipart/form-data so the optional proof image travels with the fields
      const formData = new FormData();
      formData.append('userId', selectedUser.id);
      formData.append('categoryId', Number(categoryId));
      formData.append('amount', parseFloat(amount));
      formData.append('status', status);
      if (paymentProof) formData.append('paymentProof', paymentProof);

      const res = await api.post(API_ROUTES.DONATIONS.ADMIN_ENTRY, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback({
        type: 'success',
        text:
          res.data?.message ||
          `Recorded ₹${parseFloat(amount).toLocaleString('en-IN')} for ${selectedUser.full_name}.`,
      });
      // Reset for the next entry (keep nothing sticky to avoid duplicate posts)
      setSelectedUser(null);
      setCategoryId('');
      setAmount('');
      setStatus('CONFIRMED');
      setPaymentProof(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Refresh sidebar/overview counts via AdminLayout context (avoids double-fetch
      // that would occur if we also dispatched the 'admin:refresh-stats' event here,
      // since AdminLayout's event listener calls the same fetchStats function).
      refreshStats?.();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || 'Failed to record seva entry.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-serif font-black text-[#FBDB8C] tracking-[0.2em] uppercase">
          Record Seva Entry
        </h2>
        <p className="text-[11px] text-white/40 font-medium tracking-wide mt-1">
          Log a seva on behalf of a devotee (offline cash / bank transfer).
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-gradient-to-b from-[#0A194E] to-[#040924] border border-[#FBDB8C]/20 rounded-3xl p-6 md:p-8 shadow-[0_0_30px_rgba(0,0,0,0.4)] space-y-7 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/40 to-transparent" />

        {/* Devotee picker */}
        <div ref={searchBoxRef} className="relative">
          <label className={commonStyles.label}>Devotee</label>
          {selectedUser ? (
            <div className="flex items-center gap-3 bg-white/5 border border-[#FBDB8C]/30 rounded-xl px-4 py-3">
              <div className="h-10 w-10 rounded-xl bg-[#FBDB8C]/10 border border-[#FBDB8C]/20 flex items-center justify-center text-[#FBDB8C] font-black flex-shrink-0">
                {selectedUser.full_name?.charAt(0).toUpperCase() || 'D'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{selectedUser.full_name}</p>
                <p className="text-[11px] text-white/40 flex items-center gap-1.5 truncate">
                  <Mail size={11} className="text-[#FBDB8C]" /> {selectedUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={clearUser}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
                aria-label="Change devotee"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => results.length && setShowResults(true)}
                placeholder="Search by name, email or code…"
                className={commonStyles.input + ' pl-11'}
                autoComplete="off"
              />
              <Search className="w-4 h-4 text-[#FBDB8C]/40 absolute left-4 top-1/2 -translate-y-1/2" />

              {showResults && (
                <div className="absolute z-20 mt-2 w-full bg-[#060B28] border border-[#FBDB8C]/20 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar">
                  {searching ? (
                    <p className="px-4 py-3 text-[11px] text-white/40 uppercase tracking-widest">Searching…</p>
                  ) : results.length === 0 ? (
                    <p className="px-4 py-3 text-[11px] text-white/40 uppercase tracking-widest">
                      {search.trim().length < 2 ? 'Type at least 2 characters' : 'No devotees found'}
                    </p>
                  ) : (
                    results.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => pickUser(u)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
                      >
                        <div className="h-9 w-9 rounded-lg bg-[#FBDB8C]/5 border border-[#FBDB8C]/10 flex items-center justify-center text-[#FBDB8C] font-black text-sm flex-shrink-0">
                          {u.full_name?.charAt(0).toUpperCase() || 'D'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{u.full_name}</p>
                          <p className="text-[11px] text-white/40 truncate">{u.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label className={commonStyles.label}>Seva Category</label>
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={commonStyles.input + ' appearance-none cursor-pointer'}
          >
            <option value="" className="bg-[#060B28]">Select a seva…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#060B28]">
                {c.name}{c.hasFixedPrice && c.fixedPrice ? ` — ₹${c.fixedPrice}` : ''}
              </option>
            ))}
          </select>
          {selectedCategory?.slug === 'statue_1_5_ft' && (
            <p className="text-[10px] text-[#FBDB8C]/60 mt-2 flex items-center gap-1.5 tracking-wide">
              <HeartHandshake size={12} /> Confirmed 1.5 Ft statue seva awards 100 AVG coins on the devotee&apos;s <strong>first</strong> statue (locked 5 yrs).
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className={commonStyles.label}>Amount (₹)</label>
          <div className="relative">
            <IndianRupee className="w-4 h-4 text-[#FBDB8C]/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={commonStyles.input + ' pl-11 tabular-nums'}
            />
          </div>
        </div>

        {/* Payment proof (optional) */}
        <div>
          <label className={commonStyles.label}>
            Payment Proof <span className="normal-case text-white/20 font-medium tracking-normal">— optional</span>
          </label>
          {paymentProof ? (
            <div className="flex items-center gap-3 bg-white/5 border border-[#FBDB8C]/20 rounded-xl px-4 py-3">
              <ImageIcon size={16} className="text-[#FBDB8C]/60 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-medium truncate">{paymentProof.name}</p>
                <p className="text-[11px] text-white/40">
                  {(paymentProof.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setPaymentProof(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
                aria-label="Remove proof"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 border border-dashed border-[#FBDB8C]/20 rounded-xl text-white/40 hover:text-[#FBDB8C] hover:border-[#FBDB8C]/40 hover:bg-white/8 transition-all text-sm"
            >
              <Paperclip size={16} />
              <span className="text-xs font-medium">Attach payment screenshot or receipt…</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                setFeedback({ type: 'error', text: 'Image must be under 5 MB.' });
                return;
              }
              setPaymentProof(file);
              setFeedback(null);
            }}
          />
        </div>

        {/* Status toggle */}
        <div>
          <label className={commonStyles.label}>Status</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: 'CONFIRMED', label: 'Confirmed', Icon: CheckCircle, hint: 'Counts now + awards coins' },
              { val: 'PENDING', label: 'Pending', Icon: Clock, hint: 'Review later in Seva' },
            ].map((opt) => {
              const { val, label, Icon, hint } = opt;
              const active = status === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setStatus(val)}
                  className={`flex flex-col items-start gap-1 px-4 py-3 rounded-xl border text-left transition-all ${
                    active
                      ? 'bg-[#FBDB8C]/10 border-[#FBDB8C]/40 text-[#FBDB8C]'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Icon size={15} /> {label}
                  </span>
                  <span className="text-[10px] opacity-70 tracking-wide">{hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? <Check size={16} className="flex-shrink-0 mt-0.5" /> : <X size={16} className="flex-shrink-0 mt-0.5" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!canSubmit}
            className={commonStyles.buttonPrimary + ' flex items-center gap-2'}
          >
            <HeartHandshake size={14} />
            {submitting ? 'Recording…' : 'Record Seva'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default AdminSevaEntry;
