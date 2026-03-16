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
        icon: <span className="text-5xl">🍬</span>,
        gradient: 'from-amber-100 via-yellow-50 to-orange-50',
        cardBg: 'bg-white',
        borderColor: 'border-yellow-200',
        hoverBorder: 'hover:border-yellow-400',
        textColor: 'text-amber-700',
        bulletBg: 'bg-yellow-100',
        bulletColor: 'text-yellow-600',
        btnGradient: 'from-amber-500 to-orange-500',
      },
      'Lotus': {
        icon: <span className="text-5xl">🪷</span>,
        gradient: 'from-pink-100 via-rose-50 to-pink-50',
        cardBg: 'bg-white',
        borderColor: 'border-pink-200',
        hoverBorder: 'hover:border-pink-400',
        textColor: 'text-pink-700',
        bulletBg: 'bg-pink-100',
        bulletColor: 'text-pink-600',
        btnGradient: 'from-pink-500 to-rose-500',
      },
      'Om': {
        icon: <span className="text-5xl">🕉️</span>,
        gradient: 'from-orange-100 via-amber-50 to-yellow-50',
        cardBg: 'bg-white',
        borderColor: 'border-orange-200',
        hoverBorder: 'hover:border-orange-400',
        textColor: 'text-orange-700',
        bulletBg: 'bg-orange-100',
        bulletColor: 'text-orange-600',
        btnGradient: 'from-orange-500 to-amber-500',
      },
      'Ganesha': {
        icon: <span className="text-5xl">🐘</span>,
        gradient: 'from-gs-teal/20 via-gs-teal/5 to-transparent',
        cardBg: 'bg-white',
        borderColor: 'border-gs-teal/30',
        hoverBorder: 'hover:border-gs-teal/60',
        textColor: 'text-gs-teal',
        bulletBg: 'bg-gs-teal/10',
        bulletColor: 'text-gs-teal',
        btnGradient: 'from-gs-teal to-[#1A7566]',
      },
      'Water': {
        icon: <span className="text-5xl">💧</span>,
        gradient: 'from-cyan-100 via-blue-50 to-blue-100',
        cardBg: 'bg-white',
        borderColor: 'border-cyan-200',
        hoverBorder: 'hover:border-cyan-400',
        textColor: 'text-cyan-700',
        bulletBg: 'bg-cyan-100',
        bulletColor: 'text-cyan-600',
        btnGradient: 'from-cyan-500 to-blue-500',
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
    <div className={commonStyles.pageContainer + " flex items-center justify-center text-gs-teal font-serif text-xl tracking-widest animate-pulse"}>
      🐘 அகில வெற்றி கணேஷா Loading Seva Plans...
    </div>
  );

  return (
    <div className={commonStyles.pageContainer + " pt-4 pb-12 px-4"}>

      {/* Header */}
      <div className={plansStyles.headerWrapper}>
        <p className={commonStyles.badgeText}>॥ सेवा प्रदाता ॥</p>
        <div className={plansStyles.headerEmoji}>🐘</div>
        <h1 className={commonStyles.pageTitle}>
          Seva <span className="text-gs-teal">Plans</span>
        </h1>
        <p className={plansStyles.headerTagline}>Your devotion. Your offering. Your blessing.</p>
        <p className={plansStyles.headerDescription}>
          Every devotee of Ganesha Seva connects through sacred offering — choose the seva that resonates with your heart.
        </p>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className={plansStyles.emptyCard}>
          <div className={plansStyles.emptyEmoji}>🪷</div>
          <p className="text-gs-navy font-serif font-bold text-lg">No seva plans available yet.</p>
          <p className="text-gray-500 text-sm mt-2">Please check back soon, devotee.</p>
        </div>
      ) : (
        <div className={plansStyles.grid}>
          {plans.map((plan) => {
            const style = getStyle(plan.element);
            return (
              <div
                key={plan.id}
                className={`${plansStyles.planCardBase} ${style.borderColor} ${style.hoverBorder} ${style.cardBg}`}
              >
                {/* Card Header */}
                <div className={`${plansStyles.planCardHeader} bg-gradient-to-br ${style.gradient} border-b ${style.borderColor}`}>
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
                  <div className="relative z-10">
                    <div className="flex justify-center mb-4">{style.icon}</div>
                    <h2 className={plansStyles.planName}>{plan.name}</h2>
                    <p className={`${plansStyles.planElement} ${style.textColor}`}>{plan.element} Seva</p>
                    <p className={plansStyles.planTagline}>{plan.tagline}</p>
                  </div>
                </div>

                 {/* Card Body */}
                <div className={plansStyles.planCardBody}>
                  <p className="text-gray-500 italic text-xs mb-3 font-medium">{plan.subtitle}</p>
                  <p className="text-gray-500 text-xs mb-8 leading-relaxed">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-8 pb-6 border-b border-gray-100 text-center">
                    <div className={`${plansStyles.planPrice} ${style.textColor}`}>{plan.price}</div>
                    <div className={plansStyles.planPriceSub}>One-time seva contribution</div>
                  </div>

                  {/* Benefits */}
                  <div className="mb-8 flex-1">
                    <h3 className="text-xs uppercase font-bold tracking-widest text-gs-navy mb-4 text-center">Seva Benefits</h3>
                    <ul className="space-y-3">
                      {plan.benefits && plan.benefits.map((benefit, idx) => (
                        <li key={idx} className={plansStyles.benefitItem}>
                          <span className={`${plansStyles.benefitBullet} ${style.bulletBg} ${style.bulletColor}`}>🙏</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <button className={`${plansStyles.ctaButton} bg-gradient-to-r ${style.btnGradient}`}>
                    Choose This Seva
                  </button>
                </div>

                {/* Footer */}
                <div className={plansStyles.planCardFooter}>
                  <p className="text-center text-gs-teal font-medium text-[10px] tracking-widest uppercase">
                    🕉️ Blessings of Lord Ganesha upon you
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