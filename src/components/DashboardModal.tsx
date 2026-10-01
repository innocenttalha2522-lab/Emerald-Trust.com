import React, { useState, useEffect, useMemo } from 'react';
import { UserAccount, CurrencyType, WithdrawalRequest, PackageTier } from '../types';
import { PACKAGE_TIERS } from '../data/mockData';

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  currency: CurrencyType;
  onCurrencyChange: (cur: CurrencyType) => void;
  withdrawals?: WithdrawalRequest[];
  onSubmitWithdrawal?: (req: {
    amount: number;
    method: 'Easypaisa' | 'Meezan Bank' | 'Payoneer Citibank' | 'Bank Transfer' | 'USDT TRC20' | 'Other';
    accountTitle: string;
    accountNumberOrIban: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string; withdrawal?: WithdrawalRequest }>;
  onOpenDeposit: () => void;
  onOpenOwnerPortal?: () => void;
  onOpenWorkspace?: () => void;
  onOpenLiveChat?: () => void;
  onLogout: () => void;
  initialTab?: 'overview' | 'withdraw' | 'history' | 'deposit' | 'affiliates';
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  user,
  currency,
  onCurrencyChange,
  withdrawals = [],
  onSubmitWithdrawal,
  onOpenDeposit,
  onOpenOwnerPortal,
  onOpenWorkspace,
  onOpenLiveChat,
  onLogout,
  initialTab = 'overview'
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'withdraw' | 'history' | 'deposit' | 'affiliates'>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  // Withdrawal Form States
  const [withdrawAmount, setWithdrawAmount] = useState<string>(currency === 'PKR' ? '500' : '100');
  const [withdrawMethod, setWithdrawMethod] = useState<'Easypaisa' | 'Meezan Bank' | 'Payoneer Citibank' | 'Bank Transfer' | 'USDT TRC20' | 'Other'>('Easypaisa');
  const [accountTitle, setAccountTitle] = useState<string>(user.name || '');
  const [accountNumberOrIban, setAccountNumberOrIban] = useState<string>('');
  const [withdrawNotes, setWithdrawNotes] = useState<string>('');

  // Active Global Withdrawal Portal Rules:
  // - Pakistani: min 500 PKR, currency in PKR
  // - International: min $100 USD, currency in USD
  // - Portal is ACTIVE for all genuine clients. Only owner-applied locks take effect.
  const isPakistani = currency === 'PKR';
  const minWithdrawalAmt = isPakistani ? 500 : 100;
  const paidReferralsCount = user.activePaidReferralsCount ?? (user.referralCount >= 10 ? 10 : user.referralCount);
  const totalReferralsCount = user.referralCount || 0;

  const isOwnerWithdrawalLocked = Boolean(user.withdrawalLockedByOwner) && user.role !== 'owner';
  const isWithdrawalLocked = isOwnerWithdrawalLocked;
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  
  // History tab filtering & search
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [isRefreshingHistory, setIsRefreshingHistory] = useState(false);
  const [localWithdrawals, setLocalWithdrawals] = useState<WithdrawalRequest[]>(withdrawals);

  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Synchronize local withdrawals with props
  useEffect(() => {
    setLocalWithdrawals(withdrawals);
  }, [withdrawals]);

  // Set default method according to currency
  useEffect(() => {
    if (currency === 'PKR') {
      if (withdrawMethod === 'Payoneer Citibank') {
        setWithdrawMethod('Easypaisa');
      }
    } else {
      if (withdrawMethod === 'Easypaisa') {
        setWithdrawMethod('Payoneer Citibank');
      }
    }
  }, [currency]);

  // Fetch latest withdrawal records for this user when opening or refreshing
  const fetchUserWithdrawals = async () => {
    if (!user.email) return;
    setIsRefreshingHistory(true);
    try {
      const res = await fetch(`/api/withdrawals/list?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.withdrawals && Array.isArray(data.withdrawals)) {
          setLocalWithdrawals(data.withdrawals);
        }
      }
    } catch (err) {
      // quiet fallback
    } finally {
      setIsRefreshingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserWithdrawals();
    }
  }, [isOpen, user.email]);

  const currentTier = PACKAGE_TIERS.find(t => t.id === user.tierId) || PACKAGE_TIERS[0];
  const isDepositActive = user.depositStatus === 'active' || user.role === 'owner';

  // Filter user's specific withdrawals
  const userWithdrawalList = useMemo(() => {
    const list = localWithdrawals.filter(w => 
      !w.userEmail || w.userEmail.toLowerCase() === user.email.toLowerCase()
    );

    return list.filter(item => {
      const matchesStatus = historyFilter === 'all' || item.status === historyFilter;
      const matchesSearch = !historySearch || 
        item.id.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.method.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.accountTitle.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.accountNumberOrIban.toLowerCase().includes(historySearch.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(historySearch.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }, [localWithdrawals, user.email, historyFilter, historySearch]);

  const pendingCount = localWithdrawals.filter(w => 
    (!w.userEmail || w.userEmail.toLowerCase() === user.email.toLowerCase()) && w.status === 'pending'
  ).length;

  const approvedCount = localWithdrawals.filter(w => 
    (!w.userEmail || w.userEmail.toLowerCase() === user.email.toLowerCase()) && w.status === 'approved'
  ).length;

  const rejectedCount = localWithdrawals.filter(w => 
    (!w.userEmail || w.userEmail.toLowerCase() === user.email.toLowerCase()) && w.status === 'rejected'
  ).length;

  const totalPaidOut = localWithdrawals
    .filter(w => (!w.userEmail || w.userEmail.toLowerCase() === user.email.toLowerCase()) && w.status === 'approved')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  const totalPendingPayout = localWithdrawals
    .filter(w => (!w.userEmail || w.userEmail.toLowerCase() === user.email.toLowerCase()) && w.status === 'pending')
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  const latestWithdrawal = localWithdrawals.find(w => 
    !w.userEmail || w.userEmail.toLowerCase() === user.email.toLowerCase()
  );

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setNotification({ text: 'Please enter a valid withdrawal amount.', type: 'error' });
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    // Role-based lock enforcement & Global Minimum Limits
    if (user.role !== 'owner') {
      if (isOwnerWithdrawalLocked) {
        setNotification({
          text: `Withdrawal is locked by Owner. Reason: "${user.withdrawalLockReason || 'Administrative compliance review in progress.'}"`,
          type: 'error'
        });
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      if (isPakistani) {
        if (amt < 500) {
          setNotification({ text: 'Minimum withdrawal amount for Pakistani clients is PKR 500.', type: 'error' });
          setTimeout(() => setNotification(null), 4000);
          return;
        }
      } else {
        if (amt < 100) {
          setNotification({ text: 'Minimum withdrawal limit for International clients is $100.00 USD.', type: 'error' });
          setTimeout(() => setNotification(null), 4000);
          return;
        }
      }
    }

    if (amt > user.balance) {
      setNotification({ text: `Withdrawal amount exceeds available balance (${currency === 'PKR' ? 'PKR ' + user.balance : '$' + user.balance.toFixed(2)}).`, type: 'error' });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    if (!accountNumberOrIban.trim()) {
      setNotification({ text: 'Please provide destination account number, mobile wallet ID, or IBAN.', type: 'error' });
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    setIsSubmittingWithdrawal(true);

    try {
      if (onSubmitWithdrawal) {
        const res = await onSubmitWithdrawal({
          amount: amt,
          method: withdrawMethod,
          accountTitle: accountTitle || user.name || 'Account Holder',
          accountNumberOrIban: accountNumberOrIban.trim(),
          notes: withdrawNotes.trim()
        });

        if (res.success) {
          setNotification({
            text: `Withdrawal request for ${currency === 'PKR' ? 'PKR ' + amt : '$' + amt.toFixed(2)} submitted! Status is now PENDING Owner approval.`,
            type: 'success'
          });
          setAccountNumberOrIban('');
          setWithdrawNotes('');
          fetchUserWithdrawals();
          setTimeout(() => {
            setActiveTab('history');
            setNotification(null);
          }, 2000);
        } else {
          setNotification({ text: res.error || 'Failed to submit withdrawal.', type: 'error' });
        }
      } else {
        // Direct API submit fallback
        const response = await fetch('/api/withdrawals/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: user.email,
            userName: user.name,
            amount: amt,
            currency,
            method: withdrawMethod,
            accountTitle: accountTitle || user.name,
            accountNumberOrIban: accountNumberOrIban.trim(),
            notes: withdrawNotes.trim()
          })
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setNotification({
            text: `Withdrawal request for ${currency === 'PKR' ? 'PKR ' + amt : '$' + amt.toFixed(2)} placed! Status: PENDING review.`,
            type: 'success'
          });
          setAccountNumberOrIban('');
          setWithdrawNotes('');
          fetchUserWithdrawals();
          setTimeout(() => {
            setActiveTab('history');
            setNotification(null);
          }, 2000);
        } else {
          setNotification({ text: data.error || 'Withdrawal failed.', type: 'error' });
        }
      }
    } catch (err: any) {
      setNotification({ text: err.message || 'Network error submitting payout request.', type: 'error' });
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  const copyReferral = () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-bbl2ws72bstco4hwtnb5zj-373501376715.asia-southeast1.run.app';
    navigator.clipboard.writeText(`${currentUrl}/?ref=${user.referralCode || 'TALHA-8842'}`);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  const handleSetQuickAmountPercent = (percent: number) => {
    if (user.balance <= 0) return;
    const calc = (user.balance * (percent / 100));
    setWithdrawAmount(calc % 1 === 0 ? calc.toString() : calc.toFixed(2));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f1115] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-800 text-white relative max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* User Identity Header */}
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-lg font-mono">
              {user.name ? user.name.charAt(0).toUpperCase() : 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">{user.name || 'Verified Investor'}</h3>
                <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded-md uppercase ${
                  isDepositActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {isDepositActive ? 'Deposit Active' : 'Deposit Required'}
                </span>
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-mono rounded uppercase">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency selector toggle */}
            <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => onCurrencyChange('USD')}
                className={`px-2 py-1 rounded-md cursor-pointer transition-all ${
                  currency === 'USD' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                USD $
              </button>
              <button
                type="button"
                onClick={() => onCurrencyChange('PKR')}
                className={`px-2 py-1 rounded-md cursor-pointer transition-all ${
                  currency === 'PKR' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                PKR (Rs)
              </button>
            </div>

            <button
              onClick={onLogout}
              className="text-xs font-mono font-bold text-red-400 hover:text-red-300 cursor-pointer bg-red-950/40 px-2.5 py-1.5 rounded-lg border border-red-900 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Owner Command Center Quick Access Banner (Only for Talha Ahmed) */}
        {(user.role === 'owner' || user.email === 'innocenttalha2522@gmail.com' || user.email?.toLowerCase().includes('talha')) && (
          <div className="mb-5 p-3.5 bg-gradient-to-r from-purple-950/80 via-zinc-900 to-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center justify-between gap-3 text-emerald-200">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[22px] text-amber-400">admin_panel_settings</span>
              <div>
                <p className="text-xs font-bold text-white font-mono">Master Owner Controls (Talha Ahmed)</p>
                <p className="text-[11px] text-zinc-400 font-mono">Manage Vault Capital, Approve Deposits &amp; Withdrawals, and View Active Teams.</p>
              </div>
            </div>
            {onOpenOwnerPortal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenOwnerPortal();
                }}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase rounded-lg transition-all cursor-pointer shrink-0 shadow-sm"
              >
                Open Owner Portal
              </button>
            )}
          </div>
        )}

        {/* Deposit Warning in Dashboard if not active */}
        {!isDepositActive && (
          <div className="mb-5 p-3.5 bg-amber-950/60 border border-amber-500/60 rounded-xl flex items-center justify-between gap-3 text-amber-200">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-amber-400">warning</span>
              <p className="text-xs">
                Deposit activation is pending. Activate a package to watch ads &amp; unlock instant payouts.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenDeposit();
              }}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs font-mono uppercase rounded-lg transition-all cursor-pointer shrink-0"
            >
              Deposit Now
            </button>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
            notification.type === 'error'
              ? 'bg-red-950/90 text-red-200 border border-red-800'
              : 'bg-emerald-950/90 text-emerald-200 border border-emerald-500'
          }`}>
            <span className="material-symbols-outlined text-[16px]">
              {notification.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{notification.text}</span>
          </div>
        )}

        {/* Top Balance & Yield Statistics */}
        <div className="bg-zinc-900/80 rounded-2xl p-5 border border-zinc-800 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Available Balance
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {currency === 'PKR' ? `PKR ${user.balance}` : `$${user.balance.toFixed(2)}`}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Total Yield Harvested
            </span>
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {currency === 'PKR' ? `PKR ${user.totalEarned}` : `$${user.totalEarned.toFixed(2)}`}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              20% Referral Commission
            </span>
            <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {currency === 'PKR' ? `PKR ${user.referralEarnings}` : `$${user.referralEarnings.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Tabs Bar with dynamic pending indicator badge */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-800 pb-2.5">
          {[
            { id: 'overview', label: 'Portfolio Overview', icon: 'dashboard' },
            { id: 'withdraw', label: 'Withdrawal Portal (Active)', icon: 'payments' },
            { 
              id: 'history', 
              label: 'Withdrawal History', 
              icon: 'receipt_long',
              badge: pendingCount > 0 ? `${pendingCount} Pending` : null,
              badgeType: 'pending'
            },
            { id: 'deposit', label: 'Activate Deposit', icon: 'add_card' },
            { id: 'affiliates', label: '20% Referral Network', icon: 'groups' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/80 bg-zinc-900/60 border border-zinc-800'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-black text-[9px] font-black rounded-full animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: PORTFOLIO OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 font-mono">Current Package Status</p>
                <h4 className="text-base font-bold text-emerald-400 capitalize">{user.packageTier || currentTier.name}</h4>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  Daily Rate: {currentTier.dailyRate}% • Referral Commission: 20% Direct
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenDeposit();
                }}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold rounded-lg cursor-pointer transition-all"
              >
                {isDepositActive ? 'Upgrade Tier' : 'Activate Package'}
              </button>
            </div>

            {/* Quick Live Withdrawal Status Alert Card */}
            {latestWithdrawal && (
              <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                latestWithdrawal.status === 'pending'
                  ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  : latestWithdrawal.status === 'approved'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/40 border-red-500/50 text-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    latestWithdrawal.status === 'pending'
                      ? 'bg-amber-500/20 text-amber-400'
                      : latestWithdrawal.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {latestWithdrawal.status === 'pending' ? 'hourglass_top' : latestWithdrawal.status === 'approved' ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono">
                        Latest Payout: {latestWithdrawal.currency === 'PKR' ? 'PKR ' + latestWithdrawal.amount : '$' + latestWithdrawal.amount}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold font-mono rounded uppercase ${
                        latestWithdrawal.status === 'pending'
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : latestWithdrawal.status === 'approved'
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-500/30 text-red-300 border border-red-500/40'
                      }`}>
                        {latestWithdrawal.status === 'pending' ? 'Pending Approval' : latestWithdrawal.status === 'approved' ? 'Approved & Dispatched' : 'Rejected & Refunded'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {latestWithdrawal.status === 'pending'
                        ? 'Under Owner verification queue (< 15 mins SLA).'
                        : latestWithdrawal.status === 'approved'
                        ? `Dispatched via ${latestWithdrawal.method} to ${latestWithdrawal.accountTitle}.`
                        : `${latestWithdrawal.notes || 'Details mismatch'}. Balance refunded.`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-mono font-bold text-white hover:text-emerald-400 underline underline-offset-4 cursor-pointer shrink-0"
                >
                  View All History →
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-zinc-400">Daily Tasks Completed:</span>
                <p className="text-sm font-bold text-white mt-1">{(user as any).completedTasksCount || user.completedAdsCount || 0} tasks done</p>
              </div>
              <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-zinc-400">{isPakistani ? 'Plan Referrals (Paid):' : 'Direct Referrals:'}</span>
                <p className="text-sm font-bold text-cyan-400 mt-1 flex items-center justify-between">
                  <span>{isPakistani ? `${paidReferralsCount}/10` : `${totalReferralsCount}/10`}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${isWithdrawalLocked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                    {isWithdrawalLocked ? 'Locked' : 'Unlocked'}
                  </span>
                </p>
              </div>
            </div>

            {/* Google Workspace Live Sync Banner */}
            {onOpenWorkspace && (
              <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-blue-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
                  </div>
                  <div>
                    <span className="text-white font-bold block">Google Drive &amp; Sheets Sync</span>
                    <span className="text-[11px] text-zinc-400">Backup portfolio reports to Drive and sync live ledger spreadsheets.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenWorkspace}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-emerald-500 hover:text-black text-emerald-300 border border-emerald-500/40 font-bold rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">table_chart</span>
                  <span>Open Hub</span>
                </button>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setActiveTab('withdraw')}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono uppercase font-bold tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">payments</span>
                <span>Request Payout</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">history</span>
                <span>Withdrawal History</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: REQUEST PAYOUT FORM (ACTIVE WITHDRAWAL PORTAL) */}
        {activeTab === 'withdraw' && (
          isOwnerWithdrawalLocked ? (
            <div className="space-y-5 py-2">
              <div className="p-5 bg-gradient-to-b from-red-950/40 to-zinc-900/90 border border-red-500/40 rounded-2xl text-center space-y-3 font-mono">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 text-2xl">
                  <span className="material-symbols-outlined text-[28px]">lock</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Withdrawal Restricted by Owner</h4>
                  <p className="text-xs text-zinc-300 mt-1 max-w-md mx-auto">
                    Withdrawal locked by Owner / Administration.{' '}
                    <strong className="text-red-400">Reason: "{user.withdrawalLockReason || 'Awaiting compliance review'}"</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {onOpenLiveChat && (
                  <button
                    type="button"
                    onClick={onOpenLiveChat}
                    className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    <span>Contact Owner (Talha Ahmed)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-zinc-700"
                >
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  <span>View Payout History</span>
                </button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            {/* Global Country & Currency Active Status Banner */}
            <div className="p-3 bg-zinc-900/90 border border-emerald-500/40 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-lg">{isPakistani ? '🇵🇰' : '🌐'}</span>
                <div>
                  <p className="font-bold text-white">
                    {isPakistani ? 'Pakistan Regional Portal' : 'Global International Portal'}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Account Registered: {user.country || (isPakistani ? 'Pakistan' : 'International')} &bull; Active Currency: <strong className="text-emerald-400">{currency}</strong>
                  </p>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-400 font-bold">
                {isPakistani ? 'Min Payout: PKR 500' : 'Min Payout: $100.00 USD'}
              </div>
            </div>

            <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-300">
              <span>Available Balance for Withdrawal:</span>
              <span className="text-base font-bold text-emerald-400">
                {currency === 'PKR' ? `PKR ${user.balance}` : `$${user.balance.toFixed(2)}`}
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Withdrawal Amount ({currency})
                </label>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {isPakistani ? 'Minimum: PKR 500' : 'Minimum: $100.00 USD'}
                </span>
              </div>
              <input
                type="number"
                step="any"
                min={minWithdrawalAmt}
                max={user.balance}
                required
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono font-bold focus:border-emerald-500 outline-none"
              />

              {/* Quick Percent Buttons */}
              <div className="flex gap-2 mt-2">
                {[25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSetQuickAmountPercent(p)}
                    className="flex-1 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-[11px] font-mono text-zinc-300 rounded-md transition-all cursor-pointer"
                  >
                    {p === 100 ? 'Max (100%)' : `${p}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Payout Gateway ({currency})
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as any)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                >
                  {isPakistani ? (
                    <>
                      <option value="Easypaisa">📱 Easypaisa (PKR Instant Settlement)</option>
                      <option value="Meezan Bank">🏛️ Meezan Bank Limited (PKR)</option>
                      <option value="Bank Transfer">🏦 Any Pakistani Commercial Bank (IBAN)</option>
                      <option value="Other">⚡ Other Pakistani Wallet (JazzCash / Nayapay)</option>
                    </>
                  ) : (
                    <>
                      <option value="Payoneer Citibank">🌐 Payoneer Citibank Checking (USD)</option>
                      <option value="USDT TRC20">⚡ Crypto USDT (TRC-20 / BEP-20)</option>
                      <option value="Bank Transfer">🏦 International Bank SWIFT / IBAN Wire</option>
                      <option value="Other">💳 Wise / PayPal International Transfer</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                  Account Holder Title / Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Talha Ahmed or Account Title"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs font-mono text-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Account Number / Mobile Number / IBAN / Wallet Address
              </label>
              <input
                type="text"
                required
                placeholder={
                  withdrawMethod === 'Easypaisa'
                    ? 'e.g. 03195006433'
                    : withdrawMethod === 'Meezan Bank'
                    ? 'e.g. 00300111747050 or PK36MEZ...'
                    : 'e.g. Account Number / IBAN'
                }
                value={accountNumberOrIban}
                onChange={(e) => setAccountNumberOrIban(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Optional Instructions / Reference Note
              </label>
              <input
                type="text"
                placeholder="e.g. Urgent settlement requested for ad harvesting yield"
                value={withdrawNotes}
                onChange={(e) => setWithdrawNotes(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-mono text-zinc-300 focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400 space-y-1">
              <p className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                <span>Sub-Second Settlement SLA:</span>
              </p>
              <p>
                Requests are immediately logged into the Owner (Talha Ahmed) settlement ledger. You can monitor the real-time review status under the <strong>Withdrawal History</strong> tab.
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                disabled={isSubmittingWithdrawal || user.balance <= 0}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmittingWithdrawal ? (
                  <span>Submitting Request...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
                    <span>Submit Withdrawal Request</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer"
              >
                View History
              </button>
            </div>

            {/* Anti-Hacker Cybersecurity Hardening Banner */}
            <div className="p-3 bg-black/40 rounded-xl border border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">verified_user</span>
                <span>Protected by 256-Bit SSL Encryption &amp; Anti-Double-Spend Mutex.</span>
              </div>
              <span className="text-[10px] text-emerald-500 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                ARMORED
              </span>
            </div>
          </form>
          )
        )}

        {/* TAB 3: WITHDRAWAL HISTORY (REAL-TIME STATUS & VERIFICATION) */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Header with Stats & Live Refresh Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-900/90 rounded-xl border border-zinc-800">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Your Withdrawal Request Ledger</span>
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>REAL-TIME STATUS</span>
                  </span>
                </h4>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Track verification and settlement from Owner (Talha Ahmed) directly.
                </p>
              </div>

              <button
                onClick={fetchUserWithdrawals}
                disabled={isRefreshingHistory}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isRefreshingHistory ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>{isRefreshingHistory ? 'Refreshing...' : 'Refresh Status'}</span>
              </button>
            </div>

            {/* Quick Metrics Summary */}
            <div className="grid grid-cols-3 gap-2.5 text-xs font-mono">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total Dispatched</span>
                <span className="text-base font-bold text-emerald-400 mt-0.5 block tabular-nums">
                  {currency === 'PKR' ? `PKR ${totalPaidOut}` : `$${totalPaidOut.toFixed(2)}`}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">{approvedCount} Approved</span>
              </div>

              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider block">Pending Queue</span>
                <span className="text-base font-bold text-amber-400 mt-0.5 block tabular-nums">
                  {currency === 'PKR' ? `PKR ${totalPendingPayout}` : `$${totalPendingPayout.toFixed(2)}`}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">{pendingCount} in Review</span>
              </div>

              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total Requests</span>
                <span className="text-base font-bold text-white mt-0.5 block tabular-nums">
                  {localWithdrawals.filter(w => !w.userEmail || w.userEmail.toLowerCase() === user.email.toLowerCase()).length}
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5 block">{rejectedCount} Rejected</span>
              </div>
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by ID, account number, or method..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 outline-none font-mono"
                />
              </div>

              <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: `Pending (${pendingCount})` },
                  { id: 'approved', label: `Approved (${approvedCount})` },
                  { id: 'rejected', label: `Rejected (${rejectedCount})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setHistoryFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      historyFilter === f.id
                        ? 'bg-emerald-500 text-black font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* History Cards List */}
            {userWithdrawalList.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 rounded-xl border border-zinc-800 text-zinc-400 text-xs font-mono space-y-3">
                <span className="material-symbols-outlined text-[36px] text-zinc-600 block mx-auto">
                  receipt_long
                </span>
                <p>
                  {historySearch || historyFilter !== 'all'
                    ? 'No withdrawal records match your active filter.'
                    : 'No withdrawal requests placed yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('withdraw')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer"
                >
                  Request First Payout
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {userWithdrawalList.map((item) => {
                  const isPending = item.status === 'pending';
                  const isApproved = item.status === 'approved';
                  const isRejected = item.status === 'rejected';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPending
                          ? 'bg-zinc-900/90 border-amber-500/50 shadow-xs'
                          : isApproved
                          ? 'bg-zinc-900/60 border-emerald-500/40'
                          : 'bg-zinc-900/40 border-red-500/40'
                      }`}
                    >
                      {/* Top Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-white">{item.id}</span>
                          <span className="text-[11px] font-mono text-zinc-400">• {item.createdAt}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {item.method}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-[11px] font-bold font-mono rounded-lg flex items-center gap-1.5 uppercase ${
                            isPending
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : isApproved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-400 border border-red-500/40'
                          }`}>
                            {isPending && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
                            <span className="material-symbols-outlined text-[14px]">
                              {isPending ? 'hourglass_top' : isApproved ? 'check_circle' : 'cancel'}
                            </span>
                            <span>{isPending ? 'Pending Verification' : isApproved ? 'Approved & Dispatched' : 'Rejected'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Content & Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Requested Amount</span>
                          <span className="text-lg font-bold text-emerald-400 tabular-nums mt-0.5 block">
                            {item.currency === 'PKR' ? `PKR ${item.amount}` : `$${Number(item.amount).toFixed(2)}`}
                          </span>
                          <span className="text-[11px] text-zinc-400 mt-1 block">
                            Recipient: <span className="text-white font-semibold">{item.accountTitle}</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Destination Account</span>
                          <span className="text-xs font-bold text-white mt-0.5 block break-all">
                            {item.accountNumberOrIban}
                          </span>

                          {/* Reviewed note / Transaction Hash */}
                          {item.reviewedAt && (
                            <div className="mt-1.5 text-[11px] text-zinc-400">
                              <span>Verified at: {item.reviewedAt}</span>
                              {item.reviewedBy && (
                                <span className="text-emerald-400 block font-semibold">
                                  by {item.reviewedBy}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Explanation / Settlement Details */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-800/60 text-[11px] font-mono flex items-center justify-between gap-2">
                        {isPending && (
                          <div className="flex items-center gap-1.5 text-amber-300">
                            <span className="material-symbols-outlined text-[15px] text-amber-400">schedule</span>
                            <span>Awaiting Owner compliance approval. Expected settlement: &lt; 15 mins.</span>
                          </div>
                        )}

                        {isApproved && (
                          <div className="flex items-center gap-1.5 text-emerald-300">
                            <span className="material-symbols-outlined text-[15px] text-emerald-400">verified</span>
                            <span>
                              Settlement Completed. {item.txHashOrRef ? `Ref: ${item.txHashOrRef}` : 'Dispatched to banking network.'}
                            </span>
                          </div>
                        )}

                        {isRejected && (
                          <div className="flex items-center gap-1.5 text-red-300">
                            <span className="material-symbols-outlined text-[15px] text-red-400">info</span>
                            <span>{item.notes || 'Details mismatch'}. Funds have been refunded to your balance.</span>
                          </div>
                        )}

                        {isRejected && (
                          <button
                            type="button"
                            onClick={() => {
                              setWithdrawAmount(item.amount.toString());
                              setWithdrawMethod(item.method);
                              setAccountTitle(item.accountTitle);
                              setActiveTab('withdraw');
                            }}
                            className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800 rounded-md text-[10px] font-bold cursor-pointer transition-all shrink-0"
                          >
                            Re-submit Payout
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: DEPOSIT ACTIVATION */}
        {activeTab === 'deposit' && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-300 font-mono">
              To activate your package tier or add funds, use our official Owner payment channels (Meezan Bank, Easypaisa, Payoneer Citibank).
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenDeposit();
              }}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              <span>Open Deposit Payment Gateway</span>
            </button>
          </div>
        )}

        {/* TAB 5: 20% NETWORK */}
        {activeTab === 'affiliates' && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2">
              <span className="text-xs text-zinc-400 font-mono">Your Direct 20% Referral Code</span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-mono font-bold text-emerald-400">{user.referralCode || 'TALHA-8842'}</span>
                <button
                  onClick={copyReferral}
                  className="px-3 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-lg text-xs font-mono font-bold cursor-pointer"
                >
                  {copiedRef ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-zinc-400">Total 20% Referrals:</span>
                <p className="text-sm font-bold text-white mt-1">{user.referralCount || 0} active</p>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <span className="text-zinc-400">Commission Earned:</span>
                <p className="text-sm font-bold text-cyan-400 mt-1">
                  {currency === 'PKR' ? `PKR ${user.referralEarnings}` : `$${user.referralEarnings.toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
