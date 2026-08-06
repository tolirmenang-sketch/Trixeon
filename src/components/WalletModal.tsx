import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitDepositRequest, fetchUserDepositRequests } from '../lib/sheetsService';
import { DepositRequest } from '../types';
import { Wallet, CheckCircle2, Copy, X, Building2, Smartphone, ArrowDownLeft, ArrowUpRight, ShieldCheck, QrCode, Sparkles, Clock, FileSpreadsheet } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminModal?: () => void;
}

type CategoryType = 'bank' | 'ewallet';

interface PaymentMethod {
  id: string;
  name: string;
  category: CategoryType;
  accountNo: string;
  accountName: string;
  color: string;
  badge: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  // Bank Indonesia
  { id: 'bca', name: 'Bank BCA', category: 'bank', accountNo: '8800-9421-0812', accountName: 'TRIXEON ASSET ID', color: '#005CAA', badge: 'BCA' },
  { id: 'mandiri', name: 'Bank Mandiri', category: 'bank', accountNo: '1370-0089-4215', accountName: 'TRIXEON ASSET ID', color: '#003B73', badge: 'MANDIRI' },
  { id: 'bri', name: 'Bank BRI', category: 'bank', accountNo: '0206-0100-9842', accountName: 'TRIXEON ASSET ID', color: '#00529C', badge: 'BRI' },
  { id: 'bni', name: 'Bank BNI', category: 'bank', accountNo: '0842-1980-2134', accountName: 'TRIXEON ASSET ID', color: '#F15A24', badge: 'BNI' },
  { id: 'permata', name: 'Bank Permata', category: 'bank', accountNo: '8520-9410-2819', accountName: 'TRIXEON ASSET ID', color: '#00833E', badge: 'PERMATA' },
  { id: 'cimb', name: 'CIMB Niaga', category: 'bank', accountNo: '8001-2094-8120', accountName: 'TRIXEON ASSET ID', color: '#ED1C24', badge: 'CIMB' },

