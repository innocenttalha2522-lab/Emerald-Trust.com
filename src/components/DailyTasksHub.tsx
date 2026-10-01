import React, { useState, useEffect } from 'react';
import { DailyTask, UserAccount, CurrencyType, TaskSubmission } from '../types';
import {
  INITIAL_SCHEDULED_TASKS,
  getActiveDayIndex,
  getTimeUntilNextDayMs,
  advanceActiveDay,
  getTasksForDay
} from '../data/tasksData';
import { TaskProofSubmitModal } from './TaskProofSubmitModal';

interface DailyTasksHubProps {
  user: UserAccount;
  currency: CurrencyType;
  tasks?: DailyTask[];
  allTasks?: DailyTask[];
  taskSubmissions?: TaskSubmission[];
  onSubmitTaskProof?: (data: any) => Promise<void> | void;
  onApproveTaskSubmission?: (submissionId: string) => void;
  onRejectTaskSubmission?: (submissionId: string, reason?: string) => void;
  onCompleteTask?: (taskOrId: DailyTask | string, rewardAmount?: number, taskTitle?: string) => void;
  onOpenAuth: () => void;
  onOpenDeposit?: () => void;
  onOpenLiveChat?: () => void;
  onOpenOwnerPortal?: () => void;
}

const COOLDOWN_24H_MS = 24 * 60 * 60 * 1000;

