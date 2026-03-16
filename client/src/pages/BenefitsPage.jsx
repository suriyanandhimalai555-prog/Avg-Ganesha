import React from 'react';
import { Gift, Award, Star, Zap } from 'lucide-react';
import { royalDashboardStyles } from '../styles/index.styles';

const BenefitsPage = () => {
  const benefits = [
    { title: 'Priority Seva', desc: 'Get priority access to special poojas and festivals.', icon: <Award className="w-8 h-8 text-[#FBDB8C]" /> },
    { title: 'Devotee Badge', desc: 'Exclusive digital badges based on your contribution level.', icon: <Star className="w-8 h-8 text-[#FBDB8C]" /> },
    { title: 'Temple Updates', desc: 'Fast-track notifications about temple events and news.', icon: <Zap className="w-8 h-8 text-[#FBDB8C]" /> },
    { title: 'Special Recognition', desc: 'Your name featured on our digital donor wall.', icon: <Gift className="w-8 h-8 text-[#FBDB8C]" /> },
  ];

  return (
    <div className={royalDashboardStyles.container}>
      <h1 className={royalDashboardStyles.headerTitle}>EXCLUSSIVE DEVOTEE BENIFITS</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
        {benefits.map((b, i) => (
          <div key={i} className={royalDashboardStyles.card + " !h-auto !py-10"}>
            <div className={royalDashboardStyles.cardGlowTop} />
            <div className="mb-4">{b.icon}</div>
            <h3 className="text-xl font-serif font-bold text-[#FBDB8C] mb-2">{b.title}</h3>
            <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed">{b.desc}</p>
            <div className={royalDashboardStyles.cardGlowBottom} />
          </div>
        ))}
      </div>

      <div className={royalDashboardStyles.mainBox + " mt-12 !min-h-[200px]"}>
        <p className="text-[#FBDB8C]/40 font-serif italic text-center p-8">
          More benefits are being added as our community grows. Stay tuned, Devotee.
        </p>
      </div>
    </div>
  );
};

export default BenefitsPage;
