export type AuthMethod = 'google' | 'phone' | 'userid';

export interface User {
  id: string;
  uid: string; // e.g. TX-984210
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  authMethod: AuthMethod;
  isVerified: boolean;
  isAdmin?: boolean;
  isBanned?: boolean;
  status?: 'active' | 'suspended' | 'banned';
  createdAt?: number;
  notes?: string;
  wallet: {
    realUsdt: number;
    demoUsdt?: number;
    marginLocked: number;
  };
}

export interface DepositRequest {
  id: string;
  userId: string;
  userUid: string;
  userName: string;
  userEmail?: string;
  amountIdr: number;
  amountUsdt: number;
  method: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: number;
  approvedAt?: number;
  approvedBy?: string;
  notes?: string;
  sheetRowIndex?: number;
}

export type TradingMode = 'real';

export type MarginMode = 'isolated' | 'cross';

export type OrderType = 'market' | 'limit' | 'stop_market';

export type OrderSide = 'long' | 'short';

export interface CryptoPair {
  symbol: string;       // e.g. BTCUSDT
  baseSymbol: string;   // e.g. BTC
  quoteSymbol: string;  // e.g. USDT
  name: string;         // e.g. Bitcoin
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  fundingRate: number;
  nextFundingIn: string; // e.g. "03:42:15"
  openInterest: number; // e.g. 1.25B
  precision: number;    // decimal places for price
  qtyPrecision: number;
  maxLeverage: number;  // e.g. 125
}

export interface Candlestick {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Position {
  id: string;
  pairSymbol: string;
  side: OrderSide;
  marginMode: MarginMode;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  size: number; // In crypto base asset or USDT contract value
  valueUsdt: number;
  marginUsdt: number;
  pnlUsdt: number;
  pnlPercentage: number;
  liquidationPrice: number;
  tpPrice?: number;
  slPrice?: number;
  txHash: string; // Blockchain transaction hash
  blockNumber: number;
  timestamp: number;
  mode: TradingMode;
}

export interface Order {
  id: string;
  pairSymbol: string;
  side: OrderSide;
  type: OrderType;
  marginMode: MarginMode;
  leverage: number;
  price: number;
  amount: number;
  marginUsdt: number;
  tpPrice?: number;
  slPrice?: number;
  status: 'open' | 'filled' | 'canceled';
  createdAt: number;
  mode: TradingMode;
  txHash: string;
}

export interface TradeHistoryItem {
  id: string;
  pairSymbol: string;
  side: OrderSide;
  entryPrice: number;
  closePrice: number;
  leverage: number;
  marginMode: MarginMode;
  realizedPnl: number;
  pnlPercentage: number;
  closedAt: number;
  mode: TradingMode;
  txHash: string;
  blockNumber: number;
}

export interface OrderBookItem {
  price: number;
  amount: number;
  total: number;
}

export interface MarketTrade {
  id: string;
  price: number;
  amount: number;
  time: string;
  side: 'buy' | 'sell';
}

export interface BlockchainProof {
  txHash: string;
  blockHeight: number;
  merkleRoot: string;
  smartContract: string;
  timestamp: number;
  signature: string;
  stateCommitment: string;
  gasUsed: number;
  network: string; // e.g. Arbitrum One L2 / Trixeon Zero-Knowledge Proof Rollup
  verified: boolean;
}

export interface AIAnalysisResult {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidenceScore: number; // 0 - 100
  summary: string;
  keyLevels: {
    support1: number;
    support2: number;
    resistance1: number;
    resistance2: number;
  };
  recommendedAction: 'STRONG LONG' | 'LEAN LONG' | 'HOLD / WAIT' | 'LEAN SHORT' | 'STRONG SHORT';
  suggestedLeverage: string;
  riskWarning: string;
  technicalFactors: string[];
}
