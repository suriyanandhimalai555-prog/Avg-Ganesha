import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { User, CircleDollarSign, Shapes, ShieldCheck, CheckCircle, Clock, XCircle, Coins } from 'lucide-react';
import api from '../api/axios';
import { royalDashboardStyles } from '../styles/index.styles';
import LoadingScreen from '../components/LoadingScreen';
import {
  AVG_COIN_USD_PRICE,
  AVG_COIN_INR_PRICE,
  avgToUsd,
  avgToInr,
  formatUsd,
  formatUsdRate,
  formatInr,
  formatInrRate,
} from '../config/coins';

// Pick a font-size class for the MEMBER NAME card so long names don't overflow the card.
const nameSizeClass = (name) => {
  const len = (name || '').trim().length;
  if (len <= 8)  return 'text-2xl';
  if (len <= 12) return 'text-xl';
  if (len <= 18) return 'text-base';
  return 'text-sm';
};

// Live countdown to a target Date. Returns y/d/h/m/s remaining (or all zeros once unlocked).
const useCountdown = (targetDate) => {
  const compute = () => {
    if (!targetDate) return null;
    const now = Date.now();
    const target = new Date(targetDate).getTime();
    let diff = Math.max(0, target - now);
    const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
    diff -= years * 365.25 * 24 * 3600 * 1000;
    const days = Math.floor(diff / (24 * 3600 * 1000));
    diff -= days * 24 * 3600 * 1000;
    const hours = Math.floor(diff / (3600 * 1000));
    diff -= hours * 3600 * 1000;
    const minutes = Math.floor(diff / (60 * 1000));
    diff -= minutes * 60 * 1000;
    const seconds = Math.floor(diff / 1000);
    const unlocked = new Date(targetDate).getTime() <= now;
    return { years, days, hours, minutes, seconds, unlocked };
  };

  const [remaining, setRemaining] = useState(compute);

  useEffect(() => {
    if (!targetDate) return;
    setRemaining(compute());
    const id = setInterval(() => setRemaining(compute()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  return remaining;
};

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [myDonations, setMyDonations] = useState([]);
  const [coins, setCoins] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, kycRes, donationsRes, coinsRes] = await Promise.all([
          api.get('/api/donations/my-stats'),
          api.get('/api/kyc/status').catch(() => ({ data: { status: 'PENDING' } })),
          api.get('/api/donations/my').catch(() => ({ data: [] })),
          api.get('/api/donations/my-coins').catch(() => ({ data: null })),
        ]);
        setStats(statsRes.data);
        setKycStatus(kycRes.data.status);
        setMyDonations(Array.isArray(donationsRes.data) ? donationsRes.data : []);
        setCoins(coinsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const coinCountdown = useCountdown(coins?.nextUnlockAt);

  if (loading) {
    return <LoadingScreen message="Revealing Royal Portal..." />;
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
      {/* ── Admin Review Indicators ── */}
      {(kycStatus === 'SUBMITTED' || myDonations.some(d => d.status === 'PENDING')) && (
        <div className="mb-8 p-6 rounded-2xl bg-[#0A194E]/40 border border-[#FBDB8C]/20 flex flex-col gap-4 shadow-[0_0_30px_rgba(251,219,140,0.1)] backdrop-blur-md">
          {kycStatus === 'SUBMITTED' && (
            <div className="flex items-center gap-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <p className="text-blue-400 text-xs font-black uppercase tracking-widest">
                An administrator is currently reviewing your KYC verification.
              </p>
            </div>
          )}
          {myDonations.some(d => d.status === 'PENDING') && (
            <div className="flex items-center gap-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FBDB8C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FCB045]"></span>
              </span>
              <p className="text-[#FBDB8C] text-xs font-black uppercase tracking-widest">
                Your recent Seva offering payment is pending administrative verification.
              </p>
            </div>
          )}
        </div>
      )}

      <div className={royalDashboardStyles.statsRow}>
        {/* Member Name */}
        <div className={royalDashboardStyles.card}>
          <div className={royalDashboardStyles.cardGlowTop} />
          <User className={royalDashboardStyles.cardIcon} />
          <p className={royalDashboardStyles.cardLabel}>MEMBER NAME:</p>
          <h3
            className={`${royalDashboardStyles.cardValueName} ${nameSizeClass(user?.fullName)}`}
            title={user?.fullName || 'DEVOTEE'}
          >
            {user?.fullName || 'DEVOTEE'}
          </h3>
          <div className={royalDashboardStyles.cardGlowBottom} />
        </div>

        {/* Total Donated */}
        <div className={royalDashboardStyles.card}>
          <div className={royalDashboardStyles.cardGlowTop} />
          <CircleDollarSign className={royalDashboardStyles.cardIcon} />
          <p className={royalDashboardStyles.cardLabel}>TOTAL DONATE AMOUNT:</p>
          <h3 className={royalDashboardStyles.cardValueNumber}>
            <span className="text-white/50 mr-0.5 font-normal">₹</span>
            {Number(totalDonated).toLocaleString('en-IN')}
          </h3>
          <div className={royalDashboardStyles.cardGlowBottom} />
        </div>

        {/* Statue Number */}
        <div className={royalDashboardStyles.card}>
          <div className={royalDashboardStyles.cardGlowTop} />
          <Shapes className={royalDashboardStyles.cardIcon} />
          <p className={royalDashboardStyles.cardLabel}>STATUE NUMBER:</p>
          <h3 className={royalDashboardStyles.cardValueNumber}>
            {statueNumbers.length > 0 ? (
              <>
                <span className="text-white/50 mr-0.5 font-normal">#</span>
                {statueNumbers[0]}
              </>
            ) : (
              <span className="text-white/30">—</span>
            )}
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

      {/* AVG Coins reward + 5-year unlock timer */}
      {coins && coins.totalBalance > 0 && (
        <div className="mb-12 relative bg-gradient-to-br from-[#0A194E] via-[#0A194E]/80 to-[#040924] border border-[#FBDB8C]/30 rounded-2xl p-6 md:p-8 shadow-[0_0_40px_rgba(251,219,140,0.15)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/60 to-transparent" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FBDB8C]/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 bg-[#FBDB8C]/20 blur-2xl rounded-full" />
                <Coins className="relative w-14 h-14 text-[#FBDB8C] drop-shadow-[0_0_10px_rgba(251,219,140,0.6)]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-[10px] font-black text-[#FBDB8C]/60 uppercase tracking-[0.3em]">
                    AVG Coins
                  </p>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold tabular-nums tracking-tight">
                    {formatUsdRate(AVG_COIN_USD_PRICE)} / AVG
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[9px] font-bold tabular-nums tracking-tight">
                    {formatInrRate(AVG_COIN_INR_PRICE)} / AVG
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-sans font-bold text-white tabular-nums tracking-tight leading-none">
                  {Number(coins.totalBalance).toLocaleString('en-IN')}{' '}
                  <span className="text-sm md:text-base font-serif font-semibold text-[#FBDB8C]/70 tracking-widest uppercase ml-1">
                    AVG
                  </span>
                </h3>
                <p className="text-xs md:text-sm font-sans font-medium text-white/60 tabular-nums tracking-tight mt-1.5">
                  <span className="text-white/30 mr-1">≈</span>
                  {formatUsd(avgToUsd(coins.totalBalance))}
                  <span className="text-white/30 text-[10px] font-bold tracking-widest uppercase ml-1.5">USD</span>
                </p>
                <p className="text-xs md:text-sm font-sans font-medium text-orange-300/80 tabular-nums tracking-tight mt-0.5">
                  <span className="text-orange-300/40 mr-1">≈</span>
                  {formatInr(avgToInr(coins.totalBalance))}
                  <span className="text-orange-300/40 text-[10px] font-bold tracking-widest uppercase ml-1.5">INR</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3">
              <span className="text-[10px] font-black text-[#FBDB8C]/70 uppercase tracking-[0.3em]">
                Unlocks In
              </span>
              {coinCountdown && !coinCountdown.unlocked ? (
                <div className="flex items-stretch gap-2">
                  {[
                    { label: 'Years',   value: coinCountdown.years },
                    { label: 'Days',    value: coinCountdown.days },
                    { label: 'Hours',   value: coinCountdown.hours },
                    { label: 'Minutes', value: coinCountdown.minutes },
                    { label: 'Seconds', value: coinCountdown.seconds },
                  ].map((seg, idx, arr) => (
                    <div key={seg.label} className="flex items-stretch gap-2">
                      <div className="flex flex-col items-center justify-center px-3 py-2 min-w-[56px] bg-black/30 border border-[#FBDB8C]/15 rounded-xl backdrop-blur-sm">
                        <span className="text-xl md:text-2xl font-sans font-semibold text-white tabular-nums tracking-tight leading-none">
                          {String(seg.value).padStart(2, '0')}
                        </span>
                        <span className="text-[8px] font-bold text-[#FBDB8C]/50 tracking-[0.15em] uppercase mt-1.5">
                          {seg.label}
                        </span>
                      </div>
                      {idx < arr.length - 1 && (
                        <span className="self-center text-[#FBDB8C]/20 text-xl font-light leading-none">:</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-black uppercase tracking-[0.25em]">
                  ● Available
                </span>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/60 to-transparent" />
        </div>
      )}

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
                        <span className="text-base font-sans font-semibold text-[#FBDB8C] tabular-nums tracking-tight">
                          <span className="text-[#FBDB8C]/60 mr-0.5">₹</span>
                          {parseFloat(d.amount).toLocaleString('en-IN')}
                        </span>
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