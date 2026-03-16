import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { commonStyles, plansStyles } from '../styles/index.styles';

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ganesha-themed style mapping
  const getStyle = (element) => {
    const styles = {
      'Modak': {
        icon: <span className="text-5xl drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">🍬</span>,
        gradient: 'from-[#FCD34D]/20 via-[#B45309]/10 to-transparent',
        textColor: 'text-[#FCD34D]',
        bulletBg: 'bg-[#FCD34D]/10',
        bulletColor: 'text-[#FCD34D]',
        btnGradient: 'from-[#FCD34D] via-[#B45309] to-[#F59E0B]',
      },
      'Lotus': {
        icon: <span className="text-5xl drop-shadow-[0_0_10px_rgba(244,114,182,0.3)]">🪷</span>,
        gradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
        textColor: 'text-pink-400',
        bulletBg: 'bg-pink-500/10',
        bulletColor: 'text-pink-400',
        btnGradient: 'from-pink-500 to-rose-600',
      },
      'Om': {
        icon: <span className="text-5xl drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">🕉️</span>,
        gradient: 'from-[#FBDB8C]/20 via-[#B45309]/10 to-transparent',
        textColor: 'text-[#FBDB8C]',
        bulletBg: 'bg-[#FBDB8C]/10',
        bulletColor: 'text-[#FBDB8C]',
        btnGradient: 'from-[#FBDB8C] via-[#B45309] to-[#F59E0B]',
      },
      'Ganesha': {
        icon: <img src="/Ganesha.jpeg" alt="Ganesha" className="w-16 h-16 rounded-full object-cover border-2 border-[#FBDB8C]/30 shadow-xl" />,
        gradient: 'from-[#FBDB8C]/20 via-[#0A194E]/40 to-transparent',
        textColor: 'text-[#FBDB8C]',
        bulletBg: 'bg-[#FBDB8C]/10',
        bulletColor: 'text-[#FBDB8C]',
        btnGradient: 'from-[#FBDB8C] via-[#B45309] to-[#F59E0B]',
      },
      'Water': {
        icon: <span className="text-5xl drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">💧</span>,
        gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
        textColor: 'text-cyan-400',
        bulletBg: 'bg-cyan-500/10',
        bulletColor: 'text-cyan-400',
        btnGradient: 'from-cyan-500 to-blue-600',
      },
    };
    return styles[element] || styles['Om'];
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/api/plans');
        setPlans(res.data);
      } catch (err) {
        console.error('Failed to fetch plans', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#060B28] flex items-center justify-center overflow-y-auto">
      <div className="flex flex-col items-center gap-4">
        <img src="/Ganesha.jpeg" alt="Loading" className="w-16 h-16 rounded-full animate-pulse border-2 border-[#FBDB8C]/30" />
        <p className="text-[#FBDB8C] font-serif tracking-[0.2em] animate-pulse uppercase">REVEALING SEVA PATHS...</p>
      </div>
    </div>
  );

  return (
    <div className={commonStyles.pageContainer + " pt-4 pb-20 px-4 overflow-y-auto"}>

      {/* Header */}
      <div className={plansStyles.headerWrapper}>
        <p className={commonStyles.preTitle}>॥ सेवा प्रदाता ॥</p>
        <div className={plansStyles.headerEmoji}>
          <img src="/Ganesha.jpeg" alt="Ganesha" className="w-24 h-24 rounded-full object-cover shadow-[0_0_30px_rgba(251,219,140,0.2)] mx-auto border-4 border-[#FBDB8C]/10" />
        </div>
        <h1 className={commonStyles.pageTitle}>ROYAL SEVA PLANS</h1>
        <p className={plansStyles.headerTagline}>Your devotion. Your offering. Your blessing.</p>
        <p className={plansStyles.headerDescription}>
          Connect through sacred offering — choose the seva that resonates with your heart and destiny.
        </p>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className={plansStyles.emptyCard}>
          <div className={plansStyles.emptyEmoji}>🪷</div>
          <p className="text-[#FBDB8C] font-serif font-bold text-lg uppercase tracking-widest">No seva plans manifest yet.</p>
          <p className="text-white/20 text-xs mt-3 uppercase tracking-widest">Please check back soon, devotee.</p>
        </div>
      ) : (
        <div className={plansStyles.grid}>
          {plans.map((plan) => {
            const style = getStyle(plan.element);
            return (
              <div
                key={plan.id}
                className={plansStyles.planCardBase}
              >
                {/* Card Header */}
                <div className={`${plansStyles.planCardHeader} bg-gradient-to-br ${style.gradient}`}>
                  <div className="relative z-10">
                    <div className="flex justify-center mb-6">{style.icon}</div>
                    <h2 className={plansStyles.planName}>{plan.name}</h2>
                    <p className={`${plansStyles.planElement} ${style.textColor}`}>{plan.element} SEVA</p>
                    <p className={plansStyles.planTagline}>{plan.tagline}</p>
                  </div>
                </div>

                 {/* Card Body */}
                <div className={plansStyles.planCardBody}>
                  <p className="text-[#FBDB8C]/40 italic text-[10px] mb-4 font-bold uppercase tracking-widest text-center">{plan.subtitle}</p>
                  <p className="text-white/40 text-xs mb-10 leading-relaxed text-center font-medium px-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-10 pb-8 border-b border-white/5 text-center">
                    <div className={`${plansStyles.planPrice} ${style.textColor}`}>${plan.price}</div>
                    <div className={plansStyles.planPriceSub}>One-time sacred contribution</div>
                  </div>

                  {/* Benefits */}
                  <div className="mb-10 flex-1">
                    <h3 className="text-[10px] uppercase font-black tracking-[0.3em] text-[#FBDB8C]/40 mb-6 text-center">DIVINE BENEFITS</h3>
                    <ul className="space-y-4">
                      {plan.benefits && plan.benefits.map((benefit, idx) => (
                        <li key={idx} className={plansStyles.benefitItem}>
                          <span className={`${plansStyles.benefitBullet} ${style.bulletBg} ${style.bulletColor}`}>🙏</span>
                          <span className="pt-0.5">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <button className={`${plansStyles.ctaButton} bg-gradient-to-r ${style.btnGradient}`}>
                    CHOOSE THIS SEVA
                  </button>
                </div>

                {/* Footer */}
                <div className={plansStyles.planCardFooter}>
                  <p className="text-center text-[#FBDB8C]/30 font-bold text-[9px] tracking-[0.3em] uppercase">
                    🕉️ Blessings upon your path 🕉️
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlansPage;