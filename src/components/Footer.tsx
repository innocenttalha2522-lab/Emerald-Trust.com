import React, { useState } from 'react';
import { Logo } from './Logo';

interface FooterProps {
  onOpenOwnerPortal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenOwnerPortal }) => {
  const [modalTitle, setModalTitle] = useState<string | null>(null);

  const renderModalContent = () => {
    if (!modalTitle) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e0e3e5] relative animate-in fade-in">
          <button
            onClick={() => setModalTitle(null)}
            className="absolute top-4 right-4 text-[#545f73] hover:text-[#191c1e] p-1 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h3 className="text-xl font-bold text-[#003527] mb-3">{modalTitle}</h3>
          <p className="text-sm text-[#404944] leading-relaxed">
            {modalTitle === 'Risk Disclosure'
              ? 'Institutional financial engagements and ad yield allocations carry structural market parameters. All member balances are protected via collateralized liquidity reserves and verified multi-sig custody.'
              : modalTitle === 'Privacy Policy'
              ? 'Emerald Trust enforces strict zero-knowledge encryption for all investor telemetry and personal KYC records. We do not sell or monetize personal investor data.'
              : 'Emerald Trust terms govern the strategic ad engagement infrastructure, 14% lifelong affiliate distribution, and sub-second settlement protocols.'}
          </p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setModalTitle(null)}
              className="px-5 py-2 bg-[#003527] text-white text-xs font-semibold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <footer className="w-full bg-[#e0e3e5]/80 py-12 border-t border-[#bfc9c3]">
      {renderModalContent()}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-10 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Col 1: Brand */}
        <div className="col-span-1 md:col-span-1 flex flex-col gap-3">
          <div className="flex items-center">
            <Logo size="sm" />
          </div>
          <p className="text-xs sm:text-sm text-[#404944] leading-relaxed">
            Securing your financial future with institutional-grade earning strategies.
          </p>
        </div>

        {/* Col 2: Company */}
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-sm text-[#191c1e] mb-1">Company</h4>
          <a
            href="#hero"
            className="text-xs sm:text-sm text-[#404944] hover:text-[#003527] transition-colors"
          >
            About Us
          </a>
          <a
            href="#how-it-works"
            className="text-xs sm:text-sm text-[#404944] hover:text-[#003527] transition-colors"
          >
            Careers
          </a>
          <a
            href="#live-yield"
            className="text-xs sm:text-sm text-[#404944] hover:text-[#003527] transition-colors"
          >
            Contact Desk
          </a>
        </div>

        {/* Col 3: Legal */}
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-sm text-[#191c1e] mb-1">Legal</h4>
          <button
            onClick={() => setModalTitle('Privacy Policy')}
            className="text-left text-xs sm:text-sm text-[#404944] hover:text-[#003527] transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setModalTitle('Terms of Service')}
            className="text-left text-xs sm:text-sm text-[#404944] hover:text-[#003527] transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <button
            onClick={() => setModalTitle('Risk Disclosure')}
            className="text-left text-xs sm:text-sm text-[#404944] hover:text-[#003527] transition-colors cursor-pointer"
          >
            Risk Disclosure
          </button>
        </div>

        {/* Col 4: Social */}
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-sm text-[#191c1e] mb-1">Social</h4>
          <div className="flex gap-4">
            <span
              title="Global Network"
              className="material-symbols-outlined text-[#404944] hover:text-[#003527] cursor-pointer transition-transform hover:scale-110"
            >
              public
            </span>
            <span
              title="Email Compliance"
              className="material-symbols-outlined text-[#404944] hover:text-[#003527] cursor-pointer transition-transform hover:scale-110"
            >
              mail
            </span>
            <span
              title="Custody Shield"
              className="material-symbols-outlined text-[#404944] hover:text-[#003527] cursor-pointer transition-transform hover:scale-110"
            >
              shield
            </span>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-10 pt-4 border-t border-[#bfc9c3]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#404944]">
        <div>© 2024 Emerald Trust Institutional Earning Platform. All rights reserved.</div>
        {onOpenOwnerPortal && (
          <button
            onClick={onOpenOwnerPortal}
            className="flex items-center gap-1.5 text-[11px] font-mono text-[#545f73] hover:text-[#003527] transition-colors cursor-pointer group"
            title="Owner Command Center Access (Talha Ahmed)"
          >
            <span className="material-symbols-outlined text-[14px] text-amber-600 group-hover:text-amber-500">admin_panel_settings</span>
            <span className="font-semibold">Owner Portal</span>
          </button>
        )}
      </div>
    </footer>
  );
};
