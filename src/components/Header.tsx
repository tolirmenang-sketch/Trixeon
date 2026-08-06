import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTrading } from '../context/TradingContext';
import {
  Zap,
  ShieldCheck,
  Wallet,
  User,
  ChevronDown,
  LogIn,
  LogOut,
  Sparkles,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2,
  Lock,
  Flame,
  Menu,
  X,
  BarChart2,
  FileSpreadsheet,
  Users
} from 'lucide-react';

interface HeaderProps {
  onOpenAuthModal: () => void;
  onOpenWalletModal: () => void;
  onOpenAnalyticsModal: () => void;
  onOpenAdminSheetsModal?: () => void;
  onOpenAdminMemberControlModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuthModal,
  onOpenWalletModal,
  onOpenAnalyticsModal,
  onOpenAdminSheetsModal,
  onOpenAdminMemberControlModal,
}) => {
  const { user, tradingMode, setTradingMode, logout } = useAuth();
  const { pairs, selectedPair, setSelectedPair } = useTrading();
  const [isPairDropdownOpen, setIsPairDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const isAdmin = user?.email?.toLowerCase() === 'tolirmenang@gmail.com';

  const activeUsdt = user ? user.wallet.realUsdt : 0;

  return (
    <header id="trixeon-header" className="bg-[#0b0e14] border-b border-[#1e232f] text-slate-100 sticky top-0 z-40 px-3 lg:px-6 py-2.5 shadow-2xl backdrop-blur-md bg-opacity-95">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-2 lg:gap-4">
        
        {/* Left: Brand Logo & Trading Pair Selector */}
        <div className="flex items-center gap-3 lg:gap-6">
          {/* Futuristic Logo Icon + Title */}
          <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => window.location.reload()}>
            <div className="relative w-8 h-8 lg:w-9 lg:h-9 flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#0052D4] via-[#4364F7] to-[#00F2FE] p-[1.5px] shadow-[0_0_15px_rgba(0,242,254,0.35)] transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-[#0b0e14] rounded-[10.5px] flex items-center justify-center">
                <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-[#00F2FE] drop-shadow-[0_0_8px_rgba(0,242,254,0.8)] fill-[#00F2FE]/20" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base lg:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-[#00F2FE]">
                  TRIXEON
                </span>
              </div>
              <span className="text-[8px] lg:text-[9px] tracking-widest text-slate-400 uppercase font-semibold hidden sm:inline-block">
                Trading Platform
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />

          {/* Crypto Pair Selector Dropdown */}
          <div className="relative">
            <button
              id="pair-selector-btn"
              onClick={() => setIsPairDropdownOpen(!isPairDropdownOpen)}
              className="flex items-center gap-2 bg-[#141923] hover:bg-[#1a2130] border border-[#232a3b] hover:border-[#00F2FE]/40 px-3 py-1.5 rounded-lg transition-all text-xs lg:text-sm font-semibold"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold">{selectedPair.symbol}</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1 rounded">
                  {selectedPair.maxLeverage}x
                </span>
              </div>
              <span className={`font-mono text-xs ${selectedPair.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${selectedPair.price.toLocaleString(undefined, { minimumFractionDigits: selectedPair.precision })}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isPairDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Pair Dropdown Menu */}
            {isPairDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-[#121620] border border-[#262e40] rounded-xl shadow-2xl z-50 p-2 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="text-[11px] font-semibold text-slate-400 px-2.5 py-1 uppercase tracking-wider flex justify-between">
                  <span>Pair / Symbol</span>
                  <span>Price / 24h</span>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {pairs.map(p => (
                    <button
                      key={p.symbol}
                      onClick={() => {
                        setSelectedPair(p);
                        setIsPairDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                        p.symbol === selectedPair.symbol
                          ? 'bg-[#1e2738] text-[#00F2FE] border border-[#00F2FE]/30'
                          : 'text-slate-200 hover:bg-[#181f2d]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{p.symbol}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1 rounded">
                          {p.maxLeverage}x
                        </span>
                      </div>
                      <div className="text-right font-mono">
                        <div>${p.price.toLocaleString(undefined, { minimumFractionDigits: p.precision })}</div>
                        <div className={`text-[10px] ${p.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {p.change24h >= 0 ? '+' : ''}{p.change24h}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Ticker Info (24h Stats) */}
          <div className="hidden xl:flex items-center gap-4 text-xs font-mono">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">24h High</span>
              <span className="text-slate-200">${selectedPair.high24h.toLocaleString(undefined, { minimumFractionDigits: selectedPair.precision })}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">24h Low</span>
              <span className="text-slate-200">${selectedPair.low24h.toLocaleString(undefined, { minimumFractionDigits: selectedPair.precision })}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Funding Rate</span>
              <span className="text-cyan-400">+{selectedPair.fundingRate}% in {selectedPair.nextFundingIn}</span>
            </div>
          </div>
        </div>

        {/* Right: AI Insights, Mode Toggle, Wallet & User Profile */}
        <div className="flex items-center gap-2 lg:gap-3">
          
          {/* AI Analytics Button */}
          <button
            id="ai-insights-btn"
            onClick={onOpenAnalyticsModal}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-indigo-900/60 to-cyan-900/60 hover:from-indigo-800/80 hover:to-cyan-800/80 border border-cyan-500/30 text-cyan-300 text-xs px-2.5 py-1.5 rounded-lg transition-all shadow-[0_0_10px_rgba(0,242,254,0.15)] font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00F2FE] animate-pulse" />
            <span>AI Signal</span>
          </button>

          {/* User Account / Auth Trigger & Integrated Wallet Navigator */}
          {user ? (
            <div className="relative">
              <button
                id="user-profile-menu-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 bg-[#141923] hover:bg-[#1b2230] border border-[#232a3b] hover:border-[#00F2FE]/40 px-2.5 py-1.5 rounded-xl transition-all shadow-md group"
              >
                <div className="relative">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-cyan-400/60 object-cover"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0b0e14]" />
                </div>

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white max-w-[90px] sm:max-w-[120px] truncate">{user.name}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/20" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      Rp {activeUsdt.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Integrated User & Wallet Navigator Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#121620] border border-[#262e40] rounded-xl shadow-2xl z-50 p-3 space-y-3 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 p-2 bg-[#181f2e] rounded-lg">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full border border-cyan-400 object-cover"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-white truncate">{user.name}</span>
                      <span className="text-xs font-mono text-cyan-400 font-bold">{user.uid}</span>
                      <span className="text-[10px] text-slate-400 capitalize">Method: {user.authMethod}</span>
                    </div>
                  </div>

                  {/* Wallet Balance & Deposit Action Card inside Profile Menu */}
                  <div className="p-2.5 bg-gradient-to-r from-emerald-950/60 via-[#141b28] to-[#121824] border border-emerald-500/35 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Saldo Utama</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        Rp {activeUsdt.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <button
                      id="wallet-btn"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenWalletModal();
                      }}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs px-2.5 py-1.5 rounded-lg transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Dompet</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between py-1 px-2 text-slate-300">
                      <span>KYC Verification</span>
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                    <div className="flex justify-between py-1 px-2 text-slate-300">
                      <span>Security Protection</span>
                      <span className="text-cyan-400 flex items-center gap-1 font-bold">
                        <Lock className="w-3.5 h-3.5" /> ZK-2FA Active
                      </span>
                    </div>
                    {isAdmin && onOpenAdminMemberControlModal && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAdminMemberControlModal();
                        }}
                        className="w-full mt-1.5 p-2 bg-gradient-to-r from-[#172438] to-[#1a2d47] hover:from-[#1e304b] hover:to-[#223b5c] border border-cyan-500/40 text-cyan-300 rounded-lg text-left flex items-center justify-between font-bold transition-all shadow-md"
                      >
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-[#00F2FE]" />
                          <span>Panel Kontrol Member</span>
                        </span>
                        <span className="text-[9px] bg-cyan-950 text-[#00F2FE] border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono">
                          ADMIN
                        </span>
                      </button>
                    )}
                    {isAdmin && onOpenAdminSheetsModal && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAdminSheetsModal();
                        }}
                        className="w-full mt-1.5 p-2 bg-[#172235] hover:bg-[#1e2e48] border border-cyan-500/30 text-cyan-300 rounded-lg text-left flex items-center justify-between font-bold transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span>Admin Google Sheets</span>
                        </span>
                        <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                          Approval
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-800 pt-2">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="header-login-btn"
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs lg:text-sm px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_20px_rgba(0,242,254,0.5)]"
            >
              <LogIn className="w-4 h-4" />
              <span>Login / Register</span>
            </button>
          )}


        </div>
      </div>

      {/* Slide-over Mobile Drawer Navigation */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content Side Sheet */}
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-[#0c1017] border-l border-[#1f283a] h-full flex flex-col p-4 shadow-2xl z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#1b2232] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0052D4] via-[#4364F7] to-[#00F2FE] p-[1px] flex items-center justify-center">
                  <div className="w-full h-full bg-[#0b0e14] rounded-[7px] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[#00F2FE]" />
                  </div>
                </div>
                <span className="font-extrabold text-base text-white tracking-wider">TRIXEON NAVIGATION</span>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card inside Mobile Drawer */}
            <div className="mb-4 bg-[#141923] border border-[#20293c] rounded-xl p-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full border border-cyan-400 object-cover"
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-sm font-bold text-white truncate">{user.name}</span>
                    <span className="text-xs font-mono text-cyan-400">{user.uid}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileDrawerOpen(false);
                    }}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuthModal();
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 font-extrabold text-slate-950 rounded-lg text-xs flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login / Register</span>
                </button>
              )}
            </div>

            {/* Wallet & Deposit Action */}
            {user && (
              <button
                onClick={() => {
                  onOpenWalletModal();
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full mb-4 bg-[#141923] hover:bg-[#1a2130] border border-[#00F2FE]/40 p-3 rounded-xl flex items-center justify-between text-left transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-950/80 rounded-lg text-[#00F2FE]">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Akun</div>
                    <div className="text-sm font-mono font-bold text-white">
                      Rp {activeUsdt.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
              </button>
            )}

            {/* AI Signal Drawer Button */}
            <button
              onClick={() => {
                onOpenAnalyticsModal();
                setIsMobileDrawerOpen(false);
              }}
              className="w-full mb-4 bg-gradient-to-r from-indigo-900/80 to-cyan-900/80 border border-cyan-500/40 p-3 rounded-xl flex items-center gap-3 text-cyan-200 text-xs font-bold shadow-lg"
            >
              <Sparkles className="w-5 h-5 text-[#00F2FE] animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white">AI Technical Signals</span>
                <span className="text-[10px] text-cyan-300/80 font-normal">Realtime Pattern & Indicator Analysis</span>
              </div>
            </button>

            {/* Trading Pair Quick Selection in Mobile Drawer */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                <span>Select Trading Pair</span>
                <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {pairs.map(p => (
                  <button
                    key={p.symbol}
                    onClick={() => {
                      setSelectedPair(p);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all ${
                      p.symbol === selectedPair.symbol
                        ? 'bg-[#1e2738] text-[#00F2FE] border border-[#00F2FE]/40'
                        : 'bg-[#121620] hover:bg-[#181f2d] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{p.symbol}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {p.maxLeverage}x
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-white">${p.price.toLocaleString(undefined, { minimumFractionDigits: p.precision })}</div>
                      <div className={`text-[10px] ${p.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.change24h >= 0 ? '+' : ''}{p.change24h}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Security Verification Badge */}
            <div className="mt-auto pt-4 border-t border-[#1c2333] flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <ShieldCheck className="w-4 h-4" /> ZK-Rollup Active
              </span>
              <span className="text-slate-500">v2.4.0</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
