import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';
import { API_ROUTES } from '../config/api';
import { Shield, AlertCircle, FileImage, X } from 'lucide-react';
import { commonStyles, donateStyles } from '../styles/index.styles';
import LoadingScreen from '../components/LoadingScreen';

const DonatePage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalStep, setModalStep] = useState('amount');
  const [successMsg, setSuccessMsg] = useState('');

  // ✅ Exact DB slugs mapped to exact filenames in /public/Facility_images/
  const categoryImages = {
    statue_1_5_ft:      '/Facility_images/1.5ft statue.jpeg',
    statue_250_ft:      '/Facility_images/250_ft_statue.jpeg',
    temple_24_gods:     '/Facility_images/24_Gods_Small_Temple.jpeg',
    free_school:        '/Facility_images/School.jpeg',       // closest available
    free_college:       '/Facility_images/college.jpeg',
    free_medical:       '/Facility_images/medical.jpeg',                       // no matching image yet
    ayurvedic_clinic:   '/Facility_images/vedhic_centre.jpeg', // closest match
    meditation_centre:  '/Facility_images/meditation_centre.jpeg',
    free_library:       '/Facility_images/library.jpeg',
    annadhanam:         '/Facility_images/Annadhanam.jpeg',
    stadium:            '/Facility_images/stadium.jpeg',
    mall:               '/Facility_images/mall.jpeg',
    kulam:              '/Facility_images/Kulam.jpeg',
    cow_park:           '/Facility_images/cow_park.jpeg',
    pet_park:           '/Facility_images/pet_park.jpeg',
    animal_park:        '/Facility_images/Animal_park.jpeg',
    old_age_home:       '/Facility_images/Oldage_home.jpeg',
    orphanage_home:     '/Facility_images/Orphanage_home.jpeg',
    green_park:         '/Facility_images/green_park.jpeg',
    cineplex:           '/Facility_images/cineplex.jpeg',
    vedic_centre:       '/Facility_images/vedhic_centre.jpeg',
  };

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
      if (err.response?.status === 403) setSelectedCategory(null);
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedCategory(null);
    setModalStep('amount');
    setPaymentProof(null);
  };

  if (loading) {
    return <LoadingScreen message="Preparing Seva Categories..." />;
  }

  return (
    <div className={commonStyles.pageContainer + ' pb-20 overflow-y-auto'}>
      <section className={donateStyles.section}>
        <div className={donateStyles.headerWrapper}>
          <p className={commonStyles.preTitle}>॥ அகில வெற்றி கணேஷா ॥</p>
          <h2 className={commonStyles.pageTitle}>Seva Offerings</h2>
          <p className="text-[#FBDB8C]/40 text-xs tracking-widest uppercase font-bold max-w-md mx-auto leading-relaxed">
            Choose your contribution path. Login and KYC validation mandatory for all devotional offerings.
          </p>
        </div>

        <div className={donateStyles.grid}>
          {categories.map((cat) => (
            <div key={cat.id} className={donateStyles.categoryCard}>
              <div className={donateStyles.categoryImageWrapper}>
                <img
                  src={categoryImages[cat.slug] || '/Ganesha.jpeg'}
                  alt={cat.name}
                  className={donateStyles.categoryImage}
                  onError={(e) => {
                    e.target.onerror = null;          // prevent infinite loop
                    e.target.src = '/Ganesha.jpeg';   // fallback
                  }}
                />
                <div className={donateStyles.categoryImageOverlay} />
              </div>
              <div className={donateStyles.categoryContent}>
                <h3 className={donateStyles.categoryTitle} title={cat.name}>{cat.name}</h3>
                <div className="flex-1">
                  {cat.hasFixedPrice && cat.fixedPrice ? (
                    <p className={donateStyles.fixedPrice}>
                      <span className="text-[#FBDB8C]/60 mr-0.5">₹</span>
                      {Number(cat.fixedPrice).toLocaleString('en-IN')}
                    </p>
                  ) : (
                    <p className={donateStyles.amountLabel}>Enter your offering amount</p>
                  )}
                </div>
                <button
                  onClick={() => handleDonateClick(cat)}
                  className={commonStyles.buttonOutline + ' mt-6'}
                >
                  Make Offering
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Donation Modal */}
      {selectedCategory && (
        <div className={donateStyles.modalOverlay}>
          <div className={donateStyles.modalContent}>
            <div className={donateStyles.modalHeader}>
              <h3 className="text-xl font-serif text-white font-bold tracking-wide uppercase">
                Offering: {selectedCategory.name}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/5 text-[#FBDB8C] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {kycStatus === 'PENDING' && (
              <div className="p-6 space-y-4">
                <div className={`${donateStyles.alertBase} ${donateStyles.alertWarning}`}>
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={22} />
                  <div>
                    <p className={`${donateStyles.alertTitle} ${donateStyles.alertWarningTitle}`}>
                      Submit KYC First
                    </p>
                    <p className={`${donateStyles.alertText} ${donateStyles.alertWarningText}`}>
                      Please complete your KYC verification before donating.
                    </p>
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
                    <p className={`${donateStyles.alertTitle} ${donateStyles.alertInfoTitle}`}>
                      KYC Under Review
                    </p>
                    <p className={`${donateStyles.alertText} ${donateStyles.alertInfoText}`}>
                      Your documents are being reviewed. You can donate once approved.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {kycStatus === 'REJECTED' && (
              <div className="p-6">
                <div className={`${donateStyles.alertBase} ${donateStyles.alertDanger}`}>
                  <AlertCircle className="text-red-600 flex-shrink-0" size={22} />
                  <div>
                    <p className={`${donateStyles.alertTitle} ${donateStyles.alertDangerTitle}`}>
                      KYC Rejected
                    </p>
                    <p className={`${donateStyles.alertText} ${donateStyles.alertDangerText}`}>
                      Please resubmit your KYC documents to donate.
                    </p>
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

            {kycStatus === 'APPROVED' && modalStep === 'amount' && !submitting && (
              <div className="p-6 space-y-6">
                <div>
                  <label className={donateStyles.modalLabel}>Offering Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm font-sans pointer-events-none">₹</span>
                    <input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={!!(selectedCategory.hasFixedPrice && selectedCategory.fixedPrice)}
                      className={commonStyles.input + ' py-3 pl-9 pr-4 rounded-xl tabular-nums disabled:opacity-70 disabled:cursor-not-allowed'}
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                {settings && (
                  <div className={donateStyles.bankDetailsBox}>
                    <p className="text-[10px] font-black text-[#FBDB8C]/60 uppercase tracking-[0.25em] mb-3">
                      Bank Details
                    </p>
                    <dl className="space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-white/40 font-medium">Account Holder</dt>
                        <dd className="text-white/90 font-medium text-right">{settings.bank_account_name || '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-white/40 font-medium">Account No.</dt>
                        <dd className="text-white/90 font-medium tabular-nums text-right">{settings.bank_account_number || '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-white/40 font-medium">Bank</dt>
                        <dd className="text-white/90 font-medium text-right">{settings.bank_name || '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-white/40 font-medium">IFSC</dt>
                        <dd className="text-white/90 font-medium tabular-nums text-right">{settings.bank_ifsc || '—'}</dd>
                      </div>
                    </dl>
                  </div>
                )}
                <button
                  onClick={handleProceedToProof}
                  className={commonStyles.buttonPrimary + ' w-full py-3 rounded-full'}
                >
                  Proceed — Upload Payment Proof
                </button>
              </div>
            )}

            {kycStatus === 'APPROVED' && modalStep === 'proof' && !submitting && (
              <form onSubmit={handleSubmitDonation} className="p-6 space-y-6">
                <div className="text-center">
                  <p className="text-[10px] font-black text-[#FBDB8C]/60 uppercase tracking-[0.25em] mb-2">
                    Offering Amount
                  </p>
                  <p className="text-3xl md:text-4xl font-sans font-semibold text-white tabular-nums tracking-tight">
                    <span className="text-white/50 mr-1 font-normal">₹</span>
                    {Number(amount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <label className={donateStyles.modalLabel}>Payment Screenshot (required)</label>
                  <div
                    className={`${donateStyles.proofBoxBase} ${
                      paymentProof ? donateStyles.proofBoxActive : donateStyles.proofBoxInactive
                    }`}
                    onClick={() => document.getElementById('proof-input').click()}
                  >
                    <input
                      id="proof-input"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const selectedFile = e.target.files[0];
                        if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
                          alert('File is too large! Maximum limit is 5MB.');
                          e.target.value = '';
                          return;
                        }
                        setPaymentProof(selectedFile);
                      }}
                    />
                    {paymentProof ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileImage className="text-[#FBDB8C]" size={32} />
                        <p className="font-medium text-white text-sm truncate max-w-full">{paymentProof.name}</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Click to replace</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileImage className="text-white/30" size={32} />
                        <p className="text-white/60 text-sm">Click to upload payment proof</p>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">JPG · PNG · PDF · max 5 MB</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalStep('amount')}
                    className={commonStyles.buttonSecondary + ' flex-1 py-3 rounded-full'}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!paymentProof || submitting}
                    className={commonStyles.buttonPrimary + ' flex-1 py-3 rounded-full'}
                  >
                    Submit Donation
                  </button>
                </div>
              </form>
            )}

            {/* Submission loading state — shared LoadingScreen, scoped inside the modal */}
            {submitting && (
              <div className="p-6">
                <LoadingScreen
                  variant="inline"
                  size="md"
                  message="Submitting Your Seva..."
                />
                <p className="text-center text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-2">
                  Please don't close this window
                </p>
              </div>
            )}

            {modalStep === 'success' && !submitting && (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4 animate-float">🙏</div>
                <p className="text-[#FBDB8C] font-serif text-lg tracking-wide leading-relaxed">
                  {successMsg}
                </p>
                <button
                  onClick={closeModal}
                  className={commonStyles.buttonPrimary + ' mt-6 px-8 py-3 rounded-full'}
                >
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