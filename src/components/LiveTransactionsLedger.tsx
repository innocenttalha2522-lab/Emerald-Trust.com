import React, { useState, useEffect } from 'react';
import { INITIAL_TRANSACTIONS } from '../data/mockData';
import { Transaction } from '../types';

export const LiveTransactionsLedger: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'payout' | 'deposit' | 'ad_yield' | 'referral'>('all');

  // Fetch real live transactions from the backend
  useEffect(() => {
    const fetchRealTransactions = async () => {
      try {
        const res = await fetch('/api/transactions/list');
        if (res.ok) {
          const data = await res.json();
          if (data.transactions && Array.isArray(data.transactions)) {
            setTransactions(data.transactions);
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    fetchRealTransactions();
    const interval = setInterval(fetchRealTransactions, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = transactions.filter((tx) => (filter === 'all' ? true : tx.type === filter));

  return (
    <section className="py-16 lg:py-24 px-4 lg:px-10 max-w-[1280px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-mono font-bold text-emerald-400 mb-3 tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-Time Financial Ledger</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-['Inter']">
            Live Global Settlements &amp; 20% Referral Allocations
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-1.5">
            Transparent sub-second payouts across Pakistani channels (Meezan, Easypaisa) and Global Citibank Payoneer wires.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-1.5 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'referral', label: '20% Referrals' },
            { id: 'payout', label: 'Payouts' },
            { id: 'ad_yield', label: 'Ad Yield' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-emerald-500 text-black shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Event &amp; Identifier</th>
                <th className="py-3.5 px-6">Client / Node</th>
                <th className="py-3.5 px-6 hidden sm:table-cell">Region</th>
                <th className="py-3.5 px-6 hidden md:table-cell">Payment Gateway</th>
                <th className="py-3.5 px-6 hidden sm:table-cell">Timestamp</th>
                <th className="py-3.5 px-6 text-right">Settled Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-xs font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-zinc-500 font-mono text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-[28px] text-zinc-600">receipt_long</span>
                      <p className="text-zinc-400 font-bold">No transactions recorded yet.</p>
                      <p className="text-[11px] text-zinc-500 max-w-md">
                        Real-time deposit confirmations, 20% direct referral rewards, and ad watching yield harvests will appear here automatically upon occurrence.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((tx, idx) => {
                const isPayout = tx.type === 'payout';
                const isDeposit = tx.type === 'deposit';
                const isAd = tx.type === 'ad_yield';
                const isRef = tx.type === 'referral';

                return (
                  <tr
                    key={tx.id + idx}
                    className="transition-colors hover:bg-zinc-800/40"
                  >
                    {/* Status Icon & ID */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                            isPayout
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : isDeposit
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isAd
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isPayout
                              ? 'arrow_outward'
                              : isDeposit
                              ? 'arrow_downward'
                              : isAd
                              ? 'bolt'
                              : 'groups'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white uppercase tracking-wide">
                            {isPayout
                              ? 'Payout'
                              : isDeposit
                              ? 'Deposit'
                              : isAd
                              ? 'Ad Yield'
                              : '20% Referral'}
                          </p>
                          <p className="text-[10px] text-zinc-500">{tx.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Recipient Account */}
                    <td className="py-3.5 px-6 font-bold text-zinc-200">
                      {tx.user}
                    </td>

                    {/* Region */}
                    <td className="py-3.5 px-6 text-zinc-400 hidden sm:table-cell">
                      {tx.country}
                    </td>

                    {/* Method */}
                    <td className="py-3.5 px-6 text-zinc-400 hidden md:table-cell">
                      {tx.method}
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-6 text-zinc-500 hidden sm:table-cell">
                      {tx.timestamp}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-6 text-right">
                      <span
                        className={`font-bold tabular-nums text-sm ${
                          isPayout
                            ? 'text-red-400'
                            : isDeposit
                            ? 'text-emerald-400'
                            : isRef
                            ? 'text-cyan-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {isPayout ? '-' : '+'}
                        {tx.currency === 'PKR' ? `PKR ${tx.amount}` : `$${tx.amount.toFixed(2)}`}
                      </span>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
