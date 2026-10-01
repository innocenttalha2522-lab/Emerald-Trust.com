import React from 'react';

interface PrecisionWorkflowProps {
  onSelectStep: (stepNumber: number) => void;
}

export const PrecisionWorkflow: React.FC<PrecisionWorkflowProps> = ({ onSelectStep }) => {
  return (
    <section id="how-it-works" className="py-16 lg:py-24 px-4 lg:px-10 max-w-[1280px] mx-auto w-full">
      {/* Title Header */}
      <div className="text-center mb-14">
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono tracking-widest rounded-full uppercase inline-block mb-3">
          EXECUTION ARCHITECTURE
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight font-['Inter']">
          Precision Workflow
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          A streamlined, cryptographic process designed for rapid node authorization and immediate revenue compounding.
        </p>
      </div>

      {/* 3 Step Cards in Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative items-center">
        {/* Connecting Line between cards on desktop */}
        <div className="absolute top-1/2 left-12 right-12 h-px bg-zinc-800 hidden md:block -z-10">
          <div className="h-full bg-emerald-500/40 w-1/3 animate-[pulse_3s_ease-in-out_infinite]" />
        </div>

        {/* Step 1 */}
        <div
          onClick={() => onSelectStep(1)}
          className="flex flex-col items-center text-center gap-4 bg-zinc-900/50 backdrop-blur-md p-8 rounded-3xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-300 relative group cursor-pointer hover:-translate-y-1"
        >
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-emerald-400 font-mono text-xl font-bold mb-2 group-hover:bg-emerald-500 group-hover:text-black transition-colors duration-300">
            01
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Secure Registration
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Create your verified account in minutes. Complete our KYC process for institutional-grade multi-sig security.
          </p>
          <span className="text-xs font-mono font-bold text-emerald-400 group-hover:underline inline-flex items-center gap-1 mt-2">
            START VERIFICATION <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </span>
        </div>

        {/* Step 2 (Featured Offset in Bento Theme) */}
        <div
          onClick={() => onSelectStep(2)}
          className="flex flex-col items-center text-center gap-4 bg-zinc-900/90 backdrop-blur-md p-8 rounded-3xl border-2 border-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.15)] hover:border-emerald-400 transition-all duration-300 relative group md:-mt-6 cursor-pointer hover:-translate-y-1"
        >
          <div className="absolute -top-3 px-3 py-0.5 bg-emerald-500 text-black text-[10px] font-mono font-bold rounded-full uppercase tracking-wider">
            Capital Allocation
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono text-xl font-bold mb-2 group-hover:bg-emerald-500 group-hover:text-black transition-colors duration-300">
            02
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Select Tier
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Choose a package that aligns with your capital strategy. Deposit via supported secure blockchain channels.
          </p>
          <span className="text-xs font-mono font-bold text-emerald-400 group-hover:underline inline-flex items-center gap-1 mt-2">
            EXPLORE TIERS <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </span>
        </div>

        {/* Step 3 */}
        <div
          onClick={() => onSelectStep(3)}
          className="flex flex-col items-center text-center gap-4 bg-zinc-900/50 backdrop-blur-md p-8 rounded-3xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-300 relative group cursor-pointer hover:-translate-y-1"
        >
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-emerald-400 font-mono text-xl font-bold mb-2 group-hover:bg-emerald-500 group-hover:text-black transition-colors duration-300">
            03
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Automated Yield
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Engage with targeted ad campaigns and watch your daily revenue compound in sub-second settlements.
          </p>
          <span className="text-xs font-mono font-bold text-emerald-400 group-hover:underline inline-flex items-center gap-1 mt-2">
            LAUNCH AD HUB <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </span>
        </div>
      </div>
    </section>
  );
};
