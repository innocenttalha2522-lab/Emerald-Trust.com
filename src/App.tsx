import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Metrics } from './components/Metrics';
import { PrecisionWorkflow } from './components/PrecisionWorkflow';
import { PackagesSection } from './components/PackagesSection';
import { DailyTasksHub } from './components/DailyTasksHub';
import { CustomerServiceModal } from './components/CustomerServiceModal';
import { ReferralProgramSection } from './components/ReferralProgramSection';
import { LiveTransactionsLedger } from './components/LiveTransactionsLedger';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { DashboardModal } from './components/DashboardModal';
import { DepositPaymentModal } from './components/DepositPaymentModal';
import { DepositWarningBanner } from './components/DepositWarningBanner';
import { OwnerPortalModal } from './components/OwnerPortalModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { OwnerGateModal } from './components/OwnerGateModal';
import { GoogleWorkspaceModal } from './components/GoogleWorkspaceModal';
import { UserAccount, PackageTier, CurrencyType, DepositRequest, WithdrawalRequest, DailyTask, TaskSubmission } from './types';
import { PACKAGE_TIERS, INITIAL_DEPOSIT_REQUESTS, OWNER_PAYMENT_DETAILS } from './data/mockData';
import { INITIAL_SCHEDULED_TASKS } from './data/tasksData';
import {
  saveUserToFirestore,
  submitDepositToFirestore,
  updateDepositStatusInFirestore,
  submitWithdrawalToFirestore,
  updateWithdrawalStatusInFirestore,
  subscribeToDeposits,
  subscribeToWithdrawals
} from './lib/firestoreService';
import { initAuth, auth } from './lib/firebase';
import {
  getInitialCurrencyAndCountry,
  detectLocationFromApi,
  checkBrowserCoords
} from './utils/geoDetection';

const DEFAULT_USER: UserAccount = {
  isRegistered: false,
  uid: 'usr-guest',
  name: '',
  email: '',
  role: 'client',
  currency: 'USD',
  country: 'Global',
  tierId: 'gold',
  depositStatus: 'none',
  depositAmount: 0,
  balance: 0,
  totalEarned: 0,
  pendingYield: 0,
  referralCode: 'EMR-8842',
  referralCount: 0,
  referralEarnings: 0,
  completedAdsCount: 0,
  kycVerified: true,
  createdAt: new Date().toISOString()
};

const TALHA_OWNER_ACCOUNT: UserAccount = {
  isRegistered: true,
  uid: 'owner-talha-1',
  name: 'Talha Ahmed',
  email: 'innocenttalha2522@gmail.com',
  role: 'owner',
  currency: 'PKR',
  country: 'Pakistan',
  phone: '+92 319 5006433',
  tierId: 'diamond',
  depositStatus: 'active',
  depositAmount: 0,
  balance: 0,
  totalEarned: 0,
  pendingYield: 0,
  referralCode: 'TALHA-OWNER',
  referralCount: 0,
  referralEarnings: 0,
  completedAdsCount: 0,
  kycVerified: true,
  createdAt: new Date().toISOString()
};

const checkIsOwnerPortalUrl = (): boolean => {
  if (typeof window !== 'undefined') {
    // Purge old mock data from previous dev sessions if any exist
    try {
      const savedDeposits = localStorage.getItem('emerald_trust_deposits');
      if (savedDeposits && (savedDeposits.includes('DEP-8921') || savedDeposits.includes('rashid.ali') || savedDeposits.includes('kashif') || savedDeposits.includes('sara'))) {
        localStorage.removeItem('emerald_trust_deposits');
      }
      const savedUser = localStorage.getItem('emerald_trust_user');
      if (savedUser && (savedUser.includes('5420') || savedUser.includes('kashif') || savedUser.includes('sara'))) {
        localStorage.removeItem('emerald_trust_user');
      }
      const savedSubs = localStorage.getItem('emerald_trust_task_submissions');
      if (savedSubs && (savedSubs.includes('kashif') || savedSubs.includes('sara') || savedSubs.includes('TSUB-74892') || savedSubs.includes('TSUB-81934'))) {
        try {
          const parsed = JSON.parse(savedSubs);
          if (Array.isArray(parsed)) {
            const clean = parsed.filter((s: any) =>
              !s.userEmail?.toLowerCase().includes('kashif') &&
              !s.userEmail?.toLowerCase().includes('sara') &&
              s.id !== 'TSUB-74892' &&
              s.id !== 'TSUB-81934'
            );
            localStorage.setItem('emerald_trust_task_submissions', JSON.stringify(clean));
          }
        } catch (e) {
          localStorage.removeItem('emerald_trust_task_submissions');
        }
      }
      const savedChat = localStorage.getItem('emerald_trust_chat_history');
      if (savedChat && (savedChat.includes('kashif') || savedChat.includes('sara'))) {
        localStorage.removeItem('emerald_trust_chat_history');
      }
    } catch (e) {
      // ignore
    }
  }
  if (typeof window === 'undefined') return false;
  try {
    const hostname = (window.location.hostname || '').toLowerCase();
    const search = (window.location.search || '').toLowerCase();
    const hash = (window.location.hash || '').toLowerCase();
    const href = (window.location.href || '').toLowerCase();
    const pathname = (window.location.pathname || '').toLowerCase();
    return (
      search.includes('portal=owner') ||
      search.includes('owner=true') ||
      search.includes('role=owner') ||
      search.includes('owner_portal') ||
      hash.includes('portal=owner') ||
      hash.includes('owner') ||
      href.includes('portal=owner') ||
      pathname.includes('/owner') ||
      hostname.includes('ais-dev') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1'
    );
  } catch (e) {
    return false;
  }
};

const checkShouldAutoOpenOwnerModal = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const search = (window.location.search || '').toLowerCase();
    const hash = (window.location.hash || '').toLowerCase();
    const href = (window.location.href || '').toLowerCase();
    const pathname = (window.location.pathname || '').toLowerCase();
    return (
      search.includes('portal=owner') ||
      search.includes('open_owner') ||
      search.includes('owner_portal') ||
      hash.includes('portal=owner') ||
      hash.includes('owner') ||
      pathname.includes('/owner')
    );
  } catch (e) {
    return false;
  }
};

