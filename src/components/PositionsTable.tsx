import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { Position, Order, TradeHistoryItem } from '../types';
import {
  Layers,
  Clock,
  History,
  ShieldCheck,
  XCircle,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Edit2,
  Check,
  Zap
} from 'lucide-react';

export const PositionsTable: React.FC = () => {
  const { positions, orders, tradeHistory, closePosition, cancelOrder, updateTpSl, inspectBlockchainProof } = useTrading();
  const [activeTab, setActiveTab] = useState<'positions' | 'orders' | 'history'>('positions');

  // Editing TP/SL state for positions
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [tempTp, setTempTp] = useState('');
  const [tempSl, setTempSl] = useState('');

  const handleSaveTpSl = (posId: string) => {
    updateTpSl(
      posId,
      tempTp ? parseFloat(tempTp) : undefined,
      tempSl ? parseFloat(tempSl) : undefined
    );
    setEditingPosId(null);
  };

  return (
    <div className="bg-[#0b0e14] border border-[#1b2232] rounded-xl overflow-hidden shadow-xl text-xs">
      {/* Header Tabs Bar */}
      <div className="flex items-center justify-between bg-[#10141d] border-b border-[#1b2232] px-3 py-2">
        <div className="flex gap-2">
          <button
            id="positions-tab-active"
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'positions'
                ? 'bg-[#1f283a] text-[#00F2FE] border border-[#00F2FE]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Open Positions ({positions.length})
          </button>

          <button
            id="positions-tab-orders"
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-[#1f283a] text-[#00F2FE] border border-[#00F2FE]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Open Orders ({orders.length})
          </button>

          <button
            id="positions-tab-history"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#1f283a] text-[#00F2FE] border border-[#00F2FE]/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Trade History ({tradeHistory.length})
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded-md">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ZK-Proof Settlement Engine Active</span>
        </div>
      </div>

      {/* POSITIONS TAB */}
      {activeTab === 'positions' && (
        <div className="overflow-x-auto custom-scrollbar">
          {positions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">
              <Zap className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
              No open positions. Select leverage and click Buy / Long or Sell / Short above.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0f131c] text-[10px] text-slate-400 uppercase font-semibold border-b border-[#1b2232]">
                  <th className="py-2.5 px-3">Symbol / Side</th>
                  <th className="py-2.5 px-3">Size & Margin</th>
                  <th className="py-2.5 px-3">Entry Price</th>
                  <th className="py-2.5 px-3">Mark Price</th>
                  <th className="py-2.5 px-3">Est. Liq Price</th>
                  <th className="py-2.5 px-3">Unrealized PnL (ROI)</th>
                  <th className="py-2.5 px-3">TP / SL</th>
                  <th className="py-2.5 px-3">Blockchain Tx</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171e2c] font-mono">
                {positions.map(pos => (
                  <tr key={pos.id} className="hover:bg-[#131926] transition-colors">
                    
                    {/* Symbol / Side */}
                    <td className="py-2.5 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                            pos.side === 'long' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          {pos.side} {pos.leverage}x
                        </span>
                        <span className="font-bold text-white text-xs">{pos.pairSymbol}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1 rounded uppercase">{pos.marginMode}</span>
                      </div>
                    </td>

                    {/* Size & Margin */}
                    <td className="py-2.5 px-3">
                      <div className="text-white font-bold">{pos.size}</div>
                      <div className="text-[10px] text-slate-400">Rp {pos.marginUsdt.toLocaleString('id-ID')}</div>
                    </td>

                    {/* Entry Price */}
                    <td className="py-2.5 px-3 text-slate-200">${pos.entryPrice.toFixed(2)}</td>

                    {/* Mark Price */}
                    <td className="py-2.5 px-3 font-bold text-white">${pos.markPrice.toFixed(2)}</td>

                    {/* Est Liq Price */}
                    <td className="py-2.5 px-3 text-amber-400 font-bold">${pos.liquidationPrice.toFixed(2)}</td>

                    {/* PnL & ROI */}
                    <td className="py-2.5 px-3">
                      <div className={`font-bold text-xs flex items-center gap-1 ${pos.pnlUsdt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pos.pnlUsdt >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                        {pos.pnlUsdt >= 0 ? '+' : ''}Rp {pos.pnlUsdt.toLocaleString('id-ID')}
                      </div>
                      <div className={`text-[10px] ${pos.pnlPercentage >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ({pos.pnlPercentage >= 0 ? '+' : ''}{pos.pnlPercentage.toFixed(2)}%)
                      </div>
                    </td>

                    {/* TP / SL */}
                    <td className="py-2.5 px-3">
                      {editingPosId === pos.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="TP"
                            value={tempTp}
                            onChange={e => setTempTp(e.target.value)}
                            className="w-12 bg-slate-900 border border-slate-700 px-1 py-0.5 rounded text-[10px] text-white"
                          />
                          <input
                            type="number"
                            placeholder="SL"
                            value={tempSl}
                            onChange={e => setTempSl(e.target.value)}
                            className="w-12 bg-slate-900 border border-slate-700 px-1 py-0.5 rounded text-[10px] text-white"
                          />
                          <button
                            onClick={() => handleSaveTpSl(pos.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-slate-300">
                          <span>TP: {pos.tpPrice ? `$${pos.tpPrice}` : '--'}</span>
                          <span>/</span>
                          <span>SL: {pos.slPrice ? `$${pos.slPrice}` : '--'}</span>
                          <button
                            onClick={() => {
                              setEditingPosId(pos.id);
                              setTempTp(pos.tpPrice?.toString() || '');
                              setTempSl(pos.slPrice?.toString() || '');
                            }}
                            className="text-cyan-400 hover:text-cyan-300 p-0.5"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Blockchain Hash Proof */}
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => inspectBlockchainProof(pos.txHash, pos.pairSymbol, pos.side, pos.entryPrice)}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-mono transition-colors"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{pos.txHash.slice(0, 6)}...{pos.txHash.slice(-4)}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </td>

                    {/* Close Position Button */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => closePosition(pos.id)}
                        className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold rounded-lg transition-all"
                      >
                        Close Market
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="overflow-x-auto custom-scrollbar">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">
              No pending open limit orders.
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="bg-[#0f131c] text-[10px] text-slate-400 uppercase font-semibold border-b border-[#1b2232]">
                  <th className="py-2.5 px-3">Symbol / Side</th>
                  <th className="py-2.5 px-3">Order Price</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Margin</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171e2c]">
                {orders.map(ord => (
                  <tr key={ord.id} className="hover:bg-[#131926]">
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ord.side === 'long' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {ord.side.toUpperCase()} {ord.leverage}x
                      </span>{' '}
                      <span className="text-white font-bold">{ord.pairSymbol}</span>
                    </td>
                    <td className="py-2.5 px-3 text-white">${ord.price}</td>
                    <td className="py-2.5 px-3 text-slate-300">{ord.amount}</td>
                    <td className="py-2.5 px-3 text-slate-300">Rp {ord.marginUsdt.toLocaleString('id-ID')}</td>
                    <td className="py-2.5 px-3 text-amber-400 capitalize font-bold">{ord.status}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => cancelOrder(ord.id)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <div className="overflow-x-auto custom-scrollbar">
          {tradeHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">
              No closed trade history yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="bg-[#0f131c] text-[10px] text-slate-400 uppercase font-semibold border-b border-[#1b2232]">
                  <th className="py-2.5 px-3">Symbol / Side</th>
                  <th className="py-2.5 px-3">Entry → Close</th>
                  <th className="py-2.5 px-3">Realized PnL (ROI)</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Proof Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171e2c]">
                {tradeHistory.map(item => (
                  <tr key={item.id} className="hover:bg-[#131926]">
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.side === 'long' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.side.toUpperCase()} {item.leverage}x
                      </span>{' '}
                      <span className="text-white font-bold">{item.pairSymbol}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      ${item.entryPrice} → ${item.closePrice}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`font-bold ${item.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.realizedPnl >= 0 ? '+' : ''}Rp {item.realizedPnl.toLocaleString('id-ID')} ({item.pnlPercentage}%)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                      {new Date(item.closedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => inspectBlockchainProof(item.txHash, item.pairSymbol, item.side, item.entryPrice)}
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        {item.txHash.slice(0, 6)}...
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
