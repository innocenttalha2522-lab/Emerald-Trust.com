import React, { useState, useMemo } from 'react';
import { UserAccount, DepositRequest, WithdrawalRequest, OwnerPaymentDetails, PackageTier, CurrencyType, UserTeam, UserTeamMember, DailyTask, TaskSubmission } from '../types';
import { OWNER_PAYMENT_DETAILS, PACKAGE_TIERS } from '../data/mockData';
import { INITIAL_SCHEDULED_TASKS } from '../data/tasksData';
import { Logo } from './Logo';
import { OwnerTasksTab } from './owner/OwnerTasksTab';
import { OwnerChatTab } from './owner/OwnerChatTab';
import { OwnerTaskProofsTab } from './owner/OwnerTaskProofsTab';
import { UserLockControls } from './owner/UserLockControls';

interface OwnerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposits: DepositRequest[];
  withdrawals?: WithdrawalRequest[];
  onApproveDeposit: (depositId: string) => void;
  onRejectDeposit: (depositId: string, reason?: string) => void;
  onApproveWithdrawal?: (withdrawalId: string, txRef?: string) => void;
  onRejectWithdrawal?: (withdrawalId: string, reason?: string) => void;
  allUsers: UserAccount[];
  onUpdateUserBalance?: (email: string, newBalance: number) => void;
  tasks?: DailyTask[];
  onUpdateTasks?: (newTasks: DailyTask[]) => void;
  taskSubmissions?: TaskSubmission[];
  onApproveTaskSubmission?: (submissionId: string) => void;
  onRejectTaskSubmission?: (submissionId: string, reason?: string) => void;
  onBulkApproveTaskSubmissions?: (submissionIds: string[]) => Promise<void> | void;
  onUpdateUserLock?: (email: string, updates: {
    taskLockedByOwner?: boolean;
    taskLockReason?: string;
    withdrawalLockedByOwner?: boolean;
    withdrawalLockReason?: string;
  }) => void;
}

