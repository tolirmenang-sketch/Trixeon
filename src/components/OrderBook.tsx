import React, { useState, useEffect } from 'react';
import { CryptoPair, OrderBookItem, MarketTrade } from '../types';
import { Layers, Activity, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface OrderBookProps {
  pair: CryptoPair;
}

export const OrderBook: React.FC<OrderBookProps> = ({ pair }) => {
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');
  const [asks, setAsks] = useState<OrderBookItem[]>([]);
  const [bids, setBids] = useState<OrderBookItem[]>([]);
  const [marketTrades, setMarketTrades] = useState<MarketTrade[]>([]);

  // Generate dynamic orderbook depth around pair.price
  useEffect(() => {
    const generateDepth = () => {
      const askItems: OrderBookItem[] = [];
      const bidItems: OrderBookItem[] = [];

      let askTotal = 0;
      let bidTotal = 0;

      const step = pair.price * 0.0003;

      for (let i = 8; i >= 1; i--) {
        const price = +(pair.price + i * step).toFixed(pair.precision);
        const amount = +(Math.random() * 2.8 + 0.1).toFixed(3);
        askTotal += amount;
        askItems.push({ price, amount, total: +askTotal.toFixed(3) });
      }

      for (let i = 1; i <= 8; i++) {
        const price = +(pair.price - i * step).toFixed(pair.precision);
        const amount = +(Math.random() * 2.8 + 0.1).toFixed(3);
        bidTotal += amount;
        bidItems.push({ price, amount, total: +bidTotal.toFixed(3) });
      }

      setAsks(askItems);
      setBids(bidItems);
    };

    generateDepth();

    // Initial trades
    const initialTrades: MarketTrade[] = Array.from({ length: 12 }, (_, i) => ({
      id: 'trd_' + (Date.now() - i * 800),
      price: +(pair.price + (Math.random() - 0.5) * pair.price * 0.001).toFixed(pair.precision),
      amount: +(Math.random() * 1.5 + 0.05).toFixed(3),
      time: new Date(Date.now() - i * 800).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      side: Math.random() > 0.45 ? 'buy' : 'sell'
    }));
    setMarketTrades(initialTrades);

    // Dynamic trade updates feed
    const interval = setInterval(() => {
      generateDepth();
      const isBuy = Math.random() > 0.48;
      const tradePrice = +(pair.price + (Math.random() - 0.5) * pair.price * 0.0005).toFixed(pair.precision);
      const newTrade: MarketTrade = {
        id: 'trd_' + Date.now(),
        price: tradePrice,
        amount: +(Math.random() * 1.8 + 0.02).toFixed(3),
        time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        side: isBuy ? 'buy' : 'sell',
      };

      setMarketTrades(prev => [newTrade, ...prev.slice(0, 19)]);
    }, 1500);

    return () => clearInterval(interval);
  }, [pair.price, pair.symbol]);

  const maxAskTotal = asks.length > 0 ? asks[0].total : 10;
  const maxBidTotal = bids.length > 0 ? bids[bids.length - 1].total : 10;

  return (
    <div className="flex flex-col h-full bg-[#0b0e14] border border-[#1b2232] rounded-xl overflow-hidden text-xs">
      {/* Header Tabs */}
      <div className="flex items-center justify-between bg-[#10141d] border-b border-[#1b2232] px-2 py-1.5">
        <div className="flex gap-1 bg-[#161c28] p-1 rounded-lg">
          <button
            id="orderbook-tab-depth"
            onClick={() => setActiveTab('book')}
            className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'book'
                ? 'bg-[#1f283a] text-[#00F2FE] border border-[#00F2FE]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Order Book
          </button>
          <button
            id="orderbook-tab-trades"
            onClick={() => setActiveTab('trades')}
            className={`px-3 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'trades'
                ? 'bg-[#1f283a] text-[#00F2FE] border border-[#00F2FE]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Trades
          </button>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Precision 0.01</span>
      </div>

      {activeTab === 'book' ? (
        <div className="flex flex-col h-full justify-between p-2">
          {/* Table Header */}
          <div className="grid grid-cols-3 text-[10px] font-semibold text-slate-500 uppercase px-1 pb-1">
            <span>Price ({pair.quoteSymbol})</span>
            <span className="text-right">Size ({pair.baseSymbol})</span>
            <span className="text-right">Total</span>
          </div>

          {/* ASKS (SELL ORDERS) */}
          <div className="space-y-0.5 overflow-hidden font-mono">
            {asks.map((item, idx) => {
              const depthPct = Math.min(100, (item.total / maxAskTotal) * 100);
              return (
                <div key={'ask_' + idx} className="relative grid grid-cols-3 py-0.5 px-1 hover:bg-rose-950/20 rounded cursor-pointer group">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/10 transition-all pointer-events-none"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-rose-400 font-semibold relative z-10">{item.price.toFixed(pair.precision)}</span>
                  <span className="text-right text-slate-300 relative z-10">{item.amount}</span>
                  <span className="text-right text-slate-500 relative z-10">{item.total}</span>
                </div>
              );
            })}
          </div>

          {/* CURRENT MID PRICE SPREAD */}
          <div className="my-1.5 py-1.5 px-2 bg-[#121723] border-y border-[#1e2638] flex items-center justify-between font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-white">
                ${pair.price.toFixed(pair.precision)}
              </span>
              <span className={`text-[10px] font-bold ${pair.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pair.change24h >= 0 ? '↑' : '↓'} {pair.change24h}%
              </span>
            </div>
            <span className="text-[10px] text-cyan-400">Spread 0.02</span>
          </div>

          {/* BIDS (BUY ORDERS) */}
          <div className="space-y-0.5 overflow-hidden font-mono">
            {bids.map((item, idx) => {
              const depthPct = Math.min(100, (item.total / maxBidTotal) * 100);
              return (
                <div key={'bid_' + idx} className="relative grid grid-cols-3 py-0.5 px-1 hover:bg-emerald-950/20 rounded cursor-pointer group">
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 transition-all pointer-events-none"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="text-emerald-400 font-semibold relative z-10">{item.price.toFixed(pair.precision)}</span>
                  <span className="text-right text-slate-300 relative z-10">{item.amount}</span>
                  <span className="text-right text-slate-500 relative z-10">{item.total}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* MARKET TRADES TAB */
        <div className="p-2 h-full overflow-y-auto custom-scrollbar font-mono">
          <div className="grid grid-cols-3 text-[10px] font-semibold text-slate-500 uppercase px-1 pb-1 border-b border-[#1b2232] mb-1">
            <span>Price ({pair.quoteSymbol})</span>
            <span className="text-right">Size</span>
            <span className="text-right">Time</span>
          </div>
          <div className="space-y-1">
            {marketTrades.map(trade => (
              <div key={trade.id} className="grid grid-cols-3 py-0.5 px-1 hover:bg-[#141a27] rounded text-xs">
                <span className={`font-semibold flex items-center gap-0.5 ${trade.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {trade.side === 'buy' ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
                  {trade.price.toFixed(pair.precision)}
                </span>
                <span className="text-right text-slate-300">{trade.amount}</span>
                <span className="text-right text-slate-500 text-[10px]">{trade.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
