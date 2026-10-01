import React, { useState } from 'react';
import { PACKAGE_TIERS } from '../data/mockData';
import { PackageTier, UserAccount, CurrencyType } from '../types';

interface PackagesSectionProps {
  user: UserAccount;
  onSelectTier: (tier: PackageTier) => void;
  currency: CurrencyType;
  onCurrencyChange: (cur: CurrencyType) => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({
  user,
  onSelectTier,
  currency,
  onCurrencyChange
}) => {
  const [activeTab, setActiveTab] = useState<'tiers' | 'calculator'>('tiers');
  const [selectedCalcTierIndex, setSelectedCalcTierIndex] = useState<number>(1);

  const matchedTier = PACKAGE_TIERS[selectedCalcTierIndex] || PACKAGE_TIERS[1];
  const capital = currency === 'PKR' ? matchedTier.pkrPrice : matchedTier.usdPrice;
  const dailyReturn = (capital * matchedTier.dailyRate) / 100;
  const weeklyReturn = dailyReturn * 7;
  const monthlyReturn = dailyReturn * 30;
  const referralBonus20 = capital * 0.20;

  return (
    <section id="packages" className="py-16 lg:py-24 px-4 lg:px-10 max-w-[1280px] mx-auto w-full">
      <div className="w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-mono font-bold text-emerald-400 mb-3 tracking-widest uppercase">
            <span className="material-symbols-outlined text-[14px]">monetization_on</span>
            <span>OFFICIAL DEPOSIT TIERS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4 font-['Inter']">
            Deposit Packages Engineered for Guaranteed Daily Yield
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Choose from our tiered packages for Pakistani and International investors. Unlock daily ad tasks, instant sub-second withdrawals, and our <span className="text-emerald-400 font-bold">20% direct referral commission</span>.
          </p>

          {/* Currency Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="inline-flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <button
                type="button"
                onClick={() => onCurrencyChange('USD')}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🇺🇸 International ($20 / $50 / $100)
              </button>
              <button
                type="button"
                onClick={() => onCurrencyChange('PKR')}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer ${
                  currency === 'PKR'
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🇵🇰 Pakistani Clients (Rs 600 / 1200 / 2000)
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="inline-flex p-1 bg-zinc-900 border border-zinc-800 rounded-2xl mt-4">
            <button
              onClick={() => setActiveTab('tiers')}
              className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'tiers'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Deposit Packages
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-4 py-1.5 text-xs font-mono uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'calculator'
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-400">calculate</span>
              <span>ROI Calculator</span>
            </button>
          </div>
        </div>

        {activeTab === 'tiers' ? (
          /* Tier Cards Grid (3 Columns on Desktop) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {PACKAGE_TIERS.map((tier) => {
              const isCurrentTier = user.tierId === tier.id && user.depositStatus === 'active';
              const priceDisplay = currency === 'PKR' ? `PKR ${tier.pkrPrice}` : `$${tier.usdPrice}.00`;

              return (
                <div
                  key={tier.id}
                  className={`rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 relative border ${
                    tier.isPopular
                      ? 'bg-zinc-900/90 border-2 border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.15)] scale-[1.02] md:-translate-y-1'
                      : 'bg-zinc-900/50 backdrop-blur-md border-zinc-800 hover:border-zinc-700 shadow-sm'
                  }`}
                >
                  {/* Badge */}
                  {tier.badge && (
                    <div className="absolute -top-3.5 right-6 px-3 py-1 bg-emerald-500 text-black text-[10px] font-mono font-bold rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">star</span>
                      <span>{tier.badge}</span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-4">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block mb-1">
                        {tier.id === 'basic' ? 'Basic Tier' : tier.id === 'gold' ? 'Gold Tier' : 'Diamond VIP Tier'}
                      </span>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {tier.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black font-mono text-emerald-400">
                          {priceDisplay}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">one-time deposit</span>
                      </div>
                    </div>

                    {/* Daily Yield Highlight */}
                    <div className="bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800 mb-6 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 tracking-wider block">
                          Daily Task Return
                        </span>
                        <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                          {tier.dailyRate}%
                        </span>
                        <span className="text-xs text-zinc-500 ml-1 font-mono">/ day</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block">
                          Referral Bonus
                        </span>
                        <span className="text-xs font-mono font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                          20% Instant
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3 mb-8">
                      <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                        Included Privileges:
                      </p>
                      {tier.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 font-mono">
                          <span className="material-symbols-outlined text-[16px] text-emerald-400 shrink-0 mt-0.5">
                            check_circle
                          </span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    <button
                      onClick={() => onSelectTier(tier)}
                      className={`w-full py-3.5 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isCurrentTier
                          ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40 cursor-default'
                          : tier.isPopular
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95'
                          : 'bg-zinc-800/80 hover:bg-zinc-800 text-white border border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      <span>
                        {isCurrentTier ? 'Active Package Tier' : `Activate for ${priceDisplay}`}
                      </span>
                      {!isCurrentTier && (
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Interactive Calculator Panel */
          <div className="bg-zinc-900/50 backdrop-blur-md p-6 sm:p-10 rounded-3xl border border-zinc-800 shadow-xl max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <label className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                    Select Target Deposit Tier:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PACKAGE_TIERS.map((tier, idx) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedCalcTierIndex(idx)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedCalcTierIndex === idx
                            ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                        }`}
                      >
                        <p className="text-xs font-bold text-white truncate">{tier.name}</p>
                        <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                          {currency === 'PKR' ? `PKR ${tier.pkrPrice}` : `$${tier.usdPrice}`}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-400">Daily Task Return Rate:</span>
                    <span className="text-emerald-400 font-bold">{matchedTier.dailyRate}% / day</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-400">Daily Ad Impressions Limit:</span>
                    <span className="text-white font-bold">{matchedTier.dailyAdsCount} Tasks / day</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-zinc-400">Direct Referral Reward:</span>
                    <span className="text-cyan-400 font-bold">20% of Invitee Deposit</span>
                  </div>
                </div>
              </div>

              {/* Yield Projections */}
              <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 text-white p-6 rounded-2xl space-y-4">
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  Projected Financial Yield
                </h4>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <span className="text-xs font-mono text-zinc-400">Daily Yield</span>
                    <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                      +{currency === 'PKR' ? `PKR ${dailyReturn.toFixed(2)}` : `$${dailyReturn.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <span className="text-xs font-mono text-zinc-400">Weekly Return</span>
                    <span className="text-lg font-bold font-mono text-white tabular-nums">
                      +{currency === 'PKR' ? `PKR ${weeklyReturn.toFixed(2)}` : `$${weeklyReturn.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                    <span className="text-xs font-mono text-zinc-400">30-Day Projected Total</span>
                    <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                      +{currency === 'PKR' ? `PKR ${monthlyReturn.toFixed(2)}` : `$${monthlyReturn.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-mono text-zinc-400">20% Referral Commission / Invitee</span>
                    <span className="text-sm font-semibold font-mono text-cyan-400 tabular-nums">
                      +{currency === 'PKR' ? `PKR ${referralBonus20.toFixed(2)}` : `$${referralBonus20.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onSelectTier(matchedTier)}
                  className="w-full mt-4 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  <span>Activate {matchedTier.name}</span>
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
