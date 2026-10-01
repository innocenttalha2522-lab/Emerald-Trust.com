import React from 'react';
import { CurrencyType } from '../types';

interface DepositWarningBannerProps {
  onOpenDeposit: () => void;
  currency: CurrencyType;
  depositStatus: string;
}

export const DepositWarningBanner: React.FC<DepositWarningBannerProps> = ({
  onOpenDeposit,
  currency,
  depositStatus
}) => {
  if (depositStatus === 'active') return null;

  return (
    <div className="w-full bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-zinc-950 border-y border-amber-500/40 px-4 py-3 text-amber-200">
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <span className="material-symbols-outlined text-[20px]">warning</span>
          </div>
          <div>
            <p className="text-xs font-bold text-white flex items-center gap-2">
              <span>Deposit Activation Required for Ad Watching</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-mono text-[10px]">
                {depositStatus === 'pending' ? 'Verification Pending' : 'Action Required'}
              </span>
            </p>
            <p className="text-[11px] text-amber-200/80 mt-0.5">
              {depositStatus === 'pending'
                ? 'Your deposit receipt is being reviewed by Owner (Talha Ahmed). Ad yield allocations will activate upon confirmation.'
                : currency === 'PKR'
                ? 'Account opened! Activate Basic (PKR 600), Gold (PKR 1200), or Diamond (PKR 2000) to start watching ads and earning daily revenue.'
                : 'Account opened! Activate Basic ($20), Gold ($50), or Diamond ($100) to start watching ads and earning daily revenue.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDeposit}
          className="shrink-0 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-lg transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">bolt</span>
          <span>{depositStatus === 'pending' ? 'View Deposit Details' : 'Activate Package Now'}</span>
        </button>
      </div>
    </div>
  );
};
