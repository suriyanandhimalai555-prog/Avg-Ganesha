import React from 'react';
import { useSelector } from 'react-redux';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { royalDashboardStyles } from '../styles/index.styles';

const ProfilePage = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className={royalDashboardStyles.container}>
      <h1 className={royalDashboardStyles.headerTitle}>DEVOTEE PROFILE</h1>

      <div className="max-w-2xl mx-auto mt-12 space-y-6">
        <div className={royalDashboardStyles.card + " !h-auto !py-10 !flex-row !justify-start !text-left gap-8 px-10"}>
            <div className={royalDashboardStyles.cardGlowTop} />
            <div className="w-24 h-24 rounded-full border-4 border-[#FBDB8C]/30 bg-[#060B28] flex items-center justify-center overflow-hidden">
                <User size={48} className="text-[#FBDB8C]" />
            </div>
            <div>
                <h2 className="text-2xl font-serif font-bold text-white mb-1 uppercase tracking-widest">{user?.fullName || 'PRABU'}</h2>
                <p className="text-[#FBDB8C] text-xs font-bold tracking-[0.2em] uppercase">
                    MEMBER SINCE {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2026'}
                </p>
            </div>
            <div className={royalDashboardStyles.cardGlowBottom} />
        </div>

        <div className={royalDashboardStyles.mainBox + " !min-h-0 !flex-col !p-10 space-y-8"}>
            <div className="w-full flex items-center gap-6 group">
                <div className="p-3 rounded-xl bg-[#FBDB8C]/5 text-[#FBDB8C]">
                    <Mail size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-[#FBDB8C]/40 uppercase tracking-widest">Email Address</p>
                    <p className="text-white font-medium">{user?.email || 'devotee@example.com'}</p>
                </div>
            </div>

            <div className="w-full flex items-center gap-6 group">
                <div className="p-3 rounded-xl bg-[#FBDB8C]/5 text-[#FBDB8C]">
                    <Phone size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-[#FBDB8C]/40 uppercase tracking-widest">Phone Number</p>
                    <p className="text-white font-medium">{user?.phone || 'Not provided'}</p>
                </div>
            </div>

            <div className="w-full flex items-center gap-6 group opacity-50">
                <div className="p-3 rounded-xl bg-[#FBDB8C]/5 text-[#FBDB8C]">
                    <MapPin size={24} />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-[#FBDB8C]/40 uppercase tracking-widest">Location</p>
                    <p className="text-white font-medium italic">Not shared</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
