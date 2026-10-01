import React, { useState } from 'react';
import { INITIAL_AD_CAMPAIGNS } from '../data/mockData';
import { AdCampaign, UserAccount, CurrencyType } from '../types';

interface AdEngagementHubProps {
  user: UserAccount;
  currency: CurrencyType;
  onEarnYield: (amount: number, campaignTitle: string) => void;
  onOpenAuth: () => void;
  onOpenDeposit: () => void;
}

export const AdEngagementHub: React.FC<AdEngagementHubProps> = ({
  user,
  currency,
  onEarnYield,
  onOpenAuth,
  onOpenDeposit
}) => {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(INITIAL_AD_CAMPAIGNS);
  const [activeTask, setActiveTask] = useState<AdCampaign | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [warningToast, setWarningToast] = useState<string | null>(null);

  const startTask = (campaign: AdCampaign) => {
    if (!user.isRegistered) {
      onOpenAuth();
      return;
    }

    // CHECK DEPOSIT STATUS MANDATE
    if (user.depositStatus !== 'active' && user.role !== 'owner') {
      setWarningToast(
        currency === 'PKR'
          ? 'Deposit activation required! Please activate Basic (PKR 600), Gold (PKR 1200), or Diamond (PKR 2000) to harvest ad yields.'
          : 'Deposit activation required! Please activate Basic ($20), Gold ($50), or Diamond ($100) to harvest ad yields.'
      );
      onOpenDeposit();
      setTimeout(() => setWarningToast(null), 5000);
      return;
    }

    setActiveTask(campaign);
    setIsVerifying(true);
    setProgress(0);

    const stepTime = (campaign.durationSeconds * 1000) / 100;
    let current = 0;

    const timer = setInterval(() => {
      current += 2;
      setProgress(Math.min(current, 100));

      if (current >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setIsVerifying(false);
          setCampaigns(prev =>
            prev.map(c => (c.id === campaign.id ? { ...c, status: 'completed' } : c))
          );
          const payout = currency === 'PKR' ? campaign.payoutPkr : campaign.payoutUsd;
          onEarnYield(payout, campaign.title);
          setSuccessToast(
            `Attestation verified! +${currency === 'PKR' ? 'PKR ' + payout : '$' + payout.toFixed(2)} added to portfolio.`
          );
          setTimeout(() => setSuccessToast(null), 4000);
          setActiveTask(null);
        }, 400);
      }
    }, stepTime);
  };

  return (
    <section id="live-yield" className="py-16 lg:py-24 px-4 lg:px-10 max-w-[1280px] mx-auto w-full">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </div>
          <div>
            <p className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Yield Settled</p>
            <p className="text-xs font-mono font-medium text-zinc-200">{successToast}</p>
          </div>
        </div>
      )}

      {warningToast && (
        <div className="fixed bottom-6 left-6 z-50 bg-amber-950/95 text-amber-200 px-5 py-3.5 rounded-2xl shadow-2xl border border-amber-500/80 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-md">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <span className="material-symbols-outlined text-[20px]">lock</span>
          </div>
          <div>
            <p className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider">Deposit Locked</p>
            <p className="text-xs font-medium text-amber-100">{warningToast}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-mono font-bold text-emerald-400 mb-3 tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>INTERACTIVE AD ENGAGEMENT ENGINE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-['Inter']">
            Institutional Sponsor Campaigns
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-2xl">
            Sponsors deploy targeted impressions to verified node operators. Activate your deposit package to start earning instant daily ad harvest yields.
          </p>
        </div>

        {/* Live User Yield Status */}
        <div className="bg-zinc-900/50 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 shrink-0 flex items-center gap-4 shadow-sm">
          <div>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Available Balance</p>
            <p className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              {currency === 'PKR' ? `PKR ${user.balance}` : `$${user.balance.toFixed(2)}`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
          </div>
        </div>
      </div>

      {/* Deposit Warning Prompt if not active */}
      {user.isRegistered && user.depositStatus !== 'active' && user.role !== 'owner' && (
        <div className="mb-8 p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-400 text-[24px]">lock_clock</span>
            <div>
              <p className="text-xs font-bold text-white">Ad Watching Activation Required</p>
              <p className="text-[11px] text-amber-200/80">
                Deposit {currency === 'PKR' ? 'PKR 600 (Basic), PKR 1200 (Gold), or PKR 2000 (Diamond)' : '$20 (Basic), $50 (Gold), or $100 (Diamond)'} to unlock all daily sponsor engagement payouts.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenDeposit}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
          >
            Activate Package Now
          </button>
        </div>
      )}

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {campaigns.map((camp) => {
          const isDone = camp.status === 'completed';
          const isRunning = activeTask?.id === camp.id && isVerifying;
          const payoutDisplay = currency === 'PKR' ? `+PKR ${camp.payoutPkr}` : `+$${camp.payoutUsd.toFixed(2)}`;

          return (
            <div
              key={camp.id}
              className={`rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                isDone
                  ? 'border-zinc-800/60 bg-zinc-950/40 opacity-60'
                  : isRunning
                  ? 'bg-zinc-900/90 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                  : 'bg-zinc-900/50 backdrop-blur-md border-zinc-800 hover:border-zinc-700 shadow-sm'
              }`}
            >
              <div>
                {/* Category & Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-zinc-800 border border-zinc-700/60 text-emerald-400 font-mono text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {camp.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-zinc-400">{camp.sponsor}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  {camp.title}
                </h3>

                {/* Engagement specification */}
                <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 mb-4 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">
                    {camp.icon}
                  </span>
                  <p className="text-xs text-zinc-300 font-mono leading-tight">
                    {camp.engagementType}
                  </p>
                </div>
              </div>

              <div>
                {/* Payout & Duration */}
                <div className="flex items-center justify-between mb-4 border-t border-zinc-800 pt-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 block">Ad Yield Payout</span>
                    <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                      {payoutDisplay}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 block">Verify Latency</span>
                    <span className="text-xs font-mono text-zinc-400 flex items-center gap-1 justify-end">
                      <span className="material-symbols-outlined text-[13px] text-zinc-500">timer</span>
                      {camp.durationSeconds}s
                    </span>
                  </div>
                </div>

                {/* Verification Progress Bar if running */}
                {isRunning && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-emerald-400 font-mono font-bold mb-1">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Verifying Attestation...
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Trigger */}
                <button
                  disabled={isDone || isVerifying}
                  onClick={() => startTask(camp)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isDone
                      ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                      : isRunning
                      ? 'bg-emerald-600 text-white cursor-wait'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:scale-[1.01] active:scale-98'
                  }`}
                >
                  {isDone ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
                      <span>Yield Harvested</span>
                    </>
                  ) : isRunning ? (
                    <span>Processing Attestation...</span>
                  ) : (
                    <>
                      <span>Engage &amp; Collect Yield</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
