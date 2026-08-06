import React, { useState } from 'react';
import { CryptoPair, OrderSide, MarginMode, OrderType } from '../types';
import { useTrading } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowUpRight, ArrowDownRight, Sliders, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface OrderPanelProps {
  pair: CryptoPair;
  onOpenAuthModal: () => void;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({ pair, onOpenAuthModal }) => {
  const { user, tradingMode } = useAuth();
  const { openPosition } = useTrading();

  const [marginMode, setMarginMode] = useState<MarginMode>('isolated');
  const [leverage, setLeverage] = useState<number>(20);
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [limitPriceInput, setLimitPriceInput] = useState<string>(pair.price.toString());
  const [marginUsdtInput, setMarginUsdtInput] = useState<string>('100000');
  
  const [enableTpSl, setEnableTpSl] = useState(false);
  const [tpInput, setTpInput] = useState<string>('');
  const [slInput, setSlInput] = useState<string>('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const availableBalance = user ? user.wallet.realUsdt : 0;

  const marginVal = parseFloat(marginUsdtInput) || 0;
  const contractValue = marginVal * leverage;
  const qtyBaseAsset = pair.price > 0 ? (contractValue / pair.price).toFixed(pair.qtyPrecision) : '0';

  // Leverage Presets
  const leveragePresets = [1, 5, 10, 20, 50, 75, 100, 125].filter(l => l <= pair.maxLeverage);

  const handlePercentageSelect = (pct: number) => {
    const calculatedMargin = (availableBalance * pct) / 100;
    setMarginUsdtInput(Math.floor(calculatedMargin).toString());
  };

  const handleExecuteOrder = (side: OrderSide) => {
    if (!user) {
      onOpenAuthModal();
      return;
    }

    if (marginVal <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Margin amount must be greater than Rp 0' });
      return;
    }

    if (marginVal > availableBalance) {
      setFeedbackMsg({ type: 'error', text: `Insufficient balance. Available: Rp ${availableBalance.toLocaleString('id-ID')}` });
      return;
    }

    const limitPrice = orderType === 'limit' ? parseFloat(limitPriceInput) : undefined;
    const tpPrice = enableTpSl && tpInput ? parseFloat(tpInput) : undefined;
    const slPrice = enableTpSl && slInput ? parseFloat(slInput) : undefined;

    const result = openPosition({
      side,
      marginMode,
      leverage,
      amountUsdt: marginVal,
      orderType,
      limitPrice,
      tpPrice,
      slPrice,
    });

    if (result.success) {
      setFeedbackMsg({ type: 'success', text: result.message });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } else {
      setFeedbackMsg({ type: 'error', text: result.message });
    }
  };

  return (
    <div id="futures-order-panel" className="bg-[#0b0e14] border border-[#1b2232] rounded-xl p-3 lg:p-4 text-xs font-sans flex flex-col justify-between shadow-xl">
      <div className="space-y-3.5">
        
        {/* Margin Mode & Leverage Header Selector */}
        <div className="flex items-center gap-2">
          {/* Isolated / Cross Toggle */}
          <div className="flex-1 bg-[#121723] p-1 rounded-lg border border-[#20293c] flex">
            <button
              id="margin-mode-cross"
              onClick={() => setMarginMode('cross')}
              className={`flex-1 py-1 rounded text-[11px] font-bold transition-all ${
                marginMode === 'cross' ? 'bg-[#1e2738] text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cross
            </button>
            <button
              id="margin-mode-isolated"
              onClick={() => setMarginMode('isolated')}
              className={`flex-1 py-1 rounded text-[11px] font-bold transition-all ${
                marginMode === 'isolated' ? 'bg-[#1e2738] text-[#00F2FE] shadow border border-[#00F2FE]/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Isolated
            </button>
          </div>

          {/* Leverage Pill Button */}
          <div className="bg-[#121723] border border-[#00F2FE]/40 px-3 py-1.5 rounded-lg flex items-center gap-1 text-[#00F2FE] font-bold">
            <Sliders className="w-3.5 h-3.5" />
            <span>{leverage}x</span>
          </div>
        </div>

        {/* Leverage Slider Control */}
        <div className="space-y-1.5 bg-[#121722] p-2.5 rounded-xl border border-[#1e2638]">
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold">
            <span>Select Leverage</span>
            <span className="text-[#00F2FE] font-mono font-bold">{leverage}x (Max {pair.maxLeverage}x)</span>
          </div>
          <input
            type="range"
            min={1}
            max={pair.maxLeverage}
            value={leverage}
            onChange={e => setLeverage(Number(e.target.value))}
            className="w-full accent-[#00F2FE] cursor-pointer"
          />
          <div className="flex justify-between gap-1 mt-1">
            {leveragePresets.map(l => (
              <button
                key={l}
                onClick={() => setLeverage(l)}
                className={`flex-1 py-0.5 rounded text-[10px] font-bold transition-all ${
                  leverage === l ? 'bg-cyan-500 text-slate-950' : 'bg-[#1a2130] text-slate-400 hover:text-white'
                }`}
              >
                {l}x
              </button>
            ))}
          </div>
        </div>

        {/* Order Type Tabs */}
        <div className="flex bg-[#121723] p-1 rounded-lg border border-[#20293c]">
          <button
            onClick={() => setOrderType('market')}
            className={`flex-1 py-1 rounded text-[11px] font-bold transition-all ${
              orderType === 'market' ? 'bg-[#1e2738] text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Market
          </button>
          <button
            onClick={() => setOrderType('limit')}
            className={`flex-1 py-1 rounded text-[11px] font-bold transition-all ${
              orderType === 'limit' ? 'bg-[#1e2738] text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Limit
          </button>
          <button
            onClick={() => setOrderType('stop_market')}
            className={`flex-1 py-1 rounded text-[11px] font-bold transition-all ${
              orderType === 'stop_market' ? 'bg-[#1e2738] text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stop
          </button>
        </div>

        {/* Limit Price Input if Order Type is Limit */}
        {orderType === 'limit' && (
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">
              Limit Order Price ({pair.quoteSymbol})
            </label>
            <input
              type="number"
              value={limitPriceInput}
              onChange={e => setLimitPriceInput(e.target.value)}
              className="w-full bg-[#121722] border border-[#20293c] focus:border-[#00F2FE] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
            />
          </div>
        )}

        {/* Margin Input Field */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 font-semibold mb-1">
            <span>Order Margin (Rupiah)</span>
            <span>Avail: <span className="text-white font-mono">Rp {availableBalance.toLocaleString('id-ID')}</span></span>
          </div>
          <div className="relative">
            <input
              type="number"
              value={marginUsdtInput}
              onChange={e => setMarginUsdtInput(e.target.value)}
              placeholder="100000"
              className="w-full bg-[#121722] border border-[#20293c] focus:border-[#00F2FE] rounded-lg px-3 py-2 text-white font-mono text-sm outline-none font-bold"
            />
            <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">IDR</span>
          </div>

          {/* Quick Balance Percentage Chips */}
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentageSelect(pct)}
                className="py-1 bg-[#151c2a] hover:bg-[#1e283c] border border-[#222b3e] text-slate-300 text-[10px] font-bold rounded-md transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Take Profit & Stop Loss Optional Checkbox */}
        <div className="space-y-2 pt-1 border-t border-[#182030]">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
            <input
              type="checkbox"
              checked={enableTpSl}
              onChange={e => setEnableTpSl(e.target.checked)}
              className="accent-[#00F2FE] rounded"
            />
            <span>Take Profit / Stop Loss (TP/SL)</span>
          </label>

          {enableTpSl && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-150">
              <div>
                <span className="text-[10px] text-emerald-400 font-semibold block mb-0.5">TP Target ($)</span>
                <input
                  type="number"
                  placeholder={(pair.price * 1.05).toFixed(pair.precision)}
                  value={tpInput}
                  onChange={e => setTpInput(e.target.value)}
                  className="w-full bg-[#121722] border border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] text-rose-400 font-semibold block mb-0.5">SL Cut ($)</span>
                <input
                  type="number"
                  placeholder={(pair.price * 0.95).toFixed(pair.precision)}
                  value={slInput}
                  onChange={e => setSlInput(e.target.value)}
                  className="w-full bg-[#121722] border border-rose-500/30 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Order Summary & Calculations */}
        <div className="bg-[#121722] p-2.5 rounded-xl border border-[#1e2638] space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>Position Size</span>
            <span className="text-white font-bold">{qtyBaseAsset} {pair.baseSymbol}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Contract Notional</span>
            <span className="text-[#00F2FE] font-bold">Rp {contractValue.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Est. Liq Price (Long)</span>
            <span className="text-amber-400 font-bold">
              ${(pair.price * (1 - (1 / leverage) * 0.90)).toFixed(pair.precision)}
            </span>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div
            className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* Primary Action Trading Buttons (BUY LONG / SELL SHORT) */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {/* BUY / LONG BUTTON */}
        <button
          id="btn-buy-long"
          onClick={() => handleExecuteOrder('long')}
          className="py-3 px-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] cursor-pointer"
        >
          <div className="flex items-center gap-1 text-sm uppercase">
            <ArrowUpRight className="w-4 h-4 stroke-[3]" />
            <span>Buy / Long</span>
          </div>
          <span className="text-[10px] font-mono opacity-90 font-bold">
            ${pair.price.toFixed(pair.precision)}
          </span>
        </button>

        {/* SELL / SHORT BUTTON */}
        <button
          id="btn-sell-short"
          onClick={() => handleExecuteOrder('short')}
          className="py-3 px-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-black rounded-xl flex flex-col items-center justify-center transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)] hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] cursor-pointer"
        >
          <div className="flex items-center gap-1 text-sm uppercase">
            <ArrowDownRight className="w-4 h-4 stroke-[3]" />
            <span>Sell / Short</span>
          </div>
          <span className="text-[10px] font-mono opacity-90 font-bold">
            ${pair.price.toFixed(pair.precision)}
          </span>
        </button>
      </div>
    </div>
  );
};
