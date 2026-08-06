import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToMembers,
  updateMemberBalance,
  updateMemberStatus,
  toggleMemberVerification,
  toggleMemberAdmin,
  createMemberManually,
  deleteMember
} from '../lib/adminMemberService';
import {
  fetchAllDepositRequests,
  approveDepositRequest,
  rejectDepositRequest,
  getStoredSpreadsheetId,
  setStoredSpreadsheetId
} from '../lib/sheetsService';
import { User, DepositRequest } from '../types';
import {
  Users,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  Search,
  Plus,
  Minus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileSpreadsheet,
  ExternalLink,
  Sparkles,
  X,
  Lock,
  Unlock,
  Wallet,
  Coins,
  DollarSign,
  UserCheck,
  UserX,
  Eye,
  ArrowUpRight,
  Filter
} from 'lucide-react';

interface AdminMemberControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminMemberControlModal: React.FC<AdminMemberControlModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'members' | 'add_member' | 'deposits'>('members');
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'verified' | 'admin'>('all');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Balance edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [balanceInput, setBalanceInput] = useState<string>('');
  const [balanceMode, setBalanceMode] = useState<'add' | 'subtract' | 'set'>('add');

  // Member detail modal state
  const [detailUser, setDetailUser] = useState<User | null>(null);

  // Manual Member creation state
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newInitialBalance, setNewInitialBalance] = useState<string>('100');
  const [newIsAdmin, setNewIsAdmin] = useState<boolean>(false);

  // Deposit requests state
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(getStoredSpreadsheetId() || '');

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Subscribe to members from Firestore
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const unsubscribe = subscribeToMembers((updatedMembers) => {
      setMembers(updatedMembers);
      setLoading(false);
    });

    loadDeposits();

    return () => unsubscribe();
  }, [isOpen]);

  const loadDeposits = async () => {
    try {
      const list = await fetchAllDepositRequests();
      setDepositRequests(list);
    } catch (err) {
      console.error("Failed to load deposit requests:", err);
    }
  };

  if (!isOpen) return null;

  const isAdmin = currentUser?.email?.toLowerCase() === 'tolirmenang@gmail.com';
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
        <div className="bg-[#0f141f] border border-rose-500/40 rounded-2xl p-6 text-center max-w-sm w-full shadow-2xl space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">AKSES DITOLAK</h3>
          <p className="text-xs text-slate-400">
            Panel Admin Kontrol Member khusus dan hanya dapat diakses oleh akun admin: <br />
            <span className="text-cyan-400 font-bold">tolirmenang@gmail.com</span>
          </p>
          <button
            onClick={onClose}
            className="w-full mt-2 py-2.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/40 font-bold rounded-xl text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.phone && m.phone.includes(searchQuery)) ||
      m.uid.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return !m.isBanned && m.status !== 'suspended' && m.status !== 'banned';
    if (statusFilter === 'suspended') return m.isBanned || m.status === 'suspended' || m.status === 'banned';
    if (statusFilter === 'verified') return m.isVerified;
    if (statusFilter === 'admin') return m.isAdmin;

    return true;
  });

  // System Stats
  const totalMembers = members.length;
  const activeCount = members.filter((m) => !m.isBanned && m.status !== 'suspended').length;
  const totalSystemBalanceUsdt = members.reduce((sum, m) => sum + (m.wallet?.realUsdt || 0), 0);
  const pendingDepositsCount = depositRequests.filter((d) => d.status === 'PENDING').length;

  // Handlers
  const handleBalanceUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const amount = parseFloat(balanceInput) || 0;
    setLoading(true);
    const success = await updateMemberBalance(editingUser.id, amount, balanceMode);
    setLoading(false);

    if (success) {
      const modeText = balanceMode === 'add' ? 'ditambahkan' : balanceMode === 'subtract' ? 'dikurangi' : 'diatur ke';
      showToast(`Balance member ${editingUser.name} (${editingUser.uid}) berhasil ${modeText} $${amount.toFixed(2)} USDT!`);
      setEditingUser(null);
      setBalanceInput('');
    } else {
      showToast(`Gagal memperbarui balance member`, 'error');
    }
  };

  const handleToggleStatus = async (m: User) => {
    const newStatus = m.status === 'suspended' || m.isBanned ? 'active' : 'suspended';
    setLoading(true);
    const success = await updateMemberStatus(m.id, newStatus);
    setLoading(false);

    if (success) {
      showToast(`Status member ${m.name} diubah menjadi ${newStatus.toUpperCase()}`);
    } else {
      showToast(`Gagal mengubah status member`, 'error');
    }
  };

  const handleToggleVerification = async (m: User) => {
    setLoading(true);
    const success = await toggleMemberVerification(m.id, !m.isVerified);
    setLoading(false);

    if (success) {
      showToast(`Status KYC member ${m.name} diubah menjadi ${!m.isVerified ? 'VERIFIED' : 'UNVERIFIED'}`);
    } else {
      showToast(`Gagal mengubah verifikasi member`, 'error');
    }
  };

  const handleToggleAdmin = async (m: User) => {
    setLoading(true);
    const success = await toggleMemberAdmin(m.id, !m.isAdmin);
    setLoading(false);

    if (success) {
      showToast(`Peran Admin member ${m.name} diubah menjadi ${!m.isAdmin ? 'ADMIN' : 'MEMBER BIASA'}`);
    } else {
      showToast(`Gagal mengubah peran admin`, 'error');
    }
  };

  const handleDeleteUser = async (m: User) => {
    if (m.id === currentUser?.id) {
      showToast('Anda tidak dapat menghapus akun Anda sendiri!', 'error');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus member ${m.name} (${m.uid}) secara permanen dari Firestore?`)) {
      return;
    }

    setLoading(true);
    const success = await deleteMember(m.id);
    setLoading(false);

    if (success) {
      showToast(`Member ${m.name} berhasil dihapus dari sistem!`);
    } else {
      showToast(`Gagal menghapus member`, 'error');
    }
  };

  const handleCreateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Nama member wajib diisi!', 'error');
      return;
    }

    setLoading(true);
    const created = await createMemberManually({
      name: newName,
      email: newEmail.trim() || undefined,
      phone: newPhone.trim() || undefined,
      initialBalance: parseFloat(newInitialBalance) || 0,
      isAdmin: newIsAdmin
    });
    setLoading(false);

    if (created) {
      showToast(`Member baru ${created.name} (${created.uid}) berhasil didaftarkan!`);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewInitialBalance('100');
      setNewIsAdmin(false);
      setActiveTab('members');
    } else {
      showToast('Gagal membuat member baru', 'error');
    }
  };

  const handleApproveDeposit = async (dep: DepositRequest, idx: number) => {
    setLoading(true);
    const success = await approveDepositRequest({
      depositId: dep.id,
      userId: dep.userId,
      amountUsdt: dep.amountUsdt || (dep.amountIdr / 16000),
      adminName: currentUser?.name || 'Admin Trixeon',
      spreadsheetId: spreadsheetId || null,
      rowIndex: idx + 2
    });
    setLoading(false);

    if (success) {
      showToast(`Deposit ${dep.id} Rp ${dep.amountIdr.toLocaleString('id-ID')} BERHASIL disetujui & dikreditkan!`);
      await loadDeposits();
    } else {
      showToast(`Gagal menyetujui deposit`, 'error');
    }
  };

  const handleRejectDeposit = async (depId: string) => {
    setLoading(true);
    const success = await rejectDepositRequest(depId, 'Ditolak Admin');
    setLoading(false);

    if (success) {
      showToast(`Deposit ${depId} berhasil ditolak.`);
      await loadDeposits();
    } else {
      showToast(`Gagal menolak deposit`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0f141f] border border-[#222e45] rounded-2xl shadow-[0_0_60px_rgba(0,242,254,0.15)] overflow-hidden flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-[#1c2638] bg-gradient-to-r from-[#111724] via-[#192236] to-[#111724] gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-[#00F2FE]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-wide">
                  PANEL KONTROL MEMBER (ADMIN SYSTEM)
                </h3>
                <span className="px-2 py-0.5 bg-cyan-950 text-[#00F2FE] border border-cyan-500/30 text-[10px] font-extrabold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> REALTIME FIRESTORE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Kelola saldo member, status akun, verifikasi KYC, dan antrean deposit pengguna secara terpusat
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors self-end sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div
            className={`px-4 py-2.5 mx-4 mt-3 rounded-xl border font-semibold text-xs flex items-center justify-between animate-in fade-in ${
              toastMsg.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-300'
                : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{toastMsg.text}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* System Stats Bar */}
        <div className="px-4 py-3 bg-[#131a29] border-b border-[#1f2a3e] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-[#0e131d] border border-[#1f283b] rounded-xl flex items-center gap-2.5">
            <Users className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">TOTAL MEMBER</span>
              <span className="text-sm font-extrabold text-white font-mono">{totalMembers} Pengguna</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#0e131d] border border-[#1f283b] rounded-xl flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">MEMBER AKTIF</span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">{activeCount} Pengguna</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#0e131d] border border-[#1f283b] rounded-xl flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">POOL SALDO SISTEM</span>
              <span className="text-sm font-extrabold text-amber-300 font-mono">
                ${totalSystemBalanceUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-[#0e131d] border border-[#1f283b] rounded-xl flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">PENDING DEPOSIT</span>
              <span className="text-sm font-extrabold text-purple-300 font-mono">
                {pendingDepositsCount} Permintaan
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 border-b border-[#1c2638] bg-[#101622] flex items-center gap-2">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'members'
                ? 'border-[#00F2FE] text-[#00F2FE]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar & Kontrol Member ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add_member')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'add_member'
                ? 'border-[#00F2FE] text-[#00F2FE]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Member Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-4 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'deposits'
                ? 'border-[#00F2FE] text-[#00F2FE]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Persetujuan Deposit ({pendingDepositsCount})</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="p-4 overflow-y-auto flex-1 font-sans text-xs">

          {/* TAB 1: MEMBERS LIST & ACTIONS */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#141b29] p-3 rounded-xl border border-[#202b3f]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari berdasarkan nama, email, no.hp, atau UID (TX-XXXXXX)..."
                    className="w-full bg-[#0b0e17] border border-[#222c3f] focus:border-[#00F2FE] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="bg-[#0b0e17] border border-[#222c3f] text-slate-200 text-xs rounded-lg px-3 py-2 outline-none font-semibold"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="suspended">Suspended / Banned</option>
                    <option value="verified">KYC Verified</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              {/* Members Table */}
              <div className="bg-[#111723] border border-[#1f293b] rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#0b0f17] text-slate-400 font-bold border-b border-[#1c2536]">
                      <tr>
                        <th className="p-3">Pengguna</th>
                        <th className="p-3">UID</th>
                        <th className="p-3">Saldo USDT (Real)</th>
                        <th className="p-3">KYC & Peran</th>
                        <th className="p-3">Status Akun</th>
                        <th className="p-3 text-right">Kontrol Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b2333]">
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            Tidak ada member yang ditemukan sesuai kriteria pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((m) => {
                          const isSuspended = m.isBanned || m.status === 'suspended' || m.status === 'banned';
                          const realUsdt = m.wallet?.realUsdt || 0;

                          return (
                            <tr key={m.id} className="hover:bg-[#161e2c] transition-colors">
                              {/* User Info */}
                              <td className="p-3">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={
                                      m.avatar ||
                                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                                    }
                                    alt={m.name}
                                    className="w-8 h-8 rounded-full object-cover border border-[#28354c]"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-white block">{m.name}</span>
                                      {m.isAdmin && (
                                        <span className="px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-500/30 rounded text-[9px] font-extrabold">
                                          ADMIN
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-sans block">
                                      {m.email || m.phone || m.authMethod.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* UID */}
                              <td className="p-3 font-mono font-bold text-cyan-400">
                                {m.uid}
                              </td>

                              {/* Wallet Balance */}
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-extrabold text-amber-300 text-sm">
                                    ${realUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingUser(m);
                                      setBalanceInput(realUsdt.toString());
                                      setBalanceMode('add');
                                    }}
                                    className="p-1 bg-[#1c273a] hover:bg-cyan-950 text-cyan-300 border border-cyan-500/30 rounded transition-colors"
                                    title="Edit / Atur Saldo Member"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                              {/* KYC & Admin Role */}
                              <td className="p-3">
                                <div className="flex flex-col gap-1 items-start">
                                  <button
                                    onClick={() => handleToggleVerification(m)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 transition-all ${
                                      m.isVerified
                                        ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                                        : 'bg-amber-950 text-amber-400 border-amber-500/40'
                                    }`}
                                  >
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>{m.isVerified ? 'KYC VERIFIED' : 'UNVERIFIED'}</span>
                                  </button>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="p-3">
                                {isSuspended ? (
                                  <span className="bg-rose-950 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> SUSPENDED
                                  </span>
                                ) : (
                                  <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> AKTIF
                                  </span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Edit Balance */}
                                  <button
                                    onClick={() => {
                                      setEditingUser(m);
                                      setBalanceInput(realUsdt.toString());
                                      setBalanceMode('add');
                                    }}
                                    className="px-2 py-1 bg-[#1a2436] hover:bg-[#25334c] text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded transition-colors flex items-center gap-1"
                                    title="Edit Saldo"
                                  >
                                    <DollarSign className="w-3 h-3" />
                                    <span>Saldo</span>
                                  </button>

                                  {/* Toggle Suspend */}
                                  <button
                                    onClick={() => handleToggleStatus(m)}
                                    className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors flex items-center gap-1 ${
                                      isSuspended
                                        ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-500/30'
                                        : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-500/30'
                                    }`}
                                    title={isSuspended ? 'Buka Suspend Akun' : 'Suspend / Bekukan Akun'}
                                  >
                                    {isSuspended ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                                    <span>{isSuspended ? 'Aktifkan' : 'Suspend'}</span>
                                  </button>

                                  {/* Toggle Admin */}
                                  <button
                                    onClick={() => handleToggleAdmin(m)}
                                    className="p-1 bg-[#172130] hover:bg-purple-950 text-purple-300 border border-purple-500/30 rounded transition-colors"
                                    title={m.isAdmin ? 'Jadikan Member Biasa' : 'Jadikan Admin'}
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Detail */}
                                  <button
                                    onClick={() => setDetailUser(m)}
                                    className="p-1 bg-[#172130] hover:bg-[#223147] text-cyan-300 border border-cyan-500/30 rounded transition-colors"
                                    title="Lihat Detail Member"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDeleteUser(m)}
                                    className="p-1 bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-500/30 rounded transition-colors"
                                    title="Hapus Member Permanen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL ADD MEMBER */}
          {activeTab === 'add_member' && (
            <div className="max-w-2xl mx-auto bg-[#121824] border border-[#212c40] p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-[#1d2738] pb-3">
                <div className="p-2 bg-cyan-950 border border-cyan-500/40 rounded-xl text-[#00F2FE]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-sm">Pendaftaran Member Baru oleh Admin</h4>
                  <p className="text-[11px] text-slate-400">Buat akun pengguna baru secara manual langsung ke Firestore database</p>
                </div>
              </div>

              <form onSubmit={handleCreateMemberSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Nama Lengkap Member *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-[#0b0e16] border border-[#212c40] focus:border-[#00F2FE] rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Email Pengguna (Opsional)</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="budi@example.com"
                      className="w-full bg-[#0b0e16] border border-[#212c40] focus:border-[#00F2FE] rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">No. WhatsApp / HP (Opsional)</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full bg-[#0b0e16] border border-[#212c40] focus:border-[#00F2FE] rounded-lg px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Saldo Awal (USDT)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={newInitialBalance}
                      onChange={(e) => setNewInitialBalance(e.target.value)}
                      className="w-full bg-[#0b0e16] border border-[#212c40] focus:border-[#00F2FE] rounded-lg px-3 py-2 text-xs text-amber-300 font-mono font-bold outline-none"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={newIsAdmin}
                        onChange={(e) => setNewIsAdmin(e.target.checked)}
                        className="w-4 h-4 accent-[#00F2FE] rounded"
                      />
                      <span>Beri Peran Administrator</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold rounded-xl shadow-[0_0_20px_rgba(0,242,254,0.25)] transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Member Baru</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: DEPOSIT APPROVALS & GOOGLE SHEETS */}
          {activeTab === 'deposits' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#141c2b] border border-[#223048] rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <input
                    type="text"
                    value={spreadsheetId}
                    onChange={(e) => {
                      setSpreadsheetId(e.target.value);
                      setStoredSpreadsheetId(e.target.value);
                    }}
                    placeholder="Google Spreadsheet ID (contoh: 1BxiMVs0XRnt3B...)"
                    className="w-full bg-[#0b0f17] border border-[#212c40] focus:border-[#00F2FE] rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                  />
                </div>

                {spreadsheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 font-bold rounded-lg transition-all flex items-center gap-1 text-xs"
                  >
                    <span>Buka Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {/* Deposit Requests Table */}
              <div className="bg-[#111723] border border-[#1f293b] rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#0b0f17] text-slate-400 font-bold border-b border-[#1c2536]">
                      <tr>
                        <th className="p-3">Request ID</th>
                        <th className="p-3">Pengguna</th>
                        <th className="p-3">Jumlah Deposit (IDR)</th>
                        <th className="p-3">Kredit Balance (USDT)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Persetujuan Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1b2333]">
                      {depositRequests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500">
                            Belum ada permintaan deposit dalam antrean.
                          </td>
                        </tr>
                      ) : (
                        depositRequests.map((dep, idx) => (
                          <tr key={dep.id} className="hover:bg-[#161e2c] transition-colors">
                            <td className="p-3 font-mono font-bold text-white">
                              {dep.id}
                              <span className="block text-[10px] text-slate-500 font-sans">
                                {new Date(dep.createdAt).toLocaleString('id-ID')}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-white block">{dep.userName}</span>
                              <span className="font-mono text-[10px] text-cyan-400">{dep.userUid}</span>
                            </td>
                            <td className="p-3 font-mono font-extrabold text-emerald-400">
                              Rp {dep.amountIdr.toLocaleString('id-ID')}
                            </td>
                            <td className="p-3 font-mono font-bold text-cyan-300">
                              +{(dep.amountUsdt || dep.amountIdr / 16000).toFixed(2)} USDT
                            </td>
                            <td className="p-3">
                              {dep.status === 'PENDING' && (
                                <span className="bg-amber-950 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                                  MENUNGGU ADMIN
                                </span>
                              )}
                              {dep.status === 'APPROVED' && (
                                <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                                  DISETUJUI
                                </span>
                              )}
                              {dep.status === 'REJECTED' && (
                                <span className="bg-rose-950 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                                  DITOLAK
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {dep.status === 'PENDING' ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleApproveDeposit(dep, idx)}
                                    disabled={loading}
                                    className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-[11px] rounded-lg shadow-md transition-all flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Setujui</span>
                                  </button>
                                  <button
                                    onClick={() => handleRejectDeposit(dep.id)}
                                    disabled={loading}
                                    className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/30 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Tolak</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {dep.status === 'APPROVED' ? 'Saldo Dikreditkan' : 'Selesai'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* POPUP MODAL 1: EDIT BALANCE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#121825] border border-[#253249] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f2a3e] pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h4 className="font-extrabold text-white text-sm">
                  Edit Saldo Member: {editingUser.name}
                </h4>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#0c1018] rounded-xl border border-[#1f283a] space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>UID Pengguna:</span>
                <span className="font-mono text-cyan-400 font-bold">{editingUser.uid}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Saldo Real Saat Ini:</span>
                <span className="font-mono text-amber-300 font-extrabold">
                  ${(editingUser.wallet?.realUsdt || 0).toFixed(2)} USDT
                </span>
              </div>
            </div>

            <form onSubmit={handleBalanceUpdateSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Pilih Mode Operasi Saldo:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceMode('add')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                      balanceMode === 'add'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-[#0e131c] text-slate-400 border-[#1f293a]'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah (+)
                  </button>

                  <button
                    type="button"
                    onClick={() => setBalanceMode('subtract')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                      balanceMode === 'subtract'
                        ? 'bg-rose-950 text-rose-300 border-rose-500'
                        : 'bg-[#0e131c] text-slate-400 border-[#1f293a]'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" /> Kurang (-)
                  </button>

                  <button
                    type="button"
                    onClick={() => setBalanceMode('set')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1 ${
                      balanceMode === 'set'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                        : 'bg-[#0e131c] text-slate-400 border-[#1f293a]'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" /> Set Total (=)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Nominal Saldo (USDT):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  placeholder="Masukkan jumlah USDT..."
                  className="w-full bg-[#0b0e16] border border-[#202b3e] focus:border-[#00F2FE] rounded-xl px-3 py-2.5 text-sm font-mono text-amber-300 font-bold outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-[#172130] text-slate-300 rounded-xl font-bold text-xs hover:bg-[#202c3f]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-lg disabled:opacity-50"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: MEMBER DETAIL MODAL */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#121825] border border-[#253249] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1f2a3e] pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={detailUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={detailUser.name}
                  className="w-10 h-10 rounded-full border border-cyan-500/40 object-cover"
                />
                <div>
                  <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                    {detailUser.name}
                    {detailUser.isAdmin && (
                      <span className="px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-500/30 rounded text-[9px] font-bold">
                        ADMIN
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] text-cyan-400 font-mono font-bold">UID: {detailUser.uid}</span>
                </div>
              </div>
              <button onClick={() => setDetailUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0c1018] rounded-xl border border-[#1f293b]">
                <span className="text-slate-400 block text-[10px]">Saldo Real USDT</span>
                <span className="text-amber-300 font-mono font-extrabold text-sm">
                  ${(detailUser.wallet?.realUsdt || 0).toFixed(2)} USDT
                </span>
              </div>

              <div className="p-3 bg-[#0c1018] rounded-xl border border-[#1f293b]">
                <span className="text-slate-400 block text-[10px]">Margin Terkunci</span>
                <span className="text-cyan-300 font-mono font-extrabold text-sm">
                  ${(detailUser.wallet?.marginLocked || 0).toFixed(2)} USDT
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#0c1018] rounded-xl border border-[#1f293b] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-semibold">{detailUser.email || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">No. WhatsApp/HP:</span>
                <span className="text-white font-semibold">{detailUser.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Metode Login:</span>
                <span className="text-cyan-400 font-mono font-bold uppercase">{detailUser.authMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status KYC:</span>
                <span className={detailUser.isVerified ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {detailUser.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailUser(null)}
                className="px-4 py-2 bg-[#1b2538] hover:bg-[#24324a] text-white font-bold rounded-xl text-xs transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
