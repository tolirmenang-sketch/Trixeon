import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, TradingMode } from '../types';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  tradingMode: TradingMode;
  setTradingMode: (mode: TradingMode) => void;
  loginWithGoogle: (email?: string, name?: string) => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<{ success: boolean; demoCode?: string }>;
  loginWithPhone: (phone: string, otp: string) => Promise<boolean>;
  loginWithUserId: (userId: string, pass: string, isRegister?: boolean) => Promise<boolean>;
  logout: () => void;
  updateBalance: (amountUsdt: number, isReal?: boolean) => void;
  lockMargin: (amountUsdt: number) => void;
  unlockMargin: (amountUsdt: number) => void;
  claimDemoFaucet: () => void;
  isAuthLoading: boolean;
}

const DEFAULT_WALLET = {
  realUsdt: 0,
  marginLocked: 0,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [tradingMode, setTradingModeState] = useState<TradingMode>(() => {
    return (localStorage.getItem('trixeon_mode') as TradingMode) || 'real';
  });

  // Synchronize Firebase Auth state and Firestore user document
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        const userRef = doc(db, 'users', fbUser.uid);
        const isTolirAdmin = fbUser.email?.toLowerCase() === 'tolirmenang@gmail.com';
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data() as User;
            const updatedUser = {
              ...userData,
              isAdmin: isTolirAdmin || userData.isAdmin || false,
            };
            if (isTolirAdmin && !userData.isAdmin) {
              await updateDoc(userRef, { isAdmin: true });
            }
            setUser(updatedUser);
          } else {
            // Create default user profile in Firestore
            const newUid = 'TX-' + Math.floor(100000 + Math.random() * 900000);
            const newUser: User = {
              id: fbUser.uid,
              uid: newUid,
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Trixeon Trader',
              email: fbUser.email || undefined,
              avatar: fbUser.photoURL || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
              authMethod: 'google',
              isVerified: true,
              isAdmin: isTolirAdmin,
              wallet: DEFAULT_WALLET,
            };
            await setDoc(userRef, newUser);
            setUser(newUser);
          }
        } catch (err) {
          console.error("Error reading Firestore user profile:", err);
        }

        // Real-time listener for user document in Firestore
        const unsubscribeDoc = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUser(docSnap.data() as User);
            }
          },
          (error) => {
            if (auth.currentUser) {
              handleFirestoreError(error, OperationType.GET, `users/${fbUser.uid}`);
            }
          }
        );

        setIsAuthLoading(false);
        return () => unsubscribeDoc();
      } else {
        // Fallback to local user state if no Firebase user logged in
        const saved = localStorage.getItem('trixeon_user');
        if (saved) {
          try { setUser(JSON.parse(saved)); } catch { setUser(null); }
        } else {
          // Default unauthenticated / logged out state as explicitly requested
          setUser(null);
        }
        setIsAuthLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const setTradingMode = (mode: TradingMode) => {
    setTradingModeState(mode);
    localStorage.setItem('trixeon_mode', mode);
  };

  const syncUserToFirestore = async (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('trixeon_user', JSON.stringify(updatedUser));

    if (firebaseUser) {
      const userRef = doc(db, 'users', firebaseUser.uid);
      try {
        await updateDoc(userRef, {
          wallet: updatedUser.wallet,
          name: updatedUser.name,
          isVerified: updatedUser.isVerified,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
      }
    }
  };

  const loginWithGoogle = async (customEmail?: string, customName?: string) => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.warn("Google Popup sign-in warning/fallback:", err);
      // Fallback demo sign in if popup fails in iframe
      const email = customEmail || 'trader.google@trixeon.io';
      const name = customName || email.split('@')[0];
      const newUid = 'TX-' + Math.floor(100000 + Math.random() * 900000);
      const newUser: User = {
        id: 'usr_g_' + Date.now(),
        uid: newUid,
        name,
        email,
        authMethod: 'google',
        isVerified: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        wallet: user ? user.wallet : DEFAULT_WALLET,
      };
      await syncUserToFirestore(newUser);
    }
  };

  const sendPhoneOtp = async (phone: string) => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      return { success: true, demoCode: data.demoCode || '123456' };
    } catch {
      return { success: true, demoCode: '888888' };
    }
  };

  const loginWithPhone = async (phone: string, otp: string) => {
    if (otp.length < 4) return false;
    const newUid = 'TX-' + Math.floor(100000 + Math.random() * 900000);
    const newUser: User = {
      id: firebaseUser ? firebaseUser.uid : 'usr_p_' + Date.now(),
      uid: newUid,
      name: `Trader ${phone.slice(-4)}`,
      phone,
      authMethod: 'phone',
      isVerified: true,
      wallet: user ? user.wallet : DEFAULT_WALLET,
    };
    await syncUserToFirestore(newUser);
    return true;
  };

  const loginWithUserId = async (userId: string, pass: string) => {
    if (!userId || !pass) return false;
    const cleanId = userId.trim();
    const newUid = cleanId.toUpperCase().startsWith('TX-') ? cleanId.toUpperCase() : 'TX-' + Math.floor(100000 + Math.random() * 900000);
    
    const newUser: User = {
      id: firebaseUser ? firebaseUser.uid : 'usr_id_' + Date.now(),
      uid: newUid,
      name: cleanId.includes('@') ? cleanId.split('@')[0] : `Trader_${cleanId}`,
      email: cleanId.includes('@') ? cleanId : undefined,
      authMethod: 'userid',
      isVerified: true,
      wallet: user ? user.wallet : DEFAULT_WALLET,
    };
    await syncUserToFirestore(newUser);
    return true;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    setUser(null);
    localStorage.removeItem('trixeon_user');
  };

  const updateBalance = (amountUsdt: number) => {
    if (!user) return;
    const updatedWallet = {
      ...user.wallet,
      realUsdt: Math.max(0, user.wallet.realUsdt + amountUsdt)
    };
    syncUserToFirestore({ ...user, wallet: updatedWallet });
  };

  const lockMargin = (amountUsdt: number) => {
    if (!user) return;
    const balance = user.wallet.realUsdt;
    if (balance < amountUsdt) return;

    const updatedWallet = {
      ...user.wallet,
      realUsdt: balance - amountUsdt,
      marginLocked: user.wallet.marginLocked + amountUsdt
    };
    syncUserToFirestore({ ...user, wallet: updatedWallet });
  };

  const unlockMargin = (amountUsdt: number) => {
    if (!user) return;
    const balance = user.wallet.realUsdt;

    const updatedWallet = {
      ...user.wallet,
      realUsdt: balance + amountUsdt,
      marginLocked: Math.max(0, user.wallet.marginLocked - amountUsdt)
    };
    syncUserToFirestore({ ...user, wallet: updatedWallet });
  };

  const claimDemoFaucet = () => {
    // Demo faucet disabled as per user request
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        tradingMode,
        setTradingMode,
        loginWithGoogle,
        sendPhoneOtp,
        loginWithPhone,
        loginWithUserId,
        logout,
        updateBalance,
        lockMargin,
        unlockMargin,
        claimDemoFaucet,
        isAuthLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
