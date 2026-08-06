import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { TradingProvider, useTrading } from './context/TradingContext';
import { Header } from './components/Header';
import { TradingViewChart } from './components/TradingViewChart';
import { OrderBook } from './components/OrderBook';
import { OrderPanel } from './components/OrderPanel';
import { PositionsTable } from './components/PositionsTable';
import { AuthModal } from './components/AuthModal';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { BlockchainProofModal } from './components/BlockchainProofModal';
import { WalletModal } from './components/WalletModal';
import { AdminSheetsModal } from './components/AdminSheetsModal';
import { AdminMemberControlModal } from './components/AdminMemberControlModal';
import { HomeView } from './components/HomeView';
import { DanaView } from './components/DanaView';
import { ProfilView } from './components/ProfilView';
import { BottomNav, BottomNavTab } from './components/BottomNav';
import { BarChart2, BookOpen, ArrowUpDown, Layers, LayoutGrid } from 'lucide-react';
import { CryptoPair } from './types';

function MainTradingApp() {
  const { selectedPair, setSelectedPair, selectedProof, setSelectedProof } = useTrading();

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isAdminSheetsModalOpen, setIsAdminSheetsModalOpen] = useState(false);
  const [isAdminMemberControlModalOpen, setIsAdminMemberControlModalOpen] = useState(false);

  // Main Mobile Navigation State ('home' | 'trade' | 'dana' | 'profil')
  const [mainNavTab, setMainNavTab] = useState<BottomNavTab>('trade');

  // Trade Sub-tab state for mobile view ('all' | 'chart' | 'orderbook' | 'orderform' | 'positions')
  const [mobileTradeTab, setMobileTradeTab] = useState<'all' | 'chart' | 'orderbook' | 'orderform' | 'positions'>('all');

  const handleSelectPairAndTrade = (pair: CryptoPair) => {
    setSelectedPair(pair);
    setMainNavTab('trade');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans antialiased selection:bg-[#00F2FE]/30 selection:text-white pb-16 lg:pb-0">
      {/* Top Header Navbar */}
      <Header
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        onOpenAnalyticsModal={() => setIsAnalyticsModalOpen(true)}
        onOpenAdminSheetsModal={() => setIsAdminSheetsModalOpen(true)}
        onOpenAdminMemberControlModal={() => setIsAdminMemberControlModalOpen(true)}
      />

      {/* Main Workstation Container */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-2 lg:p-3 space-y-3">
        
        {/* MOBILE VIEW NAVIGATION HANDLERS */}
        <div className="lg:hidden">
          {/* HOME TAB VIEW */}
          {mainNavTab === 'home' && (
            <HomeView
              onSelectPairAndTrade={handleSelectPairAndTrade}
              onOpenAnalyticsModal={() => setIsAnalyticsModalOpen(true)}
            />
          )}

          {/* DANA TAB VIEW */}
          {mainNavTab === 'dana' && (
            <DanaView
              onOpenWalletModal={() => setIsWalletModalOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {/* PROFIL TAB VIEW */}
          {mainNavTab === 'profil' && (
            <ProfilView
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onOpenAdminSheetsModal={() => setIsAdminSheetsModalOpen(true)}
              onOpenAdminMemberControlModal={() => setIsAdminMemberControlModalOpen(true)}
            />
          )}
        </div>

        {/* TRADE VIEW (Always visible on desktop lg:, conditionally visible on mobile when mainNavTab === 'trade') */}
        <div className={`space-y-3 ${mainNavTab !== 'trade' ? 'hidden lg:block' : 'block'}`}>
          
          {/* Mobile Trade Layout Quick Selector Bar */}
          <div className="lg:hidden bg-[#0e121a] border-b border-[#1b2232] px-2 py-1.5 sticky top-[57px] z-30 flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setMobileTradeTab('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                mobileTradeTab === 'all'
                  ? 'bg-[#1e2738] text-[#00F2FE] border border-[#00F2FE]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Semua Panel</span>
            </button>

            <button
              onClick={() => setMobileTradeTab('chart')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                mobileTradeTab === 'chart'
                  ? 'bg-[#1e2738] text-[#00F2FE] border border-[#00F2FE]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Grafik</span>
            </button>

            <button
              onClick={() => setMobileTradeTab('orderbook')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                mobileTradeTab === 'orderbook'
                  ? 'bg-[#1e2738] text-[#00F2FE] border border-[#00F2FE]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Buku Order</span>
            </button>

            <button
              onClick={() => setMobileTradeTab('orderform')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                mobileTradeTab === 'orderform'
                  ? 'bg-[#1e2738] text-[#00F2FE] border border-[#00F2FE]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Form Order</span>
            </button>

            <button
              onClick={() => setMobileTradeTab('positions')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                mobileTradeTab === 'positions'
                  ? 'bg-[#1e2738] text-[#00F2FE] border border-[#00F2FE]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Posisi Saya</span>
            </button>
          </div>

          {/* Upper Trading Layout (Chart + Order Form) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-3">
            
            {/* Main Candlestick Chart Area (8 cols on LG / 9 cols on XL) */}
            <div className={`lg:col-span-8 xl:col-span-9 flex flex-col gap-3 min-h-[380px] sm:min-h-[440px] lg:min-h-[500px] ${
              mobileTradeTab !== 'all' && mobileTradeTab !== 'chart' ? 'hidden lg:flex' : 'flex'
            }`}>
              <TradingViewChart pair={selectedPair} />
            </div>

            {/* Order Execution Panel (4 cols on LG / 3 cols on XL) */}
            <div className={`lg:col-span-4 xl:col-span-3 ${
              mobileTradeTab !== 'all' && mobileTradeTab !== 'orderform' ? 'hidden lg:block' : 'block'
            }`}>
              <OrderPanel pair={selectedPair} onOpenAuthModal={() => setIsAuthModalOpen(true)} />
            </div>

          </div>

          {/* Lower Workstation Section at Bottom (Positions Table & Order Book) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-3">
            
            {/* Positions Table (8 cols on LG / 9 cols on XL) */}
            <div className={`lg:col-span-8 xl:col-span-9 ${
              mobileTradeTab !== 'all' && mobileTradeTab !== 'positions' ? 'hidden lg:block' : 'block'
            }`}>
              <PositionsTable />
            </div>

            {/* Orderbook Depth (Moved to bottom of the page - 4 cols on LG / 3 cols on XL) */}
            <div className={`lg:col-span-4 xl:col-span-3 min-h-[380px] sm:min-h-[420px] lg:min-h-[450px] ${
              mobileTradeTab !== 'all' && mobileTradeTab !== 'orderbook' ? 'hidden lg:block' : 'block'
            }`}>
              <OrderBook pair={selectedPair} />
            </div>

          </div>
        </div>

      </main>

      {/* Mobile Bottom Navigator Bar */}
      <BottomNav
        activeTab={mainNavTab}
        onChangeTab={setMainNavTab}
      />

      {/* Modals Layer */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onOpenAdminModal={() => {
          setIsWalletModalOpen(false);
          setIsAdminSheetsModalOpen(true);
        }}
      />

      <AdminSheetsModal
        isOpen={isAdminSheetsModalOpen}
        onClose={() => setIsAdminSheetsModalOpen(false)}
      />

      <AdminMemberControlModal
        isOpen={isAdminMemberControlModalOpen}
        onClose={() => setIsAdminMemberControlModalOpen(false)}
      />

      <AnalyticsPanel
        pair={selectedPair}
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />

      <BlockchainProofModal
        proof={selectedProof}
        onClose={() => setSelectedProof(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TradingProvider>
        <MainTradingApp />
      </TradingProvider>
    </AuthProvider>
  );
}
