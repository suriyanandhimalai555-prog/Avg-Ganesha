import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Shield, FileText } from 'lucide-react';
import api from '../api/axios';

const KycPage = () => {
  const [fileFront, setFileFront] = useState(null);
  const [fileBack, setFileBack] = useState(null);
  const [status, setStatus] = useState('LOADING');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/api/kyc/status');
        setStatus(res.data.status || 'PENDING');
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
    <div className="space-y-3">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 relative group cursor-pointer ${file ? 'border-gs-teal bg-gs-teal/5' : 'border-gray-300 bg-gray-50 hover:border-gs-teal hover:bg-gs-teal/5'}`}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        {file ? (
          <div className="flex flex-col items-center">
            <FileText className="text-gs-teal mb-3" size={32} />
            <p className="text-gs-navy font-bold truncate w-full px-4">{file.name}</p>
            <p className="text-xs text-gs-teal mt-1 font-medium">Ready to upload 🙏</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="text-gray-400 group-hover:text-gs-teal transition-colors mb-3" size={32} />
            <p className="text-gray-500 group-hover:text-gs-navy font-medium transition-colors">Click or Drag & Drop</p>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG or PDF</p>
          </div>
        )}
      </div>
    </div>
  );

  if (status === 'LOADING') {
    return <div className="text-gs-teal text-center font-serif text-xl tracking-widest mt-20 animate-pulse">🐘 ॥ श्री गणेशाय नमः ॥ Checking Status...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto border-4 border-gs-teal/20 shadow-sm">
          <Shield className="text-gs-teal" size={36} />
        </div>
        <h2 className="text-3xl font-serif text-gs-navy font-bold tracking-wide">Identity Verification</h2>
        <p className="text-gray-500 text-sm">Complete your KYC to unlock full platform access as a verified devotee.</p>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 w-1 h-full bg-gs-teal opacity-50" />
        <div className="flex items-center gap-5 relative z-10 pl-2">
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
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">Verification Status</p>
            <p className={`text-xl font-bold font-serif ${
              status === 'APPROVED' ? 'text-[#10b981]' :
              status === 'SUBMITTED' ? 'text-blue-600' :
              status === 'REJECTED' ? 'text-red-600' : 'text-gs-teal'
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
        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-3xl p-8 space-y-8 shadow-sm">

          {status === 'REJECTED' && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-sm text-center font-medium">
              Your previous submission was rejected. Please ensure your ID is clear and try again.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FileUploadBox label="Government ID (Front)" file={fileFront} setFile={setFileFront} />
            <FileUploadBox label="Government ID (Back)" file={fileBack} setFile={setFileBack} />
          </div>

          <button
            type="submit"
            disabled={!fileFront || !fileBack || loading}
            className={`w-full py-4 rounded-full font-bold text-sm tracking-widest uppercase transition-all duration-300 shadow-md ${
              (!fileFront || !fileBack || loading)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-gs-teal hover:bg-[#1A7566] text-white hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {loading ? '🙏 Submitting Documents...' : 'Submit Documents for Verification'}
          </button>
        </form>
      )}

      {status === 'SUBMITTED' && (
        <div className="text-center p-10 bg-white border border-gray-100 shadow-sm rounded-3xl animate-pulse">
          <div className="text-5xl mb-4">🕉️</div>
          <p className="text-gs-teal font-serif text-xl font-bold mb-2">Your documents are being reviewed by our team.</p>
          <p className="text-gray-500 text-sm">This usually takes 24–48 hours. Thank you for your patience, devotee.</p>
        </div>
      )}

      {status === 'APPROVED' && (
        <div className="text-center p-10 bg-[#f0fdf4] border border-[#bbf7d0] shadow-sm rounded-3xl">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-[#16a34a] font-serif font-bold text-xl mb-2">You are a verified devotee of Ganesha Seva.</p>
          <p className="text-[#15803d] text-sm">You now have full access to all platform features.</p>
        </div>
      )}
    </div>
  );
};

export default KycPage;