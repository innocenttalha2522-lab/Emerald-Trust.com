import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import { UserAccount, DepositRequest, WithdrawalRequest } from '../types';

/**
 * Saves or updates a user account document in Firestore
 */
export async function saveUserToFirestore(user: UserAccount): Promise<void> {
  const userId = user.uid || auth.currentUser?.uid || user.email.replace(/[@.]/g, '_');
  const userPath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        ...user,
        uid: userId,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

/**
 * Submits a new deposit request to Firestore
 */
export async function submitDepositToFirestore(deposit: DepositRequest): Promise<void> {
  const path = `deposits/${deposit.id}`;
  try {
    const depositRef = doc(db, 'deposits', deposit.id);
    await setDoc(depositRef, deposit);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Updates a deposit request status in Firestore
 */
export async function updateDepositStatusInFirestore(
  depositId: string,
  status: 'approved' | 'rejected',
  reviewerName = 'Talha Ahmed (Owner)',
  notes = ''
): Promise<void> {
  const path = `deposits/${depositId}`;
  try {
    const depositRef = doc(db, 'deposits', depositId);
    await updateDoc(depositRef, {
      status,
      reviewedAt: new Date().toLocaleTimeString(),
      reviewedBy: reviewerName,
      notes: notes || undefined
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Submits a withdrawal request to Firestore
 */
export async function submitWithdrawalToFirestore(withdrawal: WithdrawalRequest): Promise<void> {
  const path = `withdrawals/${withdrawal.id}`;
  try {
    const wthRef = doc(db, 'withdrawals', withdrawal.id);
    await setDoc(wthRef, withdrawal);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Updates a withdrawal status in Firestore
 */
export async function updateWithdrawalStatusInFirestore(
  withdrawalId: string,
  status: 'approved' | 'rejected',
  reviewerName = 'Talha Ahmed (Owner)',
  txHashOrRef?: string,
  notes?: string
): Promise<void> {
  const path = `withdrawals/${withdrawalId}`;
  try {
    const wthRef = doc(db, 'withdrawals', withdrawalId);
    await updateDoc(wthRef, {
      status,
      reviewedAt: new Date().toLocaleTimeString(),
      reviewedBy: reviewerName,
      txHashOrRef: txHashOrRef || undefined,
      notes: notes || undefined
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Subscribes to real-time deposits
 */
export function subscribeToDeposits(
  onUpdate: (deposits: DepositRequest[]) => void,
  userEmail?: string,
  isOwner?: boolean
) {
  const path = 'deposits';
  try {
    const depositsRef = collection(db, 'deposits');
    return onSnapshot(
      depositsRef,
      (snapshot) => {
        const list: DepositRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as DepositRequest);
        });
        // Sort descending by creation
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    console.warn('Firestore subscription initialized in offline mode:', error);
    return () => {};
  }
}

/**
 * Subscribes to real-time withdrawals
 */
export function subscribeToWithdrawals(
  onUpdate: (withdrawals: WithdrawalRequest[]) => void,
  userEmail?: string,
  isOwner?: boolean
) {
  const path = 'withdrawals';
  try {
    const withdrawalsRef = collection(db, 'withdrawals');
    return onSnapshot(
      withdrawalsRef,
      (snapshot) => {
        const list: WithdrawalRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as WithdrawalRequest);
        });
        onUpdate(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (error) {
    console.warn('Firestore withdrawals subscription initialized in offline mode:', error);
    return () => {};
  }
}
