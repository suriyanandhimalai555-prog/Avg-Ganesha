import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { useSelector } from 'react-redux';

const NetworkPage = () => {
  const [inviteStats, setInviteStats] = useState(null);
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

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm animate-fade-in max-w-2xl mx-auto">
      <h3 className="text-2xl font-serif text-gs-navy font-bold mb-4 text-center">
        🐘 Your Invite Network
      </h3>
      <p className="text-sm text-gray-500 text-center mb-6">
        Share this link with friends and family to invite them to Ganesha Seva.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <input
          type="text"
          readOnly
          value={inviteLink}
          className="flex-1 w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700"
        />
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(inviteLink)}
          className="px-4 py-2.5 rounded-xl bg-gs-teal text-white font-bold hover:bg-[#1A7566] transition-colors w-full sm:w-auto"
        >
          Copy invite link
        </button>
      </div>
    </div>
  );
};

export default NetworkPage;