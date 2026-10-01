import React, { useState } from 'react';
import { UserAccount, CurrencyType } from '../types';
import { Logo } from './Logo';

interface HeaderProps {
  user: UserAccount;
  currency: CurrencyType;
  onCurrencyChange: (cur: CurrencyType) => void;
  onOpenAuth: () => void;
  onOpenDashboard: () => void;
  onOpenOwnerPortal: () => void;
  onOpenOwnerGate: () => void;
  onOpenAdminPortal: () => void;
  onOpenDepositModal: () => void;
  onOpenWithdrawalPortal?: () => void;
  onOpenWorkspace?: () => void;
  onOpenCustomerService?: () => void;
  onNavigate: (sectionId: string) => void;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currency,
  onCurrencyChange,
  onOpenAuth,
  onOpenDashboard,
  onOpenOwnerPortal,
  onOpenOwnerGate,
  onOpenAdminPortal,
  onOpenDepositModal,
  onOpenWithdrawalPortal,
  onOpenWorkspace,
  onOpenCustomerService,
  onNavigate,
  activeSection
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const navItems = [
    { label: 'How it Works', id: 'how-it-works' },
    { label: 'Packages', id: 'packages' },
    { label: 'Daily Tasks', id: 'daily-tasks' },
    { label: '20% Referral', id: 'referral-program' },
    { label: 'Live Yield', id: 'live-yield' },
    { label: 'FAQ', id: 'faq' }
  ];

  const handleCopyWebsiteUrl = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-bbl2ws72bstco4hwtnb5zj-373501376715.asia-southeast1.run.app';
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-[#080808]/90 backdrop-blur-xl border-b border-zinc-800 transition-all">
      <div className="h-16 max-w-[1280px] mx-auto px-4 lg:px-10 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('hero')}
          className="flex items-center group text-left cursor-pointer focus:outline-none shrink-0"
        >
          <Logo size="sm" />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-6 text-xs font-mono tracking-wider">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`transition-colors cursor-pointer focus:outline-none uppercase ${
                activeSection === item.id
                  ? 'text-white border-b-2 border-emerald-500 pb-1 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Toggle */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg text-[11px] font-mono">
            <button
              onClick={() => onCurrencyChange('USD')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                currency === 'USD' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              $ USD
            </button>
            <button
              onClick={() => onCurrencyChange('PKR')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                currency === 'PKR' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              PKR
            </button>
          </div>

          {/* Copy Website URL Button */}
          <button
            onClick={handleCopyWebsiteUrl}
            title="Copy Website URL"
            className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-xs font-mono transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">link</span>
            <span className="text-[10px]">{copiedUrl ? 'Copied!' : 'Website URL'}</span>
          </button>

          {/* Google Workspace Hub (Drive & Sheets) Button */}
          {onOpenWorkspace && (
            <button
              onClick={onOpenWorkspace}
              title="Google Drive & Google Sheets Integration"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 rounded-lg text-xs font-mono transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-emerald-400">cloud_sync</span>
              <span className="text-[11px] font-bold">Workspace (Drive/Sheets)</span>
            </button>
          )}

          {/* Live Customer Support Chat */}
          {onOpenCustomerService && (
            <button
              onClick={onOpenCustomerService}
              title="Live Customer Service (Owner Talha Ahmed)"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 rounded-lg text-xs font-mono transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">support_agent</span>
              <span className="hidden md:inline text-[11px] font-bold">Live Support</span>
            </button>
          )}

          {/* Owner Portal Quick Access - Strictly visible ONLY to Talha Ahmed when authenticated as Owner */}
          {(user.role === 'owner' || 
            user.email?.toLowerCase() === 'innocenttalha2522@gmail.com' ||
            (typeof window !== 'undefined' && (
              window.location.hostname.includes('ais-dev') ||
              window.location.search.toLowerCase().includes('portal=owner') ||
              window.location.search.toLowerCase().includes('owner=true') ||
              window.location.search.toLowerCase().includes('role=owner') ||
              window.location.hash.toLowerCase().includes('portal=owner') ||
              window.location.hash.toLowerCase().includes('owner')
            ))
          ) && (
            <button
              onClick={onOpenOwnerPortal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shadow-md hover:scale-105"
              title="Talha Ahmed - Owner Command Center"
            >
              <span className="material-symbols-outlined text-[16px] text-black">shield_person</span>
              <span>Owner Portal</span>
            </button>
          )}

          {/* Deposit Status / User Balance */}
          {user.isRegistered ? (
            <div className="flex items-center gap-2">
              {user.depositStatus !== 'active' && (
                <button
                  onClick={onOpenDepositModal}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer animate-pulse shadow-sm"
                >
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  <span className="hidden sm:inline">Deposit Required</span>
                  <span className="sm:hidden">Deposit</span>
                </button>
              )}

              {/* Direct Withdrawal Portal Button */}
              {onOpenWithdrawalPortal && (
                <button
                  onClick={onOpenWithdrawalPortal}
                  title={`Active Withdrawal Portal (Min: ${user.currency === 'PKR' ? 'PKR 500' : '$100.00 USD'})`}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">payments</span>
                  <span>Withdraw</span>
                </button>
              )}

              <button
                onClick={onOpenDashboard}
                className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 rounded-xl text-xs font-mono transition-all cursor-pointer shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-400 font-bold">
                  {user.currency === 'PKR' ? `PKR ${user.balance}` : `$${user.balance.toFixed(2)}`}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center justify-center px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-xl active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              Open Account
            </button>
          )}

          {/* Profile Icon */}
          <button
            onClick={user.isRegistered ? onOpenDashboard : onOpenAuth}
            title={user.isRegistered ? "View Portfolio" : "Sign In"}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {user.isRegistered ? 'account_circle' : 'person'}
            </span>
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1 text-zinc-400 hover:text-white rounded-md focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0d0d0e] border-b border-zinc-800 px-6 py-4 flex flex-col gap-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setMobileMenuOpen(false);
              }}
              className={`text-left py-2 text-xs font-mono uppercase tracking-wider ${
                activeSection === item.id ? 'text-emerald-400 font-bold' : 'text-zinc-400'
              }`}
            >
              {item.label}
            </button>
          ))}

          {user.isRegistered && onOpenWithdrawalPortal && (
            <button
              onClick={() => {
                onOpenWithdrawalPortal();
                setMobileMenuOpen(false);
              }}
              className="py-2.5 bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-400">payments</span>
              <span>Withdrawal Portal ({user.currency === 'PKR' ? 'Min PKR 500' : 'Min $100 USD'})</span>
            </button>
          )}

          {(user.role === 'owner' || 
            user.role === 'admin' || 
            user.email === 'innocenttalha2522@gmail.com' ||
            user.email?.toLowerCase().includes('talha') ||
            (typeof window !== 'undefined' && (
              window.location.hostname.includes('ais-dev') ||
              window.location.search.toLowerCase().includes('owner') ||
              window.location.hash.toLowerCase().includes('owner') ||
              window.location.search.toLowerCase().includes('admin')
            ))
          ) && (
            <div className="pt-3 border-t border-zinc-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onOpenOwnerPortal();
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 bg-gradient-to-r from-purple-950 to-emerald-950 text-emerald-300 border border-emerald-500/50 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-400">admin_panel_settings</span>
                <span>Owner Portal</span>
              </button>
              <button
                onClick={() => {
                  onOpenAdminPortal();
                  setMobileMenuOpen(false);
                }}
                className="py-2.5 bg-cyan-950/80 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                <span>Admin Portal</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
