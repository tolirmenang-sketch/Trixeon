import React, { useState } from 'react';
import { BlockchainProof } from '../types';
import { ShieldCheck, CheckCircle2, Copy, ExternalLink, X, Cpu, Lock, Layers } from 'lucide-react';

interface BlockchainProofModalProps {
  proof: BlockchainProof | null;
  onClose: () => void;
}

export const BlockchainProofModal: React.FC<BlockchainProofModalProps> = ({ proof, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!proof) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(proof.txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div id="blockchain-proof-modal" className="relative w-full max-w-xl bg-[#121620] border border-[#232b3e] rounded-2xl shadow-[0_0_50px_rgba(0,242,254,0.25)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1e2738] bg-gradient-to-r from-cyan-950/60 via-[#121620] to-blue-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-[#00F2FE]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Cryptographic Trade Certificate</h3>
              <p className="text-[11px] text-slate-400">Zero-Knowledge Rollup On-Chain Settlement Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2738] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 font-sans">
          
          {/* Status Badge */}
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-extrabold text-white text-xs block">Cryptographically Verified Valid</span>
                <span className="text-[10px] text-emerald-300 font-mono">Proof Hash Verified via SHA-256 State Tree</span>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-900/60 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/30">
              Block #{proof.blockHeight}
            </span>
          </div>

          {/* Details Grid */}
          <div className="space-y-3 font-mono text-xs">
            
            {/* Tx Hash */}
            <div className="bg-[#161c28] p-3 rounded-xl border border-[#222d40]">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                Transaction Hash (SHA-256)
              </span>
              <div className="flex items-center justify-between gap-2 bg-[#0f131d] p-2 rounded-lg border border-[#1b2232]">
                <span className="text-[#00F2FE] font-bold text-[11px] truncate">{proof.txHash}</span>
                <button
                  onClick={handleCopyHash}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                  title="Copy Hash"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              {copied && <span className="text-[10px] text-emerald-400 mt-1 block">Copied to clipboard!</span>}
            </div>

            {/* Merkle Root */}
            <div className="bg-[#161c28] p-3 rounded-xl border border-[#222d40]">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                Merkle State Tree Root
              </span>
              <span className="text-slate-300 text-[11px] block truncate bg-[#0f131d] p-2 rounded-lg border border-[#1b2232]">
                {proof.merkleRoot}
              </span>
            </div>

            {/* Smart Contract & Network Info */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#161c28] p-2.5 rounded-xl border border-[#222d40]">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Network Layer</span>
                <span className="text-white font-bold text-[11px] mt-0.5 block">{proof.network}</span>
              </div>
              <div className="bg-[#161c28] p-2.5 rounded-xl border border-[#222d40]">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Smart Contract Vault</span>
                <span className="text-cyan-400 font-bold text-[11px] mt-0.5 block truncate">{proof.smartContract}</span>
              </div>
            </div>

            {/* Cryptographic Signature */}
            <div className="bg-[#161c28] p-3 rounded-xl border border-[#222d40]">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                ECDSA Cryptographic Signature
              </span>
              <span className="text-slate-400 text-[10px] block break-all bg-[#0f131d] p-2 rounded-lg border border-[#1b2232] max-h-16 overflow-y-auto custom-scrollbar">
                {proof.signature}
              </span>
            </div>

          </div>

          <div className="pt-2 text-center text-[11px] text-slate-500">
            Immutable trade proof anchored on Ethereum L2 Smart Contract Vault protocol.
          </div>

        </div>
      </div>
    </div>
  );
};