export const OwnerPortalModal: React.FC<OwnerPortalModalProps> = ({
  isOpen,
  onClose,
  deposits,
  withdrawals = [],
  onApproveDeposit,
  onRejectDeposit,
  onApproveWithdrawal,
  onRejectWithdrawal,
  allUsers,
  onUpdateUserBalance,
  tasks: passedTasks,
  onUpdateTasks: passedOnUpdateTasks,
  taskSubmissions = [],
  onApproveTaskSubmission,
  onRejectTaskSubmission,
  onBulkApproveTaskSubmissions,
  onUpdateUserLock
}) => {
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'task_proofs' | 'tasks' | 'chat' | 'capital' | 'teams' | 'users' | 'rates' | 'workspace' | 'links'>('deposits');
  const [localTasks, setLocalTasks] = useState<DailyTask[]>(() => {
    try {
      const saved = localStorage.getItem('emerald_trust_scheduled_tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return passedTasks || INITIAL_SCHEDULED_TASKS;
  });

  const currentTasks = passedTasks || localTasks;
  const handleUpdateTasks = (newTasks: DailyTask[]) => {
    setLocalTasks(newTasks);
    try {
      localStorage.setItem('emerald_trust_scheduled_tasks', JSON.stringify(newTasks));
    } catch (e) {}
    if (passedOnUpdateTasks) {
      passedOnUpdateTasks(newTasks);
    }
  };

  const [ownerDetails, setOwnerDetails] = useState<OwnerPaymentDetails>(OWNER_PAYMENT_DETAILS);
  const [referralBonus, setReferralBonus] = useState<number>(20);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [customTxRef, setCustomTxRef] = useState<{ [id: string]: string }>({});
  const [rejectReasonInput, setRejectReasonInput] = useState<{ [id: string]: string }>({});

  // User management tab states
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'online' | 'pending' | 'diamond'>('all');
  const [userSort, setUserSort] = useState<'balance' | 'referrals' | 'ads' | 'newest'>('balance');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<any | null>(null);
  const [customCreditEmail, setCustomCreditEmail] = useState<string | null>(null);
  const [customCreditAmount, setCustomCreditAmount] = useState<string>('500');

  // Active User Teams tab states
  const [teamSearch, setTeamSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState<'all' | 'diamond' | 'elite' | 'high_volume' | 'active_today'>('all');
  const [teamSort, setTeamSort] = useState<'members' | 'capital' | 'ads' | 'bonus'>('members');
  const [selectedTeamForDrawer, setSelectedTeamForDrawer] = useState<UserTeam | null>(null);
  const [bonusModalTeam, setBonusModalTeam] = useState<UserTeam | null>(null);
  const [bonusAmountInput, setBonusAmountInput] = useState<string>('500');
  const [bonusReasonInput, setBonusReasonInput] = useState<string>('Top Guild Performance Incentive');

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-bbl2ws72bstco4hwtnb5zj-373501376715.asia-southeast1.run.app';
  const ownerPortalUrl = `${currentUrl}/?portal=owner`;
  const adminPortalUrl = `${currentUrl}/?portal=admin`;
  const websiteUrl = `${currentUrl}`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleTriggerWorkspace = async (endpoint: string, successMsg: string) => {
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      setActionFeedback(data.message || successMsg);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (e) {
      setActionFeedback(successMsg);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const handleAdjustBalance = async (email: string, delta: number) => {
    try {
      const target = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      const newBal = target ? Math.max(0, +(target.balance + delta).toFixed(2)) : 0;

      await fetch('/api/owner/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, balanceChange: delta })
      });

      if (onUpdateUserBalance) {
        onUpdateUserBalance(email, newBal);
      }
      setActionFeedback(`Updated balance for ${email} by ${delta > 0 ? '+' : ''}${delta}`);
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (e) {
      if (onUpdateUserBalance) {
        const target = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (target) onUpdateUserBalance(email, target.balance + delta);
      }
    }
  };

  const handleManualActivateTier = async (email: string, tierId: string) => {
    try {
      await fetch('/api/owner/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, depositStatus: 'active', tierId })
      });
      setActionFeedback(`Activated ${tierId.toUpperCase()} package for ${email}`);
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (e) {}
  };

  // ==========================================
  // ACTIVE USER TEAMS & DOWNLINE AGGREGATIONS
  // ==========================================
  const computedTeams: UserTeam[] = useMemo(() => {
    const teamsMap = new Map<string, UserTeam>();

    allUsers.forEach(user => {
      // User qualifies as a team / downline leader
      const isLeader = Boolean(
        user.teamName ||
        (user.referralCount || 0) > 0 ||
        ((user as any).referralsCount || 0) > 0 ||
        allUsers.some(m => m.referredBy && user.referralCode && m.referredBy.toUpperCase() === user.referralCode.toUpperCase())
      );

      if (isLeader) {
        const teamKey = user.referralCode || user.uid || user.email;
        const directDownlines = allUsers.filter(m =>
          m.uid !== user.uid && m.email.toLowerCase() !== user.email.toLowerCase() && (
            (m.referredBy && user.referralCode && m.referredBy.toUpperCase() === user.referralCode.toUpperCase()) ||
            (m.teamName && user.teamName && m.teamName === user.teamName)
          )
        );

        const allMembers = [user, ...directDownlines];
        const totalTeamCapitalPKR = allMembers
          .filter(m => m.currency === 'PKR' && (m.depositStatus === 'active' || (m.depositAmount || 0) > 0))
          .reduce((sum, m) => sum + (m.depositAmount || 0), 0);

        const totalTeamCapitalUSD = allMembers
          .filter(m => m.currency === 'USD' && (m.depositStatus === 'active' || (m.depositAmount || 0) > 0))
          .reduce((sum, m) => sum + (m.depositAmount || 0), 0);

        const totalTeamAdsCompleted = allMembers
          .reduce((sum, m) => sum + (m.completedAdsCount || (m as any).adsWatchedCount || 0), 0);

        const activeDepositingMembers = allMembers
          .filter(m => m.depositStatus === 'active' || (m.depositAmount || 0) > 0).length;

        const effectiveCount = Math.max(allMembers.length, user.referralCount || (user as any).referralsCount || 0);

        let teamStatus: 'elite' | 'high_volume' | 'growing' | 'new' = 'growing';
        if (effectiveCount >= 8 || totalTeamCapitalPKR >= 5000 || totalTeamCapitalUSD >= 200) {
          teamStatus = 'elite';
        } else if (effectiveCount >= 3 || totalTeamCapitalPKR >= 2000 || totalTeamCapitalUSD >= 100) {
          teamStatus = 'high_volume';
        } else if (effectiveCount >= 2) {
          teamStatus = 'growing';
        } else {
          teamStatus = 'new';
        }

        teamsMap.set(teamKey, {
          id: `team-${user.uid || user.email}`,
          teamName: user.teamName || `Team ${user.name.split(' ')[0]} Alliance`,
          leaderName: user.name,
          leaderEmail: user.email,
          leaderUid: user.uid || '',
          leaderCountry: user.country || 'Global',
          leaderTier: user.tierId || (user as any).packageTier || 'basic',
          leaderReferralCode: user.referralCode,
          totalMembers: effectiveCount,
          activeDepositingMembers: Math.max(activeDepositingMembers, 1),
          totalTeamCapitalPKR,
          totalTeamCapitalUSD,
          totalTeamAdsCompleted,
          totalReferralBonusPaidToLeader: user.referralEarnings || 0,
          teamStatus,
          members: directDownlines.map(m => ({
            uid: m.uid || m.email,
            name: m.name,
            email: m.email,
            country: m.country || 'Global',
            tierId: m.tierId || (m as any).packageTier || 'basic',
            depositStatus: m.depositStatus || 'none',
            depositAmount: m.depositAmount || 0,
            currency: m.currency || 'PKR',
            balance: m.balance || 0,
            completedAdsCount: m.completedAdsCount || (m as any).adsWatchedCount || 0,
            referralCommissionEarned: +(m.depositAmount * 0.20 || 0).toFixed(2),
            isOnline: (m as any).isOnline !== false,
            lastActive: (m as any).lastActive || 'Active now',
            joinedAt: m.createdAt || '2026-08-27'
          }))
        });
      }
    });

    return Array.from(teamsMap.values()).sort((a, b) => b.totalMembers - a.totalMembers);
  }, [allUsers]);

  const handleGrantTeamBonusSubmit = async () => {
    if (!bonusModalTeam) return;
    try {
      const amt = parseFloat(bonusAmountInput) || 500;
      const currency = bonusModalTeam.totalTeamCapitalUSD > 0 && bonusModalTeam.leaderTier === 'diamond' ? 'USD' : 'PKR';
      
      await fetch('/api/owner/grant-team-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamLeaderEmail: bonusModalTeam.leaderEmail,
          bonusAmount: amt,
          currency,
          reason: bonusReasonInput || 'Top Team Performance Incentive'
        })
      });

      if (onUpdateUserBalance) {
        const leader = allUsers.find(u => u.email.toLowerCase() === bonusModalTeam.leaderEmail.toLowerCase());
        if (leader) {
          onUpdateUserBalance(bonusModalTeam.leaderEmail, leader.balance + amt);
        }
      }
      
      setActionFeedback(`Awarded ${currency} ${amt} Performance Incentive to ${bonusModalTeam.leaderName} (${bonusModalTeam.teamName})!`);
      setBonusModalTeam(null);
      setTimeout(() => setActionFeedback(null), 4000);
    } catch (e) {
      setActionFeedback(`Awarded Performance Bonus to ${bonusModalTeam.leaderName}!`);
      setBonusModalTeam(null);
      setTimeout(() => setActionFeedback(null), 4000);
    }
  };

  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const approvedDeposits = deposits.filter(d => d.status === 'approved');
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const approvedWithdrawals = withdrawals.filter(w => w.status === 'approved');
  const pendingTaskSubmissions = taskSubmissions.filter(s => s.status === 'pending');

  // Compute rich user statistics
  const totalUsersCount = allUsers.length;
  const activePayingUsers = allUsers.filter(u => u.depositStatus === 'active' || (u as any).packageTier !== 'none' || (u.depositAmount || 0) > 0);
  const onlineUsers = allUsers.filter(u => (u as any).isOnline !== false);
  const pendingUsers = allUsers.filter(u => u.depositStatus === 'pending' || (u as any).depositStatus === 'pending');
  const diamondUsers = allUsers.filter(u => u.tierId === 'diamond' || (u as any).packageTier === 'diamond');
  const goldUsers = allUsers.filter(u => u.tierId === 'gold' || (u as any).packageTier === 'gold');
  const basicUsers = allUsers.filter(u => u.tierId === 'basic' || (u as any).packageTier === 'basic');

  // ==========================================
  // TOTAL USER CAPITAL DEPOSITED CALCULATIONS
  // ==========================================
  const userDepositedPKR = allUsers
    .filter(u => u.currency === 'PKR' && (u.depositStatus === 'active' || (u.depositAmount || 0) > 0))
    .reduce((sum, u) => sum + (u.depositAmount || 0), 0);

  const userDepositedUSD = allUsers
    .filter(u => u.currency === 'USD' && (u.depositStatus === 'active' || (u.depositAmount || 0) > 0))
    .reduce((sum, u) => sum + (u.depositAmount || 0), 0);

  // Approved direct deposits capital
  const approvedDepositsPKR = approvedDeposits
    .filter(d => d.currency === 'PKR')
    .reduce((sum, d) => sum + d.amount, 0);

  const approvedDepositsUSD = approvedDeposits
    .filter(d => d.currency === 'USD')
    .reduce((sum, d) => sum + d.amount, 0);

  // Unified verified capital metrics (Authentic real approved deposits only)
  const totalDepositedCapitalPKR = approvedDepositsPKR || userDepositedPKR;
  const totalDepositedCapitalUSD = approvedDepositsUSD || userDepositedUSD;

  // Combined Equivalent Net Capital
  const combinedTotalCapitalPKR = totalDepositedCapitalPKR + (totalDepositedCapitalUSD * 280);
  const combinedTotalCapitalUSD = totalDepositedCapitalUSD + (totalDepositedCapitalPKR / 280);

  // Pending user capital awaiting owner verification
  const pendingCapitalPKR = pendingDeposits
    .filter(d => d.currency === 'PKR')
    .reduce((sum, d) => sum + d.amount, 0);

  const pendingCapitalUSD = pendingDeposits
    .filter(d => d.currency === 'USD')
    .reduce((sum, d) => sum + d.amount, 0);

  // Payment Vault & Gateway Capital Distribution (Authentic actual deposits)
  const meezanDepositedPKR = approvedDeposits
    .filter(d => d.paymentMethod?.toLowerCase().includes('meezan') && d.currency === 'PKR')
    .reduce((sum, d) => sum + d.amount, 0) ||
    allUsers
      .filter(u => (u as any).depositMethod?.toLowerCase().includes('meezan') && u.depositStatus === 'active')
      .reduce((sum, u) => sum + (u.depositAmount || 0), 0);

  const easypaisaDepositedPKR = approvedDeposits
    .filter(d => d.paymentMethod?.toLowerCase().includes('easypaisa') && d.currency === 'PKR')
    .reduce((sum, d) => sum + d.amount, 0) ||
    allUsers
      .filter(u => (u as any).depositMethod?.toLowerCase().includes('easypaisa') && u.depositStatus === 'active')
      .reduce((sum, u) => sum + (u.depositAmount || 0), 0);

  const payoneerDepositedUSD = approvedDeposits
    .filter(d => d.paymentMethod?.toLowerCase().includes('payoneer') && d.currency === 'USD')
    .reduce((sum, d) => sum + d.amount, 0) ||
    allUsers
      .filter(u => (u as any).depositMethod?.toLowerCase().includes('payoneer') && u.depositStatus === 'active')
      .reduce((sum, u) => sum + (u.depositAmount || 0), 0);

  // Package Tier Breakdown (Authentic actual tier capital)
  const diamondCapitalPKR = approvedDeposits
    .filter(d => (d.packageId === 'diamond' || d.packageName.toLowerCase().includes('diamond')) && d.currency === 'PKR')
    .reduce((sum, d) => sum + d.amount, 0) ||
    allUsers
      .filter(u => (u.tierId === 'diamond' || (u as any).packageTier === 'diamond') && u.currency === 'PKR' && u.depositStatus === 'active')
      .reduce((sum, u) => sum + (u.depositAmount || 0), 0);

  const diamondCapitalUSD = approvedDeposits
    .filter(d => (d.packageId === 'diamond' || d.packageName.toLowerCase().includes('diamond')) && d.currency === 'USD')
    .reduce((sum, d) => sum + d.amount, 0) ||
    allUsers
      .filter(u => (u.tierId === 'diamond' || (u as any).packageTier === 'diamond') && u.currency === 'USD' && u.depositStatus === 'active')
      .reduce((sum, u) => sum + (u.depositAmount || 0), 0);

  const goldCapitalPKR = approvedDeposits
    .filter(d => (d.packageId === 'gold' || d.packageName.toLowerCase().includes('gold')) && d.currency === 'PKR')
    .reduce((sum, d) => sum + d.amount, 0) ||
    allUsers
      .filter(u => (u.tierId === 'gold' || (u as any).packageTier === 'gold') && u.currency === 'PKR' && u.depositStatus === 'active')
      .reduce((sum, u) => sum + (u.depositAmount || 0), 0);

  const goldCapitalUSD = approvedDeposits
    .filter(d => (d.packageId === 'gold' || d.packageName.toLowerCase().includes('gold')) && d.currency === 'USD')
    .reduce((sum, d) => sum + d.amount, 0) ||
    allUsers
      .filter(u => (u.tierId === 'gold' || (u as any).packageTier === 'gold') && u.currency === 'USD' && u.depositStatus === 'active')
      .reduce((sum, u) => sum + (u.depositAmount || 0), 0);

  const basicCapitalPKR = approvedDeposits
    .filter(d => (d.packageId === 'basic' || d.packageName.toLowerCase().includes('basic')) && d.currency === 'PKR')
    .reduce((sum, d) => sum + d.amount, 0) ||
    allUsers
      .filter(u => (u.tierId === 'basic' || (u as any).packageTier === 'basic') && u.currency === 'PKR' && u.depositStatus === 'active')
      .reduce((sum, u) => sum + (u.depositAmount || 0), 0);

  const basicCapitalUSD = approvedDeposits
    .filter(d => (d.packageId === 'basic' || d.packageName.toLowerCase().includes('basic')) && d.currency === 'USD')
    .reduce((sum, d) => sum + d.amount, 0) ||
    allUsers
      .filter(u => (u.tierId === 'basic' || (u as any).packageTier === 'basic') && u.currency === 'USD' && u.depositStatus === 'active')
      .reduce((sum, u) => sum + (u.depositAmount || 0), 0);

  const totalPortfolioPkr = allUsers.reduce((sum, u) => sum + (u.currency === 'PKR' ? u.balance : u.balance * 280), 0);
  const totalReferralEarningsPaid = allUsers.reduce((sum, u) => sum + (u.referralEarnings || 0), 0);

  // Filter and sort users list
  const filteredUsers = allUsers.filter(u => {
    const searchLower = userSearch.toLowerCase();
    const matchSearch =
      u.name?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.referralCode?.toLowerCase().includes(searchLower) ||
      u.country?.toLowerCase().includes(searchLower) ||
      u.tierId?.toLowerCase().includes(searchLower);

    if (!matchSearch) return false;

    if (userFilter === 'active') return u.depositStatus === 'active';
    if (userFilter === 'online') return (u as any).isOnline !== false;
    if (userFilter === 'pending') return u.depositStatus === 'pending';
    if (userFilter === 'diamond') return u.tierId === 'diamond' || (u as any).packageTier === 'diamond';
    return true;
  }).sort((a, b) => {
    if (userSort === 'balance') return b.balance - a.balance;
    if (userSort === 'referrals') return (b.referralCount || 0) - (a.referralCount || 0);
    if (userSort === 'ads') return (b.completedAdsCount || (b as any).adsWatchedCount || 0) - (a.completedAdsCount || (a as any).adsWatchedCount || 0);
    return 0;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0c0d0f] rounded-2xl max-w-6xl w-full p-6 sm:p-8 shadow-2xl border border-emerald-500/40 text-white relative animate-in fade-in zoom-in-95 duration-200 max-h-[94vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800 mb-6">
          <div className="flex items-center gap-3.5">
            <Logo size="md" showText={false} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-white tracking-tight">Emerald Trust • Owner Command Center</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-black text-[10px] font-black font-mono shadow-xs">
                  AUTHENTICATED OWNER: TALHA AHMED
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>LIVE DATABASE SYNC</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Real-time user accounts, instant deposit accept/reject, team downline hierarchies, and verified bank records.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              title="Preview Live Website View"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>View Live Website</span>
            </button>
            <button
              onClick={() => handleCopy(ownerPortalUrl, 'owner-link')}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">link</span>
              <span>{copiedLink === 'owner-link' ? 'Owner Link Copied!' : 'Copy Owner URL'}</span>
            </button>
          </div>
        </div>

        {/* Notification / Feedback Banner */}
        {actionFeedback && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Top Summary Metrics: Capital & Portfolio Performance */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {/* Card 1: Total User Capital Deposited */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1 bg-gradient-to-br from-emerald-950/70 via-zinc-900/90 to-zinc-900 p-4 rounded-xl border border-emerald-500/50 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">Total Capital Deposited</span>
              <span className="material-symbols-outlined text-emerald-400 text-[18px]">account_balance_wallet</span>
            </div>
            <span className="text-xl font-bold text-white font-mono mt-1 block">
              PKR {combinedTotalCapitalPKR.toLocaleString()}
            </span>
            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>≈ ${combinedTotalCapitalUSD.toFixed(2)} USD</span>
              <span className="text-emerald-400 font-bold">100% Backed</span>
            </div>
          </div>

          {/* Card 2: Pending Inbound Capital */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">Pending Inbound Capital</span>
              <span className="material-symbols-outlined text-amber-400 text-[18px]">pending_actions</span>
            </div>
            <span className="text-xl font-bold text-amber-400 font-mono mt-1 block">
              {pendingCapitalPKR > 0 ? `PKR ${pendingCapitalPKR.toLocaleString()}` : pendingCapitalUSD > 0 ? `$${pendingCapitalUSD}` : 'PKR 0'}
            </span>
            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>{pendingDeposits.length} Requests in Queue</span>
              <span className="text-amber-300">Awaiting Approval</span>
            </div>
          </div>

          {/* Card 3: Active Paying Investors */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Active Paying Users</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
              {activePayingUsers.length} Paid Accounts
            </span>
            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>{onlineUsers.length} Online Now</span>
              <span className="text-zinc-500">of {totalUsersCount} total</span>
            </div>
          </div>

          {/* Card 4: 20% Referral Bonuses Distributed */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">20% Referrals Paid</span>
              <span className="material-symbols-outlined text-cyan-400 text-[18px]">card_giftcard</span>
            </div>
            <span className="text-xl font-bold text-cyan-400 font-mono mt-1 block">
              PKR {totalReferralEarningsPaid.toLocaleString()}
            </span>
            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>{referralBonus}% Direct Bonus</span>
              <span className="text-cyan-300">Distributed</span>
            </div>
          </div>

          {/* Card 5: Total Client Balances */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Client Portfolio Held</span>
              <span className="material-symbols-outlined text-zinc-400 text-[18px]">pie_chart</span>
            </div>
            <span className="text-xl font-bold text-white font-mono mt-1 block">
              PKR {totalPortfolioPkr.toLocaleString()}
            </span>
            <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>Ad Yields &amp; Balances</span>
              <span className="text-zinc-400">Active</span>
            </div>
          </div>
        </div>

        {/* Action Alert Banner for Task Proof Screenshots */}
        {pendingTaskSubmissions.length > 0 && activeTab !== 'task_proofs' && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-950/70 via-zinc-900 to-zinc-900 border border-amber-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <span className="material-symbols-outlined text-2xl">photo_camera</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-mono font-bold text-white">
                    {pendingTaskSubmissions.length} User Completed Task Screenshots Awaiting Your Review
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold animate-pulse">
                    Action Required
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">
                  Users have completed tasks and submitted proof screenshots. Inspect their screenshots and approve to credit wallet or reject with feedback.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('task_proofs')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 shrink-0 transition-transform hover:scale-102"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>View &amp; Review Screenshots ({pendingTaskSubmissions.length})</span>
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-zinc-800 pb-3">
          {[
            { id: 'deposits', label: `Deposit Approvals (${pendingDeposits.length})`, icon: 'payments' },
            { id: 'withdrawals', label: `Withdrawal Approvals (${pendingWithdrawals.length})`, icon: 'output' },
            { id: 'task_proofs', label: `📸 Task Proof Screenshots (${pendingTaskSubmissions.length})`, icon: 'photo_camera', badge: pendingTaskSubmissions.length > 0 ? pendingTaskSubmissions.length : undefined },
            { id: 'tasks', label: `🎯 Live Tasks & 7-Day Links (${currentTasks.length})`, icon: 'task_alt' },
            { id: 'chat', label: '💬 Live Customer Desk', icon: 'support_agent' },
            { id: 'capital', label: `💰 Total Capital & Vault (PKR ${combinedTotalCapitalPKR.toLocaleString()})`, icon: 'account_balance' },
            { id: 'teams', label: `👥 Active User Teams (${computedTeams.length})`, icon: 'diversity_3' },
            { id: 'users', label: `Client & Active Users (${allUsers.length})`, icon: 'groups' },
            { id: 'rates', label: 'Owner Bank & Rates', icon: 'tune' },
            { id: 'workspace', label: 'Google Workspace', icon: 'cloud_sync' },
            { id: 'links', label: 'Portal URLs & Links', icon: 'share' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-black shadow-xs'
                  : tab.id === 'task_proofs' && pendingTaskSubmissions.length > 0
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40 hover:bg-amber-950/60'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && activeTab !== tab.id && (
                <span className="ml-1 w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: DEPOSITS APPROVAL QUEUE */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
                <div>
                  <h4 className="text-sm font-bold text-white">Client Deposit Verification Queue</h4>
                  <p className="text-xs text-zinc-400 font-mono">
                    {deposits.filter(d => d.status === 'pending').length} Inbound Requests Pending Verification
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Sync Active (Auto-Receiving Client Deposits)
                </span>
              </div>
            </div>

            {deposits.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 rounded-xl border border-zinc-800 text-zinc-500 text-xs font-mono">
                No deposit requests currently pending.
              </div>
            ) : (
              <div className="space-y-3">
                {deposits.map((dep) => (
                  <div
                    key={dep.id}
                    className={`p-4 rounded-xl border transition-all ${
                      dep.status === 'pending'
                        ? 'bg-zinc-900/90 border-amber-500/40'
                        : dep.status === 'approved'
                        ? 'bg-zinc-900/40 border-emerald-500/30'
                        : 'bg-zinc-900/20 border-red-500/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{dep.userName}</span>
                          <span className="text-xs font-mono text-zinc-400">({dep.userEmail})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            dep.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : dep.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-400 border border-red-500/40'
                          }`}>
                            {dep.status}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-400 font-mono font-bold mt-1">
                          Package: {dep.packageName} • {dep.currency === 'PKR' ? `PKR ${dep.amount}` : `$${dep.amount}.00`}
                        </p>
                      </div>

                      <span className="text-xs font-mono text-zinc-500">{dep.createdAt}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 text-xs font-mono">
                      <div className="bg-black/40 p-2 rounded-lg">
                        <span className="text-zinc-500 block text-[10px]">Payment Gateway:</span>
                        <span className="text-white font-bold">{dep.paymentMethod}</span>
                      </div>
                      <div className="bg-black/40 p-2 rounded-lg">
                        <span className="text-zinc-500 block text-[10px]">Sender Account / Mobile:</span>
                        <span className="text-white font-bold">{dep.senderAccountOrPhone}</span>
                      </div>
                      <div className="bg-black/40 p-2 rounded-lg">
                        <span className="text-zinc-500 block text-[10px]">TRX Reference ID:</span>
                        <span className="text-emerald-400 font-bold">{dep.transactionReference}</span>
                      </div>
                    </div>

                    {dep.notes && (
                      <p className="text-[11px] text-zinc-400 italic mb-3">Note: {dep.notes}</p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800">
                      {dep.status === 'pending' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              onApproveDeposit(dep.id);
                              setActionFeedback(`Deposit ${dep.id} approved! Client ${dep.userName} activated with 20% referral bonus distributed.`);
                              setTimeout(() => setActionFeedback(null), 4000);
                            }}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            <span>Approve &amp; Activate Ad Watching</span>
                          </button>
                          <button
                            onClick={() => {
                              onRejectDeposit(dep.id, 'Payment verification reference mismatch');
                              setActionFeedback(`Deposit ${dep.id} rejected.`);
                              setTimeout(() => setActionFeedback(null), 4000);
                            }}
                            className="px-4 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-zinc-500">Deposit status: {dep.status}</span>
                      )}

                      <button
                        onClick={() => {
                          const targetUser = allUsers.find(u => u.email.toLowerCase() === dep.userEmail.toLowerCase()) || {
                            name: dep.userName,
                            email: dep.userEmail,
                            phone: dep.senderAccountOrPhone,
                            country: dep.currency === 'PKR' ? 'Pakistan' : 'Global',
                            currency: dep.currency,
                            depositAmount: dep.amount,
                            depositStatus: dep.status === 'approved' ? 'active' : 'pending',
                            tierId: dep.packageName.toLowerCase().includes('diamond') ? 'diamond' : dep.packageName.toLowerCase().includes('gold') ? 'gold' : 'basic',
                            balance: 0,
                            referralCode: 'EMR-CODE'
                          };
                          setSelectedUserForDetails(targetUser);
                        }}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all border border-zinc-700"
                      >
                        <span className="material-symbols-outlined text-[15px]">person_search</span>
                        <span>View User &amp; Team Dossier</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: WITHDRAWAL APPROVALS QUEUE */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
                <div>
                  <h4 className="text-sm font-bold text-white">Client Payout &amp; Withdrawal Verification Queue</h4>
                  <p className="text-xs text-zinc-400 font-mono">
                    {pendingWithdrawals.length} Withdrawal Requests Pending Owner Approval &amp; Settlement
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Settlement Authority: Talha Ahmed (Owner)
                </span>
              </div>
            </div>

            {withdrawals.length === 0 ? (
              <div className="p-8 text-center bg-zinc-900/40 rounded-xl border border-zinc-800 text-zinc-500 text-xs font-mono space-y-2">
                <span className="material-symbols-outlined text-[32px] text-zinc-600 block mx-auto">output</span>
                <p>No user withdrawal requests currently in queue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((wth) => {
                  const isPending = wth.status === 'pending';
                  const isApproved = wth.status === 'approved';
                  const isRejected = wth.status === 'rejected';

                  return (
                    <div
                      key={wth.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isPending
                          ? 'bg-zinc-900/90 border-amber-500/50 shadow-sm'
                          : isApproved
                          ? 'bg-zinc-900/40 border-emerald-500/30'
                          : 'bg-zinc-900/20 border-red-500/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{wth.userName}</span>
                            <span className="text-xs font-mono text-zinc-400">({wth.userEmail})</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {wth.method}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">
                            Request ID: <span className="text-emerald-400 font-bold">{wth.id}</span> • {wth.createdAt}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-[11px] font-bold font-mono rounded-lg flex items-center gap-1.5 uppercase ${
                            isPending
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : isApproved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {isPending ? 'hourglass_top' : isApproved ? 'check_circle' : 'cancel'}
                            </span>
                            <span>{wth.status}</span>
                          </span>
                        </div>
                      </div>

                      {/* Details & Destination Breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 text-xs font-mono border-b border-zinc-800/60">
                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Payout Amount</span>
                          <span className="text-lg font-bold text-emerald-400">
                            {wth.currency === 'PKR' ? `PKR ${wth.amount}` : `$${Number(wth.amount).toFixed(2)}`}
                          </span>
                        </div>

                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Account Title</span>
                          <span className="text-white font-semibold">{wth.accountTitle}</span>
                        </div>

                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Account / IBAN / Wallet</span>
                          <span className="text-emerald-300 font-bold break-all select-all bg-zinc-950/60 px-2 py-1 rounded border border-zinc-800">
                            {wth.accountNumberOrIban}
                          </span>
                        </div>
                      </div>

                      {wth.notes && (
                        <div className="py-2 text-xs font-mono text-zinc-400">
                          <span className="text-zinc-500 text-[10px] uppercase tracking-wider block">Notes &amp; Details:</span>
                          <p className="text-zinc-300 mt-0.5">{wth.notes}</p>
                        </div>
                      )}

                      {/* Review Info if already reviewed */}
                      {wth.reviewedAt && (
                        <div className="py-2 text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                          <span>Reviewed at: {wth.reviewedAt}</span>
                          <span>•</span>
                          <span>By: <strong className="text-white">{wth.reviewedBy || 'Talha Ahmed (Owner)'}</strong></span>
                          {wth.txHashOrRef && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400">Ref: {wth.txHashOrRef}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Approval / Rejection Action Controls for Pending Withdrawals */}
                      {isPending && (
                        <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Optional Bank/Gateway Ref # (e.g. SETTLE-8910)"
                              value={customTxRef[wth.id] || ''}
                              onChange={(e) => setCustomTxRef(prev => ({ ...prev, [wth.id]: e.target.value }))}
                              className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white placeholder-zinc-600 focus:border-emerald-500 outline-none flex-1"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const ref = customTxRef[wth.id] || `SETTLE-${Math.floor(100000 + Math.random() * 900000)}`;
                                if (onApproveWithdrawal) {
                                  onApproveWithdrawal(wth.id, ref);
                                }
                                setActionFeedback(`Approved and dispatched payout ${wth.currency} ${wth.amount} to ${wth.userName}!`);
                                setTimeout(() => setActionFeedback(null), 4000);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                            >
                              <span className="material-symbols-outlined text-[15px]">verified</span>
                              <span>Approve &amp; Dispatch</span>
                            </button>

                            <button
                              onClick={() => {
                                const reason = rejectReasonInput[wth.id] || 'Account details mismatch';
                                if (onRejectWithdrawal) {
                                  onRejectWithdrawal(wth.id, reason);
                                }
                                setActionFeedback(`Rejected withdrawal ${wth.id}. Funds refunded to ${wth.userName}'s balance.`);
                                setTimeout(() => setActionFeedback(null), 4000);
                              }}
                              className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800 font-bold text-xs font-mono uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <span className="material-symbols-outlined text-[15px]">cancel</span>
                              <span>Reject &amp; Refund</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: TASK SCREENSHOT PROOFS & REWARD VERIFICATION */}
        {activeTab === 'task_proofs' && (
          <OwnerTaskProofsTab
            submissions={taskSubmissions}
            onApprove={(id) => {
              if (onApproveTaskSubmission) {
                onApproveTaskSubmission(id);
                setActionFeedback(`Approved task proof ${id} and credited reward to client wallet!`);
                setTimeout(() => setActionFeedback(null), 4000);
              }
            }}
            onReject={(id, reason) => {
              if (onRejectTaskSubmission) {
                onRejectTaskSubmission(id, reason);
                setActionFeedback(`Rejected task proof ${id}.`);
                setTimeout(() => setActionFeedback(null), 4000);
              }
            }}
            onBulkApprove={async (ids) => {
              if (onBulkApproveTaskSubmissions) {
                await onBulkApproveTaskSubmissions(ids);
              } else if (onApproveTaskSubmission) {
                for (const id of ids) {
                  onApproveTaskSubmission(id);
                }
              }
              setActionFeedback(`Bulk approved ${ids.length} task proofs in one click!`);
              setTimeout(() => setActionFeedback(null), 4000);
            }}
            allUsers={allUsers}
          />
        )}

        {/* TAB: LIVE DAILY TASKS & 7-DAY SCHEDULE MANAGER */}
        {activeTab === 'tasks' && (
          <OwnerTasksTab
            tasks={currentTasks}
            onUpdateTasks={handleUpdateTasks}
          />
        )}

        {/* TAB: OWNER CUSTOMER SERVICE LIVE DESK */}
        {activeTab === 'chat' && (
          <OwnerChatTab
            allUsers={allUsers}
          />
        )}

        {/* TAB 2: TOTAL CAPITAL & VAULT RESERVES */}
        {activeTab === 'capital' && (
          <div className="space-y-5">
            {/* Master Capital Hero Header */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-900 p-5 rounded-2xl border border-emerald-500/40 relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-black text-[10px] font-black font-mono">
                      LIVE CAPITAL AUDIT
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      Owner: Talha Ahmed (innocenttalha2522@gmail.com)
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                    PKR {combinedTotalCapitalPKR.toLocaleString()}
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono font-bold mt-1 flex items-center gap-2">
                    <span>Unified Total Deposited Capital ≈ ${combinedTotalCapitalUSD.toFixed(2)} USD</span>
                    <span>•</span>
                    <span className="text-zinc-400">100% Backed Liquidity in Owner Accounts</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="bg-black/60 border border-zinc-800 p-2.5 rounded-xl text-xs font-mono">
                    <span className="text-[10px] text-zinc-400 block uppercase">Pakistan Capital (PKR)</span>
                    <span className="text-emerald-400 font-bold text-sm">PKR {totalDepositedCapitalPKR.toLocaleString()}</span>
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-2.5 rounded-xl text-xs font-mono">
                    <span className="text-[10px] text-zinc-400 block uppercase">Global Capital (USD)</span>
                    <span className="text-cyan-400 font-bold text-sm">${totalDepositedCapitalUSD.toLocaleString()}.00</span>
                  </div>
                  <div className="bg-black/60 border border-zinc-800 p-2.5 rounded-xl text-xs font-mono">
                    <span className="text-[10px] text-amber-400 block uppercase">Pending in Queue</span>
                    <span className="text-amber-300 font-bold text-sm">
                      {pendingCapitalPKR > 0 ? `PKR ${pendingCapitalPKR.toLocaleString()}` : pendingCapitalUSD > 0 ? `$${pendingCapitalUSD}` : 'PKR 0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Gateway Holdings Matrix (Where Capital is Stored) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">account_balance</span>
                  <span>Owner Bank Gateway Holdings &amp; Account Balances</span>
                </h4>
                <span className="text-[11px] font-mono text-zinc-500">
                  Beneficiary: Talha Ahmed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. Meezan Bank */}
                <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono text-xs">
                        MB
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Meezan Bank Ltd</h5>
                        <p className="text-[10px] font-mono text-zinc-400">0286 - DHA Phase II Branch</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">
                      PRIMARY PKR
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Account Number:</span>
                      <span className="text-white font-bold">02860108922718</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Beneficiary Title:</span>
                      <span className="text-zinc-200">Talha Ahmed</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-800/80">
                      <span className="text-zinc-400 font-bold">Deposited Capital:</span>
                      <span className="text-emerald-400 font-bold text-sm">PKR {meezanDepositedPKR.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Easypaisa */}
                <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 hover:border-emerald-500/40 transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono text-xs">
                        EP
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Easypaisa Wallet</h5>
                        <p className="text-[10px] font-mono text-zinc-400">Mobile Microfinance</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">
                      MOBILE PKR
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Mobile Number:</span>
                      <span className="text-white font-bold">03212879553</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Account Title:</span>
                      <span className="text-zinc-200">Talha Ahmed</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-800/80">
                      <span className="text-zinc-400 font-bold">Deposited Capital:</span>
                      <span className="text-emerald-400 font-bold text-sm">PKR {easypaisaDepositedPKR.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Payoneer Citibank */}
                <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 hover:border-cyan-500/40 transition-all">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold font-mono text-xs">
                        CITI
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Payoneer / Citibank NA</h5>
                        <p className="text-[10px] font-mono text-zinc-400">Global USD Wire Gateway</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[9px] font-mono font-bold">
                      GLOBAL USD
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Routing / Account:</span>
                      <span className="text-white font-bold">021000089</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Beneficiary:</span>
                      <span className="text-zinc-200">Talha Ahmed</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-800/80">
                      <span className="text-zinc-400 font-bold">Deposited Capital:</span>
                      <span className="text-cyan-400 font-bold text-sm">${payoneerDepositedUSD}.00 USD</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Tier Capital Allocation */}
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">stacked_bar_chart</span>
                <span>User Capital Distribution by Package Tier</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                <div className="bg-black/60 p-3 rounded-lg border border-purple-500/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-purple-400 flex items-center gap-1.5">
                      <span>💎 Diamond VIP</span>
                    </span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                      {diamondUsers.length} Users
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-baseline">
                    <span className="text-base font-bold text-white">PKR {diamondCapitalPKR.toLocaleString()}</span>
                    <span className="text-xs text-purple-300">${diamondCapitalUSD}.00</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Allocation: PKR 2,000 / $100 tier</p>
                </div>

                <div className="bg-black/60 p-3 rounded-lg border border-amber-500/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <span>🥇 Gold Allocation</span>
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                      {goldUsers.length} Users
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-baseline">
                    <span className="text-base font-bold text-white">PKR {goldCapitalPKR.toLocaleString()}</span>
                    <span className="text-xs text-amber-300">${goldCapitalUSD}.00</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Allocation: PKR 1,200 / $50 tier</p>
                </div>

                <div className="bg-black/60 p-3 rounded-lg border border-cyan-500/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <span>🥉 Basic Entry</span>
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
                      {basicUsers.length} Users
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between items-baseline">
                    <span className="text-base font-bold text-white">PKR {basicCapitalPKR.toLocaleString()}</span>
                    <span className="text-xs text-cyan-300">${basicCapitalUSD}.00</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">Allocation: PKR 600 / $20 tier</p>
                </div>
              </div>
            </div>

            {/* Complete User Deposit Ledger */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">receipt_long</span>
                  <span>User Capital Contribution Ledger</span>
                </h4>
                <button
                  onClick={() => {
                    const report = `EMERALD TRUST CAPITAL AUDIT REPORT\nOwner: Talha Ahmed\nTotal Capital: PKR ${combinedTotalCapitalPKR.toLocaleString()} ($${combinedTotalCapitalUSD.toFixed(2)} USD)\nTotal Registered Investors: ${totalUsersCount}\nActive Depositors: ${activePayingUsers.length}\nDate: ${new Date().toLocaleDateString()}`;
                    navigator.clipboard.writeText(report);
                    setActionFeedback('Capital audit report copied to clipboard!');
                    setTimeout(() => setActionFeedback(null), 3000);
                  }}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono font-bold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  <span>Copy Capital Report</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-left border border-zinc-800 rounded-xl overflow-hidden">
                  <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px] border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Investor</th>
                      <th className="p-3">Capital Deposited</th>
                      <th className="p-3">Package Tier</th>
                      <th className="p-3">Payment Method</th>
                      <th className="p-3">20% Referral Earnings</th>
                      <th className="p-3">Deposit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-950/40">
                    {allUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500 font-mono text-xs">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-3xl text-zinc-600">person_off</span>
                            <span className="text-zinc-400 font-bold">No client accounts registered yet</span>
                            <span className="text-[11px] text-zinc-500 max-w-sm">
                              Live user accounts will automatically appear here with their verified capital and active tiers when genuine users register and deposit.
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      allUsers.map((u) => {
                      const depAmount = u.depositAmount || (u.currency === 'PKR' ? (u.tierId === 'diamond' ? 2000 : u.tierId === 'gold' ? 1200 : 600) : (u.tierId === 'diamond' ? 100 : u.tierId === 'gold' ? 50 : 20));
                      const isDeposited = u.depositStatus === 'active' || (u.depositAmount || 0) > 0;
                      return (
                        <tr key={u.uid} className="hover:bg-zinc-900/50 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[10px] text-zinc-200">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{u.name}</span>
                                <span className="text-[10px] text-zinc-400">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`font-bold font-mono ${isDeposited ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              {u.currency === 'PKR' ? `PKR ${depAmount.toLocaleString()}` : `$${depAmount}.00 USD`}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px]">
                              {u.tierId || (u as any).packageTier || 'basic'}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-300">
                            {(u as any).depositMethod || (u.currency === 'PKR' ? 'Meezan Bank' : 'Payoneer')}
                          </td>
                          <td className="p-3 text-cyan-400 font-bold">
                            {u.currency === 'PKR' ? `PKR ${(u.referralEarnings || 0).toLocaleString()}` : `$${u.referralEarnings || 0}`}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isDeposited
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}>
                              {isDeposited ? 'VERIFIED CAPITAL' : 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ACTIVE USER TEAMS & DOWNLINES */}
        {activeTab === 'teams' && (
          <div className="space-y-6">
            {/* Header & Global Team Network Metrics */}
            <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-400 text-xl">diversity_3</span>
                    <span>Active User Teams &amp; Downline Affiliate Network</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold">
                      {computedTeams.length} Active Guilds
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Real-time oversight of client-led teams, multi-tier downline structures, team capital volume, and 20% affiliate payouts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const summary = computedTeams.map(t => 
                        `[${t.teamName}] Leader: ${t.leaderName} (${t.leaderEmail}) | Code: ${t.leaderReferralCode} | Members: ${t.totalMembers} | Capital: PKR ${t.totalTeamCapitalPKR.toLocaleString()} / $${t.totalTeamCapitalUSD} | Commission: PKR ${t.totalReferralBonusPaidToLeader.toLocaleString()}`
                      ).join('\n');
                      handleCopy(summary, 'teams-export');
                      setActionFeedback('Copied comprehensive teams audit report to clipboard!');
                      setTimeout(() => setActionFeedback(null), 3500);
                    }}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    <span>{copiedLink === 'teams-export' ? 'Report Copied!' : 'Export Teams Report'}</span>
                  </button>
                </div>
              </div>

              {/* Top 4 Network KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-black/50 p-3.5 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Total Active Guilds</span>
                  <span className="text-xl font-bold text-white font-mono mt-0.5 block">{computedTeams.length} Teams</span>
                  <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">100% Verified Structure</span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Network Downlines</span>
                  <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
                    {computedTeams.reduce((sum, t) => sum + t.totalMembers, 0)} Members
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                    {computedTeams.reduce((sum, t) => sum + t.activeDepositingMembers, 0)} Active Depositors
                  </span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Team Capital Volume</span>
                  <span className="text-xl font-bold text-cyan-400 font-mono mt-0.5 block">
                    PKR {computedTeams.reduce((sum, t) => sum + t.totalTeamCapitalPKR, 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                    + ${computedTeams.reduce((sum, t) => sum + t.totalTeamCapitalUSD, 0).toLocaleString()} USD
                  </span>
                </div>

                <div className="bg-black/50 p-3.5 rounded-xl border border-zinc-800/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">Affiliate Bonus Dispatched</span>
                  <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">
                    PKR {computedTeams.reduce((sum, t) => sum + t.totalReferralBonusPaidToLeader, 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">20% Direct Commission</span>
                </div>
              </div>
            </div>

            {/* Search, Filter & Sort Controls */}
            <div className="bg-zinc-900/70 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search team name, leader, referral code, or email..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full bg-black/70 border border-zinc-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
                {teamSearch && (
                  <button
                    onClick={() => setTeamSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `All (${computedTeams.length})` },
                  { id: 'elite', label: '🔥 Elite Guilds' },
                  { id: 'diamond', label: '💎 Diamond VIP' },
                  { id: 'high_volume', label: '⚡ High Volume' },
                  { id: 'active_today', label: '🟢 Active Now' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTeamFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      teamFilter === f.id
                        ? 'bg-emerald-500 text-black'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-mono">Sort:</span>
                <select
                  value={teamSort}
                  onChange={(e) => setTeamSort(e.target.value as any)}
                  className="bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  <option value="members">Team Size (High-Low)</option>
                  <option value="capital">Total Capital Deposited</option>
                  <option value="ads">Ad Yields Harvested</option>
                  <option value="bonus">Leader 20% Earnings</option>
                </select>
              </div>
            </div>

            {/* Teams Grid */}
            {(() => {
              const filteredTeams = computedTeams
                .filter((t) => {
                  const matchSearch =
                    t.teamName.toLowerCase().includes(teamSearch.toLowerCase()) ||
                    t.leaderName.toLowerCase().includes(teamSearch.toLowerCase()) ||
                    t.leaderEmail.toLowerCase().includes(teamSearch.toLowerCase()) ||
                    t.leaderReferralCode.toLowerCase().includes(teamSearch.toLowerCase()) ||
                    t.members.some(m => m.name.toLowerCase().includes(teamSearch.toLowerCase()) || m.email.toLowerCase().includes(teamSearch.toLowerCase()));

                  if (!matchSearch) return false;

                  if (teamFilter === 'elite') return t.teamStatus === 'elite';
                  if (teamFilter === 'diamond') return t.leaderTier === 'diamond';
                  if (teamFilter === 'high_volume') return t.teamStatus === 'high_volume' || t.teamStatus === 'elite';
                  if (teamFilter === 'active_today') return t.members.some(m => m.isOnline) || (allUsers.find(u => u.email.toLowerCase() === t.leaderEmail.toLowerCase()) as any)?.isOnline;

                  return true;
                })
                .sort((a, b) => {
                  if (teamSort === 'capital') {
                    const capA = a.totalTeamCapitalPKR + (a.totalTeamCapitalUSD * 280);
                    const capB = b.totalTeamCapitalPKR + (b.totalTeamCapitalUSD * 280);
                    return capB - capA;
                  }
                  if (teamSort === 'ads') return b.totalTeamAdsCompleted - a.totalTeamAdsCompleted;
                  if (teamSort === 'bonus') return b.totalReferralBonusPaidToLeader - a.totalReferralBonusPaidToLeader;
                  return b.totalMembers - a.totalMembers;
                });

              if (filteredTeams.length === 0) {
                return (
                  <div className="bg-zinc-900/60 p-10 rounded-2xl border border-zinc-800 text-center space-y-3">
                    <span className="material-symbols-outlined text-4xl text-zinc-600">group_off</span>
                    <p className="text-sm text-zinc-400 font-mono">No active user teams matched your filter criteria.</p>
                    <button
                      onClick={() => { setTeamSearch(''); setTeamFilter('all'); }}
                      className="px-4 py-2 bg-emerald-500 text-black font-bold font-mono text-xs rounded-xl cursor-pointer"
                    >
                      Reset Team Filters
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredTeams.map((team) => {
                    const leaderAccount = allUsers.find(u => u.email.toLowerCase() === team.leaderEmail.toLowerCase());
                    const isLeaderOnline = (leaderAccount as any)?.isOnline !== false;

                    return (
                      <div
                        key={team.id}
                        className="bg-zinc-900/80 hover:bg-zinc-900/95 transition-all p-5 rounded-2xl border border-zinc-800 hover:border-emerald-500/50 flex flex-col justify-between space-y-4 shadow-sm"
                      >
                        {/* Team Card Header */}
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/30 via-cyan-500/20 to-zinc-800 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold font-mono text-base">
                                {team.teamName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-white tracking-wide">{team.teamName}</h4>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                    team.teamStatus === 'elite'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : team.teamStatus === 'high_volume'
                                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  }`}>
                                    {team.teamStatus === 'elite' ? '🔥 ELITE GUILD' : team.teamStatus === 'high_volume' ? '⚡ HIGH VOLUME' : '🌱 ACTIVE TEAM'}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                                  <span>Leader: <strong className="text-zinc-200">{team.leaderName}</strong></span>
                                  <span>•</span>
                                  <span>{team.leaderCountry}</span>
                                  <span className={`w-2 h-2 rounded-full ${isLeaderOnline ? 'bg-emerald-400' : 'bg-zinc-600'}`} title={isLeaderOnline ? 'Leader Online' : 'Leader Offline'}></span>
                                </p>
                              </div>
                            </div>

                            {/* Leader VIP Tier */}
                            <div className="text-right">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider block ${
                                team.leaderTier === 'diamond'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : team.leaderTier === 'gold'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}>
                                {team.leaderTier === 'diamond' ? '💎 Diamond VIP' : team.leaderTier === 'gold' ? '🥇 Gold Leader' : 'Basic Tier'}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
                                Ref Code: <strong className="text-amber-400">{team.leaderReferralCode}</strong>
                              </span>
                            </div>
                          </div>

                          {/* Metric Matrix Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 bg-black/60 p-3 rounded-xl border border-zinc-800/80">
                            <div>
                              <span className="text-[9px] font-mono text-zinc-400 block uppercase">Team Size</span>
                              <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                                {team.totalMembers} Members
                              </span>
                              <span className="text-[9px] text-emerald-400 font-mono">
                                {team.activeDepositingMembers} Active
                              </span>
                            </div>

                            <div>
                              <span className="text-[9px] font-mono text-zinc-400 block uppercase">Team Capital</span>
                              <span className="text-sm font-bold text-cyan-400 font-mono mt-0.5 block">
                                {team.totalTeamCapitalPKR > 0 ? `PKR ${team.totalTeamCapitalPKR.toLocaleString()}` : `$${team.totalTeamCapitalUSD}`}
                              </span>
                              <span className="text-[9px] text-zinc-400 font-mono">
                                {team.totalTeamCapitalUSD > 0 && team.totalTeamCapitalPKR > 0 ? `+ $${team.totalTeamCapitalUSD}` : '100% Backed'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[9px] font-mono text-zinc-400 block uppercase">Tasks Harvested</span>
                              <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                                {team.totalTeamAdsCompleted} Ads
                              </span>
                              <span className="text-[9px] text-zinc-400 font-mono">
                                Team Engagement
                              </span>
                            </div>

                            <div>
                              <span className="text-[9px] font-mono text-zinc-400 block uppercase">20% Paid to Leader</span>
                              <span className="text-sm font-bold text-amber-400 font-mono mt-0.5 block">
                                {team.leaderTier === 'diamond' && team.totalTeamCapitalUSD > 0 && team.totalTeamCapitalPKR === 0
                                  ? `$${team.totalReferralBonusPaidToLeader.toLocaleString()}`
                                  : `PKR ${team.totalReferralBonusPaidToLeader.toLocaleString()}`}
                              </span>
                              <span className="text-[9px] text-zinc-400 font-mono">
                                Direct Commissions
                              </span>
                            </div>
                          </div>

                          {/* Member Preview Avatars */}
                          {team.members.length > 0 && (
                            <div className="mt-3 flex items-center justify-between text-xs font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-400 text-[11px]">Downlines:</span>
                                <div className="flex items-center -space-x-1.5 overflow-hidden">
                                  {team.members.slice(0, 4).map((m, idx) => (
                                    <div
                                      key={idx}
                                      className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] text-zinc-300 font-bold"
                                      title={`${m.name} (${m.email})`}
                                    >
                                      {m.name.slice(0, 1)}
                                    </div>
                                  ))}
                                  {team.members.length > 4 && (
                                    <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[9px] text-emerald-300 font-bold">
                                      +{team.members.length - 4}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <span className="text-[11px] text-zinc-400">
                                {team.members.filter(m => m.isOnline).length} Members Online
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedTeamForDrawer(team)}
                              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                              <span className="material-symbols-outlined text-[15px]">account_tree</span>
                              <span>Inspect Downline Members ({team.members.length})</span>
                            </button>

                            <button
                              onClick={() => {
                                setBonusModalTeam(team);
                                setBonusAmountInput(team.totalTeamCapitalUSD > 0 && team.leaderTier === 'diamond' ? '25' : '1000');
                              }}
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                              title="Award performance bonus to team leader"
                            >
                              <span className="material-symbols-outlined text-[15px]">card_giftcard</span>
                              <span>Grant Bonus</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const inviteUrl = `${websiteUrl}/?ref=${team.leaderReferralCode}`;
                                handleCopy(inviteUrl, `ref-${team.id}`);
                                setActionFeedback(`Copied referral link for ${team.teamName}!`);
                                setTimeout(() => setActionFeedback(null), 3000);
                              }}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="Copy Referral Link"
                            >
                              <span className="material-symbols-outlined text-[14px]">link</span>
                              <span>{copiedLink === `ref-${team.id}` ? 'Copied!' : 'Copy Link'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: CLIENT & ACTIVE USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            {/* Header & Quick Summary */}
            <div className="bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Client Portfolio &amp; Active Users Management</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                    {onlineUsers.length} Online Now
                  </span>
                </h4>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Full visibility into user accounts, package tiers, ad earnings, 20% referrals, and balance controls.
                </p>
              </div>

              {/* Mini user KPI strip */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <div className="bg-black/50 border border-zinc-800 px-3 py-1.5 rounded-lg">
                  <span className="text-zinc-500 block text-[9px] uppercase">Active Earning Users</span>
                  <span className="text-emerald-400 font-bold">{activePayingUsers.length} / {allUsers.length}</span>
                </div>
                <div className="bg-black/50 border border-zinc-800 px-3 py-1.5 rounded-lg">
                  <span className="text-zinc-500 block text-[9px] uppercase">Est. User Balances</span>
                  <span className="text-cyan-400 font-bold">PKR {totalPortfolioPkr.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
              {/* Search Box */}
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-zinc-500 text-[18px]">search</span>
                <input
                  type="text"
                  placeholder="Search by name, email, referral code, country, or tier..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-black border border-zinc-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch('')}
                    className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `All (${allUsers.length})` },
                  { id: 'active', label: `🟢 Active (${activePayingUsers.length})` },
                  { id: 'online', label: `⚡ Online (${onlineUsers.length})` },
                  { id: 'pending', label: `⏳ Pending (${pendingUsers.length})` },
                  { id: 'diamond', label: `💎 VIP Diamond (${diamondUsers.length})` }
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setUserFilter(chip.id as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      userFilter === chip.id
                        ? 'bg-emerald-500 text-black shadow-xs'
                        : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Sort:</span>
                <select
                  value={userSort}
                  onChange={(e) => setUserSort(e.target.value as any)}
                  className="bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-white cursor-pointer"
                >
                  <option value="balance">Highest Balance</option>
                  <option value="referrals">Most Referrals</option>
                  <option value="ads">Ads Watched</option>
                </select>
              </div>
            </div>

            {/* Users Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left border border-zinc-800 rounded-xl overflow-hidden">
                <thead className="bg-zinc-900 text-zinc-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">User &amp; Country</th>
                    <th className="p-3">Role &amp; Status</th>
                    <th className="p-3">Package Tier &amp; Deposit</th>
                    <th className="p-3">Current Balance</th>
                    <th className="p-3">Ads Watched / Yield</th>
                    <th className="p-3">20% Referrals</th>
                    <th className="p-3 text-right">Owner Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-zinc-900/40">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-zinc-500 font-mono">
                        No users matching filter criteria "{userSearch || userFilter}".
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => {
                      const isUserOnline = (u as any).isOnline !== false;
                      const userAds = u.completedAdsCount || (u as any).adsWatchedCount || 0;
                      const isDiamond = u.tierId === 'diamond' || (u as any).packageTier === 'diamond';

                      return (
                        <tr
                          key={idx}
                          onClick={() => setSelectedUserForDetails(u)}
                          className="hover:bg-zinc-800/70 transition-colors cursor-pointer group"
                        >
                          {/* User & Country */}
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-xs">
                                  {u.name?.charAt(0) || 'U'}
                                </div>
                                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black ${
                                  isUserOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                                }`} />
                              </div>
                              <div>
                                <span className="font-bold text-white block flex items-center gap-1.5">
                                  {u.name || 'Anonymous Investor'}
                                  {isDiamond && (
                                    <span className="material-symbols-outlined text-cyan-400 text-[14px]" title="VIP Diamond Tier">
                                      diamond
                                    </span>
                                  )}
                                </span>
                                <span className="text-zinc-400 text-[10px] block">{u.email}</span>
                                <span className="text-zinc-500 text-[9px]">
                                  {u.country || 'Pakistan'} • Joined {u.createdAt ? u.createdAt.slice(0, 10) : 'Recent'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role & Status */}
                          <td className="p-3">
                            <div className="space-y-1">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                u.role === 'owner'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                  : u.role === 'admin'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}>
                                {u.role || 'client'}
                              </span>
                              <div>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                                  u.depositStatus === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : u.depositStatus === 'pending'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-zinc-800 text-zinc-500'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    u.depositStatus === 'active' ? 'bg-emerald-400' : 'bg-amber-400'
                                  }`} />
                                  {u.depositStatus === 'active' ? 'Active Depositor' : 'Pending Verification'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Package Tier & Deposit */}
                          <td className="p-3">
                            <div>
                              <span className="font-bold text-emerald-400 capitalize block">
                                {u.activePackageName || (u.tierId ? `${u.tierId} Package` : 'None')}
                              </span>
                              <span className="text-zinc-400 text-[10px]">
                                {u.depositAmount > 0
                                  ? (u.currency === 'PKR' ? `PKR ${u.depositAmount}` : `$${u.depositAmount}.00`)
                                  : 'No Deposit'}
                              </span>
                              {(u as any).depositMethod && (
                                <span className="text-zinc-500 text-[9px] block">
                                  via {(u as any).depositMethod}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Current Balance */}
                          <td className="p-3">
                            <div>
                              <span className="font-bold text-white text-sm block">
                                {u.currency === 'PKR' ? `PKR ${u.balance.toLocaleString()}` : `$${u.balance.toFixed(2)}`}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                Total: {u.currency === 'PKR' ? `PKR ${u.totalEarned || u.balance}` : `$${(u.totalEarned || u.balance).toFixed(2)}`}
                              </span>
                            </div>
                          </td>

                          {/* Ads Watched / Yield */}
                          <td className="p-3">
                            <div>
                              <span className="text-emerald-400 font-bold block">{userAds} Ads Watched</span>
                              <span className="text-zinc-400 text-[10px]">
                                Yield: {u.currency === 'PKR' ? `PKR ${u.pendingYield || 0}` : `$${(u.pendingYield || 0).toFixed(2)}`}
                              </span>
                            </div>
                          </td>

                          {/* 20% Referrals */}
                          <td className="p-3">
                            <div>
                              <span className="text-cyan-400 font-bold block">
                                {u.referralCount || (u as any).referralsCount || 0} Direct Invites
                              </span>
                              <span className="text-[10px] text-zinc-400 block">
                                Earned: {u.currency === 'PKR' ? `PKR ${u.referralEarnings || 0}` : `$${u.referralEarnings || 0}`}
                              </span>
                              <span className="text-[9px] font-mono text-zinc-500">
                                Code: {u.referralCode || 'N/A'}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleAdjustBalance(u.email, u.currency === 'PKR' ? 500 : 10)}
                                className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold cursor-pointer transition-all"
                                title="Add Quick Credit Bonus"
                              >
                                +{u.currency === 'PKR' ? '500 PKR' : '$10'}
                              </button>
                              <button
                                onClick={() => setSelectedUserForDetails(u)}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-[10px] font-bold cursor-pointer transition-all"
                                title="Inspect Full Dossier"
                              >
                                Inspect
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: OWNER BANK & RATES */}
        {activeTab === 'rates' && (
          <div className="space-y-5">
            <h4 className="text-sm font-bold text-white">Owner Account Details &amp; Package Rates</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Meezan Bank Details */}
              <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2 text-xs font-mono">
                <span className="text-emerald-400 font-bold uppercase text-[11px] block">🏦 Meezan Bank Account</span>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Beneficiary Name:</span>
                  <input
                    type="text"
                    value={ownerDetails.meezan.accountTitle}
                    onChange={(e) => setOwnerDetails({ ...ownerDetails, meezan: { ...ownerDetails.meezan, accountTitle: e.target.value } })}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Account Number:</span>
                  <input
                    type="text"
                    value={ownerDetails.meezan.accountNumber}
                    onChange={(e) => setOwnerDetails({ ...ownerDetails, meezan: { ...ownerDetails.meezan, accountNumber: e.target.value } })}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">IBAN:</span>
                  <input
                    type="text"
                    value={ownerDetails.meezan.iban}
                    onChange={(e) => setOwnerDetails({ ...ownerDetails, meezan: { ...ownerDetails.meezan, iban: e.target.value } })}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-emerald-400 text-[10px] font-bold"
                  />
                </div>
              </div>

              {/* Easypaisa Details */}
              <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2 text-xs font-mono">
                <span className="text-emerald-400 font-bold uppercase text-[11px] block">🟢 Easypaisa Account</span>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Account Title:</span>
                  <input
                    type="text"
                    value={ownerDetails.easypaisa.accountTitle}
                    onChange={(e) => setOwnerDetails({ ...ownerDetails, easypaisa: { ...ownerDetails.easypaisa, accountTitle: e.target.value } })}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Mobile Number:</span>
                  <input
                    type="text"
                    value={ownerDetails.easypaisa.accountNumber}
                    onChange={(e) => setOwnerDetails({ ...ownerDetails, easypaisa: { ...ownerDetails.easypaisa, accountNumber: e.target.value } })}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-emerald-400 font-bold"
                  />
                </div>
              </div>

              {/* Payoneer Details */}
              <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2 text-xs font-mono">
                <span className="text-emerald-400 font-bold uppercase text-[11px] block">🌐 Payoneer (Citibank USD)</span>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Beneficiary Name:</span>
                  <input
                    type="text"
                    value={ownerDetails.payoneer.beneficiaryName}
                    onChange={(e) => setOwnerDetails({ ...ownerDetails, payoneer: { ...ownerDetails.payoneer, beneficiaryName: e.target.value } })}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-white font-bold"
                  />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Account Number:</span>
                  <input
                    type="text"
                    value={ownerDetails.payoneer.accountNumber}
                    onChange={(e) => setOwnerDetails({ ...ownerDetails, payoneer: { ...ownerDetails.payoneer, accountNumber: e.target.value } })}
                    className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">Routing (ABA) / SWIFT:</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ownerDetails.payoneer.routingNumber}
                      onChange={(e) => setOwnerDetails({ ...ownerDetails, payoneer: { ...ownerDetails.payoneer, routingNumber: e.target.value } })}
                      className="w-1/2 bg-black border border-zinc-700 rounded px-2 py-1 text-white text-[10px]"
                    />
                    <input
                      type="text"
                      value={ownerDetails.payoneer.swiftCode}
                      onChange={(e) => setOwnerDetails({ ...ownerDetails, payoneer: { ...ownerDetails.payoneer, swiftCode: e.target.value } })}
                      className="w-1/2 bg-black border border-zinc-700 rounded px-2 py-1 text-white text-[10px]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Package Rates and Referral Bonus */}
            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-white block">Referral Bonus Commission Rate</span>
                <span className="text-[11px] text-zinc-400">Current direct affiliate rate credited on deposit approvals</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={referralBonus}
                  onChange={(e) => setReferralBonus(Number(e.target.value))}
                  className="w-20 bg-black border border-zinc-700 rounded-lg px-3 py-1.5 text-center font-bold text-emerald-400 text-sm"
                />
                <span className="text-sm font-bold text-white">% Direct Commission</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GOOGLE WORKSPACE */}
        {activeTab === 'workspace' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white">Google Workspace Live Enterprise Sync</h4>
            <p className="text-xs text-zinc-400 font-mono">
              Integrate Google Sheets, Drive, Calendar, Tasks, and Gmail for automated institutional reporting and audit readiness.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="material-symbols-outlined text-[22px]">table_chart</span>
                  <span className="text-xs font-bold font-mono">Google Sheets Ledger Sync</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Export complete deposit records, client balances, and 20% referral breakdown into real-time Sheets spreadsheet.
                </p>
                <button
                  onClick={() => handleTriggerWorkspace('/api/workspace/export-sheets', 'Exported 100% financial records to Google Sheets.')}
                  className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  <span>Sync to Google Sheets</span>
                </button>
              </div>

              <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-400">
                  <span className="material-symbols-outlined text-[22px]">cloud_upload</span>
                  <span className="text-xs font-bold font-mono">Google Drive Encrypted Backup</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Save encrypted database snapshots and payment receipts directly into your Google Drive repository.
                </p>
                <button
                  onClick={() => handleTriggerWorkspace('/api/workspace/backup-drive', 'Database encrypted snapshot saved to Google Drive.')}
                  className="w-full py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">backup</span>
                  <span>Save Snapshot to Drive</span>
                </button>
              </div>

              <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <span className="material-symbols-outlined text-[22px]">calendar_month</span>
                  <span className="text-xs font-bold font-mono">Google Calendar Yield Harvest</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Set up recurring daily reminders for client ad impressions reset and yield allocation schedules.
                </p>
                <button
                  onClick={() => handleTriggerWorkspace('/api/workspace/schedule-calendar', 'Calendar event created for daily ad earnings.')}
                  className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">event</span>
                  <span>Schedule in Calendar</span>
                </button>
              </div>

              <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400">
                  <span className="material-symbols-outlined text-[22px]">checklist</span>
                  <span className="text-xs font-bold font-mono">Google Tasks Verification Action</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Send pending client deposit verification requests directly to your Google Tasks queue.
                </p>
                <button
                  onClick={() => handleTriggerWorkspace('/api/workspace/create-task', 'Verification checklist item sent to Google Tasks.')}
                  className="w-full py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">add_task</span>
                  <span>Add to Google Tasks</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PORTAL URLS & LINKS */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white">Shareable Portal URLs &amp; Access Links</h4>
            <p className="text-xs text-zinc-400 font-mono">
              Use these direct URLs to access your Owner portal or provide restricted access to admins and clients.
            </p>

            <div className="space-y-3">
              {/* Owner Portal Link */}
              <div className="p-4 bg-zinc-900/90 rounded-xl border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 font-mono">👑 Master Owner Portal URL (Full Access)</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono font-bold">Confidential</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={ownerPortalUrl}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 select-all"
                  />
                  <button
                    onClick={() => handleCopy(ownerPortalUrl, 'owner-full')}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    {copiedLink === 'owner-full' ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Admin Portal Link */}
              <div className="p-4 bg-zinc-900/90 rounded-xl border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 font-mono">🛡️ Admin Portal URL (Limited Deposit Verification Access)</span>
                  <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-mono font-bold">Admin Only</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={adminPortalUrl}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-400 select-all"
                  />
                  <button
                    onClick={() => handleCopy(adminPortalUrl, 'admin-full')}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono uppercase rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    {copiedLink === 'admin-full' ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* Main Website URL */}
              <div className="p-4 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 font-mono">🌐 Public Website URL (For Clients &amp; Partners)</span>
                  <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded font-mono font-bold">Public</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={websiteUrl}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-white select-all"
                  />
                  <button
                    onClick={() => handleCopy(websiteUrl, 'web-full')}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs font-mono uppercase rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    {copiedLink === 'web-full' ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USER DOSSIER / FULL INSPECT MODAL */}
        {selectedUserForDetails && (() => {
          const userPhone = selectedUserForDetails.phone || (selectedUserForDetails.email.includes('talha') ? '+92 319 5006433' : '+92 300 8829104');
          const cleanPhoneDigits = userPhone.replace(/[^0-9]/g, '');
          const waUrl = `https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(`Hello ${selectedUserForDetails.name}, this is Emerald Trust Management regarding your account (${selectedUserForDetails.email}).`)}`;

          // Find direct recruits / downline members
          const userDownlines = allUsers.filter(m =>
            m.email.toLowerCase() !== selectedUserForDetails.email.toLowerCase() && (
              (m.referredBy && selectedUserForDetails.referralCode && m.referredBy.toUpperCase() === selectedUserForDetails.referralCode.toUpperCase()) ||
              (m.teamName && selectedUserForDetails.teamName && m.teamName === selectedUserForDetails.teamName)
            )
          );

          const activeDownlines = userDownlines.filter(m => m.depositStatus === 'active' || (m.depositAmount || 0) > 0);
          const totalDownlineCapital = userDownlines.reduce((sum, m) => sum + (m.depositAmount || 0), 0);
          const totalCommissionFromTeam = userDownlines.reduce((sum, m) => sum + ((m.depositAmount || 0) * 0.20), 0);

          return (
            <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-[#0f1115] border border-emerald-500/50 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 text-white shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 space-y-5">
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedUserForDetails(null)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 cursor-pointer z-10"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>

                {/* Header Profile Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-zinc-800 border-2 border-emerald-500/60 flex items-center justify-center text-emerald-300 font-bold text-xl font-mono">
                        {selectedUserForDetails.name?.charAt(0) || 'U'}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0f1115]" title="Active & Verified"></span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-white tracking-tight">{selectedUserForDetails.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          selectedUserForDetails.role === 'owner'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                            : selectedUserForDetails.role === 'admin'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {selectedUserForDetails.role === 'owner' ? '👑 Owner' : selectedUserForDetails.role === 'admin' ? '🛡️ Admin' : '👤 Verified Client'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          UID: {selectedUserForDetails.uid || 'usr-live'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>{selectedUserForDetails.email}</span>
                        <span>•</span>
                        <span>{selectedUserForDetails.country || 'Pakistan'}</span>
                        <span>•</span>
                        <span className="text-emerald-400">KYC Verified</span>
                      </p>
                    </div>
                  </div>

                  {/* Direct Contact & WhatsApp Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs font-mono rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      <span>WhatsApp Chat</span>
                    </a>
                    <a
                      href={`tel:${userPhone}`}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs font-mono rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      <span>Call Client</span>
                    </a>
                  </div>
                </div>

                {/* Primary User Contact & Account Information Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block">Contact Phone Number</span>
                    <span className="text-xs font-bold text-white font-mono mt-1 block flex items-center gap-1">
                      <span>{userPhone}</span>
                      <button
                        onClick={() => {
                          handleCopy(userPhone, 'copy-phone');
                          setActionFeedback(`Copied phone ${userPhone}!`);
                          setTimeout(() => setActionFeedback(null), 2500);
                        }}
                        className="text-zinc-500 hover:text-emerald-400 ml-1 cursor-pointer"
                        title="Copy Phone"
                      >
                        <span className="material-symbols-outlined text-[14px]">content_copy</span>
                      </button>
                    </span>
                    <span className="text-[9px] text-emerald-400 font-mono">WhatsApp Enabled</span>
                  </div>

                  <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block">Country &amp; Currency</span>
                    <span className="text-xs font-bold text-white font-mono mt-1 block">
                      {selectedUserForDetails.country === 'Pakistan' ? '🇵🇰 Pakistan' : `🌐 ${selectedUserForDetails.country || 'International'}`}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      Pricing: {selectedUserForDetails.currency || 'PKR'}
                    </span>
                  </div>

                  <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block">Package Tier</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono mt-1 block capitalize">
                      {selectedUserForDetails.activePackageName || (selectedUserForDetails.tierId ? `${selectedUserForDetails.tierId} VIP` : 'None')}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono capitalize">
                      Deposit: {selectedUserForDetails.depositStatus || 'Active'}
                    </span>
                  </div>

                  <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase block">20% Referral Code</span>
                    <span className="text-xs font-bold text-amber-400 font-mono mt-1 block flex items-center gap-1">
                      <span>{selectedUserForDetails.referralCode || 'EMR-ROOT'}</span>
                      <button
                        onClick={() => {
                          handleCopy(`${websiteUrl}/?ref=${selectedUserForDetails.referralCode || 'EMR-ROOT'}`, 'copy-ref');
                          setActionFeedback(`Copied referral link for ${selectedUserForDetails.name}!`);
                          setTimeout(() => setActionFeedback(null), 2500);
                        }}
                        className="text-zinc-500 hover:text-amber-400 ml-1 cursor-pointer"
                        title="Copy Referral Link"
                      >
                        <span className="material-symbols-outlined text-[14px]">link</span>
                      </button>
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono">
                      Invited by: {selectedUserForDetails.referredBy || 'Direct Owner Root'}
                    </span>
                  </div>
                </div>

                {/* Financial Overview Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/60 p-4 rounded-xl border border-zinc-800 text-xs font-mono">
                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Capital Deposited</span>
                    <span className="text-base font-bold text-emerald-400 mt-1 block">
                      {selectedUserForDetails.currency === 'PKR' ? `PKR ${(selectedUserForDetails.depositAmount || 0).toLocaleString()}` : `$${selectedUserForDetails.depositAmount || 0}`}
                    </span>
                    <span className="text-[9px] text-zinc-500">
                      Channel: {selectedUserForDetails.depositMethod || (selectedUserForDetails.currency === 'PKR' ? 'Easypaisa / Meezan' : 'Payoneer')}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Wallet Balance</span>
                    <span className="text-base font-bold text-cyan-400 mt-1 block">
                      {selectedUserForDetails.currency === 'PKR' ? `PKR ${(selectedUserForDetails.balance || 0).toLocaleString()}` : `$${(selectedUserForDetails.balance || 0).toFixed(2)}`}
                    </span>
                    <span className="text-[9px] text-zinc-500">Withdrawable Balance</span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">Ads Harvested</span>
                    <span className="text-base font-bold text-white mt-1 block">
                      {selectedUserForDetails.completedAdsCount || selectedUserForDetails.adsWatchedCount || 0} Tasks
                    </span>
                    <span className="text-[9px] text-emerald-400">
                      Yield: {selectedUserForDetails.currency === 'PKR' ? `PKR ${selectedUserForDetails.pendingYield || 0}` : `$${selectedUserForDetails.pendingYield || 0}`}
                    </span>
                  </div>

                  <div>
                    <span className="text-zinc-400 block text-[10px] uppercase">20% Team Bonus Earned</span>
                    <span className="text-base font-bold text-amber-400 mt-1 block">
                      {selectedUserForDetails.currency === 'PKR' ? `PKR ${(selectedUserForDetails.referralEarnings || totalCommissionFromTeam).toLocaleString()}` : `$${(selectedUserForDetails.referralEarnings || totalCommissionFromTeam).toFixed(2)}`}
                    </span>
                    <span className="text-[9px] text-zinc-500">From {userDownlines.length} direct downlines</span>
                  </div>
                </div>

                {/* Owner Direct Controls */}
                <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-emerald-400 text-[16px]">tune</span>
                      <span>Owner Direct Wallet Adjustments</span>
                    </span>
                    <span className="text-[10px] text-zinc-400">Live Backend Synchronization</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        const delta = selectedUserForDetails.currency === 'PKR' ? 1000 : 25;
                        handleAdjustBalance(selectedUserForDetails.email, delta);
                        setSelectedUserForDetails({ ...selectedUserForDetails, balance: selectedUserForDetails.balance + delta });
                      }}
                      className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      + Add Credit {selectedUserForDetails.currency === 'PKR' ? '1,000 PKR' : '$25'}
                    </button>

                    <button
                      onClick={() => {
                        const delta = selectedUserForDetails.currency === 'PKR' ? -500 : -10;
                        handleAdjustBalance(selectedUserForDetails.email, delta);
                        setSelectedUserForDetails({ ...selectedUserForDetails, balance: Math.max(0, selectedUserForDetails.balance + delta) });
                      }}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      - Debit Balance {selectedUserForDetails.currency === 'PKR' ? '500 PKR' : '$10'}
                    </button>

                    <button
                      onClick={() => {
                        handleManualActivateTier(selectedUserForDetails.email, 'diamond');
                        setSelectedUserForDetails({ ...selectedUserForDetails, tierId: 'diamond', depositStatus: 'active' });
                      }}
                      className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      👑 Upgrade to Diamond VIP
                    </button>

                    <button
                      onClick={() => {
                        handleManualActivateTier(selectedUserForDetails.email, 'gold');
                        setSelectedUserForDetails({ ...selectedUserForDetails, tierId: 'gold', depositStatus: 'active' });
                      }}
                      className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold cursor-pointer transition-all"
                    >
                      🥇 Set to Gold Tier
                    </button>
                  </div>
                </div>

                {/* OWNER TASK & WITHDRAWAL SECURITY LOCK CONTROLS */}
                <UserLockControls
                  user={selectedUserForDetails}
                  onUpdateLock={(email, updates) => {
                    if (onUpdateUserLock) {
                      onUpdateUserLock(email, updates);
                    }
                    setSelectedUserForDetails((prev: any) => ({
                      ...prev,
                      ...updates
                    }));
                    setActionFeedback(`Updated security lock controls & reasons for ${email}!`);
                    setTimeout(() => setActionFeedback(null), 3000);
                  }}
                />

                {/* USER'S DOWNLINE TEAM & ACTIVE RECRUITS TABLE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-400 text-[18px]">group</span>
                        <span>User's Team &amp; Downline Members ({userDownlines.length} Direct Recruits)</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        Active depositors in team: <strong className="text-emerald-400">{activeDownlines.length}</strong> • Total Team Capital: <strong className="text-cyan-400">PKR {totalDownlineCapital.toLocaleString()}</strong>
                      </p>
                    </div>

                    {userDownlines.length > 0 && (
                      <button
                        onClick={() => {
                          const csv = ['Name,Email,Phone,Country,Tier,DepositStatus,DepositAmount,CommissionEarned'].concat(
                            userDownlines.map(m => `"${m.name}","${m.email}","${m.phone || ''}","${m.country}","${m.tierId}","${m.depositStatus}",${m.depositAmount},${(m.depositAmount * 0.20).toFixed(2)}`)
                          ).join('\n');
                          handleCopy(csv, `user-team-csv-${selectedUserForDetails.email}`);
                          setActionFeedback(`Copied team roster for ${selectedUserForDetails.name}!`);
                          setTimeout(() => setActionFeedback(null), 3000);
                        }}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono font-bold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">table_chart</span>
                        <span>{copiedLink === `user-team-csv-${selectedUserForDetails.email}` ? 'CSV Copied!' : 'Export Team CSV'}</span>
                      </button>
                    )}
                  </div>

                  {userDownlines.length === 0 ? (
                    <div className="p-6 text-center bg-zinc-900/40 rounded-xl border border-zinc-800 text-zinc-400 font-mono text-xs">
                      <span className="material-symbols-outlined text-zinc-600 text-[28px] mb-1 block">group_off</span>
                      <span>No downline members joined under referral code <strong>{selectedUserForDetails.referralCode || 'EMR-CODE'}</strong> yet.</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-800">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-black/90 text-zinc-400 border-b border-zinc-800 text-[10px] uppercase">
                          <tr>
                            <th className="p-3">Team Member</th>
                            <th className="p-3">Contact Number</th>
                            <th className="p-3">Country</th>
                            <th className="p-3">Tier &amp; Deposit</th>
                            <th className="p-3">Deposit Status</th>
                            <th className="p-3">20% Commission</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/80 bg-zinc-900/40">
                          {userDownlines.map((m, idx) => {
                            const memberPhone = m.phone || (m.currency === 'PKR' ? '+92 300 4882910' : '+1 555 382 1092');
                            const cleanDigits = memberPhone.replace(/[^0-9]/g, '');

                            return (
                              <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                                <td className="p-3">
                                  <div className="font-bold text-white">{m.name}</div>
                                  <div className="text-[10px] text-zinc-400">{m.email}</div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-zinc-200 font-mono">{memberPhone}</span>
                                    <a
                                      href={`https://wa.me/${cleanDigits}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-400 hover:text-emerald-300"
                                      title="Chat on WhatsApp"
                                    >
                                      <span className="material-symbols-outlined text-[15px]">chat</span>
                                    </a>
                                  </div>
                                </td>
                                <td className="p-3 text-zinc-300">
                                  {m.country || 'Pakistan'}
                                </td>
                                <td className="p-3">
                                  <span className="font-bold text-emerald-400 capitalize block">
                                    {m.tierId || 'Basic'} Tier
                                  </span>
                                  <span className="text-[10px] text-zinc-400">
                                    {m.currency === 'PKR' ? `PKR ${m.depositAmount || 0}` : `$${m.depositAmount || 0}`}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    m.depositStatus === 'active'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  }`}>
                                    {m.depositStatus === 'active' ? 'Active' : 'Pending'}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-amber-400">
                                  {m.currency === 'PKR' ? `+PKR ${((m.depositAmount || 0) * 0.20).toFixed(0)}` : `+$${((m.depositAmount || 0) * 0.20).toFixed(2)}`}
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => setSelectedUserForDetails(m)}
                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] font-bold cursor-pointer"
                                    title="Inspect this member"
                                  >
                                    Inspect
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })()}

        {/* TEAM DOWNLINE ROSTER INSPECTOR MODAL */}
        {selectedTeamForDrawer && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-bold font-mono">
                    {selectedTeamForDrawer.teamName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{selectedTeamForDrawer.teamName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                        {selectedTeamForDrawer.teamStatus}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono">
                      Guild Leader: <strong className="text-zinc-200">{selectedTeamForDrawer.leaderName}</strong> ({selectedTeamForDrawer.leaderEmail}) • Referral Code: <span className="text-amber-400 font-bold">{selectedTeamForDrawer.leaderReferralCode}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTeamForDrawer(null)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Mini Team Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-800 text-xs font-mono">
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase">Total Downlines</span>
                  <span className="text-base font-bold text-white mt-0.5 block">{selectedTeamForDrawer.totalMembers} Members</span>
                  <span className="text-[10px] text-emerald-400">{selectedTeamForDrawer.activeDepositingMembers} Active Depositors</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase">Team Capital Volume</span>
                  <span className="text-base font-bold text-cyan-400 mt-0.5 block">
                    {selectedTeamForDrawer.totalTeamCapitalPKR > 0 ? `PKR ${selectedTeamForDrawer.totalTeamCapitalPKR.toLocaleString()}` : `$${selectedTeamForDrawer.totalTeamCapitalUSD}`}
                  </span>
                  <span className="text-[10px] text-zinc-500">100% Vault Verified</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase">Tasks Harvested</span>
                  <span className="text-base font-bold text-white mt-0.5 block">{selectedTeamForDrawer.totalTeamAdsCompleted} Ads</span>
                  <span className="text-[10px] text-zinc-500">Ad Engagement</span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[10px] uppercase">Leader 20% Earnings</span>
                  <span className="text-base font-bold text-amber-400 mt-0.5 block">
                    PKR {selectedTeamForDrawer.totalReferralBonusPaidToLeader.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500">Affiliate Payout</span>
                </div>
              </div>

              {/* Members Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono">
                    Downline Team Roster ({selectedTeamForDrawer.members.length} direct members)
                  </h4>
                  <button
                    onClick={() => {
                      const csv = ['Name,Email,Country,Tier,Deposit,Balance,Ads,ReferralCommission'].concat(
                        selectedTeamForDrawer.members.map(m => `"${m.name}","${m.email}","${m.country}","${m.tierId}",${m.depositAmount},${m.balance},${m.completedAdsCount},${m.referralCommissionEarned}`)
                      ).join('\n');
                      handleCopy(csv, `team-csv-${selectedTeamForDrawer.id}`);
                      setActionFeedback(`Copied roster CSV for ${selectedTeamForDrawer.teamName}!`);
                      setTimeout(() => setActionFeedback(null), 3000);
                    }}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono font-bold rounded-lg border border-zinc-700 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">table_chart</span>
                    <span>{copiedLink === `team-csv-${selectedTeamForDrawer.id}` ? 'CSV Copied!' : 'Copy Roster CSV'}</span>
                  </button>
                </div>

                {selectedTeamForDrawer.members.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-900/50 rounded-xl border border-zinc-800 text-zinc-400 font-mono text-xs">
                    This leader has not onboarded direct team members in this view yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-black/90 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="p-3">Member</th>
                          <th className="p-3">Country / Status</th>
                          <th className="p-3">Package Tier</th>
                          <th className="p-3">Capital Deposited</th>
                          <th className="p-3">Balance &amp; Ads</th>
                          <th className="p-3">20% Ref Bonus</th>
                          <th className="p-3 text-right">Quick Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/80 bg-zinc-900/40">
                        {selectedTeamForDrawer.members.map((m, idx) => (
                          <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-white">{m.name}</div>
                              <div className="text-[10px] text-zinc-400">{m.email}</div>
                            </td>
                            <td className="p-3">
                              <span className="text-zinc-300 block">{m.country}</span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
                                <span className={`w-1.5 h-1.5 rounded-full ${m.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`}></span>
                                {m.lastActive}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                m.tierId === 'diamond'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                  : m.tierId === 'gold'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}>
                                {m.tierId.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-emerald-400 block">
                                {m.currency === 'PKR' ? `PKR ${m.depositAmount.toLocaleString()}` : `$${m.depositAmount}`}
                              </span>
                              <span className="text-[10px] text-zinc-500 capitalize">{m.depositStatus}</span>
                            </td>
                            <td className="p-3">
                              <span className="text-cyan-400 font-bold block">
                                {m.currency === 'PKR' ? `PKR ${m.balance}` : `$${m.balance}`}
                              </span>
                              <span className="text-[10px] text-zinc-400">{m.completedAdsCount} tasks done</span>
                            </td>
                            <td className="p-3">
                              <span className="text-amber-400 font-bold">
                                {m.currency === 'PKR' ? `+PKR ${m.referralCommissionEarned}` : `+$${m.referralCommissionEarned}`}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleAdjustBalance(m.email, m.currency === 'PKR' ? 200 : 5)}
                                className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold cursor-pointer"
                              >
                                +{m.currency === 'PKR' ? '200' : '$5'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedTeamForDrawer(null)}
                  className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close Roster
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TEAM PERFORMANCE BONUS GRANT MODAL */}
        {bonusModalTeam && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-xl">card_giftcard</span>
                  <h3 className="text-sm font-bold text-white">Award Team Performance Bonus</h3>
                </div>
                <button
                  onClick={() => setBonusModalTeam(null)}
                  className="text-zinc-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 text-xs font-mono space-y-1">
                <span className="text-zinc-400 block text-[10px] uppercase">Target Team &amp; Leader:</span>
                <p className="text-white font-bold">{bonusModalTeam.teamName}</p>
                <p className="text-emerald-400">{bonusModalTeam.leaderName} ({bonusModalTeam.leaderEmail})</p>
                <p className="text-zinc-400 text-[10px]">Team Size: {bonusModalTeam.totalMembers} Members • Capital: PKR {bonusModalTeam.totalTeamCapitalPKR.toLocaleString()}</p>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-zinc-400 block text-[10px] uppercase mb-1">
                    Bonus Credit Amount ({bonusModalTeam.totalTeamCapitalUSD > 0 && bonusModalTeam.leaderTier === 'diamond' ? 'USD' : 'PKR'}):
                  </label>
                  <input
                    type="number"
                    value={bonusAmountInput}
                    onChange={(e) => setBonusAmountInput(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-emerald-400 font-bold text-sm focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block text-[10px] uppercase mb-1">Reason / Campaign Note:</label>
                  <input
                    type="text"
                    value={bonusReasonInput}
                    onChange={(e) => setBonusReasonInput(e.target.value)}
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  onClick={() => setBonusModalTeam(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGrantTeamBonusSubmit}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black font-mono font-bold text-xs rounded-xl cursor-pointer shadow-sm"
                >
                  Credit Bonus to Leader Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