  // e-Wallet Indonesia
  { id: 'dana', name: 'DANA', category: 'ewallet', accountNo: '0812-9842-1098', accountName: 'TRIXEON OFFICIAL', color: '#118EEA', badge: 'DANA' },
  { id: 'ovo', name: 'OVO', category: 'ewallet', accountNo: '0812-9842-1098', accountName: 'TRIXEON OFFICIAL', color: '#4C2A86', badge: 'OVO' },
  { id: 'gopay', name: 'GoPay', category: 'ewallet', accountNo: '0812-9842-1098', accountName: 'TRIXEON OFFICIAL', color: '#00AED6', badge: 'GOPAY' },
  { id: 'shopeepay', name: 'ShopeePay', category: 'ewallet', accountNo: '0812-9842-1098', accountName: 'TRIXEON OFFICIAL', color: '#EE4D2D', badge: 'SHOPEEPAY' },
  { id: 'linkaja', name: 'LinkAja', category: 'ewallet', accountNo: '0812-9842-1098', accountName: 'TRIXEON OFFICIAL', color: '#E31E25', badge: 'LINKAJA' },
];

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, onOpenAdminModal }) => {
  const { user, updateBalance } = useAuth();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('bank');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('bca');
  
  const [amountInput, setAmountInput] = useState('500000');
  const [destAccountNo, setDestAccountNo] = useState('');
  const [destAccountHolder, setDestAccountHolder] = useState('');

  const [copied, setCopied] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userRequests, setUserRequests] = useState<DepositRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadUserRequests = async () => {
    if (user?.id) {
      const list = await fetchUserDepositRequests(user.id);
      setUserRequests(list);
    }
  };

  useEffect(() => {
    if (isOpen && user?.id) {
      loadUserRequests();
    }
  }, [isOpen, user?.id]);

  if (!isOpen || !user) return null;

  const filteredMethods = PAYMENT_METHODS.filter(m => m.category === selectedCategory);
  const selectedMethod = PAYMENT_METHODS.find(m => m.id === selectedMethodId) || filteredMethods[0];

  const handleCopyNo = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountInput) || 0;
    if (val <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Jumlah deposit harus lebih besar dari Rp 0' });
      return;
    }

    setSubmitting(true);
    try {
      await submitDepositRequest({
        userId: user.id,
        userUid: user.uid,
        userName: user.name,
        userEmail: user.email,
        amountIdr: val,
        amountUsdt: val / 16000,
        method: 'QRIS',
      });

      setFeedbackMsg({
        type: 'success',
        text: `Permintaan deposit Rp ${val.toLocaleString('id-ID')} via QRIS berhasil dikirim! Penambahan balance harus disetujui Admin via Google Sheets.`
      });

      await loadUserRequests();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Gagal mengirim deposit: ${err.message || 'Error'}` });
    } finally {
      setSubmitting(false);
    }

    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountInput) || 0;
    const currentBalance = user.wallet.realUsdt;

    if (val <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Jumlah penarikan harus lebih besar dari Rp 0' });
      return;
    }

    if (val > currentBalance) {
      setFeedbackMsg({
        type: 'error',
        text: `Saldo tidak mencukupi. Saldo tersedia: Rp ${currentBalance.toLocaleString('id-ID')}`
      });
      return;
    }

    if (!destAccountNo || !destAccountHolder) {
      setFeedbackMsg({ type: 'error', text: 'Silakan isi nomor rekening / e-wallet dan nama pemilik rekening' });
      return;
    }

    updateBalance(-val);
    setFeedbackMsg({
      type: 'success',
      text: `Permintaan penarikan Rp ${val.toLocaleString('id-ID')} ke ${selectedMethod.name} (${destAccountNo}) telah diproses.`
    });
    setDestAccountNo('');
    setDestAccountHolder('');
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div id="wallet-modal-container" className="relative w-full max-w-lg bg-[#121620] border border-[#232b3e] rounded-2xl shadow-[0_0_50px_rgba(0,242,254,0.2)] overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2738] bg-gradient-to-r from-[#121620] via-[#171d2b] to-[#121620]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-[#00F2FE]">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Dompet Transaksi Rupiah</h3>
              <p className="text-[11px] text-slate-400">Deposit via QRIS Instant All Payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2738] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 font-sans text-xs overflow-y-auto flex-1">
          
          {/* Balance Overview Card */}
          <div className="p-4 rounded-xl border bg-gradient-to-r from-emerald-950/40 via-[#151d2c] to-[#121620] border-emerald-500/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Saldo Utama (Rupiah)</span>
              <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">
                Rp {user.wallet.realUsdt.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Margin Terkunci</span>
              <span className="text-xs font-mono text-cyan-300 font-bold block">
                Rp {user.wallet.marginLocked.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Deposit / Withdraw Action Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#0d1018] rounded-xl border border-[#1b2230] font-bold">
            <button
              onClick={() => { setActiveTab('deposit'); setFeedbackMsg(null); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'deposit' ? 'bg-[#1e2738] text-[#00F2FE] shadow border border-[#00F2FE]/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              <span>Deposit QRIS</span>
            </button>

            <button
              onClick={() => { setActiveTab('withdraw'); setFeedbackMsg(null); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'withdraw' ? 'bg-[#1e2738] text-[#00F2FE] shadow border border-[#00F2FE]/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-cyan-400" />
              <span>Penarikan (Withdraw)</span>
            </button>
          </div>

          {/* Notification Feedback */}
          {feedbackMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* DEPOSIT FORM - ONLY VIA QRIS */}
          {activeTab === 'deposit' && (
            <form onSubmit={handleDepositSubmit} className="space-y-4 pt-1">
              
              {/* QRIS Header Badge & Container */}
              <div className="p-4 bg-[#141a26] border border-[#232f48] rounded-2xl text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-cyan-400 font-extrabold text-sm">
                  <QrCode className="w-5 h-5 text-[#00F2FE]" />
                  <span>Scan QRIS All Payment</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Pindai QRIS di bawah ini menggunakan M-Banking (BCA, Mandiri, BRI, BNI) atau e-Wallet (DANA, OVO, GoPay, ShopeePay, LinkAja).
                </p>

                {/* QR Code Image */}
                <div className="relative group inline-block my-1">
                  <div className="bg-white p-3 rounded-2xl border-2 border-[#00F2FE]/60 shadow-[0_0_25px_rgba(0,242,254,0.3)] inline-block">
                    <img
                      src="https://i.imgur.com/FQeeybq.jpeg"
                      alt="QRIS Deposit Trixeon"
                      className="w-60 max-w-full h-auto mx-auto rounded-lg object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-[10px] font-bold text-slate-400">
                  <span className="bg-[#1b2436] px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/30">MEMBER OF QRIS</span>
                  <span className="bg-[#1b2436] px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/30">PROSES OTOMATIS</span>
                  <span className="bg-[#1b2436] px-2 py-0.5 rounded text-amber-300 border border-amber-500/30">TANPA BIAYA ADMIN</span>
                </div>
              </div>

              {/* Deposit Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jumlah Deposit yang Ditransfer (Rupiah)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    placeholder="500000"
                    className="w-full bg-[#171d2b] border border-[#232f48] focus:border-[#00F2FE] rounded-xl px-3 py-2 text-sm text-white font-mono font-bold outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">IDR</span>
                </div>

                {/* Quick Selection Presets */}
                <div className="grid grid-cols-5 gap-1.5 mt-2">
                  {[
                    { label: '50rb', val: '50000' },
                    { label: '100rb', val: '100000' },
                    { label: '500rb', val: '500000' },
                    { label: '1 Jt', val: '1000000' },
                    { label: '5 Jt', val: '5000000' }
                  ].map(item => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setAmountInput(item.val)}
                      className="py-1 bg-[#141923] hover:bg-[#1e2738] border border-[#222c3f] text-slate-300 text-[10px] font-bold rounded-lg transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? 'Mengirim ke Admin...' : 'Konfirmasi Deposit QRIS'}</span>
              </button>

              {/* Deposit Approval Notice */}
              <div className="p-3 bg-[#151d2c] border border-[#23314a] rounded-xl text-[11px] text-slate-300 space-y-1">
                <div className="font-extrabold text-amber-400 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Prosedur Penambahan Balance (Google Sheets)</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[10px]">
                  Penambahan balance memerlukan persetujuan Admin melalui Google Sheets. Setelah Anda mengonfirmasi deposit, status akan tercatat di antrean dan disetujui Admin.
                </p>
                {onOpenAdminModal && (
                  <button
                    type="button"
                    onClick={onOpenAdminModal}
                    className="mt-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Buka Admin Approval Panel (Google Sheets)</span>
                  </button>
                )}
              </div>

              {/* Deposit Request History */}
              {userRequests.length > 0 && (
                <div className="pt-2 border-t border-[#1e2738] space-y-2">
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#00F2FE]" />
                    <span>Riwayat Status Deposit Anda</span>
                  </h4>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {userRequests.map(req => (
                      <div
                        key={req.id}
                        className="p-2.5 bg-[#141a26] border border-[#20293b] rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white">{req.id}</span>
                            <span className="font-mono font-extrabold text-emerald-400">
                              Rp {req.amountIdr.toLocaleString('id-ID')}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-sans block">
                            {new Date(req.createdAt).toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div>
                          {req.status === 'PENDING' && (
                            <span className="bg-amber-950/80 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                              MENUNGGU ADMIN
                            </span>
                          )}
                          {req.status === 'APPROVED' && (
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                              DISETUJUI (+{req.amountUsdt.toFixed(2)} USDT)
                            </span>
                          )}
                          {req.status === 'REJECTED' && (
                            <span className="bg-rose-950 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                              DITOLAK
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {/* WITHDRAW FORM */}
          {activeTab === 'withdraw' && (
            <div className="space-y-3 pt-1">
              {/* Payment Method Category Filter for Withdraw */}
              <div className="flex gap-2 border-b border-[#1f2738] pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('bank');
                    const firstBank = PAYMENT_METHODS.find(m => m.category === 'bank')!;
                    setSelectedMethodId(firstBank.id);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedCategory === 'bank'
                      ? 'bg-cyan-950/80 text-[#00F2FE] border border-cyan-500/40'
                      : 'bg-[#141923] text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Bank Indonesia</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('ewallet');
                    const firstEwallet = PAYMENT_METHODS.find(m => m.category === 'ewallet')!;
                    setSelectedMethodId(firstEwallet.id);
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    selectedCategory === 'ewallet'
                      ? 'bg-cyan-950/80 text-[#00F2FE] border border-cyan-500/40'
                      : 'bg-[#141923] text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>e-Wallet Indonesia</span>
                </button>
              </div>

              {/* Payment Method Selector Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                {filteredMethods.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethodId(m.id)}
                    className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between h-14 ${
                      selectedMethod.id === m.id
                        ? 'bg-[#1d2638] border-[#00F2FE] shadow-[0_0_10px_rgba(0,242,254,0.2)]'
                        : 'bg-[#141923] border-[#222c3f] hover:bg-[#1a2130]'
                    }`}
                  >
                    <span
                      className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black text-white w-fit"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.badge}
                    </span>
                    <span className="font-bold text-white text-[11px] truncate">{m.name}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Metode Tujuan Penarikan
                  </label>
                  <div className="p-2.5 bg-[#171e2c] border border-[#263248] rounded-xl text-white font-bold flex items-center justify-between">
                    <span>{selectedMethod.name}</span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded uppercase">
                      {selectedMethod.category === 'bank' ? 'Bank Indonesia' : 'e-Wallet'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nomor Rekening / Nomor HP ({selectedMethod.name})
                  </label>
                  <input
                    type="text"
                    value={destAccountNo}
                    onChange={e => setDestAccountNo(e.target.value)}
                    placeholder={selectedMethod.category === 'bank' ? 'Contoh: 8820192384' : 'Contoh: 081234567890'}
                    className="w-full bg-[#171d2b] border border-[#232f48] focus:border-[#00F2FE] rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Pemilik Rekening / Akun
                  </label>
                  <input
                    type="text"
                    value={destAccountHolder}
                    onChange={e => setDestAccountHolder(e.target.value)}
                    placeholder="Sesuai nama di buku tabungan / e-wallet"
                    className="w-full bg-[#171d2b] border border-[#232f48] focus:border-[#00F2FE] rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Jumlah Penarikan (Rupiah)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Tersedia: <span className="text-white font-mono font-bold">Rp {user.wallet.realUsdt.toLocaleString('id-ID')}</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={amountInput}
                      onChange={e => setAmountInput(e.target.value)}
                      placeholder="500000"
                      className="w-full bg-[#171d2b] border border-[#232f48] focus:border-[#00F2FE] rounded-xl px-3 py-2 text-sm text-white font-mono font-bold outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">IDR</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all"
                >
                  Kirim Permintaan Penarikan
                </button>
              </form>
            </div>
          )}

          {/* Security Guarantee Note */}
          <div className="flex items-center gap-2 p-2.5 bg-[#0e121b] rounded-xl border border-[#1b2333] text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Transaksi diproses langsung dengan enkripsi ZK-Security 256-bit.</span>
          </div>

        </div>
      </div>
    </div>
  );
};

