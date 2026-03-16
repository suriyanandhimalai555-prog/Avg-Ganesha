import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Shield, FileText } from 'lucide-react';
import api from '../api/axios';
import { commonStyles, kycStyles } from '../styles/index.styles';

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
            <p className={kycStyles.uploadStatusText}>Ready to upload 🙏</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className={kycStyles.uploadIconInactive} size={32} />
            <p className={kycStyles.uploadPlaceholderText}>Click or Drag & Drop</p>
            <p className={kycStyles.uploadMimeText}>JPG, PNG or PDF</p>
          </div>
        )}
      </div>
    </div>
  );

  if (status === 'LOADING') {
    return <div className={kycStyles.loadingText}>🐘 ॥ श्री गणेशाय नमः ॥ Checking Status...</div>;
  }

  return (
    <div className={kycStyles.container}>
      <div className={kycStyles.header}>
        <div className={kycStyles.headerIconWrapper}>
          <Shield className="text-gs-teal" size={36} />
        </div>
        <h2 className={kycStyles.headerTitle}>Identity Verification</h2>
        <p className={kycStyles.headerSubtitle}>Complete your KYC to unlock full platform access as a verified devotee.</p>
      </div>

      {/* Status Card */}
      <div className={kycStyles.statusCard}>
        <div className={kycStyles.statusCardDecoration} />
        <div className={kycStyles.statusCardContent}>
          {status === 'APPROVED' ? (
            <CheckCircle className="text-[#10b981]" size={32} />
          ) : status === 'SUBMITTED' ? (
            <CheckCircle className="text-blue-500" size={32} />
          ) : status === 'REJECTED' ? (
            <AlertCircle className="text-red-500" size={32} />
          ) : (
            <AlertCircle className="text-gs-teal" size={32} />
          )}

          <div>
            <p className={kycStyles.statusLabel}>Verification Status</p>
            <p className={`${kycStyles.statusValue} ${
              status === 'APPROVED' ? kycStyles.statusValueApproved :
              status === 'SUBMITTED' ? kycStyles.statusValueSubmitted :
              status === 'REJECTED' ? kycStyles.statusValueRejected : kycStyles.statusValuePending
            }`}>
              {status === 'PENDING' && 'Pending Verification'}
              {status === 'SUBMITTED' && 'Under Review'}
              {status === 'APPROVED' && '✅ Verified Devotee'}
              {status === 'REJECTED' && '❌ Rejected — Please Resubmit'}
            </p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      {(status === 'PENDING' || status === 'REJECTED') && (
        <form onSubmit={handleSubmit} className={kycStyles.form}>

          {status === 'REJECTED' && (
            <div className={kycStyles.rejectionBox}>
              <p className={kycStyles.rejectionTitle}>Your previous submission was rejected.</p>
              {rejectionReason && <p className={kycStyles.rejectionReason}>{rejectionReason}</p>}
              <p className="mt-2 text-red-600">Please ensure your ID is clear and try again.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FileUploadBox label="Government ID (Front)" file={fileFront} setFile={setFileFront} />
            <FileUploadBox label="Government ID (Back)" file={fileBack} setFile={setFileBack} />
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
            {loading ? '🙏 Submitting Documents...' : 'Submit Documents for Verification'}
          </button>
        </form>
      )}

      {status === 'SUBMITTED' && (
        <div className={kycStyles.infoCard}>
          <div className="text-5xl mb-4">🕉️</div>
          <p className={kycStyles.infoTitle}>Your documents are being reviewed by our team.</p>
          <p className={kycStyles.infoSubtitle}>This usually takes 24–48 hours. Thank you for your patience, devotee.</p>
        </div>
      )}

      {status === 'APPROVED' && (
        <div className={kycStyles.successCard}>
          <div className="text-5xl mb-4">✅</div>
          <p className={kycStyles.successTitle}>You are a verified devotee of Ganesha Seva.</p>
          <p className={kycStyles.successSubtitle}>You now have full access to all platform features.</p>
        </div>
      )}
    </div>
  );
};

export default KycPage;