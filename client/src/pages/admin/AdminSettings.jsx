import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import api from '../../api/axios';
import { API_ROUTES } from '../../config/api';
import { adminStyles } from '../../styles/index.styles';

const AdminSettings = () => {
  const [bankDetails, setBankDetails] = useState({
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_branch: '',
    bank_customer_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(API_ROUTES.SETTINGS);
        if (cancelled) return;
        setBankDetails((prev) => ({
          ...prev,
          bank_account_name: res.data?.bank_account_name || '',
          bank_account_number: res.data?.bank_account_number || '',
          bank_ifsc: res.data?.bank_ifsc || '',
          bank_branch: res.data?.bank_branch || '',
          bank_customer_id: res.data?.bank_customer_id || '',
        }));
      } catch (err) {
        console.error('Failed to load bank settings', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e) =>
    setBankDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await api.put(API_ROUTES.SETTINGS, bankDetails);
      setFeedback({ type: 'success', message: 'Account details updated.' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to save account details.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="animate-fade-in">
      <div className={adminStyles.sectionBox}>
        <div className="flex items-center gap-4 mb-10 pb-4 border-b border-[#FBDB8C]/10">
          <Shield className="text-[#FBDB8C]" size={24} />
          <h2 className="text-xl font-serif font-black text-[#FBDB8C] tracking-[0.2em] uppercase">
            Donation Account Settings
          </h2>
        </div>

        {loading ? (
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
            Loading bank details...
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field
                label="Account Holder Name"
                name="bank_account_name"
                value={bankDetails.bank_account_name}
                onChange={handleChange}
                placeholder="Enter display name"
              />
              <Field
                label="Bank Account Number"
                name="bank_account_number"
                value={bankDetails.bank_account_number}
                onChange={handleChange}
                placeholder="Enter account number"
              />
              <Field
                label="Bank Customer ID"
                name="bank_customer_id"
                value={bankDetails.bank_customer_id}
                onChange={handleChange}
                placeholder="Enter customer ID"
              />
              <Field
                label="Bank IFSC Code"
                name="bank_ifsc"
                value={bankDetails.bank_ifsc}
                onChange={handleChange}
                placeholder="Enter IFSC code"
              />
            </div>

            <div className="mt-10 pt-6 border-t border-white/5 flex items-center gap-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-[#FCD34D] via-[#B45309] to-[#F59E0B] text-white font-black text-[10px] tracking-[0.3em] uppercase py-4 px-10 rounded-full shadow-lg hover:shadow-[0_0_30px_rgba(251,191,36,0.3)] transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Account Settings'}
              </button>
              {feedback && (
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${
                    feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {feedback.message}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

const Field = ({ label, name, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">
      {label}
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl px-5 py-3.5 text-sm text-white focus:border-[#FBDB8C]/40 outline-none transition-all placeholder-white/20"
    />
  </div>
);

export default AdminSettings;