const checkIsAdminPortalUrl = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const search = (window.location.search || '').toLowerCase();
    const hash = (window.location.hash || '').toLowerCase();
    const href = (window.location.href || '').toLowerCase();
    return search.includes('portal=admin') || hash.includes('portal=admin') || href.includes('portal=admin');
  } catch (e) {
    return false;
  }
};

export default function App() {
  // Geolocation & Browser Locale Auto-Detection:
  // Automatically sets user's initial currency to 'PKR' if in Pakistan, or 'USD' otherwise
  const [currency, setCurrency] = useState<CurrencyType>(() => {
    const initialGeo = getInitialCurrencyAndCountry();
    return initialGeo.currency;
  });

  const [user, setUser] = useState<UserAccount>(() => {
    const initialGeo = getInitialCurrencyAndCountry();
    const defaultAccount: UserAccount = {
      ...DEFAULT_USER,
      currency: initialGeo.currency,
      country: initialGeo.country
    };

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('emerald_trust_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.email?.toLowerCase() === 'innocenttalha2522@gmail.com' || parsed.role === 'owner')) {
            return { ...TALHA_OWNER_ACCOUNT, ...parsed, role: 'owner' };
          }
          if (parsed && typeof parsed === 'object' && parsed.email) {
            const resolvedCurrency = parsed.currency || initialGeo.currency;
            const resolvedCountry = parsed.country || initialGeo.country;
            return {
              ...defaultAccount,
              ...parsed,
              role: 'client',
              currency: resolvedCurrency,
              country: resolvedCountry
            };
          }
        } catch (e) {
          // ignore
        }
      }
    }

    if (checkIsOwnerPortalUrl()) {
      return TALHA_OWNER_ACCOUNT;
    }

    return defaultAccount;
  });

  // Client preview mode (allows Owner to preview what regular users see with zero owner portal visibility)
  const [previewAsClient, setPreviewAsClient] = useState<boolean>(false);

  // Check if current user / environment is the Platform Owner (Talha Ahmed)
  const isOwner = !previewAsClient && (
    user.role === 'owner' ||
    user.email?.toLowerCase() === 'innocenttalha2522@gmail.com' ||
    user.email?.toLowerCase().includes('talha') ||
    checkIsOwnerPortalUrl()
  );

  const [deposits, setDeposits] = useState<DepositRequest[]>(() => {
    const saved = localStorage.getItem('emerald_trust_deposits');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some(d => d.id === 'DEP-8921' || d.id === 'DEP-8922')) {
          return parsed;
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() => {
    const saved = localStorage.getItem('emerald_trust_withdrawals');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [allUsersList, setAllUsersList] = useState<UserAccount[]>([TALHA_OWNER_ACCOUNT]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
  const [dashboardInitialTab, setDashboardInitialTab] = useState<'overview' | 'withdraw' | 'history' | 'affiliates'>('overview');
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [ownerPortalOpen, setOwnerPortalOpen] = useState<boolean>(() => checkShouldAutoOpenOwnerModal());
  const [ownerGateOpen, setOwnerGateOpen] = useState(false);
  const [adminPortalOpen, setAdminPortalOpen] = useState<boolean>(() => checkIsAdminPortalUrl());
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState<boolean>(false);
  const [customerServiceOpen, setCustomerServiceOpen] = useState<boolean>(false);

  const [scheduledTasks, setScheduledTasks] = useState<DailyTask[]>(() => {
    try {
      const saved = localStorage.getItem('emerald_trust_scheduled_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_SCHEDULED_TASKS;
  });

  const handleUpdateScheduledTasks = (newTasks: DailyTask[]) => {
    setScheduledTasks(newTasks);
    try {
      localStorage.setItem('emerald_trust_scheduled_tasks', JSON.stringify(newTasks));
    } catch (e) {}
  };

  const [taskSubmissions, setTaskSubmissions] = useState<TaskSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('emerald_trust_task_submissions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((s: any) =>
            !s.userEmail?.toLowerCase().includes('kashif') &&
            !s.userEmail?.toLowerCase().includes('sara') &&
            s.id !== 'TSUB-74892' &&
            s.id !== 'TSUB-81934'
          );
        }
      }
    } catch (e) {}
    return [];
  });

  const [selectedTierForDeposit, setSelectedTierForDeposit] = useState<PackageTier | null>(null);
  const [activeSection, setActiveSection] = useState('hero');

  // Check URL query params for ?portal=owner or ?portal=admin dynamically & listen to Firebase Auth
  useEffect(() => {
    const handleUrlCheck = () => {
      if (checkShouldAutoOpenOwnerModal()) {
        setOwnerPortalOpen(true);
        setUser(prev => ({
          ...prev,
          ...TALHA_OWNER_ACCOUNT
        }));
      } else if (checkIsAdminPortalUrl()) {
        setAdminPortalOpen(true);
      }
    };

    handleUrlCheck();

    // Firebase Auth real-time listener (detect Google sign-in by Talha Ahmed)
    const unsubAuth = initAuth((firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        if (firebaseUser.email.toLowerCase().trim() === 'innocenttalha2522@gmail.com') {
          setUser(prev => ({
            ...prev,
            ...TALHA_OWNER_ACCOUNT,
            email: firebaseUser.email!,
            name: firebaseUser.displayName || TALHA_OWNER_ACCOUNT.name,
            role: 'owner',
            isRegistered: true
          }));
        } else {
          setUser(prev => ({
            ...prev,
            email: firebaseUser.email!,
            name: firebaseUser.displayName || prev.name || 'Client',
            role: 'client',
            isRegistered: true
          }));
        }
      }
    });

    // Global helper methods on window for direct access & keyboard shortcut
    if (typeof window !== 'undefined') {
      (window as any).openOwnerPortal = () => {
        setOwnerPortalOpen(true);
        setUser(prev => ({ ...prev, ...TALHA_OWNER_ACCOUNT }));
      };
      (window as any).openAdminPortal = () => setAdminPortalOpen(true);
      
      const handleKeyDown = (e: KeyboardEvent) => {
        // Secret shortcut: Ctrl + Alt + O or Cmd + Alt + O
        if ((e.ctrlKey || e.metaKey) && e.altKey && e.key.toLowerCase() === 'o') {
          e.preventDefault();
          setOwnerGateOpen(true);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('popstate', handleUrlCheck);
      window.addEventListener('hashchange', handleUrlCheck);
      window.addEventListener('open-owner-portal', handleUrlCheck);

      return () => {
        if (unsubAuth) unsubAuth();
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('popstate', handleUrlCheck);
        window.removeEventListener('hashchange', handleUrlCheck);
        window.removeEventListener('open-owner-portal', handleUrlCheck);
      };
    }

    return () => {
      if (unsubAuth) unsubAuth();
    };
  }, []);

  // Real-time synchronization between client deposits, withdrawals and Owner/Admin portals
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const res = await fetch('/api/deposits/list');
        if (res.ok) {
          const data = await res.json();
          if (data.deposits && Array.isArray(data.deposits)) {
            setDeposits(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(data.deposits)) {
                return data.deposits;
              }
              return prev;
            });
          }
        }

        const wthRes = await fetch('/api/withdrawals/list');
        if (wthRes.ok) {
          const wthData = await wthRes.json();
          if (wthData.withdrawals && Array.isArray(wthData.withdrawals)) {
            setWithdrawals(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(wthData.withdrawals)) {
                return wthData.withdrawals;
              }
              return prev;
            });
          }
        }

        const ownerRes = await fetch('/api/owner/data');
        if (ownerRes.ok) {
          const ownerData = await ownerRes.json();
          if (ownerData.users && Array.isArray(ownerData.users)) {
            setAllUsersList(ownerData.users);
          }
          if (ownerData.withdrawals && Array.isArray(ownerData.withdrawals)) {
            setWithdrawals(ownerData.withdrawals);
          }
          if (ownerData.taskSubmissions && Array.isArray(ownerData.taskSubmissions)) {
            setTaskSubmissions(ownerData.taskSubmissions);
          }
        }

        const taskRes = await fetch('/api/tasks/submissions');
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          if (taskData.submissions && Array.isArray(taskData.submissions)) {
            setTaskSubmissions(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(taskData.submissions)) {
                return taskData.submissions;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // quiet fallback
      }
    };

    fetchBackendData();
    // Fast 2.5 second polling to automatically pick up deposits, withdrawals & task proofs immediately
    const interval = setInterval(fetchBackendData, 2500);

    // Cross-tab real-time communication via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('emerald_trust_sync');
        bc.onmessage = (event) => {
          if (event.data?.type === 'NEW_DEPOSIT' && event.data.deposit) {
            setDeposits(prev => [event.data.deposit, ...prev.filter(d => d.id !== event.data.deposit.id)]);
          } else if (event.data?.type === 'DEPOSIT_APPROVED' && event.data.depositId) {
            setDeposits(prev =>
              prev.map(d => (d.id === event.data.depositId ? { ...d, status: 'approved' } : d))
            );
          } else if (event.data?.type === 'NEW_WITHDRAWAL' && event.data.withdrawal) {
            setWithdrawals(prev => [event.data.withdrawal, ...prev.filter(w => w.id !== event.data.withdrawal.id)]);
          } else if (event.data?.type === 'WITHDRAWAL_APPROVED' && event.data.withdrawalId) {
            setWithdrawals(prev =>
              prev.map(w => (w.id === event.data.withdrawalId ? { ...w, status: 'approved' } : w))
            );
          } else if (event.data?.type === 'WITHDRAWAL_REJECTED' && event.data.withdrawalId) {
            setWithdrawals(prev =>
              prev.map(w => (w.id === event.data.withdrawalId ? { ...w, status: 'rejected', notes: event.data.reason } : w))
            );
          } else if (event.data?.type === 'TASK_PROOF_SUBMITTED' && event.data.submission) {
            setTaskSubmissions(prev => [event.data.submission, ...prev.filter(s => s.id !== event.data.submission.id)]);
          } else if (event.data?.type === 'TASK_SUBMISSION_APPROVED') {
            setTaskSubmissions(prev =>
              prev.map(s => (s.id === event.data.submissionId || s.taskId === event.data.taskId ? { ...s, status: 'approved' } : s))
            );
          } else if (event.data?.type === 'TASK_SUBMISSION_REJECTED') {
            setTaskSubmissions(prev =>
              prev.map(s => (s.id === event.data.submissionId ? { ...s, status: 'rejected', rejectionReason: event.data.reason } : s))
            );
          } else if (event.data?.type === 'REFRESH_ALL') {
            fetchBackendData();
          }
        };
      }
    } catch (e) {}

    // Real-time Firestore sync for deposits & withdrawals
    const unsubDeposits = subscribeToDeposits((newDeposits) => {
      if (newDeposits && newDeposits.length > 0) {
        setDeposits(prev => {
          const merged = [...newDeposits];
          prev.forEach(p => {
            if (!merged.some(m => m.id === p.id)) merged.push(p);
          });
          return merged;
        });
      }
    });

    const unsubWithdrawals = subscribeToWithdrawals((newWithdrawals) => {
      if (newWithdrawals && newWithdrawals.length > 0) {
        setWithdrawals(prev => {
          const merged = [...newWithdrawals];
          prev.forEach(p => {
            if (!merged.some(m => m.id === p.id)) merged.push(p);
          });
          return merged;
        });
      }
    });

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
      if (unsubDeposits) unsubDeposits();
      if (unsubWithdrawals) unsubWithdrawals();
    };
  }, []);

  // Persist state to localStorage and Firestore
  useEffect(() => {
    localStorage.setItem('emerald_trust_user', JSON.stringify(user));
    if (user.isRegistered && user.email) {
      saveUserToFirestore(user).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('emerald_trust_deposits', JSON.stringify(deposits));
  }, [deposits]);

  useEffect(() => {
    localStorage.setItem('emerald_trust_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    if (user.isRegistered) {
      if (user.depositStatus !== 'active') {
        setDepositModalOpen(true);
      } else {
        setDashboardModalOpen(true);
      }
    } else {
      setSelectedTierForDeposit(PACKAGE_TIERS[1]);
      setAuthModalOpen(true);
    }
  };

  const handleSelectTierFromPackages = (tier: PackageTier) => {
    setSelectedTierForDeposit(tier);
    if (!user.isRegistered) {
      setAuthModalOpen(true);
    } else {
      setDepositModalOpen(true);
    }
  };

  const handleCompleteDailyTask = (taskOrId: DailyTask | string, earnedAmount?: number) => {
    // Check if tasks are locked by owner for this user
    if (user.taskLockedByOwner) {
      alert(`Daily tasks are locked for your account.\n\nOwner Comment: ${user.taskLockReason || 'Pending administrative review.'}`);
      return;
    }

    const taskId = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
    const taskObj = typeof taskOrId === 'string' ? scheduledTasks.find(t => t.id === taskOrId) : taskOrId;
    const reward = user.currency === 'PKR' ? (taskObj?.rewardPkr || 10) : (taskObj?.rewardUsd || 1.0);
    const finalAmount = earnedAmount !== undefined ? earnedAmount : reward;
    const now = Date.now();

    setUser((prev) => {
      const newBal = +(prev.balance + finalAmount).toFixed(2);
      const newTotal = +(prev.totalEarned + finalAmount).toFixed(2);
      const prevCompletedIds = prev.completedTaskIds || [];
      const updatedCompletedIds = Array.from(new Set([...prevCompletedIds, taskId]));
      const updatedTimestamps = {
        ...(prev.taskCompletionTimestamps || {}),
        [taskId]: now
      };

      const updated: UserAccount = {
        ...prev,
        balance: newBal,
        totalEarned: newTotal,
        completedAdsCount: (prev.completedAdsCount || 0) + 1,
        completedTasksCount: (prev.completedTasksCount || 0) + 1,
        completedTaskIds: updatedCompletedIds,
        taskCompletionTimestamps: updatedTimestamps
      };

      try {
        localStorage.setItem('emerald_trust_user', JSON.stringify(updated));
        localStorage.setItem('emerald_trust_task_completions', JSON.stringify(updatedTimestamps));
      } catch (e) {}

      if (updated.email) {
        saveUserToFirestore(updated).catch(console.error);
      }
      return updated;
    });

    setAllUsersList(prev =>
      prev.map(u => {
        if (u.email.toLowerCase() === user.email.toLowerCase()) {
          const uTimestamps = {
            ...(u.taskCompletionTimestamps || {}),
            [taskId]: now
          };
          return {
            ...u,
            balance: +(u.balance + finalAmount).toFixed(2),
            totalEarned: +(u.totalEarned + finalAmount).toFixed(2),
            completedAdsCount: (u.completedAdsCount || 0) + 1,
            completedTasksCount: (u.completedTasksCount || 0) + 1,
            completedTaskIds: Array.from(new Set([...(u.completedTaskIds || []), taskId])),
            taskCompletionTimestamps: uTimestamps
          };
        }
        return u;
      })
    );

    // Sync to backend if possible
    fetch('/api/owner/update-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, balanceChange: finalAmount })
    }).catch(() => {});
  };

  const handleUpdateUserLock = (email: string, updates: {
    taskLockedByOwner?: boolean;
    taskLockReason?: string;
    withdrawalLockedByOwner?: boolean;
    withdrawalLockReason?: string;
  }) => {
    setAllUsersList(prev =>
      prev.map(u => (u.email.toLowerCase() === email.toLowerCase() ? { ...u, ...updates } : u))
    );
    if (user.email.toLowerCase() === email.toLowerCase()) {
      setUser(prev => ({ ...prev, ...updates }));
    }
  };

  const handleEarnYield = (amount: number, campaignTitle: string) => {
    setUser((prev) => ({
      ...prev,
      balance: +(prev.balance + amount).toFixed(2),
      totalEarned: +(prev.totalEarned + amount).toFixed(2),
      completedAdsCount: (prev.completedAdsCount || 0) + 1
    }));
  };

  const handleWithdraw = (amount: number, address: string) => {
    setUser((prev) => ({
      ...prev,
      balance: Math.max(0, +(prev.balance - amount).toFixed(2))
    }));
  };

  const handleLogout = () => {
    setUser(DEFAULT_USER);
    localStorage.removeItem('emerald_trust_user');
    setDashboardModalOpen(false);
  };

  const handleAuthComplete = (newUser: Partial<UserAccount>, shouldOpenDeposit: boolean) => {
    const updated: UserAccount = {
      ...user,
      ...newUser,
      isRegistered: true
    };
    setUser(updated);

    // Also update allUsersList
    setAllUsersList(prev => {
      const idx = prev.findIndex(u => u.email.toLowerCase() === updated.email.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });

    if (shouldOpenDeposit) {
      setTimeout(() => {
        setDepositModalOpen(true);
      }, 300);
    }
  };

  const handleDepositSubmitted = (req: DepositRequest) => {
    setDeposits(prev => [req, ...prev.filter(d => d.id !== req.id)]);
    setUser(prev => ({
      ...prev,
      depositStatus: 'pending',
      tierId: req.packageId,
      depositAmount: req.amount
    }));

    // Sync to Firestore
    submitDepositToFirestore(req).catch(console.error);

    // Broadcast immediately to Owner / Admin tabs
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('emerald_trust_sync');
        bc.postMessage({ type: 'NEW_DEPOSIT', deposit: req });
      }
    } catch (e) {}
  };

  const handleApproveDeposit = async (depositId: string) => {
    try {
      await fetch('/api/deposits/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, reviewerName: 'Talha Ahmed (Owner)' })
      });
    } catch (e) {
      // offline fallback
    }

    // Sync to Firestore
    updateDepositStatusInFirestore(depositId, 'approved', 'Talha Ahmed (Owner)').catch(console.error);

    setDeposits(prev =>
      prev.map(d => (d.id === depositId ? { ...d, status: 'approved', reviewedBy: 'Talha Ahmed (Owner)' } : d))
    );

    // If current logged-in user matches the deposit, activate them
    const matchingDep = deposits.find(d => d.id === depositId);
    if (matchingDep) {
      if ((user?.email || '').toLowerCase() === (matchingDep.userEmail || '').toLowerCase()) {
        setUser(prev => ({
          ...prev,
          depositStatus: 'active',
          tierId: matchingDep.packageId,
          depositAmount: matchingDep.amount
        }));
      }

      // Update in allUsersList & award 20% referral bonus
      setAllUsersList(prev =>
        prev.map(u => {
          if ((u?.email || '').toLowerCase() === (matchingDep.userEmail || '').toLowerCase()) {
            return {
              ...u,
              depositStatus: 'active',
              tierId: matchingDep.packageId,
              depositAmount: matchingDep.amount
            };
          }
          return u;
        })
      );
    }
  };

  const handleRejectDeposit = async (depositId: string, reason?: string) => {
    try {
      await fetch('/api/deposits/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, reason })
      });
    } catch (e) {}

    setDeposits(prev =>
      prev.map(d => (d.id === depositId ? { ...d, status: 'rejected', notes: reason || 'Rejected' } : d))
    );

    const matchingDep = deposits.find(d => d.id === depositId);
    if (matchingDep && (user?.email || '').toLowerCase() === (matchingDep.userEmail || '').toLowerCase()) {
      setUser(prev => ({ ...prev, depositStatus: 'rejected' }));
    }
  };

  const handleUpdateUserBalance = (email: string, newBalance: number) => {
    setAllUsersList(prev =>
      prev.map(u => ((u?.email || '').toLowerCase() === (email || '').toLowerCase() ? { ...u, balance: newBalance } : u))
    );
    if ((user?.email || '').toLowerCase() === (email || '').toLowerCase()) {
      setUser(prev => ({ ...prev, balance: newBalance }));
    }
  };

  const handleWithdrawSubmit = async (req: {
    amount: number;
    method: 'Easypaisa' | 'Meezan Bank' | 'Payoneer Citibank' | 'Bank Transfer' | 'USDT TRC20' | 'Other';
    accountTitle: string;
    accountNumberOrIban: string;
    notes?: string;
  }) => {
    try {
      const res = await fetch('/api/withdrawals/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          userName: user.name,
          amount: req.amount,
          currency,
          method: req.method,
          accountTitle: req.accountTitle,
          accountNumberOrIban: req.accountNumberOrIban,
          notes: req.notes
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.withdrawal) {
        setWithdrawals(prev => [data.withdrawal, ...prev.filter(w => w.id !== data.withdrawal.id)]);
        setUser(prev => ({
          ...prev,
          balance: Math.max(0, +(prev.balance - req.amount).toFixed(2))
        }));

        // Sync to Firestore
        submitWithdrawalToFirestore(data.withdrawal).catch(console.error);

        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel('emerald_trust_sync');
            bc.postMessage({ type: 'NEW_WITHDRAWAL', withdrawal: data.withdrawal });
          }
        } catch (e) {}

        return { success: true, withdrawal: data.withdrawal };
      }
      return { success: false, error: data.error || 'Withdrawal submission failed.' };
    } catch (err: any) {
      // Offline fallback
      const fallbackWithdrawal: WithdrawalRequest = {
        id: `WTH-${Math.floor(10000 + Math.random() * 90000)}`,
        userEmail: user.email,
        userName: user.name,
        amount: req.amount,
        currency,
        method: req.method,
        accountTitle: req.accountTitle,
        accountNumberOrIban: req.accountNumberOrIban,
        status: 'pending',
        createdAt: 'Just now',
        notes: req.notes || `Withdrawal request submitted via ${req.method}. Pending Owner review.`
      };

      setWithdrawals(prev => [fallbackWithdrawal, ...prev]);
      setUser(prev => ({
        ...prev,
        balance: Math.max(0, +(prev.balance - req.amount).toFixed(2))
      }));
      submitWithdrawalToFirestore(fallbackWithdrawal).catch(console.error);
      return { success: true, withdrawal: fallbackWithdrawal };
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string, txRef?: string) => {
    try {
      await fetch('/api/withdrawals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          reviewerName: 'Talha Ahmed (Owner)',
          txHashOrRef: txRef
        })
      });
    } catch (e) {}

    // Sync to Firestore
    updateWithdrawalStatusInFirestore(withdrawalId, 'approved', 'Talha Ahmed (Owner)', txRef).catch(console.error);

    setWithdrawals(prev =>
      prev.map(w =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'approved',
              reviewedAt: new Date().toLocaleTimeString(),
              reviewedBy: 'Talha Ahmed (Owner)',
              txHashOrRef: txRef || `SETTLE-${Math.floor(100000 + Math.random() * 900000)}`,
              notes: `Approved & Dispatched by Talha Ahmed (Owner)`
            }
          : w
      )
    );

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('emerald_trust_sync');
        bc.postMessage({ type: 'WITHDRAWAL_APPROVED', withdrawalId, txRef });
      }
    } catch (e) {}
  };

  const handleRejectWithdrawal = async (withdrawalId: string, reason?: string) => {
    const item = withdrawals.find(w => w.id === withdrawalId);
    try {
      await fetch('/api/withdrawals/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          reason,
          reviewerName: 'Talha Ahmed (Owner)'
        })
      });
    } catch (e) {}

    setWithdrawals(prev =>
      prev.map(w =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'rejected',
              reviewedAt: new Date().toLocaleTimeString(),
              reviewedBy: 'Talha Ahmed (Owner)',
              notes: `Rejected: ${reason || 'Details mismatch'}. Funds refunded.`
            }
          : w
      )
    );

    // Refund user balance
    if (item && user.email.toLowerCase() === item.userEmail.toLowerCase()) {
      setUser(prev => ({
        ...prev,
        balance: +(prev.balance + item.amount).toFixed(2)
      }));
    }

    if (item) {
      setAllUsersList(prev =>
        prev.map(u => {
          if (u.email.toLowerCase() === item.userEmail.toLowerCase()) {
            return { ...u, balance: +(u.balance + item.amount).toFixed(2) };
          }
          return u;
        })
      );
    }

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('emerald_trust_sync');
        bc.postMessage({ type: 'WITHDRAWAL_REJECTED', withdrawalId, reason });
      }
    } catch (e) {}
  };

  const handleApproveTaskSubmission = async (submissionId: string) => {
    try {
      const res = await fetch('/api/tasks/approve-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, reviewerName: 'Talha Ahmed (Owner)' })
      });
      const data = await res.json();
      const updatedSub: TaskSubmission = data.submission;

      setTaskSubmissions(prev =>
        prev.map(s => s.id === submissionId ? (updatedSub || { ...s, status: 'approved' as const, reviewedBy: 'Talha Ahmed (Owner)' }) : s)
      );

      const targetSub = taskSubmissions.find(s => s.id === submissionId) || updatedSub;
      if (targetSub) {
        const reward = targetSub.userCurrency === 'PKR' ? (targetSub.rewardPkr || 10) : (targetSub.rewardUsd || 1.0);
        const completionTime = Date.now();

        // 1. Update user if it is the current user
        if ((user?.email || '').toLowerCase() === (targetSub?.userEmail || '').toLowerCase()) {
          setUser(prev => {
            const newBal = +(prev.balance + reward).toFixed(2);
            const newTotal = +(prev.totalEarned + reward).toFixed(2);
            const prevCompletedIds = prev.completedTaskIds || [];
            const updatedCompletedIds = Array.from(new Set([...prevCompletedIds, targetSub.taskId]));
            const updatedTimestamps = {
              ...(prev.taskCompletionTimestamps || {}),
              [targetSub.taskId]: completionTime
            };

            const updatedUser: UserAccount = {
              ...prev,
              balance: newBal,
              totalEarned: newTotal,
              completedAdsCount: (prev.completedAdsCount || 0) + 1,
              completedTasksCount: (prev.completedTasksCount || 0) + 1,
              completedTaskIds: updatedCompletedIds,
              taskCompletionTimestamps: updatedTimestamps
            };

            try {
              localStorage.setItem('emerald_trust_user', JSON.stringify(updatedUser));
              localStorage.setItem('emerald_trust_task_completions', JSON.stringify(updatedTimestamps));
            } catch (e) {}

            saveUserToFirestore(updatedUser).catch(console.error);
            return updatedUser;
          });
        }

        // 2. Update allUsersList
        setAllUsersList(prev =>
          prev.map(u => {
            if ((u?.email || '').toLowerCase() === (targetSub?.userEmail || '').toLowerCase()) {
              const uTimestamps = {
                ...(u.taskCompletionTimestamps || {}),
                [targetSub.taskId]: completionTime
              };
              return {
                ...u,
                balance: +(u.balance + reward).toFixed(2),
                totalEarned: +(u.totalEarned + reward).toFixed(2),
                completedAdsCount: (u.completedAdsCount || 0) + 1,
                completedTasksCount: (u.completedTasksCount || 0) + 1,
                completedTaskIds: Array.from(new Set([...(u.completedTaskIds || []), targetSub.taskId])),
                taskCompletionTimestamps: uTimestamps
              };
            }
            return u;
          })
        );

        // 3. Broadcast to other open tabs
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel('emerald_trust_sync');
            bc.postMessage({
              type: 'TASK_SUBMISSION_APPROVED',
              submissionId,
              taskId: targetSub.taskId,
              userEmail: targetSub.userEmail,
              rewardAmount: reward,
              timestamp: completionTime
            });
            bc.close();
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error approving task submission:', err);
    }
  };

  const handleBulkApproveTaskSubmissions = async (submissionIds: string[]) => {
    if (!submissionIds || submissionIds.length === 0) return;
    try {
      const res = await fetch('/api/tasks/bulk-approve-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionIds, reviewerName: 'Talha Ahmed (Owner)' })
      });
      const data = await res.json();
      const approvedSubs: TaskSubmission[] = data.approvedSubmissions || [];

      // Update task submissions state
      const approvedMap = new Map(approvedSubs.map(s => [s.id, s]));
      const completionTime = Date.now();

      setTaskSubmissions(prev =>
        prev.map(s => {
          if (submissionIds.includes(s.id)) {
            const serverSub = approvedMap.get(s.id);
            return serverSub || {
              ...s,
              status: 'approved' as const,
              reviewedBy: 'Talha Ahmed (Owner)',
              reviewedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
          }
          return s;
        })
      );

      // Aggregate user rewards for affected users
      const targets = taskSubmissions.filter(s => submissionIds.includes(s.id));
      const userRewardsMap = new Map<string, { totalReward: number; taskIds: string[] }>();

      targets.forEach(t => {
        const emailKey = (t.userEmail || '').toLowerCase();
        const reward = t.userCurrency === 'PKR' ? (t.rewardPkr || 10) : (t.rewardUsd || 1.0);
        const existing = userRewardsMap.get(emailKey) || { totalReward: 0, taskIds: [] };
        existing.totalReward += reward;
        existing.taskIds.push(t.taskId);
        userRewardsMap.set(emailKey, existing);
      });

      // 1. If current user is among targets, update user state
      const myEmail = (user?.email || '').toLowerCase();
      if (userRewardsMap.has(myEmail)) {
        const myBonus = userRewardsMap.get(myEmail)!;
        setUser(prev => {
          const newBal = +(prev.balance + myBonus.totalReward).toFixed(2);
          const newTotal = +(prev.totalEarned + myBonus.totalReward).toFixed(2);
          const prevCompletedIds = prev.completedTaskIds || [];
          const updatedCompletedIds = Array.from(new Set([...prevCompletedIds, ...myBonus.taskIds]));
          const updatedTimestamps = { ...(prev.taskCompletionTimestamps || {}) };
          myBonus.taskIds.forEach(tId => {
            updatedTimestamps[tId] = completionTime;
          });

          const updatedUser: UserAccount = {
            ...prev,
            balance: newBal,
            totalEarned: newTotal,
            completedAdsCount: (prev.completedAdsCount || 0) + myBonus.taskIds.length,
            completedTasksCount: (prev.completedTasksCount || 0) + myBonus.taskIds.length,
            completedTaskIds: updatedCompletedIds,
            taskCompletionTimestamps: updatedTimestamps
          };

          try {
            localStorage.setItem('emerald_trust_user', JSON.stringify(updatedUser));
            localStorage.setItem('emerald_trust_task_completions', JSON.stringify(updatedTimestamps));
          } catch (e) {}

          saveUserToFirestore(updatedUser).catch(console.error);
          return updatedUser;
        });
      }

      // 2. Update allUsersList
      setAllUsersList(prev =>
        prev.map(u => {
          const uEmail = (u?.email || '').toLowerCase();
          if (userRewardsMap.has(uEmail)) {
            const bonus = userRewardsMap.get(uEmail)!;
            const uTimestamps = { ...(u.taskCompletionTimestamps || {}) };
            bonus.taskIds.forEach(tId => {
              uTimestamps[tId] = completionTime;
            });
            return {
              ...u,
              balance: +(u.balance + bonus.totalReward).toFixed(2),
              totalEarned: +(u.totalEarned + bonus.totalReward).toFixed(2),
              completedAdsCount: (u.completedAdsCount || 0) + bonus.taskIds.length,
              completedTasksCount: (u.completedTasksCount || 0) + bonus.taskIds.length,
              completedTaskIds: Array.from(new Set([...(u.completedTaskIds || []), ...bonus.taskIds])),
              taskCompletionTimestamps: uTimestamps
            };
          }
          return u;
        })
      );

      // 3. Broadcast sync
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('emerald_trust_sync');
          bc.postMessage({
            type: 'TASK_SUBMISSIONS_BULK_APPROVED',
            submissionIds,
            timestamp: completionTime
          });
          bc.close();
        }
      } catch (e) {}
    } catch (err) {
      console.error('Error bulk approving task submissions:', err);
    }
  };

  const handleRejectTaskSubmission = async (submissionId: string, reason?: string) => {
    try {
      const res = await fetch('/api/tasks/reject-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          reason: reason || 'Screenshot proof unclear or invalid',
          reviewerName: 'Talha Ahmed (Owner)'
        })
      });
      const data = await res.json();
      const updatedSub: TaskSubmission = data.submission;

      setTaskSubmissions(prev =>
        prev.map(s => s.id === submissionId ? (updatedSub || { ...s, status: 'rejected' as const, rejectionReason: reason }) : s)
      );

      const targetSub = taskSubmissions.find(s => s.id === submissionId) || updatedSub;
      if (targetSub) {
        try {
          if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            const bc = new BroadcastChannel('emerald_trust_sync');
            bc.postMessage({
              type: 'TASK_SUBMISSION_REJECTED',
              submissionId,
              taskId: targetSub.taskId,
              userEmail: targetSub.userEmail,
              reason: reason || 'Screenshot proof unclear or invalid'
            });
            bc.close();
          }
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error rejecting task submission:', err);
    }
  };

  const handleSubmitTaskProof = async (submissionData: any) => {
    try {
      const res = await fetch('/api/tasks/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      const data = await res.json();
      if (data.submission) {
        setTaskSubmissions(prev => [data.submission, ...prev.filter(s => s.id !== data.submission.id)]);
      }
    } catch (e) {
      setTaskSubmissions(prev => [
        {
          ...submissionData,
          id: `TSUB-${Math.floor(10000 + Math.random() * 90000)}`,
          status: 'pending',
          submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          submittedTimestamp: Date.now()
        },
        ...prev.filter(s => !(s.userEmail.toLowerCase() === submissionData.userEmail.toLowerCase() && s.taskId === submissionData.taskId))
      ]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080808] text-white font-['Inter',sans-serif]">
      {/* Header Bar */}
      <Header
        user={previewAsClient ? { ...user, role: 'client', email: 'client.preview@emeraldtrust.io' } : user}
        currency={currency}
        onCurrencyChange={setCurrency}
        onOpenAuth={() => {
          setSelectedTierForDeposit(null);
          setAuthModalOpen(true);
        }}
        onOpenDashboard={() => {
          setDashboardInitialTab('overview');
          setDashboardModalOpen(true);
        }}
        onOpenWithdrawalPortal={() => {
          setDashboardInitialTab('withdraw');
          setDashboardModalOpen(true);
        }}
        onOpenOwnerPortal={() => setOwnerPortalOpen(true)}
        onOpenOwnerGate={() => setOwnerGateOpen(true)}
        onOpenAdminPortal={() => setAdminPortalOpen(true)}
        onOpenDepositModal={() => setDepositModalOpen(true)}
        onOpenWorkspace={() => setWorkspaceModalOpen(true)}
        onOpenCustomerService={() => setCustomerServiceOpen(true)}
        onNavigate={handleNavigate}
        activeSection={activeSection}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16">
        {/* Deposit Warning Banner for Unactivated Users */}
        {user.isRegistered && (
          <DepositWarningBanner
            depositStatus={user.depositStatus}
            currency={currency}
            onOpenDeposit={() => setDepositModalOpen(true)}
          />
        )}

        <Hero
          onGetStarted={handleGetStarted}
          onViewTiers={() => handleNavigate('packages')}
        />

        <Metrics />

        <PrecisionWorkflow
          onSelectStep={(step) => {
            if (step === 1) {
              if (!user.isRegistered) setAuthModalOpen(true);
              else setDashboardModalOpen(true);
            } else if (step === 2) {
              handleNavigate('packages');
            } else {
              handleNavigate('daily-tasks');
            }
          }}
        />

        <PackagesSection
          user={user}
          currency={currency}
          onCurrencyChange={setCurrency}
          onSelectTier={handleSelectTierFromPackages}
        />

        {/* 3 DAILY TASKS HUB (AUTO-ROTATING 7-DAY SCHEDULE & SCREENSHOT PROOF VERIFICATION) */}
        <DailyTasksHub
          user={previewAsClient ? { ...user, role: 'client', email: 'client.preview@emeraldtrust.io' } : user}
          currency={currency}
          tasks={scheduledTasks}
          taskSubmissions={taskSubmissions}
          onSubmitTaskProof={handleSubmitTaskProof}
          onApproveTaskSubmission={handleApproveTaskSubmission}
          onRejectTaskSubmission={handleRejectTaskSubmission}
          onCompleteTask={handleCompleteDailyTask}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenLiveChat={() => setCustomerServiceOpen(true)}
          onOpenOwnerPortal={() => (isOwner ? setOwnerPortalOpen(true) : setOwnerGateOpen(true))}
        />

        <ReferralProgramSection
          user={user}
          currency={currency}
          onOpenAuth={() => setAuthModalOpen(true)}
        />

        <LiveTransactionsLedger />

        <FaqSection />
      </main>

      {/* Footer */}
      <Footer onOpenOwnerPortal={() => (isOwner ? setOwnerPortalOpen(true) : setOwnerGateOpen(true))} />

      {/* Auth & Auto-Registration Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onComplete={handleAuthComplete}
        initialTier={selectedTierForDeposit}
        currency={currency}
        onCurrencyChange={setCurrency}
        onOpenOwnerGate={() => setOwnerGateOpen(true)}
      />

      {/* Owner Gate & Master Authentication Modal */}
      <OwnerGateModal
        isOpen={ownerGateOpen}
        onClose={() => setOwnerGateOpen(false)}
        onAuthenticated={(ownerAccount) => {
          setUser(ownerAccount);
          setOwnerPortalOpen(true);
        }}
      />

      {/* Deposit Payment Gateway Modal (Meezan, Easypaisa, Payoneer) */}
      <DepositPaymentModal
        isOpen={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        selectedTier={selectedTierForDeposit}
        currency={currency}
        onCurrencyChange={setCurrency}
        userEmail={user.email || 'investor@emeraldtrust.io'}
        userName={user.name || 'Talha Ahmed'}
        onDepositSubmitted={handleDepositSubmitted}
      />

      {/* Investor Portfolio Dashboard Modal */}
      <DashboardModal
        isOpen={dashboardModalOpen}
        onClose={() => setDashboardModalOpen(false)}
        initialTab={dashboardInitialTab}
        user={user}
        currency={currency}
        onCurrencyChange={setCurrency}
        withdrawals={withdrawals}
        onSubmitWithdrawal={handleWithdrawSubmit}
        onOpenDeposit={() => setDepositModalOpen(true)}
        onOpenOwnerPortal={() => setOwnerPortalOpen(true)}
        onOpenWorkspace={() => setWorkspaceModalOpen(true)}
        onOpenLiveChat={() => setCustomerServiceOpen(true)}
        onLogout={handleLogout}
      />

      {/* Google Workspace Hub Modal (Drive & Sheets) */}
      <GoogleWorkspaceModal
        isOpen={workspaceModalOpen}
        onClose={() => setWorkspaceModalOpen(false)}
        user={user}
        deposits={deposits}
        withdrawals={withdrawals}
      />

      {/* Master Owner Portal (Full Access - Talha Ahmed) */}
      <OwnerPortalModal
        isOpen={ownerPortalOpen}
        onClose={() => setOwnerPortalOpen(false)}
        deposits={deposits}
        withdrawals={withdrawals}
        onApproveDeposit={handleApproveDeposit}
        onRejectDeposit={handleRejectDeposit}
        onApproveWithdrawal={handleApproveWithdrawal}
        onRejectWithdrawal={handleRejectWithdrawal}
        allUsers={allUsersList}
        onUpdateUserBalance={handleUpdateUserBalance}
        tasks={scheduledTasks}
        onUpdateTasks={handleUpdateScheduledTasks}
        taskSubmissions={taskSubmissions}
        onApproveTaskSubmission={handleApproveTaskSubmission}
        onRejectTaskSubmission={handleRejectTaskSubmission}
        onBulkApproveTaskSubmissions={handleBulkApproveTaskSubmissions}
        onUpdateUserLock={handleUpdateUserLock}
      />

      {/* Admin Portal (Limited Access) */}
      <AdminPortalModal
        isOpen={adminPortalOpen}
        onClose={() => setAdminPortalOpen(false)}
        deposits={deposits}
        onApproveDeposit={handleApproveDeposit}
        onRejectDeposit={handleRejectDeposit}
      />

      {/* Live Customer Service / Support Chat Modal */}
      <CustomerServiceModal
        isOpen={customerServiceOpen}
        onClose={() => setCustomerServiceOpen(false)}
        user={user}
        currentUser={user}
        currency={currency}
      />

      {/* Floating 24/7 Live Customer Service Button (Available to all visitors & investors) */}
      <div className="fixed bottom-5 right-5 z-[80] animate-in fade-in duration-300">
        <button
          onClick={() => setCustomerServiceOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-mono font-bold text-xs rounded-2xl flex items-center gap-2 transition-all shadow-2xl cursor-pointer hover:scale-105 border border-emerald-400/40 group"
          title="24/7 Customer Service Desk - Chat Live with Owner Talha Ahmed"
        >
          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-950 border-2 border-emerald-400">
              <span className="w-full h-full block rounded-full bg-emerald-400 animate-ping opacity-75" />
            </span>
          </div>
          <span className="font-bold">Customer Support</span>
        </button>
      </div>

      {/* Live Client View Active Banner (when Owner activates Preview as User) */}
      {previewAsClient && (
        <div className="fixed bottom-5 left-5 z-[80] flex items-center gap-2.5 bg-zinc-950/95 border border-amber-500/70 p-2 pl-3.5 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <div className="text-left">
            <p className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider leading-none">
              Client View Active
            </p>
            <p className="text-[11px] font-mono text-zinc-300">
              Owner portal is hidden from live clients
            </p>
          </div>
          <button
            onClick={() => setPreviewAsClient(false)}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-md"
            title="Return to Master Owner Mode"
          >
            <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
            <span>Return to Owner</span>
          </button>
        </div>
      )}

      {/* Floating Owner Portal Access Pill (Visible ONLY to Owner Talha Ahmed) */}
      {!previewAsClient && isOwner && (
        <div className="fixed bottom-5 left-5 z-[80] flex items-center gap-2 bg-zinc-950/95 border border-emerald-500/70 p-2 pl-3.5 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider leading-none">
                Owner Mode Active
              </p>
              <p className="text-[11px] font-mono text-zinc-300">
                Talha Ahmed • {deposits.filter(d => d.status === 'pending').length} Pending
              </p>
            </div>
          </div>
          <button
            onClick={() => setOwnerPortalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-mono font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105"
            title="Open Master Owner Portal (Full Access)"
          >
            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            <span>Open Owner Portal</span>
          </button>
          <button
            onClick={() => setPreviewAsClient(true)}
            className="px-2.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono text-[11px] rounded-xl flex items-center gap-1 transition-all border border-zinc-800 cursor-pointer"
            title="Test and verify how live users see the platform"
          >
            <span className="material-symbols-outlined text-[14px]">visibility</span>
            <span className="hidden sm:inline">Preview as User</span>
          </button>
        </div>
      )}
    </div>
  );
}
