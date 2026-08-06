import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAllDepositRequests, approveDepositRequest, rejectDepositRequest, getStoredSpreadsheetId, setStoredSpreadsheetId } from '../lib/sheetsService';
import { DepositRequest } from '../types';
import { Table, CheckCircle2, XCircle, RefreshCw, FileSpreadsheet, ExternalLink, ShieldAlert, Sparkles, X, PlusCircle } from 'lucide-react';

interface AdminSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSheetsModal: React.FC<AdminSheetsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [spreadsheetId, setSpreadsheetIdState] = useState<string>(getStoredSpreadsheetId() || '');
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  const loadDeposits = async () => {
    setLoading(true);
    try {
      const list = await fetchAllDepositRequests();
      setDeposits(list);
    } catch (err) {
      console.error('Failed to load deposit requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDeposits();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAdmin = user?.email?.toLowerCase() === 'tolirmenang@gmail.com';
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
        <div className="bg-[#0f141f] border border-rose-500/40 rounded-2xl p-6 text-center max-w-sm w-full shadow-2xl space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-base font-extrabold text-white">AKSES DITOLAK</h3>
          <p className="text-xs text-slate-400">
            Panel Admin Deposit & Google Sheets khusus dan hanya dapat diakses oleh akun admin: <br />
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

  const handleApprove = async (dep: DepositRequest, index: number) => {
    setLoading(true);
    setActionStatus(`Memproses persetujuan deposit ${dep.id}...`);

    const success = await approveDepositRequest({
      depositId: dep.id,
      userId: dep.userId,
      amountUsdt: dep.amountUsdt || (dep.amountIdr / 16000),
      adminName: user?.name || 'Admin Trixeon',
      spreadsheetId: spreadsheetId || null,
      rowIndex: index + 2,
    });

    if (success) {
      setActionStatus(`Deposit ${dep.id} sebesar Rp ${dep.amountIdr.toLocaleString('id-ID')} BERHASIL disetujui & saldo dikreditkan ke user!`);
      await loadDeposits();
    } else {
      setActionStatus(`Gagal menyetujui deposit ${dep.id}`);
    }
    setLoading(false);
    setTimeout(() => setActionStatus(null), 4000);
  };

  const handleReject = async (depId: string) => {
    setLoading(true);
    setActionStatus(`Menolak deposit ${depId}...`);
    const success = await rejectDepositRequest(depId, 'Ditolak oleh Admin');
    if (success) {
      setActionStatus(`Deposit ${depId} berhasil ditolak.`);
      await loadDeposits();
    }
    setLoading(false);
    setTimeout(() => setActionStatus(null), 4000);
  };

  const handleSyncFromSheets = async () => {
    if (!spreadsheetId) {
      setActionStatus('AKfycbzdgg8vSs6DcNU-X8v-rn1DzYmOhlf2OOzo89InnsGXd2DCtRSqpxhFnRT90IgcaRHd');
      return;
    }

    setLoading(true);
    setActionStatus('Menyingkronkan data deposit dari Google Sheets...');

    try {
      // Refresh local deposit list
      await loadDeposits();
      setActionStatus('Sinkronisasi Google Sheets selesai!');
    } catch (err: any) {
      setActionStatus(`Gagal sync Google Sheets: ${err.message || 'Error'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setActionStatus(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#10141e] border border-[#232c40] rounded-2xl shadow-[0_0_50px_rgba(0,242,254,0.15)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2738] bg-gradient-to-r from-[#121620] via-[#1a2233] to-[#121620]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Admin Panel - Approval Balance via Google Sheets</h3>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold rounded-full">
                  GOOGLE SHEETS SYNC
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Verifikasi dan persetujuan saldo deposit pengguna melalui Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 font-sans text-xs overflow-y-auto flex-1">
          
          {/* Status Message */}
          {actionStatus && (
            <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-cyan-300 font-semibold flex items-center gap-2 text-xs animate-in fade-in">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{actionStatus}</span>
            </div>
          )}

          {/* Google Sheets Configuration Bar */}
          <div className="p-3.5 bg-[#161d2b] border border-[#233048] rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={spreadsheetId}
                onChange={(e) => {
                  setSpreadsheetIdState(e.target.value);
                  setStoredSpreadsheetId(e.target.value);
                }}
                placeholder="Google Spreadsheet ID (contoh: 1BxiMVs0XRnt3B...)"
                className="w-full bg-[#0d111a] border border-[#222e44] focus:border-[#00F2FE] rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncFromSheets}
                disabled={loading}
                className="px-3 py-1.5 bg-[#1d273a] hover:bg-[#25324a] text-cyan-300 border border-cyan-500/30 font-bold rounded-lg transition-all flex items-center gap-1.5 text-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Sync Google Sheets</span>
              </button>

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
          </div>

          {/* Deposit Requests Table */}
          <div className="bg-[#121722] border border-[#1f283a] rounded-xl overflow-hidden shadow-lg">
            <div className="px-4 py-3 bg-[#161d2a] border-b border-[#1f283a] flex items-center justify-between">
              <span className="font-extrabold text-white text-xs flex items-center gap-2">
                <Table className="w-4 h-4 text-[#00F2FE]" />
                Daftar Antrean Permintaan Deposit (Persetujuan Admin)
              </span>
              <button
                onClick={loadDeposits}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Muat Ulang Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0e121a] text-slate-400 font-bold border-b border-[#1e2638]">
                  <tr>
                    <th className="p-3">ID Request</th>
                    <th className="p-3">Pengguna (UID)</th>
                    <th className="p-3">Jumlah (IDR)</th>
                    <th className="p-3">Kredit USDT</th>
                    <th className="p-3">Metode</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2638]">
                  {deposits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Belum ada permintaan deposit dalam antrean.
                      </td>
                    </tr>
                  ) : (
                    deposits.map((dep, idx) => (
                      <tr key={dep.id} className="hover:bg-[#161e2e] transition-colors">
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
                          +{(dep.amountUsdt || (dep.amountIdr / 16000)).toFixed(2)} USDT
                        </td>
                        <td className="p-3">
                          <span className="bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-bold border border-cyan-500/30">
                            {dep.method || 'QRIS'}
                          </span>
                        </td>
                        <td className="p-3">
                          {dep.status === 'PENDING' && (
                            <span className="bg-amber-950/80 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
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
                                onClick={() => handleApprove(dep, idx)}
                                disabled={loading}
                                className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-[11px] rounded-lg shadow-md transition-all flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Setujui</span>
                              </button>
                              <button
                                onClick={() => handleReject(dep.id)}
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

          <div className="p-3 bg-[#141926] border border-[#222d42] rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Persetujuan deposit akan langsung memperbarui saldo dompet pengguna secara real-time di Firestore database dan Google Sheets.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
