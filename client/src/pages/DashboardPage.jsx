import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Star, Users, Heart, UserPlus } from 'lucide-react';
import { useSelector } from 'react-redux';

const DashboardPage = () => {
  const [inviteStats, setInviteStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/api/invites/stats');
        setInviteStats(res.data);
      } catch (err) {
        console.error('Failed to load invite stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDevoteeLevel = (count = 0) => {
    if (count >= 10) return { label: 'Maha Bhakta', emoji: '🌟', gradient: 'bg-gradient-to-br from-yellow-400 via-gs-gold to-yellow-600', border: 'border-gs-gold', glow: 'shadow-[0_0_30px_rgba(212,175,55,0.4)]', textColor: 'text-yellow-900' };
    if (count >= 5)  return { label: 'Uttama Seva', emoji: '🪷',  gradient: 'bg-gradient-to-br from-gs-teal via-[#1A7566] to-gs-navy',   border: 'border-gs-teal', glow: 'shadow-[0_0_30px_rgba(45,156,138,0.4)]', textColor: 'text-white' };
    if (count >= 2)  return { label: 'Seva Ratna',  emoji: '✨',  gradient: 'bg-gradient-to-br from-[#4DB6AC] to-gs-teal', border: 'border-[#4DB6AC]',  glow: 'shadow-[0_0_30px_rgba(77,182,172,0.4)]', textColor: 'text-white' };
    return             { label: 'Nava Bhakta',  emoji: '🕉️',  gradient: 'bg-gradient-to-br from-gray-100 to-gray-200',                   border: 'border-gray-300',   glow: 'shadow-none',                                textColor: 'text-gray-600' };
  };

  const inviteCount = inviteStats?.invite_count || 0;
  const level = getDevoteeLevel(inviteCount);

  const InfoCard = ({ title, value, colorClass = 'text-gs-teal' }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all duration-300 cursor-default h-32">
      <p className="text-gray-400 text-xs uppercase tracking-[0.2em] font-bold mb-3">{title}</p>
      <p className={`text-3xl font-bold font-serif ${colorClass}`}>{value}</p>
    </div>
  );

  if (loading) return (
    <div className="text-gs-teal animate-pulse text-xl font-serif tracking-widest text-center mt-20">
      🐘 ॥ श्री गणेशाय नमः ॥
    </div>
  );

  return (
    <div className="animate-fade-in space-y-8">

      {/* Stats Row */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard title="Devotee Name" value={user.fullName || 'Devotee'} colorClass="text-gs-navy" />
          <InfoCard title="Invite Count" value={inviteCount} colorClass="text-gs-teal" />
          <InfoCard title="Your Invite Code" value={inviteStats?.invite_code || user.inviteCode || '—'} colorClass="text-[#1A7566]" />
        </div>

        {/* Level Badge */}
        <div className="w-full lg:w-auto flex justify-center items-center">
          <div className={`relative w-36 h-36 rounded-full p-1 flex items-center justify-center border-4 bg-white ${level.border} ${level.glow} shadow-sm transition-all duration-700`}>
            <div className={`absolute inset-2 rounded-full ${level.gradient} opacity-20 pointer-events-none`} />
            <div className="text-center z-10 relative">
              <div className="text-3xl mb-1">{level.emoji}</div>
              <p className={`text-[9px] font-extrabold uppercase tracking-widest ${level.textColor} opacity-70`}>STATUS</p>
              <p className={`text-[11px] font-black ${level.textColor} leading-tight`}>{level.label}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Network mini-section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gs-teal/10 flex items-center justify-center text-gs-teal">
            <UserPlus size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Devotees You've Invited</p>
            <p className="text-3xl font-bold font-serif text-gs-navy">{inviteCount}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-gs-gold/10 flex items-center justify-center text-gs-gold text-2xl">
            🕉️
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">Daily Mantra</p>
            <p className="text-sm text-gs-navy font-serif italic font-medium tracking-wide">॥ ॐ गं गणपतये नमः ॥</p>
          </div>
        </div>
      </div>

      {/* Ganesha Hero Image */}
      <div className="flex justify-center mt-8">
        <div className="relative w-full max-w-3xl rounded-3xl border border-gs-teal/20 bg-white shadow-[0_10px_40px_rgba(45,156,138,0.08)] overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-gs-teal/5 to-transparent pointer-events-none" />
          <div className="w-full h-72 flex flex-col items-center justify-center relative z-10">
            <div className="text-8xl animate-float">🐘</div>
            <p className="text-gs-navy font-serif font-bold text-2xl mt-4">Lord Ganesha</p>
            <p className="text-gray-500 text-sm mt-1 mb-3">Vighnaharta — Remover of Obstacles</p>
            <div className="px-6 py-2 bg-gs-teal/10 rounded-full">
              <p className="text-gs-teal text-xs font-serif font-bold tracking-widest">॥ श्री गणेशाय नमः ॥</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;