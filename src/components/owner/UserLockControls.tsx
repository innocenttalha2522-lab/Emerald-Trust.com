import React, { useState } from 'react';
import { UserAccount } from '../../types';

interface UserLockControlsProps {
  user: UserAccount;
  onUpdateLock: (email: string, updates: {
    taskLockedByOwner?: boolean;
    taskLockReason?: string;
    withdrawalLockedByOwner?: boolean;
    withdrawalLockReason?: string;
  }) => void;
}

export const UserLockControls: React.FC<UserLockControlsProps> = ({ user, onUpdateLock }) => {
  const [taskLocked, setTaskLocked] = useState<boolean>(!!user.taskLockedByOwner);
  const [taskReason, setTaskReason] = useState<string>(user.taskLockReason || 'Daily tasks paused by administrator pending identity verification.');
  
  const [withdrawalLocked, setWithdrawalLocked] = useState<boolean>(!!user.withdrawalLockedByOwner);
  const [withdrawalReason, setWithdrawalReason] = useState<string>(
    user.withdrawalLockReason ||
    (user.currency === 'PKR'
      ? '10 referrals with active plan purchases required to unlock withdrawals (Minimum: 500 PKR).'
      : '10 referrals required to unlock withdrawals (Minimum: $100 USD).')
  );

  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = () => {
    onUpdateLock(user.email, {
      taskLockedByOwner: taskLocked,
      taskLockReason: taskReason,
      withdrawalLockedByOwner: withdrawalLocked,
      withdrawalLockReason: withdrawalReason
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const activeReferralsCount = user.activePaidReferralsCount || 0;
  const isReferralRequirementMet = activeReferralsCount >= 10;

  return (
    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-[18px]">lock_person</span>
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            Security &amp; Lock Controls for {user.name}
          </span>
        </div>
        {savedFeedback && (
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            Saved &amp; Broadcasted!
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TASK LOCK SECTION */}
        <div className={`p-3 rounded-xl border space-y-2.5 transition-all ${
          taskLocked ? 'bg-red-950/20 border-red-500/50' : 'bg-zinc-900/60 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-amber-400">task_alt</span>
              <span>Daily Tasks Access</span>
            </span>
            <button
              type="button"
              onClick={() => setTaskLocked(!taskLocked)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                taskLocked
                  ? 'bg-red-500 text-white hover:bg-red-400 shadow-xs'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
              }`}
            >
              {taskLocked ? '🔒 TASK LOCKED' : '🟢 UNLOCKED'}
            </button>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 uppercase block mb-1">
              Comment / Reason Shown to User:
            </label>
            <input
              type="text"
              value={taskReason}
              onChange={(e) => setTaskReason(e.target.value)}
              placeholder="e.g. Account under manual review"
              className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-200 focus:border-amber-400 outline-none"
            />
          </div>
          <p className="text-[10px] text-zinc-500">
            When locked, user cannot start or claim daily task rewards and sees this reason.
          </p>
        </div>

        {/* WITHDRAWAL LOCK SECTION */}
        <div className={`p-3 rounded-xl border space-y-2.5 transition-all ${
          withdrawalLocked ? 'bg-red-950/20 border-red-500/50' : 'bg-zinc-900/60 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-cyan-400">payments</span>
              <span>Withdrawal Access</span>
            </span>
            <button
              type="button"
              onClick={() => setWithdrawalLocked(!withdrawalLocked)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                withdrawalLocked
                  ? 'bg-red-500 text-white hover:bg-red-400 shadow-xs'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
              }`}
            >
              {withdrawalLocked ? '🔒 WITHDRAWAL LOCKED' : '🟢 UNLOCKED'}
            </button>
          </div>

          {/* Referral progress indicator */}
          <div className="p-2 bg-black/50 rounded-lg border border-zinc-800 flex items-center justify-between text-[10px]">
            <span className="text-zinc-400">10 Referral Requirement:</span>
            <span className={isReferralRequirementMet ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {activeReferralsCount} / 10 Referrals {user.currency === 'PKR' ? '(Plan Buyers)' : ''}
            </span>
          </div>

          <div>
            <label className="text-[10px] text-zinc-400 uppercase block mb-1">
              Comment / Reason Shown to User:
            </label>
            <input
              type="text"
              value={withdrawalReason}
              onChange={(e) => setWithdrawalReason(e.target.value)}
              placeholder="e.g. 10 referrals required or locked by admin"
              className="w-full bg-black border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-200 focus:border-cyan-400 outline-none"
            />
          </div>
          <p className="text-[10px] text-zinc-500">
            Min withdrawal: {user.currency === 'PKR' ? '500 PKR' : '$100 USD'}.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          <span>Save Lock Status &amp; Reason</span>
        </button>
      </div>
    </div>
  );
};
