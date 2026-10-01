import React, { useState } from 'react';
import { FAQ_ITEMS } from '../data/mockData';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 lg:py-24 bg-[#f2f4f6]/60 border-t border-[#e0e3e5] px-4 lg:px-10">
      <div className="max-w-[860px] mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#eceef0] rounded-full text-xs font-semibold text-[#003527] mb-3">
            <span className="material-symbols-outlined text-[14px]">help</span>
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#191c1e] tracking-tight mb-3 font-['Inter']">
            Institutional Transparency &amp; Operations
          </h2>
          <p className="text-sm sm:text-base text-[#404944] leading-relaxed">
            Everything you need to know about our daily yield mechanics, referral tiers, and audited capital security.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen ? 'border-[#003527] shadow-sm' : 'border-[#e0e3e5] hover:border-[#bfc9c3]'
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#003527]" />
                    <span className="text-sm sm:text-base font-bold text-[#191c1e] tracking-tight">
                      {item.question}
                    </span>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full bg-[#eceef0] flex items-center justify-center text-[#003527] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-[#003527] text-white' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-[#404944] leading-relaxed border-t border-[#e0e3e5]/50 mt-1">
                    <p>{item.answer}</p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-[#545f73]">
                      <span className="material-symbols-outlined text-[14px] text-[#003527]">verified_user</span>
                      <span>Category: {item.category}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
