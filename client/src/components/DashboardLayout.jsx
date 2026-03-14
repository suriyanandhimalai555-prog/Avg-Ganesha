import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen bg-floral-confetti bg-gs-cream text-gs-navy font-sans flex overflow-hidden relative">

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
          <header className="mb-6 md:mb-10 flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex items-center gap-4">
              {/* Mobile Toggle */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-2 text-gs-teal hover:bg-black/5 rounded-lg transition"
              >
                <Menu size={28} />
              </button>

              <div>
                <p className="text-gs-teal font-serif font-semibold tracking-widest text-[10px] md:text-xs mb-0.5">॥ श्री गणेशाय नमः ॥</p>
                <h2 className="text-xl md:text-3xl font-serif font-bold tracking-wide text-gs-navy">
                  🐘 <span className="text-gs-teal">Ganesha Seva</span>
                  <span className="hidden md:inline text-gray-500 text-lg font-sans font-normal ml-2"> — Devotee Portal</span>
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