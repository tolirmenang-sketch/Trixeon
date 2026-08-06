import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, CheckCircle2, Lock, LogIn, LogOut, Key, FileSpreadsheet, Users } from 'lucide-react';

interface ProfilViewProps {
  onOpenAuthModal: () => void;
  onOpenAdminSheetsModal?: () => void;
  onOpenAdminMemberControlModal?: () => void;
}

export const ProfilView: React.FC<ProfilViewProps> = ({
  onOpenAuthModal,
  onOpenAdminSheetsModal,
  onOpenAdminMemberControlModal,
}) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.email?.toLowerCase() === 'tolirmenang@gmail.com';

  if (!user) {
    return (
      <div className="bg-[#0b0e14] border border-[#1b2232] rounded-2xl p-6 text-center space-y-4 max-w-md mx-auto my-6 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-[#00F2FE]">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-white">Profil Pengguna</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Anda belum masuk ke akun Trixeon. Masuk atau daftar untuk mengakses pengaturan profil dan keamanan.
          </p>
        </div>

        <button
          onClick={onOpenAuthModal}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          <span>Masuk / Daftar Akun</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0 max-w-2xl mx-auto">
      {/* User Header Card */}
      <div className="bg-[#0b0e14] border border-[#1b2232] rounded-2xl p-5 shadow-2xl flex items-center gap-4">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-14 h-14 rounded-full border-2 border-cyan-400 object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-white truncate">{user.name}</h3>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
              {user.uid}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{user.email || user.phone || 'Authenticated User'}</p>
        </div>
      </div>

      {/* Account Verification Details */}
      <div className="bg-[#0b0e14] border border-[#1b2232] rounded-2xl p-4 space-y-3 text-xs">
        <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] border-b border-[#182030] pb-2">
          Status Akun & Keamanan
        </h4>

        <div className="flex items-center justify-between py-1">
          <span className="text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verifikasi KYC</span>
          </span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-slate-400 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Keamanan 2FA ZK-Proof</span>
          </span>
          <span className="text-cyan-400 font-bold">Aktif</span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-slate-400 flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-400" />
            <span>Metode Otentikasi</span>
          </span>
          <span className="text-white font-mono uppercase">{user.authMethod}</span>
        </div>
      </div>

      {/* Admin Member Control Panel Button */}
      {isAdmin && onOpenAdminMemberControlModal && (
        <button
          onClick={onOpenAdminMemberControlModal}
          className="w-full py-3 bg-gradient-to-r from-[#142236] to-[#182b47] hover:from-[#1b2d47] hover:to-[#20375b] text-[#00F2FE] border border-cyan-500/50 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          <Users className="w-4 h-4 text-[#00F2FE]" />
          <span>Panel Admin Kontrol & Kelola Member</span>
        </button>
      )}

      {/* Admin Google Sheets Approval Button */}
      {isAdmin && onOpenAdminSheetsModal && (
        <button
          onClick={onOpenAdminSheetsModal}
          className="w-full py-3 bg-[#131d2e] hover:bg-[#1a283f] text-cyan-300 border border-cyan-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Panel Admin Deposit & Balance (Google Sheets)</span>
        </button>
      )}

      {/* Logout Button */}
      <button
        onClick={logout}
        className="w-full py-3 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
      >
        <LogOut className="w-4 h-4" />
        <span>Keluar dari Akun</span>
      </button>
    </div>
  );
};
