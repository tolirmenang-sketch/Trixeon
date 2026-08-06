import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { DepositRequest } from '../types';

export const ADMIN_SPREADSHEET_ID_KEY = 'trixeon_admin_spreadsheet_id';

export function getStoredSpreadsheetId(): string | null {
  return localStorage.getItem(ADMIN_SPREADSHEET_ID_KEY);
}

export function setStoredSpreadsheetId(id: string) {
  localStorage.setItem(ADMIN_SPREADSHEET_ID_KEY, id);
}

// 1. Submit a deposit request to Firestore deposit_requests collection
export async function submitDepositRequest(params: {
  userId: string;
  userUid: string;
  userName: string;
  userEmail?: string;
  amountIdr: number;
  amountUsdt: number;
  method: string;
  accessToken?: string | null;
}): Promise<DepositRequest> {
  const reqId = 'DEP-' + Math.floor(100000 + Math.random() * 900000);
  const now = Date.now();

  const newRequest: DepositRequest = {
    id: reqId,
    userId: params.userId,
    userUid: params.userUid,
    userName: params.userName,
    userEmail: params.userEmail || '',
    amountIdr: params.amountIdr,
    amountUsdt: params.amountUsdt,
    method: params.method || 'QRIS',
    status: 'PENDING',
    createdAt: now,
    notes: 'Menunggu konfirmasi Admin via Google Sheets',
  };

  try {
    // Save to Firestore deposit_requests collection
    const depRef = doc(db, 'deposit_requests', reqId);
    await setDoc(depRef, newRequest);
  } catch (err) {
    console.warn("Firestore deposit_requests store warning:", err);
  }

  // Also append to Google Sheets if spreadsheet ID and accessToken exist
  const spreadsheetId = getStoredSpreadsheetId();
  if (spreadsheetId && params.accessToken) {
    try {
      await fetch('/api/sheets/append-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: params.accessToken,
          spreadsheetId,
          deposit: newRequest,
        }),
      });
    } catch (err) {
      console.warn("Failed to append to Google Sheets:", err);
    }
  }

  return newRequest;
}

// 2. Fetch pending deposit requests for user or admin
export async function fetchUserDepositRequests(userId: string): Promise<DepositRequest[]> {
  try {
    const q = query(collection(db, 'deposit_requests'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: DepositRequest[] = [];
    snap.forEach(d => {
      list.push(d.data() as DepositRequest);
    });
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error("Error fetching user deposit requests:", err);
    return [];
  }
}

// 3. Admin: Fetch all deposit requests
export async function fetchAllDepositRequests(): Promise<DepositRequest[]> {
  try {
    const snap = await getDocs(collection(db, 'deposit_requests'));
    const list: DepositRequest[] = [];
    snap.forEach(d => {
      list.push(d.data() as DepositRequest);
    });
    return list.sort((a, b) => b.createdAt - a.createdAt);
  } catch (err) {
    console.error("Error fetching all deposit requests:", err);
    return [];
  }
}

// 4. Admin: Approve deposit request and credit balance to user in Firestore
export async function approveDepositRequest(params: {
  depositId: string;
  userId: string;
  amountUsdt: number;
  adminName?: string;
  accessToken?: string | null;
  spreadsheetId?: string | null;
  rowIndex?: number;
}): Promise<boolean> {
  try {
    // A. Update deposit request status in Firestore
    const depRef = doc(db, 'deposit_requests', params.depositId);
    await updateDoc(depRef, {
      status: 'APPROVED',
      approvedAt: Date.now(),
      approvedBy: params.adminName || 'Admin Google Sheets',
      notes: 'Disetujui Admin',
    });

    // B. Credit user's wallet in Firestore
    const userRef = doc(db, 'users', params.userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const currentWallet = userSnap.data().wallet || { realUsdt: 0, marginLocked: 0 };
      const newBalance = (currentWallet.realUsdt || 0) + params.amountUsdt;
      await updateDoc(userRef, {
        'wallet.realUsdt': newBalance,
      });
    }

    // C. Update status in Google Sheets if connected
    if (params.accessToken && params.spreadsheetId && params.rowIndex) {
      await fetch('/api/sheets/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: params.accessToken,
          spreadsheetId: params.spreadsheetId,
          rowIndex: params.rowIndex,
          newStatus: 'APPROVED',
          notes: `Disetujui Admin (${params.adminName || 'Google Sheets'})`,
        }),
      });
    }

    return true;
  } catch (err) {
    console.error("Error approving deposit request:", err);
    return false;
  }
}

// 5. Admin: Reject deposit request
export async function rejectDepositRequest(depositId: string, notes?: string): Promise<boolean> {
  try {
    const depRef = doc(db, 'deposit_requests', depositId);
    await updateDoc(depRef, {
      status: 'REJECTED',
      approvedAt: Date.now(),
      notes: notes || 'Ditolak Admin',
    });
    return true;
  } catch (err) {
    console.error("Error rejecting deposit request:", err);
    return false;
  }
}
