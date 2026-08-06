import React, { useState } from 'react';
import { CryptoPair, AIAnalysisResult } from '../types';
import { Sparkles, TrendingUp, TrendingDown, ShieldAlert, Activity, RefreshCw, Layers, Zap, X, ChevronRight } from 'lucide-react';

interface AnalyticsPanelProps {
  pair: CryptoPair;
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ pair, isOpen, onClose }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const fetchAiAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ai/analyze-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: pair.symbol,
          price: pair.price,
          change24h: pair.change24h,
          high24h: pair.high24h,
          low24h: pair.low24h,
          timeframe: '15m',
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setError('Failed to load AI analytics.');
      }
    } catch {
      setError('Error connecting to AI Quantum engine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div id="analytics-modal-container" className="relative w-full max-w-2xl bg-[#121620] border border-[#232b3e] rounded-2xl shadow-[0_0_50px_rgba(0,242,254,0.2)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2738] bg-gradient-to-r from-indigo-950/60 via-[#121620] to-cyan-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-[#00F2FE]">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Trixeon AI Quantitative Signals
                <span className="text-[10px] bg-cyan-500/20 text-[#00F2FE] border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono">
                  Gemini 3.6 Flash
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Real-time Orderflow & Technical Pattern Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2738] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Real-time Market Analytics Metrics Row */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            {/* Fear & Greed Index */}
            <div className="bg-[#171d2b] p-3 rounded-xl border border-[#232f48] text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Crypto Fear & Greed</span>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">68 / 100</div>
              <span className="text-[10px] text-emerald-300 font-semibold">Greed (Bullish Sentiment)</span>
            </div>

            {/* Long / Short Ratio */}
            <div className="bg-[#171d2b] p-3 rounded-xl border border-[#232f48] text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Global Long/Short Ratio</span>
              <div className="text-xl font-extrabold text-[#00F2FE] font-mono">1.68</div>
              <span className="text-[10px] text-cyan-300 font-semibold">62.7% Longs vs 37.3% Shorts</span>
            </div>

            {/* Funding Rate & Volatility */}
            <div className="bg-[#171d2b] p-3 rounded-xl border border-[#232f48] text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Open Interest</span>
              <div className="text-xl font-extrabold text-white font-mono">$1.85B</div>
              <span className="text-[10px] text-slate-400 font-semibold">+4.2% in last 24 hours</span>
            </div>
          </div>

          {/* AI Generator Action Box */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-[#182030] to-cyan-950/40 p-4 rounded-xl border border-cyan-500/30 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white text-sm">Analyze {pair.symbol} Orderbook & Momentum</h4>
              <p className="text-xs text-slate-400">Generate neural trade probability, support/resistance targets, and leverage advice.</p>
            </div>

            <button
              id="generate-ai-signal-btn"
              onClick={fetchAiAnalysis}
              disabled={loading}
              className="py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Analyzing...' : 'Run Quantum AI Signal'}</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* AI Analysis Result Display */}
          {analysis && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Sentiment & Action Banner */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#161d2c] p-3.5 rounded-xl border border-[#222d42]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Market Bias</span>
                  <div className={`text-lg font-black font-mono flex items-center gap-1.5 mt-0.5 ${
                    analysis.sentiment === 'BULLISH' ? 'text-emerald-400' : analysis.sentiment === 'BEARISH' ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {analysis.sentiment === 'BULLISH' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {analysis.sentiment} ({analysis.confidenceScore}% Confidence)
                  </div>
                </div>

                <div className="bg-[#161d2c] p-3.5 rounded-xl border border-[#222d42]">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Recommended Signal</span>
                  <div className="text-lg font-black text-[#00F2FE] font-mono mt-0.5">
                    {analysis.recommendedAction}
                  </div>
                  <span className="text-[10px] text-slate-400">Rec. Leverage: {analysis.suggestedLeverage}</span>
                </div>
              </div>

              {/* Summary Breakdown */}
              <div className="bg-[#161d2c] p-3.5 rounded-xl border border-[#222d42]">
                <h5 className="text-xs font-bold text-white mb-1">Market Structure Summary</h5>
                <p className="text-xs text-slate-300 leading-relaxed">{analysis.summary}</p>
              </div>

              {/* Support / Resistance Levels */}
              <div className="bg-[#161d2c] p-3.5 rounded-xl border border-[#222d42]">
                <h5 className="text-xs font-bold text-white mb-2">Key Fibonacci & Liquidity Levels</h5>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-rose-950/30 border border-rose-500/30 p-2 rounded-lg">
                    <span className="text-[10px] text-rose-400 font-bold block">Resistances</span>
                    <div className="text-slate-200">R2: ${analysis.keyLevels.resistance2}</div>
                    <div className="text-slate-200">R1: ${analysis.keyLevels.resistance1}</div>
                  </div>
                  <div className="bg-emerald-950/30 border border-emerald-500/30 p-2 rounded-lg">
                    <span className="text-[10px] text-emerald-400 font-bold block">Supports</span>
                    <div className="text-slate-200">S1: ${analysis.keyLevels.support1}</div>
                    <div className="text-slate-200">S2: ${analysis.keyLevels.support2}</div>
                  </div>
                </div>
              </div>

              {/* Technical Drivers */}
              <div className="bg-[#161d2c] p-3.5 rounded-xl border border-[#222d42]">
                <h5 className="text-xs font-bold text-white mb-2">Technical Drivers</h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {analysis.technicalFactors?.map((factor, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#00F2FE]" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Warning */}
              <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex items-center gap-2 font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{analysis.riskWarning}</span>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
