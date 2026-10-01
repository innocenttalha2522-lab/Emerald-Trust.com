import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14'
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const subtitleSizes = {
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-[10px]',
    xl: 'text-xs'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon SVG Emblem */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-emerald-500/30 rounded-xl blur-[6px] transform scale-110" />
        
        {/* Main Emblem SVG */}
        <svg
          viewBox="0 0 100 100"
          className="relative w-full h-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shield / Octagon Outer Frame */}
          <path
            d="M50 4 L88 24 V66 L50 96 L12 66 V24 Z"
            fill="url(#emeraldGradientDark)"
            stroke="url(#emeraldGoldStroke)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Inner Geometric Trust Facets */}
          <polygon
            points="50,14 80,30 50,54 20,30"
            fill="url(#emeraldFacetTop)"
            opacity="0.9"
          />
          <polygon
            points="20,30 50,54 50,86 18,62"
            fill="url(#emeraldFacetLeft)"
            opacity="0.8"
          />
          <polygon
            points="80,30 50,54 50,86 82,62"
            fill="url(#emeraldFacetRight)"
            opacity="0.95"
          />

          {/* Central Diamond Sparkle Node */}
          <circle cx="50" cy="50" r="5" fill="#34D399" filter="url(#glowFilter)" />
          <path
            d="M50 38 L52 48 L62 50 L52 52 L50 62 L48 52 L38 50 L48 48 Z"
            fill="#FFFFFF"
          />

          {/* Precision Gradients */}
          <defs>
            <linearGradient id="emeraldGradientDark" x1="50" y1="4" x2="50" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="50%" stopColor="#022c22" />
              <stop offset="100%" stopColor="#051b14" />
            </linearGradient>

            <linearGradient id="emeraldGoldStroke" x1="12" y1="4" x2="88" y2="96" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="45%" stopColor="#10b981" />
              <stop offset="75%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <linearGradient id="emeraldFacetTop" x1="50" y1="14" x2="50" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <linearGradient id="emeraldFacetLeft" x1="20" y1="30" x2="50" y2="86" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>

            <linearGradient id="emeraldFacetRight" x1="80" y1="30" x2="50" y2="86" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <filter id="glowFilter" x="35" y="35" width="30" height="30" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Typography Wordmark */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-wider uppercase font-mono text-white ${titleSizes[size]}`}>
              Emerald<span className="text-emerald-400">Trust</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/30">
              OFFICIAL
            </span>
          </div>
          <span className={`font-mono uppercase tracking-widest text-zinc-400 font-medium ${subtitleSizes[size]}`}>
            Capital Vault & Ad Earnings
          </span>
        </div>
      )}
    </div>
  );
};
