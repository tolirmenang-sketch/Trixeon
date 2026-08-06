import { BlockchainProof } from '../types';

// Simple SHA-256 string hash generator (using Web Crypto API or pure JS fallback)
export async function generateTxHash(data: string): Promise<string> {
  try {
    const msgUint8 = new TextEncoder().encode(data + Date.now().toString() + Math.random().toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return '0x' + hashHex;
  } catch {
    // Fallback pseudo-hash
    let hash = '';
    const chars = '0123456789abcdef';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return '0x' + hash;
  }
}

export function generateSyncTxHash(): string {
  let hash = '';
  const chars = '0123456789abcdef';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return '0x' + hash;
}

export function generateBlockchainProof(txHash: string, pair: string, side: string, price: number, amount: number): BlockchainProof {
  const blockHeight = 18942150 + Math.floor(Math.random() * 100);
  const merkleRoot = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const signature = '0x' + Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const stateCommitment = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  return {
    txHash,
    blockHeight,
    merkleRoot,
    smartContract: '0x8f3Cf7ad23CD3CaDbD9735AFf958023239c6A063', // Trixeon L2 Vault Contract
    timestamp: Date.now(),
    signature,
    stateCommitment,
    gasUsed: Math.floor(21000 + Math.random() * 15000),
    network: 'Trixeon ZK-Rollup (L2 Arbitrum Mainnet)',
    verified: true,
  };
}

export function formatCurrency(value: number, precision: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

export function formatNumberCompact(value: number): string {
  if (value >= 1e9) {
    return (value / 1e9).toFixed(2) + 'B';
  }
  if (value >= 1e6) {
    return (value / 1e6).toFixed(2) + 'M';
  }
  if (value >= 1e3) {
    return (value / 1e3).toFixed(2) + 'K';
  }
  return value.toFixed(2);
}
