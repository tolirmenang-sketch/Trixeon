import React from 'react';
import { Home, BarChart2, Wallet, User } from 'lucide-react';

export type BottomNavTab = 'home' | 'trade' | 'dana' | 'profil';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onChangeTab: (tab: BottomNavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  return (
    <nav
      id="bottom-mobile-navigator"
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d14]/95 backdrop-blur-lg border-t border-[#1b2232] lg:hidden flex items-center justify-around py-2 px-1 shadow-[0_-10px_25px_rgba(0,0,0,0.6)]"
    >
      {/* Home Tab */}
      <button
        id="nav-tab-home"
        onClick={() => onChangeTab('home')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          activeTab === 'home'
            ? 'text-[#00F2FE] font-extrabold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5] text-[#00F2FE]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5">Home</span>
      </button>

      {/* Trade Tab */}
      <button
        id="nav-tab-trade"
        onClick={() => onChangeTab('trade')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          activeTab === 'trade'
            ? 'text-[#00F2FE] font-extrabold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <BarChart2 className={`w-5 h-5 ${activeTab === 'trade' ? 'stroke-[2.5] text-[#00F2FE]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5">Trade</span>
      </button>

      {/* Dana Tab */}
      <button
        id="nav-tab-dana"
        onClick={() => onChangeTab('dana')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          activeTab === 'dana'
            ? 'text-[#00F2FE] font-extrabold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Wallet className={`w-5 h-5 ${activeTab === 'dana' ? 'stroke-[2.5] text-[#00F2FE]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5">Dana</span>
      </button>

      {/* Profil Tab */}
      <button
        id="nav-tab-profil"
        onClick={() => onChangeTab('profil')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
          activeTab === 'profil'
            ? 'text-[#00F2FE] font-extrabold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <User className={`w-5 h-5 ${activeTab === 'profil' ? 'stroke-[2.5] text-[#00F2FE]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5">Profil</span>
      </button>
    </nav>
  );
};
