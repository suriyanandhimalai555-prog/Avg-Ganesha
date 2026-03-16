import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Shield, FileText } from 'lucide-react';
import api from '../api/axios';
import { kycStyles } from '../styles/index.styles';

const KycPage = () => {
  const [fileFront, setFileFront] = useState(null);
  const [fileBack, setFileBack] = useState(null);
  const [status, setStatus] = useState('LOADING');
  const [rejectionReason, setRejectionReason] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/api/kyc/status');
        setStatus(res.data.status || 'PENDING');
        setRejectionReason(res.data.rejectionReason);
      } catch (err) {
        console.error('Failed to fetch KYC status', err);
        setStatus('PENDING');
      }
    };
    fetchStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileFront || !fileBack) return alert('Please upload both front and back of your ID.');

    setLoading(true);
    const formData = new FormData();
    formData.append('idFront', fileFront);
    formData.append('idBack', fileBack);

    try {
      await api.post('/api/kyc/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('SUBMITTED');
    } catch (err) {
      console.error(err);
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const FileUploadBox = ({ label, file, setFile }) => (
    <div className={kycStyles.inputGroup}>
      <label className={kycStyles.inputLabel}>{label}</label>
      <div className={`${kycStyles.uploadBoxBase} ${file ? kycStyles.uploadBoxActive : kycStyles.uploadBoxInactive}`}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} className={kycStyles.fileInput} />
        {file ? (
          <div className="flex flex-col items-center">
            <FileText className={kycStyles.uploadIconActive} size={32} />
            <p className={kycStyles.uploadFileName}>{file.name}</p>
            <p className={kycStyles.uploadStatusText}>SACRED ID PREPARED 🙏</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className={kycStyles.uploadIconInactive} size={32} />
            <p className={kycStyles.uploadPlaceholderText}>TOUCH OR DRAG DOCUMENT</p>
            <p className={kycStyles.uploadMimeText}>JPG, PNG OR PDF</p>
          </div>
        )}
      </div>
    </div>
  );

  if (status === 'LOADING') {
    return (
      <div className="min-h-screen bg-[#060B28] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/Ganesha.jpeg" alt="Loading" className="w-16 h-16 rounded-full animate-pulse border-2 border-[#FBDB8C]/30" />
          <p className="text-[#FBDB8C] font-serif tracking-[0.2em] animate-pulse uppercase">READING DEVOTEE STATUS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={kycStyles.container + " overflow-y-auto"}>
      <div className={kycStyles.header}>
        <div className={kycStyles.headerIconWrapper}>
          <Shield className="text-[#FBDB8C]" size={36} />
        </div>
        <h2 className={kycStyles.headerTitle}>DEVOTEE VALIDATION</h2>
        <p className={kycStyles.headerSubtitle}>Verify your identity to unlock full access to the Royal Portal.</p>
      </div>

      {/* Status Card */}
      <div className={kycStyles.statusCard}>
        <div className={kycStyles.statusCardDecoration} />
        <div className={kycStyles.statusCardContent}>
          {status === 'APPROVED' ? (
            <CheckCircle className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]" size={40} />
          ) : status === 'SUBMITTED' ? (
            <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : status === 'REJECTED' ? (
            <AlertCircle className="text-red-400" size={40} />
          ) : (
            <Shield className="text-[#FBDB8C]/40" size={40} />
          )}

          <div>
            <p className={kycStyles.statusLabel}>VALIDATION PROGRESS:</p>
            <p className={`${kycStyles.statusValue} ${
              status === 'APPROVED' ? kycStyles.statusValueApproved :
              status === 'SUBMITTED' ? kycStyles.statusValueSubmitted :
              status === 'REJECTED' ? kycStyles.statusValueRejected : kycStyles.statusValuePending
            }`}>
              {status === 'PENDING' && 'PENDING SUBMISSION'}
              {status === 'SUBMITTED' && 'UNDER ROYAL REVIEW'}
              {status === 'APPROVED' && 'VERIFIED DEVOTEE'}
              {status === 'REJECTED' && 'RESUBMISSION REQUIRED'}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      {(status === 'PENDING' || status === 'REJECTED') && (
        <form onSubmit={handleSubmit} className={kycStyles.form}>

          {status === 'REJECTED' && (
            <div className={kycStyles.rejectionBox}>
              <p className={kycStyles.rejectionTitle}>PREVIOUS ATTEMPT DECLINED</p>
              {rejectionReason && <p className={kycStyles.rejectionReason}>Reason: {rejectionReason}</p>}
              <p className="mt-3 opacity-60">Please ensure the document is clear and matches your profile details.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FileUploadBox label="GOVERNMENT ID (FRONT)" file={fileFront} setFile={setFileFront} />
            <FileUploadBox label="GOVERNMENT ID (BACK)" file={fileBack} setFile={setFileBack} />
          </div>

          <button
            type="submit"
            disabled={!fileFront || !fileBack || loading}
            className={`${kycStyles.submitBtnBase} ${
              (!fileFront || !fileBack || loading)
                ? kycStyles.submitBtnDisabled
                : kycStyles.submitBtnEnabled
            }`}
          >
            {loading ? 'SUBMITTING TO TEMPLE...' : 'SUBMIT FOR VALIDATION'}
          </button>
        </form>
      )}

      {status === 'SUBMITTED' && (
        <div className={kycStyles.infoCard}>
          <div className="text-5xl mb-6">🕉️</div>
          <p className={kycStyles.infoTitle}>DOCUMENTS UNDER REVIEW</p>
          <p className={kycStyles.infoSubtitle}>Our administrators are validating your identity. Please return in 24 hours.</p>
        </div>
      )}

      {status === 'APPROVED' && (
        <div className={kycStyles.successCard}>
          <div className="text-5xl mb-6">🔱</div>
          <p className={kycStyles.successTitle}>IDENTITY FULLY VERIFIED</p>
          <p className={kycStyles.successSubtitle}>You are now recognized as a lifetime verified devotee in our portal.</p>
        </div>
      )}
    </div>
  );
};

export default KycPage;