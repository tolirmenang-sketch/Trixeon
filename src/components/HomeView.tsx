import React from 'react';
import { useTrading } from '../context/TradingContext';
import { CryptoPair } from '../types';
import { TrendingUp, TrendingDown, Sparkles, ShieldCheck, ArrowRight, BarChart2, Flame } from 'lucide-react';

interface HomeViewProps {
  onSelectPairAndTrade: (pair: CryptoPair) => void;
  onOpenAnalyticsModal: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectPairAndTrade, onOpenAnalyticsModal }) => {
  const { pairs } = useTrading();

  const topGainers = [...pairs].sort((a, b) => b.change24h - a.change24h);

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Banner Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0d1322] via-[#121c33] to-[#0d1322] border border-[#232f48] rounded-2xl p-4 lg:p-6 shadow-2xl">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[#00F2FE] text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trixeon High Precision Engine</span>
          </div>
          <h2 className="text-lg lg:text-2xl font-black text-white tracking-tight">
            Pasar Kripto Real-Time & Analytics AI
          </h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Akses pasar aset kripto tercepat dengan eksekusi bebas slip dan verifikasi bukti kriptografis ZK-Rollup.
          </p>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={onOpenAnalyticsModal}
              className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sinyal AI Technical</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Gainers Quick Carousel/Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Trending Market Today</span>
          </h3>
          <span className="text-[10px] text-cyan-400 font-mono">Real-time update</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {topGainers.slice(0, 4).map(p => (
            <button
              key={p.symbol}
              onClick={() => onSelectPairAndTrade(p)}
              className="bg-[#10141e] hover:bg-[#161d2c] border border-[#1d273a] hover:border-cyan-500/40 p-3 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{p.symbol}</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded">{p.maxLeverage}x</span>
              </div>
              <div className="text-sm font-bold font-mono text-white mt-1">
                ${p.price.toLocaleString(undefined, { minimumFractionDigits: p.precision })}
              </div>
              <div className={`text-[10px] font-mono mt-0.5 flex items-center gap-1 ${p.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {p.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{p.change24h >= 0 ? '+' : ''}{p.change24h}%</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* All Crypto Trading Pairs List */}
      <div className="bg-[#0b0e14] border border-[#1b2232] rounded-xl overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-[#10141d] border-b border-[#1b2232] flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span>Daftar Pasar Kripto ({pairs.length})</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">USD Turnover</span>
        </div>

        <div className="divide-y divide-[#171e2c]">
          {pairs.map(p => (
            <div
              key={p.symbol}
              onClick={() => onSelectPairAndTrade(p)}
              className="p-3.5 hover:bg-[#131926] transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#182132] border border-[#232f48] flex items-center justify-center font-bold text-xs text-white">
                  {p.baseSymbol}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">{p.symbol}</span>
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-1 rounded">
                      {p.maxLeverage}x
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Vol: ${p.volume24h}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-xs font-bold text-white">
                  ${p.price.toLocaleString(undefined, { minimumFractionDigits: p.precision })}
                </div>
                <div className={`text-[10px] font-mono ${p.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {p.change24h >= 0 ? '+' : ''}{p.change24h}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
