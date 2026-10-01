import React, { useState, useEffect } from 'react';

interface HeroProps {
  onGetStarted: () => void;
  onViewTiers: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted, onViewTiers }) => {
  const [latestPayout, setLatestPayout] = useState<number>(1450.00);
  const [flash, setFlash] = useState<boolean>(false);

  // Subtle real-time payout counter simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIncrement = Math.floor(Math.random() * 400) + 100;
      setLatestPayout(prev => {
        const next = prev + randomIncrement;
        return next > 9500 ? 1450.00 : next;
      });
      setFlash(true);
      setTimeout(() => setFlash(false), 1200);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="hero" className="relative pt-6 pb-12 lg:pt-16 lg:pb-20 px-4 lg:px-10 max-w-[1280px] mx-auto w-full">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-10 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-indigo-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Bento Grid Header & Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Large Bento Box (8 Cols) */}
        <div className="lg:col-span-8 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 sm:p-10 flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle background illustration overlay */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none mix-blend-screen">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXD0FWxsmGazxHmHb_HFXjb86B3fgwBCr4-Pz7jI35blvgDNnPEjKhh0LqvAPCKY0z9aiqc3QWVEGQLILhVaIYG7q-jXBrofS4peG9iE_YJca63YNYb7cEkCAksm3Vtff_MIT3DF39UB5xGE2kL-6VccM9uP3pPYmbElaFjst3PynxCeRyW8AcgASVGg-R2yUqYsTJ4Mgu0QTBSRwQC87zUBFG-AscO6hPJ4BCik-SoezlWeAyyOnviQ"
              className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
              alt="Background Node Grid"
            />
          </div>

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono tracking-wider rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                INSTITUTIONAL YIELD V4.2
              </span>
              <span className="px-3 py-1 bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 text-[10px] font-mono rounded-full">
                SUB-SECOND SETTLEMENT
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.12] mb-5 font-['Inter']">
              Institutional-Grade Earning, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300">
                Simplified.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl leading-relaxed mb-8">
              Maximize your daily revenue through strategic ad engagement and a powerful 14% lifelong referral program. Built for serious node operators and capital syndicates.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onGetStarted}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-bold font-mono text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>Get Started Today</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
              <button
                onClick={onViewTiers}
                className="px-6 py-3.5 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-2xl font-mono text-xs uppercase tracking-wider transition-all hover:border-zinc-500 flex items-center gap-2 cursor-pointer"
              >
                <span>View Investment Tiers</span>
              </button>
            </div>
          </div>

          {/* Bento Sub-row Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-8 mt-8 border-t border-zinc-800/80 relative z-10">
            <div>
              <p className="text-[10px] text-zinc-500 font-bold font-mono uppercase tracking-wider mb-1">Daily Rate</p>
              <p className="text-base sm:text-lg font-mono font-bold text-emerald-400">UP TO 2.6% / DAY</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold font-mono uppercase tracking-wider mb-1">Affiliate Pool</p>
              <p className="text-base sm:text-lg font-mono font-bold text-white">14% LIFELONG</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] text-zinc-500 font-bold font-mono uppercase tracking-wider mb-1">Protocol Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-emerald-500"></div>
                </div>
                <span className="text-xs font-mono text-emerald-400">100% ONLINE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Bento Column (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Top Bento Stat Card: Latest Payout */}
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-zinc-800/80 border border-zinc-700/50 rounded-2xl flex items-center justify-center text-emerald-400">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </div>
              <span className="text-emerald-400 text-xs font-mono font-bold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                +14.8% APY
              </span>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold font-mono uppercase tracking-widest mb-1">
                Real-Time Settlement
              </p>
              <p className={`text-3xl sm:text-4xl font-mono font-bold text-white transition-colors tabular-nums ${flash ? 'text-emerald-400' : ''}`}>
                ${latestPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Dispatched to multi-sig ledger
              </p>
            </div>
          </div>

          {/* Highlight Action Bento Tile (Matches Bento Accent Tile) */}
          <div
            onClick={onGetStarted}
            className="bg-emerald-600 hover:bg-emerald-500 transition-colors rounded-3xl p-6 text-white relative overflow-hidden group cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.2)]"
          >
            <div className="relative z-10 h-full flex flex-col justify-between min-h-[110px]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-100 font-bold">
                  Sponsored Quota
                </span>
                <h3 className="text-xl font-bold mt-1 leading-snug">
                  Activate daily verified ad engagement
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold font-mono mt-4">
                <span>EXPLORE AD ENGINE</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/15 rounded-full blur-2xl pointer-events-none"></div>
          </div>

          {/* Social Proof Node Bento Card */}
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                <img
                  className="w-8 h-8 rounded-full border-2 border-zinc-900 object-cover"
                  alt="Investor"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAsjvl4ycWCRB2iCP_0bD7inGw1EOLP64OJhyyZdYmV4CEyrilxq8KDwm5VIg2O3jK4QMH6i0VSLntHBeIIUETqu__Spa3Yh6PMTqNHhCKABUSA79Lue5C4pvMSqd7lrvFI6Eh8hi50ZB3RhZgiocCNwBdVd4ALoqjhieSCmoXL9-eRcPG8VSxkfqSRuRJd6PEB8se1C62QXrvQJl_0baNWfmtbFzftucJd-27valwa6TYbebwi21URA"
                />
                <img
                  className="w-8 h-8 rounded-full border-2 border-zinc-900 object-cover"
                  alt="Investor"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBi0tg8marjWfYZXm32x2LZJlvefCqz8T07vDjEqRZw4V0Pf2AXedVQn98OjA2lbCiVHrJFDBJCR8O3ItZZ0ktCldc4FsqcNsYGIppdvHEer7ehibhEeH-fffIRKrPs5f8FkCjXV-ZZjV7hzFa2CUT-UoTd1q_7HTPJe76q2790KQ_MYYnnNpAvbg9ks09BHZPAuS57RR7IraFbRqgMpWqfXXX7dp8TIqP-javhIOn9ebMr1e5I2S00Mg"
                />
                <img
                  className="w-8 h-8 rounded-full border-2 border-zinc-900 object-cover"
                  alt="Investor"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDChhU7xfWAOpnN1BvY9YWp6FtUWTFa71Q7UXSqoMX0eT2qaYoN5yTeA1ZRG4mkvVagMnwB3dP32Z9wjQ0GPp0amLBX0pkyR5pl8iUBwmUkKfEWumncI2ryeYo7_3dsZ4iDhnQpk2LC2o8C9LPNASTZfa8KuGz7NRfDuXXnNs42aqkW1xPYtblo9jCU0THSOJWor0psXg9Fz5GOGwS8GRMu4F0i1Lt_UzDZDATXkYaOPD3nDTtZQhr6DA"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-white font-mono">5,000+ OPERATORS</p>
                <p className="text-[10px] text-zinc-500">Global Verified Liquidity</p>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
