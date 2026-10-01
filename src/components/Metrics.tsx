import React from 'react';

export const Metrics: React.FC = () => {
  return (
    <section className="py-6 px-4 lg:px-10 max-w-[1280px] mx-auto w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-zinc-800/80 rounded-xl flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <span className="text-emerald-400 text-xs font-mono font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              LIVE
            </span>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">100%</p>
            <p className="text-xs text-zinc-500 font-medium font-mono uppercase tracking-wider mt-1">Real-Time Verification</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-zinc-800/80 rounded-xl flex items-center justify-center text-cyan-400">
              <span className="material-symbols-outlined text-[20px]">percent</span>
            </div>
            <span className="text-cyan-400 text-xs font-mono font-bold px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
              DIRECT
            </span>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">20%</p>
            <p className="text-xs text-zinc-500 font-medium font-mono uppercase tracking-wider mt-1">Referral Commission</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-zinc-800/80 rounded-xl flex items-center justify-center text-zinc-400">
              <span className="material-symbols-outlined text-[20px]">public</span>
            </div>
            <span className="text-emerald-400 text-xs font-mono font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              DUAL
            </span>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">PKR / USD</p>
            <p className="text-xs text-zinc-500 font-medium font-mono uppercase tracking-wider mt-1">Geo-Targeted Routing</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-zinc-800/80 rounded-xl flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
            <span className="text-emerald-400 text-xs font-mono font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              &lt;100MS
            </span>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-white tracking-tight">&lt;0.1s</p>
            <p className="text-xs text-zinc-500 font-medium font-mono uppercase tracking-wider mt-1">Withdrawal Latency</p>
          </div>
        </div>
      </div>
    </section>
  );
};
