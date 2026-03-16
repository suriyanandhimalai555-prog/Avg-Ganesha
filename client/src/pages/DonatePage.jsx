import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { API_ROUTES, API_BASE_URL } from '../config/api';
import { Shield, AlertCircle, FileImage, X } from 'lucide-react';
import { commonStyles, donateStyles } from '../styles/index.styles';

const DonatePage = () => {
  const navigate = useNavigate();
  const { token, user } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalStep, setModalStep] = useState('amount'); // amount | proof | success
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [catRes, setRes] = await Promise.all([
          api.get(API_ROUTES.DONATIONS.CATEGORIES),
          api.get('/api/settings'),
        ]);
        setCategories(catRes.data);
        setSettings(setRes.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleDonateClick = async (category) => {
    if (!token) {
      navigate('/login?redirect=/donate');
      return;
    }
    setSelectedCategory(category);
    setAmount(category.hasFixedPrice && category.fixedPrice ? String(category.fixedPrice) : '');
    setModalStep('amount');
    setPaymentProof(null);
    setSuccessMsg('');

    try {
      const res = await api.get('/api/kyc/status');
      setKycStatus(res.data.status);
    } catch {
      setKycStatus('PENDING');
    }
  };

  const handleProceedToProof = () => {
    if (!selectedCategory) return;
    if (selectedCategory.hasFixedPrice && selectedCategory.fixedPrice) {
      if (!amount || parseFloat(amount) !== selectedCategory.fixedPrice) {
        setAmount(String(selectedCategory.fixedPrice));
      }
    } else if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    setModalStep('proof');
  };

  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    if (!paymentProof || !selectedCategory) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('categoryId', selectedCategory.id);
      formData.append('amount', parseFloat(amount));
      formData.append('paymentProof', paymentProof);
      await api.post(API_ROUTES.DONATIONS.SUBMIT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setModalStep('success');
      setSuccessMsg('Donation submitted successfully. It will appear on your dashboard after admin approval.');
      setPaymentProof(null);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit donation';
      alert(msg);
      if (err.response?.status === 403) {
        setSelectedCategory(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedCategory(null);
    setModalStep('amount');
    setPaymentProof(null);
  };

  const formatPrice = (val) => (val ? `₹${Number(val).toLocaleString('en-IN')}` : null);

  if (loading) {
    return (
      <div className={commonStyles.pageContainer + " flex items-center justify-center"}>
        <p className="text-gs-teal font-serif text-xl">॥ அகில வெற்றி கணேஷா ॥</p>
      </div>
    );
  }

  return (
    <div className={commonStyles.pageContainer + " pb-20"}>
      <section className={donateStyles.section}>
        <div className={donateStyles.headerWrapper}>
          <p className={commonStyles.badgeText}>॥ அகில வெற்றி கணேஷா ॥</p>
          <h2 className={commonStyles.pageTitle}>Donation Categories</h2>
          <p className="text-gray-600 text-sm">Choose a cause to support. Anyone can browse; login and KYC required to donate.</p>
        </div>

        <div className={donateStyles.grid}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={donateStyles.categoryCard}
            >
              <div className="flex-1">
                <h3 className={donateStyles.categoryTitle}>{cat.name}</h3>
                {cat.hasFixedPrice && cat.fixedPrice && (
                  <p className={donateStyles.fixedPrice}>{formatPrice(cat.fixedPrice)}</p>
                )}
                {(!cat.hasFixedPrice || !cat.fixedPrice) && (
                  <p className={donateStyles.amountLabel}>Enter your amount</p>
                )}
              </div>
              <button
                onClick={() => handleDonateClick(cat)}
                className={commonStyles.buttonOutline}
              >
                Donate
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Donation Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-serif text-gs-navy font-bold">Donate to {selectedCategory.name}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {kycStatus === 'PENDING' && (
              <div className="p-6 space-y-4">
                <div className={`${donateStyles.alertBase} ${donateStyles.alertWarning}`}>
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={22} />
                  <div>
                    <p className={`${donateStyles.alertTitle} ${donateStyles.alertWarningTitle}`}>Submit KYC First</p>
                    <p className={`${donateStyles.alertText} ${donateStyles.alertWarningText}`}>Please complete your KYC verification before donating.</p>
                    <button
                      onClick={() => navigate('/dashboard/kyc')}
                      className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-full text-sm font-bold"
                    >
                      Go to KYC
                    </button>
                  </div>
                </div>
              </div>
            )}

            {kycStatus === 'SUBMITTED' && (
              <div className="p-6">
                <div className={`${donateStyles.alertBase} ${donateStyles.alertInfo}`}>
                  <Shield className="text-blue-600 flex-shrink-0" size={22} />
                  <div>
                    <p className={`${donateStyles.alertTitle} ${donateStyles.alertInfoTitle}`}>KYC Under Review</p>
                    <p className={`${donateStyles.alertText} ${donateStyles.alertInfoText}`}>Your documents are being reviewed. You can donate once approved.</p>
                  </div>
                </div>
              </div>
            )}

            {kycStatus === 'REJECTED' && (
              <div className="p-6">
                <div className={`${donateStyles.alertBase} ${donateStyles.alertDanger}`}>
                  <AlertCircle className="text-red-600 flex-shrink-0" size={22} />
                  <div>
                    <p className={`${donateStyles.alertTitle} ${donateStyles.alertDangerTitle}`}>KYC Rejected</p>
                    <p className={`${donateStyles.alertText} ${donateStyles.alertDangerText}`}>Please resubmit your KYC documents to donate.</p>
                    <button
                      onClick={() => navigate('/dashboard/kyc')}
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-full text-sm font-bold"
                    >
                      Resubmit KYC
                    </button>
                  </div>
                </div>
              </div>
            )}

            {kycStatus === 'APPROVED' && modalStep === 'amount' && (
              <div className="p-6 space-y-6">
                <div>
                  <label className={donateStyles.modalLabel}>Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={selectedCategory.hasFixedPrice && selectedCategory.fixedPrice}
                    className={commonStyles.input + " py-3 px-4 rounded-xl"}
                    placeholder="Enter amount"
                  />
                </div>
                {settings && (
                  <div className={donateStyles.bankDetailsBox}>
                    <p className="font-bold text-gray-700 mb-2">Bank Details</p>
                    <p>{settings.bank_account_name}</p>
                    <p>Account: {settings.bank_account_number || '—'}</p>
                    <p>{settings.bank_name} | IFSC: {settings.bank_ifsc}</p>
                  </div>
                )}
                <button
                  onClick={handleProceedToProof}
                  className={commonStyles.buttonPrimary + " w-full py-3 rounded-full"}
                >
                  Proceed — Upload Payment Proof
                </button>
              </div>
            )}

            {kycStatus === 'APPROVED' && modalStep === 'proof' && (
              <form onSubmit={handleSubmitDonation} className="p-6 space-y-6">
                <p className="text-gs-teal font-bold text-xl">₹{parseFloat(amount || 0).toLocaleString('en-IN')}</p>
                <div>
                  <label className={donateStyles.modalLabel}>
                    Payment Screenshot (required)
                  </label>
                  <div
                    className={`${donateStyles.proofBoxBase} ${paymentProof ? donateStyles.proofBoxActive : donateStyles.proofBoxInactive}`}
                    onClick={() => document.getElementById('proof-input').click()}
                  >
                    <input
                      id="proof-input"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => setPaymentProof(e.target.files[0])}
                    />
                    {paymentProof ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileImage className="text-gs-teal" size={32} />
                        <p className="font-medium text-gs-navy">{paymentProof.name}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileImage className="text-gray-400" size={32} />
                        <p className="text-gray-500">Click to upload payment proof</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setModalStep('amount')} className={commonStyles.buttonSecondary + " flex-1 py-3 rounded-full"}>
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!paymentProof || submitting}
                    className={commonStyles.buttonPrimary + " flex-1 py-3 rounded-full"}
                  >
                    {submitting ? 'Submitting...' : 'Submit Donation'}
                  </button>
                </div>
              </form>
            )}

            {modalStep === 'success' && (
              <div className="p-6 text-center">
                <div className="text-5xl mb-4">🙏</div>
                <p className="text-gs-teal font-bold text-lg">{successMsg}</p>
                <button onClick={closeModal} className={commonStyles.buttonPrimary + " mt-4 px-6 py-2 rounded-full"}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonatePage;
