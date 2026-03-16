import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen bg-[#060B28] text-white font-sans flex overflow-hidden relative">

      {/* Ambient background removed, using CSS confetti pattern and cream bg now */}

      {/* SIDEBAR */}
      <div className="relative z-20 h-full flex-shrink-0">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 h-full overflow-y-auto relative z-10 bg-transparent scroll-smooth">
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen">

          {/* HEADER */}
          <header className="mb-6 md:mb-10 flex items-center justify-between border-b border-[#FBDB8C]/10 pb-6 relative">
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FBDB8C]/20 to-transparent" />
            
            <div className="flex items-center gap-4 relative z-10">
              {/* Mobile Toggle */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2.5 bg-[#FBDB8C]/10 text-[#FBDB8C] border border-[#FBDB8C]/20 rounded-xl transition-all hover:bg-[#FBDB8C]/20"
              >
                <Menu size={24} />
              </button>

              <div>
                <p className="text-[#FBDB8C] font-serif font-semibold tracking-widest text-[10px] md:text-xs mb-0.5 uppercase opacity-80">அகில வெற்றி கணேஷா</p>
                <h2 className="text-xl md:text-3xl font-serif font-bold tracking-[0.1em] text-white flex items-center gap-3 uppercase">
                  <img src="/Ganesha.jpeg" alt="Ganesha" className="w-9 h-9 md:w-11 md:h-11 rounded-full object-cover shadow-sm border border-[#FBDB8C]/30" />
                  <span className="leading-tight pt-1">
                    World Of <span className="text-[#FBDB8C]">Agilavetri Ganesha</span>
                    <span className="hidden md:inline text-[#FBDB8C]/40 text-lg font-sans font-normal ml-3 lowercase"> — devotee portal</span>
                  </span>
                </h2>
              </div>
            </div>
          </header>

          {/* DYNAMIC CONTENT */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;