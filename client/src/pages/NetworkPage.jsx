import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useSelector } from 'react-redux';
import { Users, Share2, Copy, CheckCircle2 } from 'lucide-react';
import { royalDashboardStyles } from '../styles/index.styles';

const NetworkPage = () => {
  const [inviteStats, setInviteStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const res = await api.get('/api/invites/stats').catch(() => ({ data: null }));
        setInviteStats(res?.data || null);
      } catch (e) {
        console.error('Failed to load invite data', e);
      }
    };
    fetchData();
  }, [token]);

  const inviteCode = inviteStats?.invite_code || user.inviteCode || '';
  const inviteBaseUrl = useMemo(
    () => import.meta.env.VITE_CLIENT_URL || window.location.origin,
    []
  );
  const inviteLink = inviteCode
    ? `${inviteBaseUrl.replace(/\/+$/, '')}/register?invite=${encodeURIComponent(inviteCode)}`
    : `${inviteBaseUrl.replace(/\/+$/, '')}/register`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={royalDashboardStyles.container}>
      <h1 className={royalDashboardStyles.headerTitle}>YOUR DEVOTEE NETWORK</h1>

      <div className="max-w-2xl mx-auto space-y-8 mt-12">
        <div className={royalDashboardStyles.card + " !h-auto !py-10"}>
            <div className={royalDashboardStyles.cardGlowTop} />
            <Users className={royalDashboardStyles.cardIcon + " mb-4"} size={40} />
            <p className={royalDashboardStyles.cardLabel}>INVITE NEW DEVOTEES</p>
            <p className="text-white/40 text-xs px-10 leading-relaxed font-medium">
                Expand our spiritual community by sharing your unique invite link with friends and family.
            </p>
            <div className={royalDashboardStyles.cardGlowBottom} />
        </div>

        <div className={royalDashboardStyles.mainBox + " !min-h-0 !p-10 flex-col space-y-6"}>
            <div className="w-full">
                <p className="text-[10px] font-black text-[#FBDB8C]/40 uppercase tracking-[0.3em] mb-4 text-center">YOUR SACRED INVITE LINK</p>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                    <div className="flex-1 w-full bg-white/5 border border-[#FBDB8C]/10 rounded-2xl px-6 py-4 text-sm text-[#FBDB8C] font-mono break-all text-center sm:text-left">
                        {inviteLink}
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className={`p-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 min-w-[140px] uppercase font-bold text-xs tracking-widest ${
                            copied 
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" 
                            : "bg-[#FBDB8C]/10 text-[#FBDB8C] border border-[#FBDB8C]/30 hover:bg-[#FBDB8C]/20"
                        }`}
                    >
                        {copied ? (
                            <>
                                <CheckCircle2 size={18} />
                                COPIED
                            </>
                        ) : (
                            <>
                                <Copy size={18} />
                                COPY LINK
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="pt-6 border-t border-white/5 w-full">
                <button 
                  onClick={() => {
                    if (navigator.share) {
                        navigator.share({
                            title: 'Ganesha Seva - Join the Divine Portal',
                            text: 'I invite you to join Agilavetri Ganesha Seva and contribute to our sacred causes.',
                            url: inviteLink,
                        }).catch(console.error);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-gradient-to-r from-[#FCD34D] via-[#B45309] to-[#F59E0B] text-white font-black text-xs tracking-[0.3em] uppercase shadow-xl hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all active:scale-95"
                >
                    <Share2 size={18} />
                    SHARE INVITE
                </button>
            </div>
        </div>

        <div className="text-center opacity-20">
            <p className="text-[10px] font-black tracking-[0.4em] text-[#FBDB8C] uppercase">
                ॥ Expand the Divine Circle ॥
            </p>
        </div>
      </div>
    </div>
  );
};

export default NetworkPage;