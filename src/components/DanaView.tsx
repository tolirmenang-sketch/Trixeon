import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck, LogIn, Lock, Coins } from 'lucide-react';

interface DanaViewProps {
  onOpenWalletModal: () => void;
  onOpenAuthModal: () => void;
}

export const DanaView: React.FC<DanaViewProps> = ({ onOpenWalletModal, onOpenAuthModal }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="bg-[#0b0e14] border border-[#1b2232] rounded-2xl p-6 text-center space-y-4 max-w-md mx-auto my-6 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-[#00F2FE]">
          <Wallet className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-white">Dompet Dana Belum Terhubung</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Silakan masuk atau daftar akun untuk melihat saldo dompet, melakukan deposit, dan penarikan dana.
          </p>
        </div>

        <button
          onClick={onOpenAuthModal}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span>Masuk / Daftar Sekarang</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0 max-w-2xl mx-auto">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-[#121826] via-[#172033] to-[#0f1420] border border-[#232f48] rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#1f2a3f] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-950 rounded-lg text-[#00F2FE]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Dana Rupiah</span>
              <div className="text-xl lg:text-2xl font-black font-mono text-white">
                Rp {user.wallet.realUsdt.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded font-bold uppercase">
            Aktif
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onOpenWalletModal}
            className="py-2.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit Dana</span>
          </button>

          <button
            onClick={onOpenWalletModal}
            className="py-2.5 px-3 bg-[#182132] hover:bg-[#202b42] text-cyan-300 border border-cyan-500/40 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Tarik Dana</span>
          </button>
        </div>
      </div>

      {/* Security Protection Callout */}
      <div className="bg-[#0b0e14] border border-[#1b2232] rounded-xl p-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="font-bold text-white">Keamanan ZK-Rollup Aktif</div>
            <div className="text-[10px] text-slate-400">Dana dijamin terisolasi di smart contract blockchain.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
