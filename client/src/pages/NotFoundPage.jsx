import React from 'react';
import { useNavigate } from 'react-router-dom';
import { royalDashboardStyles } from '../styles/index.styles';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#060B28] flex flex-col items-center justify-center px-4 text-center overflow-hidden">
      <div className="relative mb-20 animate-float">
        <div className="absolute inset-0 bg-[#FBDB8C]/20 blur-3xl rounded-full scale-150 transform -translate-y-4" />
        <img src="/Ganesha.jpeg" alt="Ganesha" className="relative z-10 w-48 h-48 rounded-full object-cover shadow-[0_0_50px_rgba(251,219,140,0.3)] border-4 border-[#FBDB8C]/20" />
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C] to-transparent" />
      </div>

      <h1 className="text-9xl font-serif font-black text-white/5 tracking-[0.2em] leading-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none">
        404
      </h1>

      <div className="relative z-10">
        <h2 className="text-3xl font-serif font-bold text-[#FBDB8C] tracking-widest uppercase mb-4">SACRED PATH NOT FOUND</h2>
        <p className="text-white/40 mb-12 max-w-sm mx-auto font-medium text-xs tracking-[0.1em] leading-relaxed uppercase">
          Even Ganesha's wisdom cannot find this path. This destination has returned to the cosmic void.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="bg-gradient-to-r from-[#FCD34D] via-[#B45309] to-[#F59E0B] text-white font-black py-4 px-12 rounded-full transition-all shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_50px_rgba(251,191,36,0.5)] hover:-translate-y-1 active:scale-95 uppercase tracking-[0.3em] text-xs"
        >
          🙏 Return to Portal
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <p className="text-[#FBDB8C]/10 font-serif italic text-[10px] tracking-[0.5em] uppercase">
          ॥ Agilavetri Ganesha Seva ॥
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;