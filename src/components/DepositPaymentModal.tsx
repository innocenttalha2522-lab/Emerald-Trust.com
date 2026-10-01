import React, { useState } from 'react';
import { PackageTier, CurrencyType, OwnerPaymentDetails, DepositRequest } from '../types';
import { OWNER_PAYMENT_DETAILS, PACKAGE_TIERS } from '../data/mockData';

interface DepositPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier?: PackageTier | null;
  currency: CurrencyType;
  onCurrencyChange: (cur: CurrencyType) => void;
  userEmail: string;
  userName: string;
  onDepositSubmitted: (req: DepositRequest) => void;
}

export const DepositPaymentModal: React.FC<DepositPaymentModalProps> = ({
  isOpen,
  onClose,
  selectedTier,
  currency,
  onCurrencyChange,
  userEmail,
  userName,
  onDepositSubmitted
}) => {
  const [activePackageId, setActivePackageId] = useState<string>(selectedTier?.id || 'gold');
  
  // Strict geo-targeted payment method setup
  const isPakistani = currency === 'PKR';
  const [paymentMethod, setPaymentMethod] = useState<'Meezan Bank' | 'Easypaisa' | 'Payoneer Citibank'>(
    isPakistani ? 'Easypaisa' : 'Payoneer Citibank'
  );

  // Sync payment method when currency changes
  React.useEffect(() => {
    if (currency === 'PKR') {
      if (paymentMethod === 'Payoneer Citibank') {
        setPaymentMethod('Easypaisa');
      }
    } else {
      setPaymentMethod('Payoneer Citibank');
    }
  }, [currency]);

  const [senderName, setSenderName] = useState(userName || '');
  const [senderAccountOrPhone, setSenderAccountOrPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentPkg = PACKAGE_TIERS.find(p => p.id === activePackageId) || PACKAGE_TIERS[1];
  const requiredAmount = currency === 'PKR' ? currentPkg.pkrPrice : currentPkg.usdPrice;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef || !senderAccountOrPhone) {
      alert('Please enter your transaction ID / reference and sender phone/account.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/deposits/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          userName: senderName || userName || userEmail,
          packageId: currentPkg.id,
          currency,
          paymentMethod,
          senderName: senderName || userName,
          senderAccountOrPhone,
          transactionReference: transactionRef
        })
      });

      const data = await response.json();
      if (data.success && data.depositRequest) {
        onDepositSubmitted(data.depositRequest);
        setSuccessMessage('Deposit proof submitted successfully to Owner (Talha Ahmed)! Your Ad Watching activation will unlock as soon as verification completes.');
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 3000);
      } else {
        // Fallback in case of network issue
        const fallbackReq: DepositRequest = {
          id: `DEP-${Math.floor(10000 + Math.random() * 90000)}`,
          userId: userEmail,
          userEmail,
          userName: senderName || userName,
          packageId: currentPkg.id,
          packageName: currentPkg.name,
          currency,
          amount: requiredAmount,
          paymentMethod,
          senderName: senderName || userName,
          senderAccountOrPhone,
          transactionReference: transactionRef,
          status: 'pending',
          createdAt: 'Just now',
          notes: 'Submitted for Owner verification.'
        };
        onDepositSubmitted(fallbackReq);
        setSuccessMessage('Deposit proof recorded! Awaiting Owner/Admin approval to activate daily ad yields.');
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 3000);
      }
    } catch (err) {
      // Local fallback
      const fallbackReq: DepositRequest = {
        id: `DEP-${Math.floor(10000 + Math.random() * 90000)}`,
        userId: userEmail,
        userEmail,
        userName: senderName || userName,
        packageId: currentPkg.id,
        packageName: currentPkg.name,
        currency,
        amount: requiredAmount,
        paymentMethod,
        senderName: senderName || userName,
        senderAccountOrPhone,
        transactionReference: transactionRef,
        status: 'pending',
        createdAt: 'Just now',
        notes: 'Submitted for Owner verification.'
      };
      onDepositSubmitted(fallbackReq);
      setSuccessMessage('Deposit proof recorded! Awaiting Owner/Admin approval to activate daily ad yields.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#101214] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-zinc-800 text-white relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
            <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Activate Deposit Package</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                Official Channels
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Send exact payment to official Owner accounts below and enter your transaction ID to unlock Ad Watching immediately.
            </p>
          </div>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center justify-between bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 mb-5">
          <span className="text-xs font-semibold text-zinc-300">Choose Client Pricing Region:</span>
          <div className="flex bg-black p-1 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                onCurrencyChange('USD');
                setPaymentMethod('Payoneer Citibank');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currency === 'USD' ? 'bg-emerald-500 text-black shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🇺🇸 International ($ USD)
            </button>
            <button
              type="button"
              onClick={() => {
                onCurrencyChange('PKR');
                setPaymentMethod('Easypaisa');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                currency === 'PKR' ? 'bg-emerald-500 text-black shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🇵🇰 Pakistan (PKR / Rs)
            </button>
          </div>
        </div>

        {/* Package Selector Cards */}
        <div className="mb-6">
          <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
            Select Deposit Tier:
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {PACKAGE_TIERS.map((pkg) => {
              const price = currency === 'PKR' ? `PKR ${pkg.pkrPrice}` : `$${pkg.usdPrice}`;
              const isSelected = activePackageId === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setActivePackageId(pkg.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 block font-bold">
                    {pkg.badge || 'Tier'}
                  </span>
                  <p className="text-xs font-bold text-white mt-0.5 truncate">{pkg.name}</p>
                  <p className="text-base font-black text-emerald-400 mt-1 font-mono">{price}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{pkg.dailyAdsCount} Ads/Day (20% Ref)</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Gateway Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              {isPakistani ? '🇵🇰 Pakistan Payment Gateways:' : '🌐 International Payment Gateway:'}
            </label>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {isPakistani ? 'Easypaisa & Meezan Bank Only' : 'Payoneer USD Citibank Only'}
            </span>
          </div>

          {isPakistani ? (
            /* Pakistani users: Easypaisa & Meezan Bank */
            <div className="grid grid-cols-2 gap-2.5">
              {(['Easypaisa', 'Meezan Bank'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paymentMethod === method
                      ? 'bg-emerald-950/60 text-white border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {method === 'Easypaisa' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>}
                  {method === 'Meezan Bank' && <span className="material-symbols-outlined text-[16px] text-emerald-400">account_balance</span>}
                  <span>{method === 'Easypaisa' ? 'Easypaisa (Instant)' : 'Meezan Bank (Direct)'}</span>
                </button>
              ))}
            </div>
          ) : (
            /* International users: Payoneer Citibank */
            <div className="w-full">
              <div className="py-2.5 px-4 rounded-xl text-xs font-bold border border-emerald-500 bg-emerald-950/60 text-white ring-2 ring-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">language</span>
                  <span>Payoneer — Citibank USD Receiving Account</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  GLOBAL WIRE
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Active Payment Channel Account Details Box */}
        <div className="bg-zinc-900/90 rounded-xl p-4 border border-zinc-800 mb-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Recipient Account Details:
            </span>
            <span className="text-xs font-bold text-zinc-300 font-mono">
              Amount Due: <span className="text-emerald-400">{currency === 'PKR' ? `PKR ${requiredAmount}` : `$${requiredAmount}.00`}</span>
            </span>
          </div>

          {paymentMethod === 'Meezan Bank' && (
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg">
                <span className="text-zinc-400">Bank Name:</span>
                <span className="text-white font-bold">{OWNER_PAYMENT_DETAILS.meezan.bankName}</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg">
                <span className="text-zinc-400">Account Title:</span>
                <span className="text-white font-bold">{OWNER_PAYMENT_DETAILS.meezan.accountTitle}</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg">
                <span className="text-zinc-400">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{OWNER_PAYMENT_DETAILS.meezan.accountNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(OWNER_PAYMENT_DETAILS.meezan.accountNumber, 'meezan-acc')}
                    className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-[10px] font-bold cursor-pointer"
                  >
                    {copiedKey === 'meezan-acc' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg">
                <span className="text-zinc-400">IBAN:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-[11px]">{OWNER_PAYMENT_DETAILS.meezan.iban}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(OWNER_PAYMENT_DETAILS.meezan.iban, 'meezan-iban')}
                    className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-[10px] font-bold cursor-pointer"
                  >
                    {copiedKey === 'meezan-iban' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'Easypaisa' && (
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg">
                <span className="text-zinc-400">Account Name:</span>
                <span className="text-white font-bold">{OWNER_PAYMENT_DETAILS.easypaisa.accountTitle}</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg">
                <span className="text-zinc-400">Easypaisa Mobile Number:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-sm">{OWNER_PAYMENT_DETAILS.easypaisa.accountNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(OWNER_PAYMENT_DETAILS.easypaisa.accountNumber, 'easypaisa')}
                    className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-[10px] font-bold cursor-pointer"
                  >
                    {copiedKey === 'easypaisa' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'Payoneer Citibank' && (
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg">
                <span className="text-zinc-400">Beneficiary Name:</span>
                <span className="text-white font-bold">{OWNER_PAYMENT_DETAILS.payoneer.beneficiaryName}</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg">
                <span className="text-zinc-400">Bank Name:</span>
                <span className="text-white font-bold">{OWNER_PAYMENT_DETAILS.payoneer.bankName}</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg">
                <span className="text-zinc-400">Routing (ABA):</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{OWNER_PAYMENT_DETAILS.payoneer.routingNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(OWNER_PAYMENT_DETAILS.payoneer.routingNumber, 'payo-routing')}
                    className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-[10px] font-bold cursor-pointer"
                  >
                    {copiedKey === 'payo-routing' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg">
                <span className="text-zinc-400">SWIFT Code:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{OWNER_PAYMENT_DETAILS.payoneer.swiftCode}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(OWNER_PAYMENT_DETAILS.payoneer.swiftCode, 'payo-swift')}
                    className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-[10px] font-bold cursor-pointer"
                  >
                    {copiedKey === 'payo-swift' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg">
                <span className="text-zinc-400">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">{OWNER_PAYMENT_DETAILS.payoneer.accountNumber}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(OWNER_PAYMENT_DETAILS.payoneer.accountNumber, 'payo-acc')}
                    className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded text-[10px] font-bold cursor-pointer"
                  >
                    {copiedKey === 'payo-acc' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Your Sender Account / Mobile
              </label>
              <input
                type="text"
                required
                value={senderAccountOrPhone}
                onChange={(e) => setSenderAccountOrPhone(e.target.value)}
                placeholder="e.g. 03001234567 or Bank Acc"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2 text-xs text-white focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Transaction ID / TRX Reference
              </label>
              <input
                type="text"
                required
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. TRX-994821 or TID #10294"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2 text-xs font-mono text-emerald-400 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting Verification...</span>
            ) : (
              <>
                <span>Submit Deposit Proof &amp; Request Activation</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
