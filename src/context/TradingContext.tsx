import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CryptoPair, Position, Order, TradeHistoryItem, OrderSide, MarginMode, OrderType, BlockchainProof } from '../types';
import { INITIAL_PAIRS } from '../data/pairs';
import { useAuth } from './AuthContext';
import { generateSyncTxHash, generateBlockchainProof } from '../utils/crypto';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';

interface TradingContextType {
  pairs: CryptoPair[];
  selectedPair: CryptoPair;
  setSelectedPair: (pair: CryptoPair) => void;
  positions: Position[];
  orders: Order[];
  tradeHistory: TradeHistoryItem[];
  openPosition: (params: {
    side: OrderSide;
    marginMode: MarginMode;
    leverage: number;
    amountUsdt: number;
    orderType: OrderType;
    limitPrice?: number;
    tpPrice?: number;
    slPrice?: number;
  }) => { success: boolean; message: string; positionId?: string };
  closePosition: (positionId: string, customClosePrice?: number) => void;
  cancelOrder: (orderId: string) => void;
  updateTpSl: (positionId: string, tpPrice?: number, slPrice?: number) => void;
  selectedProof: BlockchainProof | null;
  setSelectedProof: (proof: BlockchainProof | null) => void;
  inspectBlockchainProof: (txHash: string, pairSymbol: string, side: string, price: number) => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser, tradingMode, lockMargin, unlockMargin, updateBalance } = useAuth();
  const [pairs, setPairs] = useState<CryptoPair[]>(INITIAL_PAIRS);
  const [selectedPair, setSelectedPairState] = useState<CryptoPair>(INITIAL_PAIRS[0]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [selectedProof, setSelectedProof] = useState<BlockchainProof | null>(null);

  // WebSocket reference for Binance public stream
  const wsRef = useRef<WebSocket | null>(null);

  // Synchronize Firestore data for positions, orders, and trade history when user/firebaseUser is active
  useEffect(() => {
    const currentUid = firebaseUser?.uid || user?.id;

    if (!currentUid) {
      // Local fallback
      const savedPos = localStorage.getItem('trixeon_positions');
      const savedHist = localStorage.getItem('trixeon_history');
      if (savedPos) {
        try { setPositions(JSON.parse(savedPos)); } catch {}
      }
      if (savedHist) {
        try { setTradeHistory(JSON.parse(savedHist)); } catch {}
      }
      return;
    }

    // Only subscribe to Firestore if user is authenticated with Firebase
    if (firebaseUser) {
      // 1. Subscribe to positions
      const posQuery = query(collection(db, 'positions'), where('userId', '==', firebaseUser.uid));
      const unsubPos = onSnapshot(
        posQuery,
        (snapshot) => {
          const docs = snapshot.docs.map(doc => doc.data() as Position);
          setPositions(docs);
        },
        (error) => {
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.GET, 'positions');
          }
        }
      );

      // 2. Subscribe to orders
      const ordQuery = query(collection(db, 'orders'), where('userId', '==', firebaseUser.uid));
      const unsubOrd = onSnapshot(
        ordQuery,
        (snapshot) => {
          const docs = snapshot.docs.map(doc => doc.data() as Order);
          setOrders(docs);
        },
        (error) => {
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.GET, 'orders');
          }
        }
      );

      // 3. Subscribe to trade history
      const histQuery = query(collection(db, 'tradeHistory'), where('userId', '==', firebaseUser.uid));
      const unsubHist = onSnapshot(
        histQuery,
        (snapshot) => {
          const docs = snapshot.docs.map(doc => doc.data() as TradeHistoryItem);
          // Sort by closedAt descending
          docs.sort((a, b) => b.closedAt - a.closedAt);
          setTradeHistory(docs);
        },
        (error) => {
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.GET, 'tradeHistory');
          }
        }
      );

      return () => {
        unsubPos();
        unsubOrd();
        unsubHist();
      };
    }
  }, [firebaseUser, user?.id]);

  useEffect(() => {
    if (!firebaseUser) {
      localStorage.setItem('trixeon_positions', JSON.stringify(positions));
    }
  }, [positions, firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) {
      localStorage.setItem('trixeon_history', JSON.stringify(tradeHistory));
    }
  }, [tradeHistory, firebaseUser]);

  // Real-time market tick generator & WebSocket listener
  useEffect(() => {
    const connectBinanceWs = () => {
      try {
        const streamNames = INITIAL_PAIRS.map(p => `${p.symbol.toLowerCase()}@ticker`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${streamNames}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.s && data.c) {
              const symbol = data.s;
              const newPrice = parseFloat(data.c);
              const change24h = parseFloat(data.P);
              const high24h = parseFloat(data.h);
              const low24h = parseFloat(data.l);
              const volume24h = parseFloat(data.q);

              setPairs(prevPairs =>
                prevPairs.map(p => {
                  if (p.symbol === symbol) {
                    const updated = {
                      ...p,
                      price: newPrice,
                      change24h,
                      high24h,
                      low24h,
                      volume24h,
                    };
                    if (selectedPair.symbol === symbol) {
                      setSelectedPairState(updated);
                    }
                    return updated;
                  }
                  return p;
                })
              );
            }
          } catch {}
        };

        ws.onerror = () => {};
      } catch {}
    };

    connectBinanceWs();

    const tickInterval = setInterval(() => {
      setPairs(prevPairs =>
        prevPairs.map(p => {
          const pct = (Math.random() - 0.495) * 0.0016;
          const delta = p.price * pct;
          const newPrice = +(p.price + delta).toFixed(p.precision);
          const newHigh = Math.max(p.high24h, newPrice);
          const newLow = Math.min(p.low24h, newPrice);

          const updated = {
            ...p,
            price: newPrice,
            high24h: newHigh,
            low24h: newLow,
          };
          if (p.symbol === selectedPair.symbol) {
            setSelectedPairState(updated);
          }
          return updated;
        })
      );
    }, 1200);

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearInterval(tickInterval);
    };
  }, [selectedPair.symbol]);

  // Real-time PnL & Liquidation Checker
  useEffect(() => {
    setPositions(prevPositions =>
      prevPositions.map(pos => {
        const pair = pairs.find(p => p.symbol === pos.pairSymbol);
        if (!pair) return pos;

        const currentPrice = pair.price;
        const markPrice = currentPrice;
        
        let pnlUsdt = 0;
        if (pos.side === 'long') {
          pnlUsdt = ((markPrice - pos.entryPrice) / pos.entryPrice) * pos.valueUsdt;
        } else {
          pnlUsdt = ((pos.entryPrice - markPrice) / pos.entryPrice) * pos.valueUsdt;
        }

        const pnlPercentage = (pnlUsdt / pos.marginUsdt) * 100;

        // Auto Stop Loss / Take Profit check trigger
        if (pos.tpPrice) {
          if ((pos.side === 'long' && markPrice >= pos.tpPrice) || (pos.side === 'short' && markPrice <= pos.tpPrice)) {
            setTimeout(() => closePosition(pos.id, pos.tpPrice), 50);
          }
        }
        if (pos.slPrice) {
          if ((pos.side === 'long' && markPrice <= pos.slPrice) || (pos.side === 'short' && markPrice >= pos.slPrice)) {
            setTimeout(() => closePosition(pos.id, pos.slPrice), 50);
          }
        }

        return {
          ...pos,
          markPrice,
          pnlUsdt: +pnlUsdt.toFixed(2),
          pnlPercentage: +pnlPercentage.toFixed(2),
        };
      })
    );
  }, [pairs]);

  const setSelectedPair = (pair: CryptoPair) => {
    setSelectedPairState(pair);
  };

  const openPosition = ({
    side,
    marginMode,
    leverage,
    amountUsdt,
    orderType,
    limitPrice,
    tpPrice,
    slPrice,
  }: {
    side: OrderSide;
    marginMode: MarginMode;
    leverage: number;
    amountUsdt: number;
    orderType: OrderType;
    limitPrice?: number;
    tpPrice?: number;
    slPrice?: number;
  }) => {
    if (!user) {
      return { success: false, message: 'Please log in to place trades.' };
    }

    const availableBalance = user.wallet.realUsdt;
    if (amountUsdt > availableBalance) {
      return { success: false, message: `Insufficient balance. Needed Rp ${amountUsdt.toLocaleString('id-ID')}, Available Rp ${availableBalance.toLocaleString('id-ID')}.` };
    }

    const entryPrice = orderType === 'market' ? selectedPair.price : (limitPrice || selectedPair.price);
    const valueUsdt = amountUsdt * leverage;
    const size = +(valueUsdt / entryPrice).toFixed(selectedPair.qtyPrecision);

    let liquidationPrice = 0;
    if (side === 'long') {
      liquidationPrice = +(entryPrice * (1 - (1 / leverage) * 0.90)).toFixed(selectedPair.precision);
    } else {
      liquidationPrice = +(entryPrice * (1 + (1 / leverage) * 0.90)).toFixed(selectedPair.precision);
    }

    lockMargin(amountUsdt);

    const txHash = generateSyncTxHash();
    const blockNumber = 18942150 + Math.floor(Math.random() * 50);
    const activeUid = firebaseUser ? firebaseUser.uid : user.id;

    if (orderType === 'market') {
      const newPos: Position & { userId: string } = {
        id: 'pos_' + Date.now(),
        userId: activeUid,
        pairSymbol: selectedPair.symbol,
        side,
        marginMode,
        leverage,
        entryPrice,
        markPrice: entryPrice,
        size,
        valueUsdt,
        marginUsdt: amountUsdt,
        pnlUsdt: 0,
        pnlPercentage: 0,
        liquidationPrice,
        tpPrice,
        slPrice,
        txHash,
        blockNumber,
        timestamp: Date.now(),
        mode: tradingMode,
      };

      if (firebaseUser) {
        setDoc(doc(db, 'positions', newPos.id), newPos).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, `positions/${newPos.id}`);
        });
      } else {
        setPositions(prev => [newPos, ...prev]);
      }

      return { success: true, message: `Successfully opened ${leverage}x ${side.toUpperCase()} position on ${selectedPair.symbol}`, positionId: newPos.id };
    } else {
      const newOrder: Order & { userId: string } = {
        id: 'ord_' + Date.now(),
        userId: activeUid,
        pairSymbol: selectedPair.symbol,
        side,
        type: orderType,
        marginMode,
        leverage,
        price: entryPrice,
        amount: size,
        marginUsdt: amountUsdt,
        tpPrice,
        slPrice,
        status: 'open',
        createdAt: Date.now(),
        mode: tradingMode,
        txHash,
      };

      if (firebaseUser) {
        setDoc(doc(db, 'orders', newOrder.id), newOrder).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, `orders/${newOrder.id}`);
        });
      } else {
        setOrders(prev => [newOrder, ...prev]);
      }

      return { success: true, message: `Limit ${side.toUpperCase()} order submitted at $${entryPrice}` };
    }
  };

  const closePosition = async (positionId: string, customClosePrice?: number) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;

    const pair = pairs.find(p => p.symbol === pos.pairSymbol);
    const closePrice = customClosePrice || (pair ? pair.price : pos.markPrice);

    let finalPnlUsdt = 0;
    if (pos.side === 'long') {
      finalPnlUsdt = ((closePrice - pos.entryPrice) / pos.entryPrice) * pos.valueUsdt;
    } else {
      finalPnlUsdt = ((pos.entryPrice - closePrice) / pos.entryPrice) * pos.valueUsdt;
    }

    const pnlPercentage = (finalPnlUsdt / pos.marginUsdt) * 100;

    unlockMargin(pos.marginUsdt);
    updateBalance(+finalPnlUsdt.toFixed(2));

    const activeUid = firebaseUser ? firebaseUser.uid : (user?.id || 'guest');

    const historyItem: TradeHistoryItem & { userId: string } = {
      id: 'hist_' + Date.now(),
      userId: activeUid,
      pairSymbol: pos.pairSymbol,
      side: pos.side,
      entryPrice: pos.entryPrice,
      closePrice: +closePrice.toFixed(pair?.precision || 2),
      leverage: pos.leverage,
      marginMode: pos.marginMode,
      realizedPnl: +finalPnlUsdt.toFixed(2),
      pnlPercentage: +pnlPercentage.toFixed(2),
      closedAt: Date.now(),
      mode: pos.mode,
      txHash: pos.txHash,
      blockNumber: pos.blockNumber,
    };

    if (firebaseUser) {
      try {
        await setDoc(doc(db, 'tradeHistory', historyItem.id), historyItem);
        await deleteDoc(doc(db, 'positions', positionId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `positions/${positionId}`);
      }
    } else {
      setTradeHistory(prev => [historyItem, ...prev]);
      setPositions(prev => prev.filter(p => p.id !== positionId));
    }
  };

  const cancelOrder = async (orderId: string) => {
    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      unlockMargin(ord.marginUsdt);
      if (firebaseUser) {
        try {
          await deleteDoc(doc(db, 'orders', orderId));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
        }
      } else {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      }
    }
  };

  const updateTpSl = async (positionId: string, tpPrice?: number, slPrice?: number) => {
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, 'positions', positionId), { tpPrice, slPrice });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `positions/${positionId}`);
      }
    } else {
      setPositions(prev =>
        prev.map(p => {
          if (p.id === positionId) {
            return { ...p, tpPrice, slPrice };
          }
          return p;
        })
      );
    }
  };

  const inspectBlockchainProof = (txHash: string, pairSymbol: string, side: string, price: number) => {
    const proof = generateBlockchainProof(txHash, pairSymbol, side, price, 1);
    setSelectedProof(proof);
  };

  return (
    <TradingContext.Provider
      value={{
        pairs,
        selectedPair,
        setSelectedPair,
        positions,
        orders,
        tradeHistory,
        openPosition,
        closePosition,
        cancelOrder,
        updateTpSl,
        selectedProof,
        setSelectedProof,
        inspectBlockchainProof,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
