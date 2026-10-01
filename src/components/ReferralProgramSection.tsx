import React, { useState } from 'react';
import { UserAccount, CurrencyType } from '../types';

interface ReferralProgramSectionProps {
  user: UserAccount;
  currency: CurrencyType;
  onOpenAuth: () => void;
}

export const ReferralProgramSection: React.FC<ReferralProgramSectionProps> = ({
  user,
  currency,
  onOpenAuth
}) => {
  const [partnerCount, setPartnerCount] = useState<number>(6);
  const [copied, setCopied] = useState<boolean>(false);

  const avgDepositUsd = 50;
  const avgDepositPkr = 1200;

  // 20% Direct Referral Commission
  const totalCommissionUsd = partnerCount * avgDepositUsd * 0.20;
  const totalCommissionPkr = partnerCount * avgDepositPkr * 0.20;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-bbl2ws72bstco4hwtnb5zj-373501376715.asia-southeast1.run.app';
  const referralLink = `${currentUrl}/?ref=${user.referralCode || 'TALHA-8842'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="referral-program" className="py-16 lg:py-24 bg-black/40 border-t border-zinc-800/80 px-4 lg:px-10">
      <div className="max-w-[1280px] mx-auto w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-mono font-bold text-emerald-400 mb-3 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[14px]">share</span>
            <span>20% Direct Referral Program</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4 font-['Inter']">
            Earn an Instant 20% Referral Commission on Every Deposit
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Invite friends, partners, and investors. Whenever they activate their Basic, Gold, or Diamond package, you receive an immediate <span className="text-emerald-400 font-bold">20% direct cash bonus</span> credited straight into your withdrawable balance.
          </p>
        </div>

        {/* 3 Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm font-mono">
              01
            </div>
            <h3 className="text-base font-bold text-white">Share Your Link</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Copy your unique referral link or share your invite code with friends and global communities.
            </p>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border-2 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.1)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center font-bold text-sm font-mono">
              20%
            </div>
            <h3 className="text-base font-bold text-white">Direct 20% Cash Credit</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Get 20% credited instantly upon deposit approval: e.g. <span className="text-emerald-400 font-bold">$20 (Diamond)</span> or <span className="text-emerald-400 font-bold">PKR 400 (Diamond)</span> per friend!
            </p>
          </div>

          <div className="bg-zinc-900/60 p-6 rounded-2xl border border-zinc-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm font-mono">
              03
            </div>
            <h3 className="text-base font-bold text-white">Sub-Second Payouts</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Withdraw referral earnings instantly via Meezan Bank, Easypaisa, or Payoneer Citibank with 0% delay.
            </p>
          </div>
        </div>

        {/* Affiliate Commission Calculator & Copy Link Box */}
        <div className="bg-zinc-900/80 rounded-2xl border border-zinc-800 shadow-xl p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Sliders (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <h3 className="text-xl font-bold text-white">
                Calculate Your 20% Affiliate Potential
              </h3>

              {/* Slider 1: Direct Invites */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Direct Clients Invited:</span>
                  <span className="font-bold text-emerald-400 text-sm">{partnerCount} Partners</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={partnerCount}
                  onChange={(e) => setPartnerCount(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Affiliate Link Share Bar */}
              <div className="pt-2">
                <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Your Referral Invitation Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="flex-1 bg-black border border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs font-mono text-emerald-400 outline-none select-all"
                  />
                  <button
                    onClick={user.isRegistered ? copyToClipboard : onOpenAuth}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copied ? 'check' : 'content_copy'}
                    </span>
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Projected Output Card (5 cols) */}
            <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 text-white p-7 rounded-2xl space-y-4">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                20% Direct Commission Payout
              </span>

              <div className="text-3xl sm:text-4xl font-bold font-mono text-emerald-400 tabular-nums">
                {currency === 'PKR' ? `PKR ${totalCommissionPkr.toLocaleString()}` : `$${totalCommissionUsd.toFixed(2)}`}
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed border-b border-zinc-800 pb-3">
                Calculated on {partnerCount} active deposit packages with guaranteed 20% direct payout.
              </p>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Basic Package (20%):</span>
                  <span className="text-emerald-400 font-bold">{currency === 'PKR' ? 'PKR 120 / ref' : '$4.00 / ref'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Gold Package (20%):</span>
                  <span className="text-emerald-400 font-bold">{currency === 'PKR' ? 'PKR 240 / ref' : '$10.00 / ref'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Diamond VIP (20%):</span>
                  <span className="text-emerald-400 font-bold">{currency === 'PKR' ? 'PKR 400 / ref' : '$20.00 / ref'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