export const DailyTasksHub: React.FC<DailyTasksHubProps> = ({
  user,
  currency,
  tasks,
  allTasks,
  taskSubmissions: passedTaskSubmissions,
  onSubmitTaskProof,
  onApproveTaskSubmission,
  onRejectTaskSubmission,
  onCompleteTask,
  onOpenAuth,
  onOpenDeposit,
  onOpenLiveChat,
  onOpenOwnerPortal
}) => {
  const taskList = tasks || allTasks || INITIAL_SCHEDULED_TASKS;

  // Active day index (0 = Day 1 .. 6 = Day 7)
  const [activeDayIndex, setActiveDayIndex] = useState<number>(() => getActiveDayIndex());

  // Current timestamp updated every second for real-time live cooldown countdown
  const [now, setNow] = useState<number>(Date.now());

  // Track task completions { [taskId]: epochTimestamp }
  const [completionTimestamps, setCompletionTimestamps] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('emerald_trust_task_completions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...(user.taskCompletionTimestamps || {}), ...parsed };
        }
      }
    } catch (e) {}
    return user.taskCompletionTimestamps || {};
  });

  // Local task submissions state
  const [localSubmissions, setLocalSubmissions] = useState<TaskSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('emerald_trust_task_submissions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return passedTaskSubmissions || [];
  });

  // Active modal task for submitting screenshot proof
  const [activeProofModalTask, setActiveProofModalTask] = useState<DailyTask | null>(null);

  // Enlarged screenshot preview modal
  const [enlargedScreenshot, setEnlargedScreenshot] = useState<{ url: string; title: string; user?: string } | null>(null);

  // Track recently submitted task IDs for visual feedback animation { [taskId]: epochTimestamp }
  const [recentlySubmittedTaskIds, setRecentlySubmittedTaskIds] = useState<Record<string, number>>({});

  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [warningToast, setWarningToast] = useState<string | null>(null);

  // Sync passed submissions if parent updates
  useEffect(() => {
    if (passedTaskSubmissions) {
      setLocalSubmissions(passedTaskSubmissions);
    }
  }, [passedTaskSubmissions]);

  // Sync completion timestamps when user prop changes
  useEffect(() => {
    if (user.taskCompletionTimestamps) {
      setCompletionTimestamps(prev => ({
        ...prev,
        ...user.taskCompletionTimestamps
      }));
    }
  }, [user.taskCompletionTimestamps]);

  // Main 1-second interval loop:
  // 1) Updates `now` timestamp to drive the 24-hour task cooldown countdowns
  // 2) Checks if 24 hours have passed for the active day, automatically advancing to next day
  useEffect(() => {
    const timer = setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);

      // Check if current day period has elapsed to auto-advance to next day
      const remainingMsUntilNextDay = getTimeUntilNextDayMs();
      if (remainingMsUntilNextDay <= 0) {
        const nextDay = advanceActiveDay();
        setActiveDayIndex(nextDay);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Listen for BroadcastChannel updates across tabs (e.g. Owner Portal approves a task proof)
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel('emerald_trust_sync');
    bc.onmessage = (event) => {
      const data = event.data;
      if (data?.type === 'TASK_SUBMISSION_APPROVED') {
        const { taskId, userEmail, rewardAmount, timestamp } = data;
        const subTime = timestamp || Date.now();
        setCompletionTimestamps(prev => ({
          ...prev,
          [taskId]: subTime
        }));
        setLocalSubmissions(prev =>
          prev.map(s => (s.id === data.submissionId || s.taskId === taskId ? { ...s, status: 'approved' } : s))
        );
        if ((user?.email || '').toLowerCase() === (userEmail || '').toLowerCase()) {
          setSuccessToast(
            `🎉 Owner Approved! Task verified by Talha Ahmed and +${currency === 'PKR' ? `${rewardAmount || 10} PKR` : `$${(rewardAmount || 1).toFixed(2)} USD`} credited! Task is closed for 24 hours.`
          );
          setTimeout(() => setSuccessToast(null), 6000);
        }
      } else if (data?.type === 'TASK_SUBMISSION_REJECTED') {
        setLocalSubmissions(prev =>
          prev.map(s => (s.id === data.submissionId ? { ...s, status: 'rejected', rejectionReason: data.reason } : s))
        );
        setWarningToast(`Task Proof Rejected: "${data.reason || 'Screenshot invalid'}". Please re-submit.`);
        setTimeout(() => setWarningToast(null), 5000);
      }
    };
    return () => bc.close();
  }, [user?.email, currency]);

  // Format milliseconds into HH:MM:SS
  const formatTime = (ms: number): string => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to check if a task is currently completed and locked for 24h
  const getTaskLockStatus = (taskId: string) => {
    const completedAt = completionTimestamps[taskId];
    if (!completedAt) {
      if (user.completedTaskIds?.includes(taskId)) {
        return { isClosed: true, remainingMs: COOLDOWN_24H_MS - 60000, formatted: '23:59:00' };
      }
      return { isClosed: false, remainingMs: 0, formatted: '' };
    }

    const elapsed = now - completedAt;
    if (elapsed < COOLDOWN_24H_MS) {
      const remainingMs = COOLDOWN_24H_MS - elapsed;
      return {
        isClosed: true,
        remainingMs,
        formatted: formatTime(remainingMs)
      };
    }

    // 24 hours have passed -> task automatically unlocked!
    return { isClosed: false, remainingMs: 0, formatted: '' };
  };

  // Get user's latest submission for a task
  const getUserSubmissionForTask = (taskId: string) => {
    const userEmail = (user.email || '').toLowerCase();
    const subs = (passedTaskSubmissions || localSubmissions).filter(
      s => s.taskId === taskId && s.userEmail.toLowerCase() === userEmail
    );
    if (subs.length === 0) return null;
    // Return latest
    return subs.sort((a, b) => b.submittedTimestamp - a.submittedTimestamp)[0];
  };

  // Fetch strictly the 3 daily tasks for the CURRENT active day
  const todayTasks = getTasksForDay(taskList, activeDayIndex);

  // Count how many of today's tasks are completed and locked
  const completedCountToday = todayTasks.filter(t => getTaskLockStatus(t.id).isClosed).length;
  const allTodayCompleted = completedCountToday >= 3;

  // Daily quota progress metrics
  const totalDailyQuota = todayTasks.length > 0 ? todayTasks.length : 3;
  const progressPercentage = Math.min(100, Math.round((completedCountToday / totalDailyQuota) * 100));
  const unitReward = currency === 'PKR' ? 10 : 1.0;
  const currentEarnedToday = completedCountToday * unitReward;
  const maxPossibleEarnedToday = totalDailyQuota * unitReward;

  // Remaining time until the next day's tasks automatically unlock
  const msUntilNextDay = getTimeUntilNextDayMs();
  const timeUntilNextDayStr = formatTime(msUntilNextDay);

  const dayLabels = [
    'Day 1 (Monday)',
    'Day 2 (Tuesday)',
    'Day 3 (Wednesday)',
    'Day 4 (Thursday)',
    'Day 5 (Friday)',
    'Day 6 (Saturday)',
    'Day 7 (Sunday)'
  ];

  // Client clicks "Open Task & Submit Screenshot Proof"
  const handleOpenTask = (task: DailyTask) => {
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }

    // Check if tasks are locked by owner
    if (user.taskLockedByOwner) {
      setWarningToast(`Tasks are currently locked by Owner. Reason: ${user.taskLockReason || 'Administrative compliance review.'}`);
      setTimeout(() => setWarningToast(null), 5000);
      return;
    }

    const lockStatus = getTaskLockStatus(task.id);
    if (lockStatus.isClosed) {
      setWarningToast(`Task "${task.title}" is already completed and closed. It will automatically unlock in ${lockStatus.formatted}.`);
      setTimeout(() => setWarningToast(null), 4000);
      return;
    }

    // Open task target link in a new tab so user can complete action (YouTube / Telegram / Mining)
    if (task.url) {
      try {
        window.open(task.url, '_blank', 'noopener,noreferrer');
      } catch (e) {}
    }

    // Immediately open screenshot submission modal
    setActiveProofModalTask(task);
  };

  // Internal submission handler
  const handleProcessProofSubmit = async (submissionData: any) => {
    try {
      // Trigger subtle success animation on task item
      const submittedTaskId = submissionData.taskId;
      if (submittedTaskId) {
        setRecentlySubmittedTaskIds(prev => ({
          ...prev,
          [submittedTaskId]: Date.now()
        }));
        setTimeout(() => {
          setRecentlySubmittedTaskIds(prev => {
            const updated = { ...prev };
            delete updated[submittedTaskId];
            return updated;
          });
        }, 5500);
      }

      // 1. Post to backend
      const res = await fetch('/api/tasks/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      const data = await res.json();
      const newSub: TaskSubmission = data.submission || {
        ...submissionData,
        id: `TSUB-${Math.floor(10000 + Math.random() * 90000)}`,
        status: 'pending',
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        submittedTimestamp: Date.now()
      };

      // 2. Update local state
      setLocalSubmissions(prev => {
        const userEmailLower = (user?.email || '').toLowerCase();
        const filtered = prev.filter(s => !((s.userEmail || '').toLowerCase() === userEmailLower && s.taskId === submissionData.taskId));
        const updated = [newSub, ...filtered];
        try {
          localStorage.setItem('emerald_trust_task_submissions', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });

      // 3. Delegate to parent if provided
      if (onSubmitTaskProof) {
        await onSubmitTaskProof(submissionData);
      }

      // 4. Notify user
      const rewardStr = currency === 'PKR' ? `${submissionData.rewardPkr || 10} PKR` : `$${(submissionData.rewardUsd || 1.0).toFixed(2)} USD`;
      setSuccessToast(
        `📸 Task Screenshot Submitted! Admin will verify your proof and credit +${rewardStr} to your balance.`
      );
      setTimeout(() => setSuccessToast(null), 6000);

      // 5. Broadcast to other tabs
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('emerald_trust_sync');
          bc.postMessage({
            type: 'TASK_PROOF_SUBMITTED',
            submission: newSub
          });
          bc.close();
        }
      } catch (e) {}
    } catch (err: any) {
      console.error('Task proof submission error:', err);
      const submittedTaskId = submissionData.taskId;
      if (submittedTaskId) {
        setRecentlySubmittedTaskIds(prev => ({
          ...prev,
          [submittedTaskId]: Date.now()
        }));
        setTimeout(() => {
          setRecentlySubmittedTaskIds(prev => {
            const updated = { ...prev };
            delete updated[submittedTaskId];
            return updated;
          });
        }, 5500);
      }

      const fallbackSub: TaskSubmission = {
        ...submissionData,
        id: `TSUB-${Math.floor(10000 + Math.random() * 90000)}`,
        status: 'pending',
        submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        submittedTimestamp: Date.now()
      };
      setLocalSubmissions(prev => {
        const userEmailLower = (user?.email || '').toLowerCase();
        const filtered = prev.filter(s => !((s.userEmail || '').toLowerCase() === userEmailLower && s.taskId === submissionData.taskId));
        const updated = [fallbackSub, ...filtered];
        localStorage.setItem('emerald_trust_task_submissions', JSON.stringify(updated));
        return updated;
      });
      setSuccessToast(
        `📸 Task Screenshot Submitted! Admin will verify your proof and credit your reward.`
      );
      setTimeout(() => setSuccessToast(null), 5000);
    }
  };

  // Owner testing tools (strictly for Talha Ahmed)
  const isOwner = user?.role === 'owner' || 
    user?.email?.toLowerCase() === 'innocenttalha2522@gmail.com' ||
    (typeof window !== 'undefined' && (
      window.location.hostname.includes('ais-dev') ||
      window.location.search.toLowerCase().includes('owner') ||
      window.location.hash.toLowerCase().includes('owner')
    ));

  const handleOwnerSimulateProof = (taskId: string) => {
    setRecentlySubmittedTaskIds(prev => ({
      ...prev,
      [taskId]: Date.now()
    }));
    setTimeout(() => {
      setRecentlySubmittedTaskIds(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
    }, 5500);
    setSuccessToast(`✨ Simulated subtle success animation on task!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleOwnerAdvanceDay = () => {
    const next = advanceActiveDay();
    setActiveDayIndex(next);
    setSuccessToast(`Owner Simulation: Advanced to ${dayLabels[next]}!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleOwnerResetCooldowns = () => {
    setCompletionTimestamps({});
    try {
      localStorage.removeItem('emerald_trust_task_completions');
    } catch (e) {}
    setSuccessToast('Owner Action: Cleared all 24-hour task cooldowns. All tasks unlocked!');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleOwnerSelectDay = (dayIdx: number) => {
    setActiveDayIndex(dayIdx);
    setSuccessToast(`Switched view to ${dayLabels[dayIdx]}`);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Quick owner direct verification for testing
  const handleOwnerDirectVerify = async (taskId: string) => {
    const sub = getUserSubmissionForTask(taskId);
    if (sub && onApproveTaskSubmission) {
      onApproveTaskSubmission(sub.id);
      return;
    }

    const task = todayTasks.find(t => t.id === taskId);
    if (!task) return;

    const reward = currency === 'PKR' ? (task.rewardPkr || 10) : (task.rewardUsd || 1.0);
    const nowTime = Date.now();

    const updatedTimestamps = {
      ...completionTimestamps,
      [taskId]: nowTime
    };
    setCompletionTimestamps(updatedTimestamps);
    try {
      localStorage.setItem('emerald_trust_task_completions', JSON.stringify(updatedTimestamps));
    } catch (e) {}

    // Mark sub approved
    setLocalSubmissions(prev => {
      const userEmailLower = (user?.email || '').toLowerCase();
      const updated = prev.map(s => s.taskId === taskId && (s.userEmail || '').toLowerCase() === userEmailLower ? { ...s, status: 'approved' as const, reviewedBy: 'Admin' } : s);
      try {
        localStorage.setItem('emerald_trust_task_submissions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (onCompleteTask) {
      onCompleteTask(task, reward, task.title);
    }

    setSuccessToast(`🎉 Admin Verification: Approved and credited +${currency === 'PKR' ? '10 PKR' : '$1.00 USD'}! Task is closed for 24 hours.`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const pendingProofCount = (passedTaskSubmissions || localSubmissions).filter(s => s.status === 'pending').length;

  // Task visibility gating: Task only shown when user active the account or deposit the money or purchase the package
  const hasActiveAccount =
    isOwner ||
    (user.isRegistered && (
      user.depositStatus === 'active' ||
      (typeof user.depositAmount === 'number' && user.depositAmount > 0) ||
      Boolean(user.activePackageName && user.activePackageName.toLowerCase() !== 'free' && user.depositStatus !== 'none') ||
      (user.tierId && user.tierId.toLowerCase() !== 'free' && user.depositStatus === 'active')
    ));
  const isDepositPending = user.isRegistered && user.depositStatus === 'pending';

  return (
    <section id="daily-tasks" className="py-14 lg:py-20 px-4 lg:px-10 max-w-[1280px] mx-auto w-full">
      {/* Toast Notification (Success) */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-emerald-500/60 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-md">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
          </div>
          <div className="text-xs font-mono">
            <div className="font-bold text-emerald-400">Task Update</div>
            <div className="text-zinc-300 mt-0.5">{successToast}</div>
          </div>
        </div>
      )}

      {/* Toast Notification (Warning) */}
      {warningToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-red-500/60 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-md">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
            <span className="material-symbols-outlined text-[20px]">lock_clock</span>
          </div>
          <div className="text-xs font-mono">
            <div className="font-bold text-amber-400">Notice</div>
            <div className="text-zinc-300 mt-0.5">{warningToast}</div>
          </div>
        </div>
      )}

      {/* Owner Debug Strip (Visible ONLY to Owner Talha Ahmed) */}
      {isOwner && (
        <div className="mb-6 p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-amber-300">
            <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
            <span className="font-bold">Owner Testing Suite:</span>
            <span className="text-zinc-300">Active Day: <strong className="text-white">{dayLabels[activeDayIndex]}</strong></span>
            {pendingProofCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                {pendingProofCount} Proofs Awaiting Verification
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenOwnerPortal && (
              <button
                onClick={onOpenOwnerPortal}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-all cursor-pointer text-[11px] flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">fact_check</span>
                <span>Open Owner Portal</span>
              </button>
            )}
            <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-700">
              <span className="text-[10px] text-zinc-400">Day:</span>
              {[0, 1, 2, 3, 4, 5, 6].map(d => (
                <button
                  key={d}
                  onClick={() => handleOwnerSelectDay(d)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    d === activeDayIndex ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  D{d + 1}
                </button>
              ))}
            </div>
            <button
              onClick={handleOwnerAdvanceDay}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-all cursor-pointer text-[11px] flex items-center gap-1"
              title="Fast-forward 24 hours to test next day tasks"
            >
              <span className="material-symbols-outlined text-[13px]">fast_forward</span>
              <span>Next Day (+24h)</span>
            </button>
            <button
              onClick={handleOwnerResetCooldowns}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition-all cursor-pointer text-[11px]"
              title="Reset all 24-hour task cooldowns"
            >
              Unlock All Tasks
            </button>
            <button
              onClick={() => handleOwnerSimulateProof(todayTasks[0]?.id || 'd1-t1')}
              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold rounded-lg transition-all cursor-pointer text-[11px] flex items-center gap-1"
              title="Preview subtle checkmark overlay and color pulse animation"
            >
              <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
              <span>Test Success FX</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Banner - Strictly shows TODAY'S task details */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-zinc-800 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Today's Assigned Tasks • {dayLabels[activeDayIndex]}</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Today's Daily Tasks</span>
            <span className="text-xs font-mono font-normal px-2.5 py-1 bg-zinc-800 text-emerald-300 border border-emerald-500/30 rounded-lg">
              {currency === 'PKR' ? '10 PKR / Task' : '$1.00 USD / Task'}
            </span>
          </h2>

          <p className="text-zinc-400 text-sm mt-2 max-w-2xl font-mono leading-relaxed">
            Open the task link, complete the engagement, and <strong className="text-emerald-400">submit your screenshot proof</strong>.
            Owner (Talha Ahmed) verifies the submission and credits{' '}
            <strong className="text-emerald-400">{currency === 'PKR' ? '10 PKR' : '$1.00 USD'}</strong> to your wallet.
            Once verified, the task is <span className="text-amber-400 font-bold">automatically closed and locked for 24 hours</span>.
            After 24 hours, the next day's tasks automatically unlock!
          </p>
        </div>

        {/* Real-Time Progress & Next Day Unlock Counter */}
        <div id="daily-tasks-quick-progress" className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shadow-xl shrink-0 min-w-[280px]">
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Today's Progress</span>
              <span className="text-[11px] font-mono font-bold text-emerald-400">{progressPercentage}%</span>
            </div>
            <div className="text-xl font-bold font-mono text-white flex items-center gap-2 mt-0.5">
              <span className={allTodayCompleted ? 'text-emerald-400' : 'text-zinc-200'}>
                {completedCountToday} / {totalDailyQuota} Closed
              </span>
              {allTodayCompleted && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full whitespace-nowrap">
                  ALL COMPLETED
                </span>
              )}
            </div>
            {/* Embedded Mini Progress Bar */}
            <div className="w-full bg-zinc-950 rounded-full h-2 mt-2 overflow-hidden border border-zinc-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-[11px] font-mono text-zinc-500 mt-1.5 flex items-center justify-between">
              <span>Next Day:</span>
              <span className="text-amber-400 font-bold">{timeUntilNextDayStr}</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-xl bg-zinc-800/80 border border-zinc-700 flex flex-col items-center justify-center text-center shrink-0 self-center">
            <span className="text-lg font-black font-mono text-emerald-400">{completedCountToday}</span>
            <span className="text-[9px] font-mono text-zinc-400 uppercase">of {totalDailyQuota}</span>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar Section: User Task Quota & Completion Milestones */}
      <div
        id="daily-tasks-quota-progress-card"
        className="mb-8 p-5 sm:p-6 bg-zinc-950/80 border border-zinc-800 rounded-3xl shadow-xl space-y-4"
      >
        {/* Progress Bar Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono text-white tracking-tight">
                  Daily Task Quota Progress
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[11px] font-semibold">
                  {dayLabels[activeDayIndex]}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                {completedCountToday === totalDailyQuota
                  ? 'Daily quota achieved! All 3 tasks verified and rewarded.'
                  : `${totalDailyQuota - completedCountToday} of ${totalDailyQuota} tasks remaining in your daily quota`}
              </p>
            </div>
          </div>

          {/* Right Statistics / Pill Badges */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
              <span className="text-zinc-400 uppercase text-[10px]">Quota:</span>
              <span className="font-bold text-white">
                {completedCountToday} / {totalDailyQuota} Completed
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-2">
              <span className="text-zinc-400 uppercase text-[10px]">Earnings:</span>
              <span className="font-bold text-emerald-400">
                {currency === 'PKR' ? `PKR ${currentEarnedToday}` : `$${currentEarnedToday.toFixed(2)}`} / {currency === 'PKR' ? `PKR ${maxPossibleEarnedToday}` : `$${maxPossibleEarnedToday.toFixed(2)}`}
              </span>
            </div>

            <div
              className={`px-3 py-1.5 rounded-xl font-bold border whitespace-nowrap flex items-center gap-1.5 ${
                progressPercentage === 100
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : progressPercentage > 0
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{progressPercentage}% Complete</span>
            </div>
          </div>
        </div>

        {/* The Animated Visual Progress Bar */}
        <div className="space-y-1.5">
          <div
            id="task-quota-progress-track"
            className="w-full bg-zinc-900/90 rounded-full h-4 sm:h-5 p-1 border border-zinc-800 relative overflow-hidden shadow-inner"
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Daily task completion quota"
          >
            {/* Background Grid Ticks (3 equal segments) */}
            <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
              <div className="w-[33.33%] border-r border-zinc-800/80 h-full"></div>
              <div className="w-[33.33%] border-r border-zinc-800/80 h-full"></div>
              <div className="w-[33.34%] h-full"></div>
            </div>

            {/* Filled Progress Bar */}
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                progressPercentage === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                  : progressPercentage > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : 'bg-zinc-800'
              }`}
              style={{ width: `${Math.max(progressPercentage > 0 ? progressPercentage : 0, 0)}%` }}
            >
              {progressPercentage > 0 && (
                <div className="absolute inset-0 bg-white/15 animate-pulse rounded-full" />
              )}
            </div>
          </div>

          {/* Scale percentages */}
          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 px-1 select-none">
            <span>0%</span>
            <span>33% (1 Task)</span>
            <span>66% (2 Tasks)</span>
            <span>100% Quota (3 Tasks)</span>
          </div>
        </div>

        {/* Milestone Steps Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {todayTasks.map((task, idx) => {
            const lockStatus = getTaskLockStatus(task.id);
            const isClosed = lockStatus.isClosed;
            const userSub = getUserSubmissionForTask(task.id);
            const isPending = userSub?.status === 'pending' && !isClosed;
            const isRejected = userSub?.status === 'rejected' && !isClosed;
            const isJustSubmitted = Boolean(recentlySubmittedTaskIds[task.id]);
            const rewardStr = currency === 'PKR' ? `${task.rewardPkr || 10} PKR` : `$${(task.rewardUsd || 1.0).toFixed(2)}`;

            return (
              <div
                key={task.id}
                id={`task-quota-step-${idx + 1}`}
                className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-3 ${
                  isJustSubmitted
                    ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.35)] animate-pulse'
                    : isClosed
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isPending
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : isRejected
                    ? 'bg-red-950/20 border-red-500/30'
                    : 'bg-zinc-900/60 border-zinc-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      isJustSubmitted
                        ? 'bg-emerald-400 text-black shadow-sm animate-checkmark-pop'
                        : isClosed
                        ? 'bg-emerald-500 text-black'
                        : isPending
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : isRejected
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {isJustSubmitted ? (
                      <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                    ) : isClosed ? (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    ) : isPending ? (
                      <span className="material-symbols-outlined text-[16px]">pending</span>
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold text-white truncate flex items-center gap-1.5">
                      <span>Task {idx + 1}: {task.category.toUpperCase()}</span>
                      {isJustSubmitted && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 truncate">
                      {task.title}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right font-mono">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block whitespace-nowrap transition-all ${
                      isJustSubmitted
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 animate-pulse'
                        : isClosed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isPending
                        ? 'bg-amber-500/20 text-amber-300'
                        : isRejected
                        ? 'bg-red-500/20 text-red-300'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isJustSubmitted ? 'Proof Sent ✓' : isClosed ? `+${rewardStr} Done` : isPending ? 'In Review' : isRejected ? 'Re-upload' : `+${rewardStr}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Lock Warning Banner (if user account locked) */}
      {user.taskLockedByOwner && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-500/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-red-300">
          <div>
            <div className="flex items-center gap-2 font-bold text-red-200 text-sm">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span>Daily Tasks Locked by Admin</span>
            </div>
            <div className="mt-1 text-zinc-300">
              <strong>Admin's Note:</strong>{' '}
              <span className="text-white italic">"{user.taskLockReason || 'Awaiting compliance review.'}"</span>
            </div>
          </div>
          {onOpenLiveChat && (
            <button
              onClick={onOpenLiveChat}
              className="px-3.5 py-2 bg-red-500 hover:bg-red-400 text-black font-bold rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 text-xs"
            >
              <span className="material-symbols-outlined text-[15px]">chat</span>
              <span>Chat with Admin</span>
            </button>
          )}
        </div>
      )}

      {/* All 3 Tasks Completed & Closed Banner */}
      {allTodayCompleted && (
        <div className="mb-8 p-6 bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-2xl shrink-0">
              🎉
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2 justify-center sm:justify-start">
                <span>All 3 Tasks Completed &amp; Closed for Today!</span>
              </h3>
              <p className="text-xs text-zinc-300 font-mono mt-1">
                You have earned your full daily reward of{' '}
                <strong className="text-emerald-400">{currency === 'PKR' ? 'PKR 30.00' : '$3.00 USD'}</strong>!
                Each task is now closed. Next day's tasks will automatically appear in{' '}
                <span className="text-amber-400 font-bold">{timeUntilNextDayStr}</span>.
              </p>
            </div>
          </div>
          <div className="px-5 py-3 bg-zinc-900 border border-amber-500/40 rounded-xl font-mono text-xs text-amber-300 shrink-0">
            <div className="text-[10px] uppercase text-zinc-400">Next Day Unlock In</div>
            <div className="text-base font-bold text-amber-400">{timeUntilNextDayStr}</div>
          </div>
        </div>
      )}

      {/* TASK VISIBILITY GATING:
          Task is only shown when user active the account, deposited money, or purchased a package.
      */}
      {!hasActiveAccount ? (
        <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-900/70 to-zinc-950 border border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center">
            {/* Lock Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-950/40">
              <span className="material-symbols-outlined text-[32px]">lock</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold mb-3 uppercase tracking-wider">
              <span>Account Activation Required</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black font-mono text-white mb-3 tracking-tight">
              Daily Tasks Locked
            </h3>

            <p className="text-zinc-300 text-xs sm:text-sm font-mono leading-relaxed mb-6">
              Daily tasks and instant reward payouts (
              <strong className="text-emerald-400">
                {currency === 'PKR' ? '+10 PKR per task (30 PKR / day)' : '+$1.00 USD per task ($3.00 / day)'}
              </strong>
              ) are only shown when you activate your account, deposit money, or purchase a package plan.
            </p>

            {/* If deposit is currently pending verification */}
            {isDepositPending ? (
              <div className="w-full bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 mb-6 text-left flex items-start gap-3 text-xs font-mono text-amber-200">
                <span className="material-symbols-outlined text-amber-400 text-[20px] shrink-0 mt-0.5">hourglass_top</span>
                <div>
                  <div className="font-bold text-white text-sm">Deposit Verification In Progress</div>
                  <div className="text-zinc-300 mt-1">
                    Your deposit reference has been submitted and is currently being verified by Admin. All 3 daily tasks will automatically appear and unlock the moment your deposit is verified!
                  </div>
                </div>
              </div>
            ) : (
              /* Benefits Preview */
              <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left font-mono">
                <div className="p-3.5 bg-black/50 border border-zinc-800 rounded-xl">
                  <div className="text-emerald-400 text-sm font-bold flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>3 Daily Tasks</span>
                  </div>
                  <div className="text-zinc-400 text-[11px]">
                    Fresh YouTube, Telegram &amp; Mining tasks rotating every 24 hours.
                  </div>
                </div>

                <div className="p-3.5 bg-black/50 border border-zinc-800 rounded-xl">
                  <div className="text-emerald-400 text-sm font-bold flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                    <span>{currency === 'PKR' ? '+10 PKR Each' : '+$1.00 USD Each'}</span>
                  </div>
                  <div className="text-zinc-400 text-[11px]">
                    Real cash credited directly to your withdrawal wallet.
                  </div>
                </div>

                <div className="p-3.5 bg-black/50 border border-zinc-800 rounded-xl">
                  <div className="text-emerald-400 text-sm font-bold flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[16px]">support_agent</span>
                    <span>Admin Verification</span>
                  </div>
                  <div className="text-zinc-400 text-[11px]">
                    Direct manual review of screenshot proofs by Admin.
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full font-mono text-xs">
              {!user.isRegistered ? (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:scale-105"
                >
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                  <span>Sign In / Register to Activate</span>
                </button>
              ) : (
                <>
                  {onOpenDeposit && (
                    <button
                      type="button"
                      onClick={onOpenDeposit}
                      className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:scale-105"
                    >
                      <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                      <span>Deposit Money &amp; Activate Account</span>
                    </button>
                  )}
                  <a
                    href="#packages"
                    className="px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-zinc-700 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                    <span>Purchase a Package</span>
                  </a>
                </>
              )}

              {onOpenLiveChat && (
                <button
                  type="button"
                  onClick={onOpenLiveChat}
                  className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl border border-zinc-800 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">support_agent</span>
                  <span>Chat Live with Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TODAY'S 3 TASKS CARDS GRID */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {todayTasks.map((task) => {
          const lockStatus = getTaskLockStatus(task.id);
          const isClosed = lockStatus.isClosed;
          const userSub = getUserSubmissionForTask(task.id);
          const isPendingReview = userSub?.status === 'pending';
          const isRejected = userSub?.status === 'rejected';
          const isJustSubmitted = Boolean(recentlySubmittedTaskIds[task.id]);

          return (
            <div
              key={task.id}
              id={`daily-task-card-${task.id}`}
              className={`relative bg-zinc-900/90 border rounded-2xl p-6 flex flex-col justify-between transition-all duration-500 overflow-hidden ${
                isJustSubmitted
                  ? 'border-emerald-400 bg-gradient-to-b from-emerald-950/40 via-zinc-900 to-zinc-950 ring-2 ring-emerald-400/60 shadow-[0_0_35px_rgba(16,185,129,0.35)] animate-success-pulse'
                  : isClosed
                  ? 'border-zinc-800 bg-zinc-950/60 opacity-90'
                  : isPendingReview
                  ? 'border-amber-500/60 bg-zinc-950/80 shadow-lg shadow-amber-950/20'
                  : isRejected
                  ? 'border-red-500/50 bg-zinc-950/80'
                  : 'border-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-900'
              }`}
            >
              {/* Shimmer sweep effect when just submitted */}
              {isJustSubmitted && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10">
                  <div className="absolute -inset-full top-0 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent animate-success-shimmer" />
                </div>
              )}

              {/* Checkmark overlay animation banner */}
              {isJustSubmitted && (
                <div className="absolute inset-0 z-30 pointer-events-none rounded-2xl bg-zinc-950/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="relative flex items-center justify-center mb-3">
                    {/* Ripple ring animation */}
                    <div className="absolute w-20 h-20 rounded-full bg-emerald-500/25 animate-ripple-ring" />
                    {/* Pop checkmark badge */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-emerald-300 flex items-center justify-center text-zinc-950 shadow-[0_0_25px_rgba(16,185,129,0.7)] animate-checkmark-pop">
                      <span className="material-symbols-outlined text-[32px] font-black">check</span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-[11px] font-mono font-bold uppercase tracking-wider mb-1.5 animate-in slide-in-from-bottom-2 duration-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Proof Submitted!</span>
                  </div>

                  <h5 className="text-white font-mono font-bold text-sm tracking-tight">
                    Screenshot Uploaded Successfully
                  </h5>
                  <p className="text-zinc-300 font-mono text-[11px] mt-1 max-w-[220px]">
                    Submitted for review. Reward will be added to your balance shortly!
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>Status: Under Admin Review</span>
                  </div>
                </div>
              )}

              {/* Card Header: Task Number & Category & Reward */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-md text-[11px] font-mono font-bold">
                      Task #{task.taskNumber}
                    </span>
                    {isJustSubmitted && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        <span>Proof Sent</span>
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono uppercase font-bold flex items-center gap-1 ${
                        task.category === 'youtube'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : task.category === 'telegram'
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          : task.category === 'mining'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{task.icon}</span>
                      <span>{task.category}</span>
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono text-zinc-400 text-[10px]">Reward</div>
                    <div className="text-sm font-mono font-black text-emerald-400">
                      {currency === 'PKR' ? '+10 PKR' : '+$1.00'}
                    </div>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white font-mono leading-snug mb-2 flex items-center gap-2">
                  <span>{task.title}</span>
                </h4>

                <p className="text-xs text-zinc-300 font-mono leading-relaxed mb-4">
                  {task.description}
                </p>

                {/* Instructions Checklist */}
                <div className="p-3 bg-black/40 border border-zinc-800/80 rounded-xl mb-4 text-[11px] font-mono text-zinc-300 space-y-1.5">
                  <div className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px] text-emerald-400">checklist</span>
                    <span>Action &amp; Screenshot Proof Required:</span>
                  </div>
                  {task.instructions.map((inst, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{inst}</span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-zinc-800/80 text-[10px] text-amber-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">screenshot</span>
                    <span>Take screenshot of completed action to submit for Admin review.</span>
                  </div>
                </div>

                {/* Status Callouts */}
                {isClosed && (
                  <div className="mb-4 p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl text-[11px] font-mono text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-emerald-400">verified</span>
                      <span className="font-bold">Verified &amp; Closed (24h)</span>
                    </div>
                    <div className="font-mono font-bold text-white bg-zinc-900/90 px-2 py-0.5 rounded border border-emerald-500/30">
                      {lockStatus.formatted}
                    </div>
                  </div>
                )}

                {isPendingReview && !isClosed && (
                  <div className={`mb-4 p-3 rounded-xl text-[11px] font-mono space-y-2 transition-all duration-300 ${
                    isJustSubmitted
                      ? 'bg-emerald-950/40 border border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                      : 'bg-amber-950/30 border border-amber-500/40'
                  }`}>
                    <div className="flex items-center justify-between text-amber-300">
                      <span className="flex items-center gap-1.5 font-bold">
                        {isJustSubmitted ? (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-emerald-300 font-bold">Proof Received! Under Admin Review</span>
                          </>
                        ) : (
                          <>
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>Proof Submitted • Under Admin Review</span>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-zinc-400">{userSub?.submittedAt}</span>
                    </div>
                    <p className="text-zinc-300 text-[10px]">
                      Awaiting verification by <strong>Admin</strong>. Reward will be credited and task will close for 24 hours once approved.
                    </p>
                    {userSub?.screenshotUrl && (
                      <button
                        type="button"
                        onClick={() => setEnlargedScreenshot({ url: userSub.screenshotUrl, title: task.title, user: user.name })}
                        className="text-emerald-400 hover:underline text-[11px] flex items-center gap-1 cursor-pointer pt-0.5"
                      >
                        <span className="material-symbols-outlined text-[13px]">zoom_in</span>
                        <span>View Submitted Screenshot</span>
                      </button>
                    )}
                  </div>
                )}

                {isRejected && !isClosed && (
                  <div className="mb-4 p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-[11px] font-mono text-red-300 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-red-200">
                      <span className="material-symbols-outlined text-[15px]">cancel</span>
                      <span>Proof Rejected by Admin</span>
                    </div>
                    <p className="text-[10px] text-zinc-300">
                      Reason: <em className="text-white font-bold">"{userSub?.rejectionReason || 'Screenshot unclear'}"</em>
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                {isClosed ? (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed select-none"
                    >
                      <span className="material-symbols-outlined text-[16px] text-amber-400">lock</span>
                      <span>Task Closed • Unlocks in {lockStatus.formatted}</span>
                    </button>
                    <p className="text-[10px] font-mono text-zinc-400 text-center">
                      Reward credited • Automatically unlocks after 24 hours
                    </p>
                  </div>
                ) : isPendingReview ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled
                      className={`w-full py-2.5 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-default select-none transition-all ${
                        isJustSubmitted
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                          : 'bg-amber-500/10 border border-amber-500/40 text-amber-300'
                      }`}
                    >
                      {isJustSubmitted ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] text-emerald-400 animate-checkmark-pop">check_circle</span>
                          <span>Proof Submitted • In Review</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px] animate-spin">hourglass_empty</span>
                          <span>Pending Admin Verification</span>
                        </>
                      )}
                    </button>

                    {/* If Owner is viewing, allow instant verification */}
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleOwnerDirectVerify(task.id)}
                        className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        <span>[Owner Authority] Approve &amp; Credit Now</span>
                      </button>
                    )}
                  </div>
                ) : isRejected ? (
                  <button
                    type="button"
                    onClick={() => handleOpenTask(task)}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Re-submit Screenshot Proof</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenTask(task)}
                    disabled={user.taskLockedByOwner}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-emerald-500/20"
                  >
                    <span className="material-symbols-outlined text-[16px]">task</span>
                    <span>{task.actionLabel} &amp; Submit Proof</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Customer Support Contact Banner */}
      <div className="mt-10 p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-[18px]">support_agent</span>
          </div>
          <div>
            <div className="font-bold text-white">Need Task Verification Assistance?</div>
            <div className="text-zinc-400 text-[11px]">
              Chat directly with Admin for instant screenshot review and task reward clearance.
            </div>
          </div>
        </div>
        {onOpenLiveChat && (
          <button
            onClick={onOpenLiveChat}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <span>Live Help Desk</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        )}
      </div>

      {/* Screenshot Proof Submission Modal */}
      {activeProofModalTask && (
        <TaskProofSubmitModal
          isOpen={!!activeProofModalTask}
          onClose={() => setActiveProofModalTask(null)}
          task={activeProofModalTask}
          currency={currency}
          userEmail={user?.email || ''}
          userName={user?.name || ''}
          userCountry={user?.country || 'Global'}
          existingSubmission={getUserSubmissionForTask(activeProofModalTask.id)}
          onSubmitProof={handleProcessProofSubmit}
        />
      )}

      {/* Enlarged Screenshot Viewer Modal */}
      {enlargedScreenshot && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-3xl w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-mono font-bold text-white">{enlargedScreenshot.title}</h4>
                <p className="text-xs font-mono text-zinc-400">Submitted Screenshot Proof</p>
              </div>
              <button
                onClick={() => setEnlargedScreenshot(null)}
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/60 rounded-2xl p-2 border border-zinc-800">
              <img
                src={enlargedScreenshot.url}
                alt="Submitted Proof"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="text-right">
              <button
                onClick={() => setEnlargedScreenshot(null)}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-mono font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
