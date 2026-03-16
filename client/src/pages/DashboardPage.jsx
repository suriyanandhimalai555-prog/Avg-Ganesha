import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { API_ROUTES } from '../config/api';
import { Shield, Heart, Award } from 'lucide-react';
import { useSelector } from 'react-redux';
import { commonStyles, dashboardStyles } from '../styles/index.styles';

const DashboardPage = () => {
  const [inviteStats, setInviteStats] = useState(null);
  const [donationStats, setDonationStats] = useState(null);
  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const [invRes, donRes, kycRes] = await Promise.all([
          api.get('/api/invites/stats').catch(() => ({ data: null })),
          api.get(API_ROUTES.DONATIONS.MY_STATS).catch(() => ({ data: null })),
          api.get('/api/kyc/status').catch(() => ({ data: { status: 'PENDING' } })),
        ]);
        setInviteStats(invRes?.data || null);
        setDonationStats(donRes?.data || null);
        setKycStatus(kycRes?.data?.status || 'PENDING');
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const getDevoteeLevel = (count = 0) => {
    if (count >= 10) return { label: 'Maha Bhakta', emoji: '🌟', gradient: dashboardStyles.levelGradientGold, border: dashboardStyles.levelBorderGold, glow: dashboardStyles.levelGlowGold, textColor: 'text-yellow-900' };
    if (count >= 5)  return { label: 'Uttama Seva', emoji: '🪷',  gradient: dashboardStyles.levelGradientTeal, border: dashboardStyles.levelBorderTeal, glow: dashboardStyles.levelGlowTeal, textColor: 'text-white' };
    if (count >= 2)  return { label: 'Seva Ratna',  emoji: '✨',  gradient: dashboardStyles.levelGradientMint, border: dashboardStyles.levelBorderMint, glow: dashboardStyles.levelGlowMint, textColor: 'text-white' };
    return             { label: 'Nava Bhakta',  emoji: '🕉️',  gradient: dashboardStyles.levelGradientGray, border: dashboardStyles.levelBorderGray, glow: dashboardStyles.levelGlowNone, textColor: 'text-gray-600' };
  };

  const inviteCount = inviteStats?.invite_count || 0;
  const level = getDevoteeLevel(inviteCount);

  const InfoCard = ({ title, value, colorClass = 'text-gs-teal' }) => (
    <div className={dashboardStyles.infoCard}>
      <p className={dashboardStyles.infoCardLabel}>{title}</p>
      <p className={`${dashboardStyles.infoCardValue} ${colorClass}`}>{value}</p>
    </div>
  );

  if (loading) return (
    <div className={dashboardStyles.loadingContainer}>
      🐘 ॥ அகில வெற்றி கணேஷா ॥
    </div>
  );

  return (
    <div className={dashboardStyles.container}>

      {/* Stats Row */}
      <div className={dashboardStyles.statsRow}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard title="Devotee Name" value={user.fullName || 'Devotee'} colorClass="text-gs-navy" />
          <div className={dashboardStyles.infoCard}>
            <p className={dashboardStyles.infoCardLabel}>KYC Status</p>
            <div className="flex items-center gap-2">
              <span className={`${dashboardStyles.statusBadgeBase} ${
                kycStatus === 'APPROVED' ? dashboardStyles.statusBadgeApproved :
                kycStatus === 'SUBMITTED' ? dashboardStyles.statusBadgeSubmitted :
                kycStatus === 'REJECTED' ? dashboardStyles.statusBadgeRejected : dashboardStyles.statusBadgePending
              }`}>
                {kycStatus || 'PENDING'}
              </span>
              {(kycStatus === 'PENDING' || kycStatus === 'REJECTED') && (
                <Link to="/dashboard/kyc" className="text-xs text-gs-teal font-bold hover:underline">Verify</Link>
              )}
            </div>
          </div>
        </div>

        {/* Level Badge */}
        <div className={dashboardStyles.badgeWrapper}>
          <div className={`${dashboardStyles.badgeBase} ${level.border} ${level.glow}`}>
            <div className={`${dashboardStyles.badgeOverlay} ${level.gradient}`} />
            <div className={dashboardStyles.badgeContent}>
              <div className="text-3xl mb-1">{level.emoji}</div>
              <p className={`${dashboardStyles.badgeStatusLabel} ${level.textColor}`}>STATUS</p>
              <p className={`${dashboardStyles.badgeStatusValue} ${level.textColor}`}>{level.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Stats */}
      {donationStats && (
        <div className={dashboardStyles.donationStatsGrid}>
          <div className={dashboardStyles.donationCard}>
            <div className={`${dashboardStyles.donationIconWrapper} bg-gs-teal/10`}>
              <Heart className="text-gs-teal" size={24} />
            </div>
            <div>
              <p className={dashboardStyles.donationLabel}>Total Donated</p>
              <p className={dashboardStyles.donationValue}>₹{(donationStats.totalDonated ?? 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className={dashboardStyles.donationCard}>
            <div className={`${dashboardStyles.donationIconWrapper} bg-gs-gold/10`}>
              <Award className="text-gs-gold" size={24} />
            </div>
            <div>
              <p className={dashboardStyles.donationLabel}>Your 1.5 Ft Statues</p>
              <p className={dashboardStyles.donationValue}>{donationStats.statue15FtCount ?? 0}</p>
            </div>
          </div>
          {donationStats.breakdown?.length > 0 ? (
            <div className={dashboardStyles.breakdownCard}>
              <p className={dashboardStyles.breakdownTitle}>Donation Breakdown</p>
              <ul className="space-y-2 text-sm">
                {donationStats.breakdown.slice(0, 5).map((b, i) => (
                  <li key={i} className={dashboardStyles.breakdownItem}>
                    <span className="text-gs-navy truncate mr-2">{b.categoryName}</span>
                    <span className={dashboardStyles.breakdownValue}>₹{(b.total ?? 0).toLocaleString('en-IN')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center justify-center">
              <Link to="/donate" className="text-gs-teal font-bold hover:underline">Donate to a cause →</Link>
            </div>
          )}
        </div>
      )}

      {/* Ganesha Hero Image */}
      <div className={dashboardStyles.heroWrapper}>
        <div className={dashboardStyles.heroCard}>
          <div className={dashboardStyles.heroOverlay} />
          <div className={dashboardStyles.heroContent}>
            <div className={dashboardStyles.heroEmoji}>🐘</div>
            <p className={dashboardStyles.heroTitle}>Lord Ganesha</p>
            <p className={dashboardStyles.heroSubtitle}>Vighnaharta — Remover of Obstacles</p>
            <div className={dashboardStyles.heroBadge}>
              <p className={dashboardStyles.heroBadgeText}>॥ அகில வெற்றி கணேஷா ॥</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;