import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { User, CircleDollarSign, Shapes, ShieldCheck, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../api/axios';
import { royalDashboardStyles } from '../styles/index.styles';

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, kycRes, donationsRes] = await Promise.all([
          api.get('/api/donations/my-stats'),
          api.get('/api/kyc/status').catch(() => ({ data: { status: 'PENDING' } })),
          api.get('/api/donations/my').catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data);
        setKycStatus(kycRes.data.status);
        setMyDonations(Array.isArray(donationsRes.data) ? donationsRes.data : []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060B28] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/Ganesha.jpeg" alt="Loading" className="w-16 h-16 rounded-full animate-pulse border-2 border-[#FBDB8C]/30" />
          <p className="text-[#FBDB8C] font-serif tracking-[0.2em] animate-pulse">REVEALING ROYAL PORTAL...</p>
        </div>
      </div>
    );
  }

  const statueNumbers = stats?.myStatueNumbers || [];
  const totalDonated = stats?.totalDonated || 0;

  const getKycStyle = (status) => {
    switch (status) {
      case 'APPROVED': return royalDashboardStyles.kycValueApproved;
      case 'SUBMITTED': return royalDashboardStyles.kycValueSubmitted;
      case 'REJECTED': return royalDashboardStyles.kycValueRejected;
      default: return royalDashboardStyles.kycValuePending;
    }
  };

  const getKycLabel = (status) => {
    switch (status) {
      case 'APPROVED': return 'VERIFIED';
      case 'SUBMITTED': return 'REVIEWING';
      case 'REJECTED': return 'REJECTED';
      default: return 'PENDING';
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'CONFIRMED') return <CheckCircle size={12} className="text-emerald-400" />;
    if (status === 'REJECTED') return <XCircle size={12} className="text-red-400" />;
    return <Clock size={12} className="text-[#FBDB8C]" />;
  };

  const getStatusColor = (status) => {
    if (status === 'CONFIRMED') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (status === 'REJECTED') return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-[#FBDB8C] bg-[#FBDB8C]/10 border-[#FBDB8C]/20';
  };

  return (
    <div className={royalDashboardStyles.container}>
      <div className={royalDashboardStyles.statsRow}>
        {/* Member Name */}
        <div className={royalDashboardStyles.card}>
          <div className={royalDashboardStyles.cardGlowTop} />
          <User className={royalDashboardStyles.cardIcon} />
          <p className={royalDashboardStyles.cardLabel}>MEMBER NAME:</p>
          <h3 className={royalDashboardStyles.cardValue}>{user?.fullName || 'DEVOTEE'}</h3>
          <div className={royalDashboardStyles.cardGlowBottom} />
        </div>

        {/* Total Donated */}
        <div className={royalDashboardStyles.card}>
          <div className={royalDashboardStyles.cardGlowTop} />
          <CircleDollarSign className={royalDashboardStyles.cardIcon} />
          <p className={royalDashboardStyles.cardLabel}>TOTAL DONATE AMOUNT:</p>
          <h3 className={royalDashboardStyles.cardValue}>₹{Number(totalDonated).toLocaleString('en-IN')}</h3>
          <div className={royalDashboardStyles.cardGlowBottom} />
        </div>

        {/* Statue Number */}
        <div className={royalDashboardStyles.card}>
          <div className={royalDashboardStyles.cardGlowTop} />
          <Shapes className={royalDashboardStyles.cardIcon} />
          <p className={royalDashboardStyles.cardLabel}>STATUE NUMBER:</p>
          <h3 className={royalDashboardStyles.cardValue}>
            {statueNumbers.length > 0 ? `#${statueNumbers[0]}` : '—'}
          </h3>
          <div className={royalDashboardStyles.cardGlowBottom} />
        </div>

        {/* KYC Status */}
        <div className={royalDashboardStyles.card}>
          <div className={royalDashboardStyles.cardGlowTop} />
          <ShieldCheck className={royalDashboardStyles.cardIcon} />
          <p className={royalDashboardStyles.cardLabel}>VALIDATION STATUS:</p>
          <h3 className={`${royalDashboardStyles.cardValue} ${getKycStyle(kycStatus)}`}>
            {getKycLabel(kycStatus)}
          </h3>
          <div className={royalDashboardStyles.cardGlowBottom} />
        </div>
      </div>

      {/* Main Content Box: Sacred Presence */}
      <div className={royalDashboardStyles.mainBox + " !items-center !justify-center"}>
        <div className="relative group p-4">
          {/* Enhanced Backdrop Glow */}
          <div className="absolute inset-0 bg-[#FBDB8C]/5 blur-[100px] scale-150 opacity-30 group-hover:opacity-60 transition-opacity duration-1000" />
          
          <div className="relative z-10 p-2 bg-gradient-to-b from-[#FBDB8C]/40 via-transparent to-[#FBDB8C]/40 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <img 
              src="/Ganesha.jpeg" 
              alt="Ganesha" 
              className="w-full max-w-[600px] h-auto rounded-[1.8rem] shadow-2xl opacity-90 group-hover:opacity-100 transition-all duration-1000 transform group-hover:scale-[1.02]" 
            />
          </div>

          {/* Bottom Caption Ornament */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/30 to-transparent" />
            <p className="text-[#FBDB8C]/40 text-xs font-serif italic tracking-[0.4em] uppercase">
              ॥ Om Gam Ganapataye Namaha ॥
            </p>
            <div className="w-2 h-2 rounded-full bg-[#FBDB8C]/20" />
          </div>
        </div>
      </div>

      {/* My Donations Section */}
      {myDonations.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-serif font-black text-[#FBDB8C] tracking-[0.2em] uppercase mb-6">
            My Seva Offerings
          </h2>
          <div className="bg-[#0A194E]/30 border border-[#FBDB8C]/10 rounded-[2rem] overflow-hidden shadow-xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-black/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Category</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Amount</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Date</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.2em]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myDonations.map((d) => (
                    <tr key={d.id} className="hover:bg-white/5 transition-all">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-white tracking-wide">{d.category_name || '—'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-base font-serif font-black text-[#FBDB8C]">₹{parseFloat(d.amount).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                          {new Date(d.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${getStatusColor(d.status)}`}>
                          {getStatusIcon(d.status)} {d.status || 'PENDING'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;