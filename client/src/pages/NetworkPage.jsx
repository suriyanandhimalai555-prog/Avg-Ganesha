import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { UserPlus } from 'lucide-react';
import { useSelector } from 'react-redux';

const NetworkPage = () => {
  const [inviteStats, setInviteStats] = useState(null);
  const [invitees, setInvitees] = useState([]);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const [statsRes] = await Promise.all([
          api.get('/api/invites/stats')
        ]);
        setInviteStats(statsRes.data);
      } catch (e) {
        console.error('Failed to load invite data', e);
      }
    };
    fetchData();
  }, []);

  const inviteCount = inviteStats?.invite_count || 0;
  const inviteCode = inviteStats?.invite_code || user.inviteCode || '—';

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-8 relative overflow-hidden shadow-sm animate-fade-in">
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-gs-teal to-transparent opacity-60" />

      <div className="flex flex-col items-center space-y-8">
        <h3 className="text-2xl font-serif text-gs-navy font-bold border-b border-gray-100 pb-4 w-full text-center">
          🐘 Your Invite Network
        </h3>

        {/* YOU Node */}
        <div className="relative z-10 mt-6">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-gs-teal shadow-[0_10px_30px_rgba(45,156,138,0.2)] flex items-center justify-center text-4xl z-20 relative">
            🕉️
          </div>
          <div className="absolute top-24 left-1/2 w-[3px] h-12 bg-gradient-to-b from-gs-teal to-transparent -translate-x-1/2 z-0 opacity-50" />
        </div>

        {/* Invite slots */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 relative z-10 w-full max-w-3xl shadow-inner">
          <p className="text-center text-xs text-gs-teal uppercase tracking-widest mb-6 font-bold">
            <UserPlus size={14} className="inline mr-1" />
            Devotees You Invited ({inviteCount})
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[...Array(Math.max(10, inviteCount))].map((_, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                  i < inviteCount
                    ? 'bg-gs-teal border-gs-teal text-white font-extrabold shadow-[0_5px_15px_rgba(45,156,138,0.3)]'
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {i < inviteCount ? '🙏' : i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Invite Code */}
        <div className="mt-4 px-8 py-4 bg-gs-teal/5 border border-gs-teal/20 rounded-full text-gs-navy font-mono text-lg tracking-widest shadow-sm">
          Your Invite Code: <span className="font-bold text-gs-teal ml-2">{inviteCode}</span>
        </div>

      </div>
    </div>
  );
};

export default NetworkPage;