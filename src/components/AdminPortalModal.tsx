import React, { useState } from 'react';
import { DepositRequest } from '../types';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposits: DepositRequest[];
  onApproveDeposit: (depositId: string) => void;
  onRejectDeposit: (depositId: string, reason?: string) => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  deposits,
  onApproveDeposit,
  onRejectDeposit
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-bbl2ws72bstco4hwtnb5zj-373501376715.asia-southeast1.run.app';
  const adminPortalUrl = `${currentUrl}/?portal=admin`;

  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const approvedDeposits = deposits.filter(d => d.status === 'approved');

  // Compute Total Capital metrics purely from real approved deposits
  const totalApprovedCapitalPKR = approvedDeposits
    .filter(d => d.currency === 'PKR')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalApprovedCapitalUSD = approvedDeposits
    .filter(d => d.currency === 'USD')
    .reduce((sum, d) => sum + d.amount, 0);

  const combinedTotalCapitalPKR = totalApprovedCapitalPKR + (totalApprovedCapitalUSD * 280);

  const pendingCapitalPKR = pendingDeposits
    .filter(d => d.currency === 'PKR')
    .reduce((sum, d) => sum + d.amount, 0);
  const pendingCapitalUSD = pendingDeposits
    .filter(d => d.currency === 'USD')
    .reduce((sum, d) => sum + d.amount, 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(adminPortalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0e1013] rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-cyan-500/30 text-white relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold">
              <span className="material-symbols-outlined text-[26px]">verified_user</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Compliance &amp; Admin Portal</h3>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500 text-black text-[10px] font-black font-mono">
                  LIMITED ACCESS
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Deposit verification, total client deposited capital, and receipt clearance queue.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">link</span>
            <span>{copiedLink ? 'Admin Link Copied!' : 'Copy Admin URL'}</span>
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="mb-4 p-3 bg-cyan-950/80 border border-cyan-500 text-cyan-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{feedback}</span>
          </div>
        )}

        {/* Capital & Queue Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 font-mono">
          <div className="bg-gradient-to-br from-emerald-950/60 to-zinc-900 p-3.5 rounded-xl border border-emerald-500/40">
            <span className="text-[10px] uppercase text-emerald-400 font-bold block">Total Capital Deposited</span>
            <span className="text-lg font-bold text-white mt-1 block">
              PKR {combinedTotalCapitalPKR.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-400">
              PKR {totalApprovedCapitalPKR.toLocaleString()} + ${totalApprovedCapitalUSD}.00 USD
            </span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] uppercase text-amber-400 font-bold block">Pending Inbound Capital</span>
            <span className="text-lg font-bold text-amber-400 mt-1 block">
              {pendingCapitalPKR > 0 ? `PKR ${pendingCapitalPKR.toLocaleString()}` : pendingCapitalUSD > 0 ? `$${pendingCapitalUSD}` : 'PKR 0'}
            </span>
            <span className="text-[10px] text-zinc-400">
              {pendingDeposits.length} Requests Pending Verification
            </span>
          </div>

          <div className="bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] uppercase text-cyan-400 font-bold block">Sync Status</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync
            </span>
            <span className="text-[10px] text-zinc-400">
              Auto-updating real-time receipts
            </span>
          </div>
        </div>

        {/* Deposit Verification List */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white">Pending Client Receipts</h4>

          {deposits.length === 0 ? (
            <div className="p-8 text-center bg-zinc-900/40 rounded-xl border border-zinc-800 text-zinc-500 text-xs font-mono">
              No deposit requests currently recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {deposits.map((dep) => (
                <div
                  key={dep.id}
                  className={`p-4 rounded-xl border transition-all ${
                    dep.status === 'pending'
                      ? 'bg-zinc-900/90 border-amber-500/40'
                      : dep.status === 'approved'
                      ? 'bg-zinc-900/40 border-emerald-500/30'
                      : 'bg-zinc-900/20 border-red-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{dep.userName}</span>
                        <span className="text-xs font-mono text-zinc-400">({dep.userEmail})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          dep.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : dep.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}>
                          {dep.status}
                        </span>
                      </div>
                      <p className="text-xs text-cyan-400 font-mono font-bold mt-1">
                        Package: {dep.packageName} • {dep.currency === 'PKR' ? `PKR ${dep.amount}` : `$${dep.amount}.00`}
                      </p>
                    </div>

                    <span className="text-xs font-mono text-zinc-500">{dep.createdAt}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 text-xs font-mono">
                    <div className="bg-black/40 p-2 rounded-lg">
                      <span className="text-zinc-500 block text-[10px]">Payment Method:</span>
                      <span className="text-white font-bold">{dep.paymentMethod}</span>
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg">
                      <span className="text-zinc-500 block text-[10px]">Sender Account/Phone:</span>
                      <span className="text-white font-bold">{dep.senderAccountOrPhone}</span>
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg">
                      <span className="text-zinc-500 block text-[10px]">TRX Reference:</span>
                      <span className="text-cyan-400 font-bold">{dep.transactionReference}</span>
                    </div>
                  </div>

                  {dep.status === 'pending' && (
                    <div className="flex gap-2 pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => {
                          onApproveDeposit(dep.id);
                          setFeedback(`Deposit ${dep.id} approved by Admin.`);
                          setTimeout(() => setFeedback(null), 3000);
                        }}
                        className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>Approve Package</span>
                      </button>
                      <button
                        onClick={() => {
                          onRejectDeposit(dep.id, 'Transaction ID not found in bank ledger');
                          setFeedback(`Deposit ${dep.id} rejected.`);
                          setTimeout(() => setFeedback(null), 3000);
                        }}
                        className="px-4 py-2 bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
