import React, { useEffect, useState } from 'react';
import api from '../api/axios';

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
    <div className="min-h-screen bg-floral-confetti bg-gs-cream flex items-center justify-center text-gs-teal font-serif text-xl tracking-widest animate-pulse">
      🐘 ॥ श्री गणेशाय नमः ॥ Loading Seva Plans...
    </div>
  );

  return (
    <div className="min-h-screen bg-floral-confetti bg-gs-cream pt-4 pb-12 px-4">

      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-10 space-y-2">
        <p className="text-gs-teal font-serif font-bold tracking-widest text-xs mb-3">॥ सेवा प्रदाता ॥</p>
        <div className="text-5xl mb-3">🐘</div>
        <h1 className="text-4xl md:text-5xl font-serif text-gs-navy font-bold tracking-wide mb-2">
          Seva <span className="text-gs-teal">Plans</span>
        </h1>
        <p className="text-gray-500 font-medium text-sm">Your devotion. Your offering. Your blessing.</p>
        <p className="text-gray-500 text-xs max-w-2xl mx-auto leading-relaxed mt-2">
          Every devotee of Ganesha Seva connects through sacred offering — choose the seva that resonates with your heart.
        </p>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="max-w-xl mx-auto text-center py-20 bg-white border border-gray-100 rounded-3xl shadow-sm">
          <div className="text-6xl mb-4">🪷</div>
          <p className="text-gs-navy font-serif font-bold text-lg">No seva plans available yet.</p>
          <p className="text-gray-500 text-sm mt-2">Please check back soon, devotee.</p>
        </div>
      ) : (
        <div className="max-w-[90rem] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan) => {
            const style = getStyle(plan.element);
            return (
              <div
                key={plan.id}
                className={`rounded-3xl overflow-hidden border ${style.borderColor} ${style.hoverBorder} ${style.cardBg} transition-all duration-300 flex flex-col hover:-translate-y-1 shadow-[0_10px_30px_rgba(45,156,138,0.08)]`}
              >
                {/* Card Header */}
                <div className={`bg-gradient-to-br ${style.gradient} p-8 text-center relative overflow-hidden border-b ${style.borderColor}`}>
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
                  <div className="relative z-10">
                    <div className="flex justify-center mb-4">{style.icon}</div>
                    <h2 className="text-2xl font-bold font-serif text-gs-navy tracking-wide mb-1">{plan.name}</h2>
                    <p className={`text-xs uppercase font-bold tracking-widest ${style.textColor} mb-1`}>{plan.element} Seva</p>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 opacity-80">{plan.tagline}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-8 flex-1 flex flex-col bg-white">
                  <p className="text-gray-500 italic text-xs mb-3 font-medium">{plan.subtitle}</p>
                  <p className="text-gray-500 text-xs mb-8 leading-relaxed">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-8 pb-6 border-b border-gray-100 text-center">
                    <div className={`text-3xl font-serif font-bold ${style.textColor}`}>{plan.price}</div>
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">One-time seva contribution</div>
                  </div>

                  {/* Benefits */}
                  <div className="mb-8 flex-1">
                    <h3 className="text-xs uppercase font-bold tracking-widest text-gs-navy mb-4 text-center">Seva Benefits</h3>
                    <ul className="space-y-3">
                      {plan.benefits && plan.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-600 text-xs font-medium leading-relaxed">
                          <span className={`${style.bulletBg} ${style.bulletColor} rounded-full p-1 mt-0.5 flex-shrink-0 text-[10px]`}>🙏</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <button className={`w-full py-3.5 rounded-full bg-gradient-to-r ${style.btnGradient} text-white font-bold uppercase tracking-widest text-[10px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300`}>
                    Choose This Seva
                  </button>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
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