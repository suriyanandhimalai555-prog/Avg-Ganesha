import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../api/axios';

const DonatePage = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('one-time');
  const [selectedAmount, setSelectedAmount] = useState('1,001');
  const [customAmount, setCustomAmount] = useState('');
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/api/plans');
        setPlans(res.data);
      } catch (err) {
        console.error('Failed to fetch plans', err);
      }
    };
    fetchPlans();
  }, []);

  const amounts = ['501', '1,001', '5,001', '10,001', '25,001', '50,001'];

  const handleSponsor = (planId) => {
    if (!token) {
      navigate('/login?redirect=/donate');
    } else {
      alert('Proceeding to payment gateway for Plan ID: ' + planId);
      // Future: Navigate to checkout page or open modal
    }
  };

  const handleDonate = () => {
    if (!token) {
      navigate('/login?redirect=/donate');
    } else {
      const amount = customAmount || selectedAmount;
      alert(`Proceeding to payment gateway for ₹${amount} (${activeTab} donation)`);
    }
  };

  const presetEmojis = {
    'Modak': '🍬',
    'Lotus': '🪷',
    'Om': '🕉️',
    'Ganesha': '🐘',
    'Water': '💧',
  };

  return (
    <div className="min-h-screen bg-floral-confetti bg-gs-cream font-sans pb-20">
      
      {/* 1. Ways to Give Section */}
      <section className="pt-16 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-gs-teal font-serif font-semibold tracking-widest text-sm mb-2">॥ दानविकल्याः ॥</p>
          <h2 className="text-4xl md:text-5xl font-serif text-gs-navy font-bold mb-3">Ways to Give</h2>
          <p className="text-gray-600 text-sm">Choose how you'd like to support our divine mission</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button 
            onClick={() => setActiveTab('one-time')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === 'one-time' ? 'bg-gs-teal text-white shadow-lg' : 'bg-white border text-gs-navy border-gray-200 hover:border-gs-teal'}`}
          >
            🕉️ One-Time Donation
          </button>
          <button 
            onClick={() => setActiveTab('monthly')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === 'monthly' ? 'bg-gs-teal text-white shadow-lg' : 'bg-white border text-gs-navy border-gray-200 hover:border-gs-teal'}`}
          >
            🪷 Monthly Seva
          </button>
          <button 
            onClick={() => setActiveTab('cause')}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === 'cause' ? 'bg-gs-teal text-white shadow-lg' : 'bg-white border text-gs-navy border-gray-200 hover:border-gs-teal'}`}
          >
            🐘 Sponsor a Cause
          </button>
        </div>

        {activeTab !== 'cause' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <h3 className="text-center text-gs-navy font-bold mb-4">Select Amount</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {amounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                  className={`py-4 rounded-xl border-2 font-bold text-lg transition-all duration-200 ${
                    selectedAmount === amt && !customAmount
                      ? 'border-gs-teal bg-gs-teal/5 text-gs-teal shadow-md'
                      : 'border-gray-200 bg-white text-gs-navy hover:border-gs-teal/50'
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(''); }}
              placeholder="Custom Amount"
              className="w-full py-4 px-6 rounded-xl border-2 border-gray-200 bg-white text-gs-navy focus:border-gs-teal focus:ring-0 outline-none transition-colors mb-6"
            />
            <div className="flex justify-center">
              <button onClick={handleDonate} className="bg-gs-teal hover:bg-[#238071] text-white font-bold py-4 px-12 rounded-full shadow-lg transition-transform hover:scale-105">
                Proceed with ₹{customAmount || selectedAmount}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'cause' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {plans.map(plan => (
              <div key={plan.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-serif text-gs-navy font-bold">{plan.name}</h3>
                    <p className="text-sm text-gray-500">{plan.tagline}</p>
                  </div>
                  <div className="text-3xl">{presetEmojis[plan.element] || '🙏'}</div>
                </div>
                <p className="text-gs-teal font-bold text-2xl mb-1">{plan.price}</p>
                <button onClick={() => handleSponsor(plan.id)} className="w-full py-2 mt-4 rounded-full border-2 border-gs-teal text-gs-teal font-bold hover:bg-gs-teal hover:text-white transition-colors">
                  Sponsor This 🙏
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Sacred Seva Opportunities Section */}
      <section className="pt-24 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gs-teal font-serif font-semibold tracking-widest text-sm mb-2">॥ सेवासीधाः ॥</p>
          <h2 className="text-4xl md:text-5xl font-serif text-gs-navy font-bold mb-3">Sacred Seva Opportunities</h2>
          <p className="text-gray-600 text-sm">Participate in these divine services and earn blessings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-[16px] p-8 border border-gs-teal/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(45,156,138,0.1)] transition-all flex flex-col items-center text-center">
              
              <div className="text-5xl mb-4">{presetEmojis[plan.element] || '🌸'}</div>
              
              <h3 className="text-xl font-serif text-gs-navy font-bold mb-2">{plan.name}</h3>
              <p className="text-xs text-gray-500 mb-6">{plan.tagline || plan.subtitle}</p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-8 flex-1">
                {plan.benefits && plan.benefits.slice(0, 2).map((benefit, idx) => (
                  <span key={idx} className="bg-gs-teal/10 text-gs-teal text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {benefit}
                  </span>
                ))}
              </div>

              <div className="mb-6">
                <p className="text-3xl font-bold text-gs-teal">{plan.price}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">One Time</p>
              </div>

              <button onClick={() => handleSponsor(plan.id)} className="w-full py-3 rounded-full border-2 border-gs-teal text-gs-teal font-bold hover:bg-gs-teal hover:text-white transition-colors">
                Sponsor This 🙏
              </button>
              
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default DonatePage;