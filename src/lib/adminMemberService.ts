import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { User } from '../types';

// 1. Fetch all members from Firestore
export async function fetchAllMembers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const members: User[] = [];
    snap.forEach((d) => {
      const data = d.data() as User;
      members.push({
        ...data,
        id: data.id || d.id,
        wallet: data.wallet || { realUsdt: 0, marginLocked: 0 }
      });
    });
    return members;
  } catch (err) {
    console.error("Error fetching members:", err);
    return [];
  }
}

// 2. Real-time listener for all members
export function subscribeToMembers(callback: (members: User[]) => void) {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => {
      const members: User[] = [];
      snap.forEach((d) => {
        const data = d.data() as User;
        members.push({
          ...data,
          id: data.id || d.id,
          wallet: data.wallet || { realUsdt: 0, marginLocked: 0 }
        });
      });
      callback(members);
    },
    (err) => {
      console.error("Firestore members subscription error:", err);
    }
  );
}

// 3. Update Member Balance directly (Credit / Debit / Set Balance)
export async function updateMemberBalance(
  userId: string,
  amountUsdt: number,
  mode: 'set' | 'add' | 'subtract' = 'set'
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return false;

    const currentWallet = userSnap.data().wallet || { realUsdt: 0, marginLocked: 0 };
    let newBalance = currentWallet.realUsdt || 0;

    if (mode === 'set') {
      newBalance = Math.max(0, amountUsdt);
    } else if (mode === 'add') {
      newBalance = Math.max(0, newBalance + amountUsdt);
    } else if (mode === 'subtract') {
      newBalance = Math.max(0, newBalance - amountUsdt);
    }

    await updateDoc(userRef, {
      'wallet.realUsdt': newBalance
    });
    return true;
  } catch (err) {
    console.error("Error updating member balance:", err);
    return false;
  }
}

// 4. Update Member Status (Active, Suspended, Banned)
export async function updateMemberStatus(
  userId: string,
  status: 'active' | 'suspended' | 'banned'
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    const isBanned = status === 'banned' || status === 'suspended';
    await updateDoc(userRef, {
      status,
      isBanned
    });
    return true;
  } catch (err) {
    console.error("Error updating member status:", err);
    return false;
  }
}

// 5. Toggle Member Verification (KYC status)
export async function toggleMemberVerification(
  userId: string,
  isVerified: boolean
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isVerified
    });
    return true;
  } catch (err) {
    console.error("Error updating member verification:", err);
    return false;
  }
}

// 6. Toggle Member Admin Role
export async function toggleMemberAdmin(
  userId: string,
  isAdmin: boolean
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isAdmin
    });
    return true;
  } catch (err) {
    console.error("Error updating member admin role:", err);
    return false;
  }
}

// 7. Admin Manual Member Creation
export async function createMemberManually(userData: {
  name: string;
  email?: string;
  phone?: string;
  initialBalance: number;
  isAdmin?: boolean;
}): Promise<User | null> {
  try {
    const customId = 'usr_man_' + Date.now();
    const newUid = 'TX-' + Math.floor(100000 + Math.random() * 900000);

    const newUser: User = {
      id: customId,
      uid: newUid,
      name: userData.name,
      email: userData.email || undefined,
      phone: userData.phone || undefined,
      authMethod: userData.email ? 'google' : 'phone',
      isVerified: true,
      isAdmin: userData.isAdmin || false,
      status: 'active',
      isBanned: false,
      createdAt: Date.now(),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      wallet: {
        realUsdt: Math.max(0, userData.initialBalance || 0),
        marginLocked: 0
      }
    };

    const userRef = doc(db, 'users', customId);
    await setDoc(userRef, newUser);
    return newUser;
  } catch (err) {
    console.error("Error creating member manually:", err);
    return null;
  }
}

// 8. Delete Member from Firestore
export async function deleteMember(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return true;
  } catch (err) {
    console.error("Error deleting member:", err);
    return false;
  }
}
