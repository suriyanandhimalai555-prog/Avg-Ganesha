import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Search,
  Mail,
  X,
  Check,
  Upload,
  FileText,
} from 'lucide-react';
import api from '../../api/axios';
import { commonStyles } from '../../styles/index.styles';

/*
  Admin — Submit KYC on behalf of a devotee
  ==========================================
  Allows an admin to upload ID documents (front + back) for any devotee who
  hasn't submitted KYC themselves. Posts to POST /api/admin/kyc-submit as
  multipart/form-data with fields: userId, idFront, idBack.
  The backend sets kyc_status → SUBMITTED so the devotee then appears in the
  normal KYC Review queue for approval.
*/

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const AdminKycEntry = () => {
  const { refreshStats } = useOutletContext() || {};

  // Devotee search / selection (same pattern as AdminSevaEntry)
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const searchBoxRef = useRef(null);

  // File state
  const [fileFront, setFileFront] = useState(null);
  const [fileBack, setFileBack] = useState(null);
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', text }

  // Debounced devotee search
  useEffect(() => {
    if (selectedUser) return;
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

  const pickFile = (e, setSide, inputRef) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setFeedback({ type: 'error', text: 'File must be under 5 MB.' });
      inputRef.current.value = '';
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFeedback({ type: 'error', text: 'Only JPG, PNG or WEBP images are allowed.' });
      inputRef.current.value = '';
      return;
    }
    setSide(file);
    setFeedback(null);
  };

  const clearFile = (setSide, inputRef) => {
    setSide(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const canSubmit = selectedUser && fileFront && fileBack && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append('userId', selectedUser.id);
      formData.append('idFront', fileFront);
      formData.append('idBack', fileBack);

      const res = await api.post('/api/admin/kyc-submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFeedback({
        type: 'success',
        text: res.data?.message || `KYC documents submitted for ${selectedUser.full_name}.`,
      });

      // Reset form
      setSelectedUser(null);
      setFileFront(null);
      setFileBack(null);
      if (frontInputRef.current) frontInputRef.current.value = '';
      if (backInputRef.current) backInputRef.current.value = '';

      refreshStats?.();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error || 'Failed to submit KYC documents.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const UploadBox = ({ label, file, onPick, onClear, inputRef }) => (
    <div>
      <label className={commonStyles.label}>{label}</label>
      {file ? (
        <div className="flex items-center gap-3 bg-white/5 border border-[#FBDB8C]/30 rounded-xl px-4 py-3">
          <FileText size={18} className="text-[#FBDB8C] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white truncate">{file.name}</p>
            <p className="text-[11px] text-white/40">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
            aria-label="Remove file"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 px-4 py-8 bg-white/5 border-2 border-dashed border-[#FBDB8C]/20 rounded-xl text-white/40 hover:text-[#FBDB8C] hover:border-[#FBDB8C]/40 hover:bg-white/8 transition-all"
        >
          <Upload size={22} className="opacity-60" />
          <span className="text-xs font-bold uppercase tracking-widest">Upload {label}</span>
          <span className="text-[10px] opacity-50">JPG · PNG · WEBP · max 5 MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={onPick}
      />
    </div>
  );

  return (
    <section className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-serif font-black text-[#FBDB8C] tracking-[0.2em] uppercase">
          Submit KYC
        </h2>
        <p className="text-[11px] text-white/40 font-medium tracking-wide mt-1">
          Upload identity documents on behalf of a devotee. The devotee&apos;s KYC status is
          set to <strong className="text-white/60">Submitted</strong> for your review.
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
                {selectedUser.kyc_status && (
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5 font-bold">
                    KYC: {selectedUser.kyc_status}
                  </p>
                )}
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
                          <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold">
                            KYC: {u.kyc_status || 'PENDING'}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Document uploads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <UploadBox
            label="Government ID — Front"
            file={fileFront}
            onPick={(e) => pickFile(e, setFileFront, frontInputRef)}
            onClear={() => clearFile(setFileFront, frontInputRef)}
            inputRef={frontInputRef}
          />
          <UploadBox
            label="Government ID — Back"
            file={fileBack}
            onPick={(e) => pickFile(e, setFileBack, backInputRef)}
            onClear={() => clearFile(setFileBack, backInputRef)}
            inputRef={backInputRef}
          />
        </div>

        <p className="text-[10px] text-white/30 tracking-wide leading-relaxed">
          Both front and back are required. After submission the devotee&apos;s KYC status
          becomes <strong className="text-white/50">Submitted</strong> — use{' '}
          <strong className="text-white/50">KYC Review</strong> in the sidebar to approve or reject.
        </p>

        {/* Feedback */}
        {feedback && (
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check size={16} className="flex-shrink-0 mt-0.5" />
            ) : (
              <X size={16} className="flex-shrink-0 mt-0.5" />
            )}
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
            <Upload size={14} />
            {submitting ? 'Uploading…' : 'Submit KYC Docs'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default AdminKycEntry;
