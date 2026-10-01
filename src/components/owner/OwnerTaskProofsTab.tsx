import React, { useState, useMemo } from 'react';
import { TaskSubmission, UserAccount, CurrencyType } from '../../types';

interface OwnerTaskProofsTabProps {
  submissions: TaskSubmission[];
  onApprove: (submissionId: string) => void;
  onReject: (submissionId: string, reason?: string) => void;
  onBulkApprove?: (submissionIds: string[]) => Promise<void> | void;
  allUsers?: UserAccount[];
  currency?: CurrencyType;
}

export const OwnerTaskProofsTab: React.FC<OwnerTaskProofsTabProps> = ({
  submissions,
  onApprove,
  onReject,
  onBulkApprove,
  allUsers = []
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofModalSub, setSelectedProofModalSub] = useState<TaskSubmission | null>(null);
  const [rejectingSubId, setRejectingSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Screenshot does not clearly show completed subscription or required action.');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Bulk action selection state
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesUser = (sub.userEmail || '').toLowerCase().includes(query) || (sub.userName || '').toLowerCase().includes(query);
        const matchesTask = (sub.taskTitle || '').toLowerCase().includes(query) || (sub.id || '').toLowerCase().includes(query);
        const matchesNotes = (sub.notes || '').toLowerCase().includes(query);
        if (!matchesUser && !matchesTask && !matchesNotes) return false;
      }
      return true;
    });
  }, [submissions, statusFilter, searchQuery]);

  // Pending submissions currently in view
  const pendingInView = useMemo(() => {
    return filteredSubmissions.filter(s => s.status === 'pending');
  }, [filteredSubmissions]);

  // Check selection status of pending items in current view
  const selectedPendingInView = useMemo(() => {
    return pendingInView.filter(s => selectedSubIds.includes(s.id));
  }, [pendingInView, selectedSubIds]);

  const isAllPendingInViewSelected = pendingInView.length > 0 && selectedPendingInView.length === pendingInView.length;
  const isPartiallySelected = selectedPendingInView.length > 0 && !isAllPendingInViewSelected;

  // Toggle selection for a single submission
  const toggleSelectSub = (id: string) => {
    setSelectedSubIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle Select All Pending in current view
  const toggleSelectAllPendingInView = () => {
    if (isAllPendingInViewSelected) {
      // Deselect all pending in view
      const inViewIds = new Set(pendingInView.map(p => p.id));
      setSelectedSubIds(prev => prev.filter(id => !inViewIds.has(id)));
    } else {
      // Select all pending in view
      const merged = new Set([...selectedSubIds, ...pendingInView.map(p => p.id)]);
      setSelectedSubIds(Array.from(merged));
    }
  };

  // Select all pending submissions across the entire database
  const selectAllPendingGlobally = () => {
    const allPendingIds = submissions.filter(s => s.status === 'pending').map(s => s.id);
    setSelectedSubIds(allPendingIds);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedSubIds([]);
  };

  // Handle single approval with feedback
  const handleApproveWithFeedback = (sub: TaskSubmission) => {
    onApprove(sub.id);
    // Unselect if was selected
    setSelectedSubIds(prev => prev.filter(id => id !== sub.id));
    const amountStr = sub.userCurrency === 'PKR' ? `${sub.rewardPkr || 10} PKR` : `$${(sub.rewardUsd || 1.0).toFixed(2)} USD`;
    setFeedbackToast(`Verified & Credited: +${amountStr} dispatched to ${sub.userName} (${sub.userEmail})!`);
    if (selectedProofModalSub?.id === sub.id) {
      setSelectedProofModalSub(null);
    }
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Handle Bulk Approval in One Click
  const handleBulkApprove = async (idsToApprove?: string[]) => {
    const targetIds = idsToApprove || selectedSubIds;
    if (targetIds.length === 0) return;

    setIsBulkApproving(true);
    try {
      const selectedSubs = submissions.filter(s => targetIds.includes(s.id) && s.status === 'pending');
      let totalPkr = 0;
      let totalUsd = 0;

      selectedSubs.forEach(s => {
        if (s.userCurrency === 'PKR') {
          totalPkr += (s.rewardPkr || 10);
        } else {
          totalUsd += (s.rewardUsd || 1.0);
        }
      });

      if (onBulkApprove) {
        await onBulkApprove(targetIds);
      } else {
        for (const id of targetIds) {
          onApprove(id);
        }
      }

      const rewardSummaryParts = [];
      if (totalPkr > 0) rewardSummaryParts.push(`${totalPkr} PKR`);
      if (totalUsd > 0) rewardSummaryParts.push(`$${totalUsd.toFixed(2)} USD`);
      const rewardSummary = rewardSummaryParts.length > 0 ? ` (+${rewardSummaryParts.join(' & ')})` : '';

      setFeedbackToast(
        `Bulk Approved: Successfully verified and credited ${selectedSubs.length} task submissions in one click${rewardSummary}!`
      );
      setSelectedSubIds(prev => prev.filter(id => !targetIds.includes(id)));
      setTimeout(() => setFeedbackToast(null), 5000);
    } catch (err) {
      setFeedbackToast(`Bulk approval process encountered an issue.`);
      setTimeout(() => setFeedbackToast(null), 3000);
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectingSubId) return;
    onReject(rejectingSubId, rejectReason);
    setSelectedSubIds(prev => prev.filter(id => id !== rejectingSubId));
    setRejectingSubId(null);
    if (selectedProofModalSub?.id === rejectingSubId) {
      setSelectedProofModalSub(null);
    }
    setFeedbackToast(`Task submission rejected with notice.`);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const getUserBalance = (email: string) => {
    const user = allUsers.find(u => (u?.email || '').toLowerCase() === (email || '').toLowerCase());
    return user ? user.balance : null;
  };

  // Calculate rewards preview for currently selected items
  const selectedRewardsSummary = useMemo(() => {
    const selectedSubs = submissions.filter(s => selectedSubIds.includes(s.id) && s.status === 'pending');
    let pkr = 0;
    let usd = 0;
    selectedSubs.forEach(s => {
      if (s.userCurrency === 'PKR') pkr += (s.rewardPkr || 10);
      else usd += (s.rewardUsd || 1.0);
    });
    return { count: selectedSubs.length, pkr, usd };
  }, [submissions, selectedSubIds]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl flex items-center justify-between text-emerald-300 font-mono text-xs shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{feedbackToast}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'pending'
              ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/20'
              : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Pending Review</span>
            {pendingCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {pendingCount}
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Requires owner credit</span>
        </div>

        <div
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'approved'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
              : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Verified &amp; Paid</span>
          <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {approvedCount}
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Rewards credited</span>
        </div>

        <div
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'rejected'
              ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/20'
              : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Rejected Proofs</span>
          <div className="text-2xl font-mono font-bold text-red-400 mt-1">
            {rejectedCount}
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Clients requested to retry</span>
        </div>

        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === 'all'
              ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-950/20'
              : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">Total Proofs</span>
          <div className="text-2xl font-mono font-bold text-zinc-100 mt-1">
            {submissions.length}
          </div>
          <span className="text-[10px] font-mono text-zinc-400">All submitted screenshots</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold capitalize transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tab === 'pending' ? `Pending (${pendingCount})` : tab}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email, name, task..."
            className="w-full bg-black border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500 placeholder:text-zinc-600"
          />
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-zinc-500 text-[16px]">
            search
          </span>
        </div>
      </div>

      {/* BULK ACTION CONTROLS BAR: Select Multiple Pending Submissions & Approve in One Click */}
      {pendingCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-emerald-500/40 rounded-3xl shadow-xl space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Selection Checkbox & Labels */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllPendingInViewSelected}
                  ref={el => {
                    if (el) el.indeterminate = isPartiallySelected;
                  }}
                  onChange={toggleSelectAllPendingInView}
                  className="w-5 h-5 rounded-md border-zinc-700 text-emerald-500 focus:ring-emerald-400 focus:ring-offset-0 bg-zinc-900 cursor-pointer accent-emerald-500"
                />
                <span className="text-xs font-mono font-bold text-white">
                  {isAllPendingInViewSelected ? 'Deselect All in View' : 'Select All Pending in View'}
                </span>
              </label>

              {/* Status Badge */}
              <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>
                  <strong>{selectedRewardsSummary.count}</strong> of <strong>{pendingCount}</strong> pending selected
                </span>
              </span>

              {/* Reward preview for selected */}
              {selectedRewardsSummary.count > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-[11px]">
                  Total Credit:{' '}
                  <strong>
                    {selectedRewardsSummary.pkr > 0 ? `${selectedRewardsSummary.pkr} PKR` : ''}
                    {selectedRewardsSummary.pkr > 0 && selectedRewardsSummary.usd > 0 ? ' + ' : ''}
                    {selectedRewardsSummary.usd > 0 ? `$${selectedRewardsSummary.usd.toFixed(2)} USD` : ''}
                  </strong>
                </span>
              )}
            </div>

            {/* Bulk Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* One-Click Approve Selected Submissions */}
              <button
                type="button"
                onClick={() => handleBulkApprove()}
                disabled={selectedRewardsSummary.count === 0 || isBulkApproving}
                className={`px-4 py-2 rounded-xl font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                  selectedRewardsSummary.count > 0 && !isBulkApproving
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black shadow-emerald-500/25 hover:scale-102'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700/60 cursor-not-allowed opacity-60'
                }`}
                title="Approve all currently selected pending submissions in one click"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isBulkApproving ? 'sync' : 'done_all'}
                </span>
                <span>
                  {isBulkApproving
                    ? 'Approving...'
                    : `Approve Selected (${selectedRewardsSummary.count})`}
                </span>
              </button>

              {/* Fast One-Click: Approve All Pending */}
              <button
                type="button"
                onClick={() => {
                  const allPendingIds = submissions.filter(s => s.status === 'pending').map(s => s.id);
                  handleBulkApprove(allPendingIds);
                }}
                disabled={pendingCount === 0 || isBulkApproving}
                className="px-3.5 py-2 rounded-xl font-mono font-bold text-xs bg-zinc-900 hover:bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Directly approve every pending submission currently in system in one click"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Approve All Pending ({pendingCount})</span>
              </button>

              {/* Select All Globally Shortcut */}
              {selectedRewardsSummary.count < pendingCount && (
                <button
                  type="button"
                  onClick={selectAllPendingGlobally}
                  className="px-3 py-2 rounded-xl font-mono text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                >
                  Select All ({pendingCount})
                </button>
              )}

              {/* Clear Selection */}
              {selectedRewardsSummary.count > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-3 py-2 rounded-xl font-mono text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center bg-zinc-950/40 border border-zinc-800 rounded-3xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <span className="material-symbols-outlined text-3xl">photo_library</span>
          </div>
          <div className="text-sm font-mono font-bold text-zinc-300">
            No {statusFilter !== 'all' ? statusFilter : ''} task screenshot proofs found
          </div>
          <p className="text-xs font-mono text-zinc-500 max-w-sm mx-auto">
            When clients complete daily tasks and upload their verification screenshots, their submissions appear here for your review and manual reward credit.
          </p>
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Verification Desk Active • Awaiting Real User Screenshot Uploads</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map(sub => {
            const rewardText = sub.userCurrency === 'PKR' ? `${sub.rewardPkr || 10} PKR` : `$${(sub.rewardUsd || 1.0).toFixed(2)} USD`;
            const currentBal = getUserBalance(sub.userEmail);
            const isSelected = selectedSubIds.includes(sub.id);

            return (
              <div
                key={sub.id}
                className={`p-5 rounded-3xl border transition-all ${
                  isSelected
                    ? 'bg-zinc-950/95 border-emerald-400 shadow-xl shadow-emerald-950/30 ring-2 ring-emerald-500/30'
                    : sub.status === 'pending'
                    ? 'bg-zinc-950/90 border-amber-500/40 shadow-xl shadow-amber-950/10'
                    : sub.status === 'approved'
                    ? 'bg-zinc-950/60 border-emerald-500/30'
                    : 'bg-zinc-950/40 border-red-500/30 opacity-80'
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-5 items-start">
                  {/* Selection Checkbox for Pending Proofs */}
                  {sub.status === 'pending' && (
                    <div className="shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={() => toggleSelectSub(sub.id)}
                        className={`w-7 h-7 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-400 text-black shadow-md shadow-emerald-500/30 scale-105'
                            : 'bg-zinc-900 border-zinc-700 hover:border-emerald-500/60 text-transparent'
                        }`}
                        title={isSelected ? 'Deselect this submission' : 'Select for bulk approval'}
                      >
                        <span className="material-symbols-outlined text-[18px] font-bold">check</span>
                      </button>
                    </div>
                  )}

                  {/* Screenshot Thumbnail (Click to zoom) */}
                  <div className="w-full lg:w-48 shrink-0">
                    <div
                      onClick={() => setSelectedProofModalSub(sub)}
                      className="group relative rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-video lg:aspect-4/3 flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors shadow-md"
                    >
                      <img
                        src={sub.screenshotUrl}
                        alt="Proof Screenshot"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white font-mono text-xs font-bold transition-opacity">
                        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                        <span>Click to Enlarge</span>
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] font-mono text-zinc-300 border border-zinc-700/60 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-emerald-400">image</span>
                        <span>Proof Photo</span>
                      </div>
                    </div>
                  </div>

                  {/* Submission Details */}
                  <div className="flex-1 space-y-3 w-full">
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-850 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">
                          {sub.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold">
                          Day {sub.dayIndex + 1} • Task #{sub.taskNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px] capitalize">
                          {sub.taskCategory}
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                            Selected for Bulk
                          </span>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div>
                        {sub.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>Pending Owner Approval</span>
                          </span>
                        )}
                        {sub.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            <span>Reward Approved &amp; Credited</span>
                          </span>
                        )}
                        {sub.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px]">cancel</span>
                            <span>Proof Rejected</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Task Title & User Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Task Details</span>
                        <h4 className="text-sm font-mono font-bold text-white mt-0.5 leading-snug">
                          {sub.taskTitle}
                        </h4>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            Reward: +{rewardText}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            Submitted at {sub.submittedAt}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Client / Investor</span>
                        <div className="text-xs font-mono font-bold text-zinc-200 mt-0.5">
                          {sub.userName}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400">
                          {sub.userEmail} • {sub.userCountry || 'Pakistan'}
                        </div>
                        {currentBal !== null && (
                          <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                            Current Balance: <span className="text-emerald-400 font-bold">{sub.userCurrency === 'PKR' ? `PKR ${currentBal}` : `$${currentBal}`}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User Notes if present */}
                    {sub.notes && (
                      <div className="p-2.5 bg-black/50 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 flex items-start gap-2">
                        <span className="text-zinc-500 font-bold shrink-0 text-[10px] uppercase">Client Handle/Note:</span>
                        <span className="text-zinc-200">{sub.notes}</span>
                      </div>
                    )}

                    {/* Rejection Note if rejected */}
                    {sub.status === 'rejected' && sub.rejectionReason && (
                      <div className="p-2.5 bg-red-950/30 border border-red-500/40 rounded-xl text-xs font-mono text-red-300">
                        <span className="font-bold">Rejection Note: </span>
                        <span>{sub.rejectionReason}</span>
                      </div>
                    )}

                    {/* Reviewer Metadata */}
                    {sub.reviewedAt && (
                      <div className="text-[11px] font-mono text-zinc-500">
                        Reviewed by <strong className="text-zinc-400">{sub.reviewedBy || 'Talha Ahmed'}</strong> at {sub.reviewedAt}
                      </div>
                    )}

                    {/* Action Buttons for Individual Pending Proofs */}
                    {sub.status === 'pending' && (
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          onClick={() => handleApproveWithFeedback(sub)}
                          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 hover:scale-102"
                        >
                          <span className="material-symbols-outlined text-[16px]">verified</span>
                          <span>Approve &amp; Credit {rewardText}</span>
                        </button>
                        <button
                          onClick={() => toggleSelectSub(sub.id)}
                          className={`px-3.5 py-2 rounded-xl font-mono font-bold text-xs cursor-pointer transition-colors flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {isSelected ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                          <span>{isSelected ? 'Selected' : 'Select for Bulk'}</span>
                        </button>
                        <button
                          onClick={() => setRejectingSubId(sub.id)}
                          className="px-4 py-2 bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-500/40 font-mono font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                          <span>Reject Proof</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Proof Image Zoom & Review Modal */}
      {selectedProofModalSub && (
        <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <span className="material-symbols-outlined text-xl">screenshot</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-mono font-bold text-white leading-tight">
                      {selectedProofModalSub.taskTitle}
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] font-bold">
                      {selectedProofModalSub.id}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-400">
                    Uploaded by <strong className="text-zinc-200">{selectedProofModalSub.userName}</strong> ({selectedProofModalSub.userEmail}) • {selectedProofModalSub.submittedAt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProofModalSub(null)}
                className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Close Viewer"
              >
                ✕
              </button>
            </div>

            {/* Main Screenshot Canvas */}
            <div className="flex-1 overflow-auto p-4 bg-zinc-950/90 flex flex-col items-center justify-center relative min-h-[300px]">
              <img
                src={selectedProofModalSub.screenshotUrl}
                alt="User Task Proof Screenshot"
                className="max-w-full max-h-[62vh] object-contain rounded-2xl border border-zinc-800 shadow-2xl"
              />
            </div>

            {/* Client Notes if present */}
            {selectedProofModalSub.notes && (
              <div className="px-5 py-2.5 bg-zinc-900/60 border-t border-zinc-800 text-xs font-mono text-zinc-300 flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold text-[10px] shrink-0">Client Comment / Handle:</span>
                <span className="text-amber-300">{selectedProofModalSub.notes}</span>
              </div>
            )}

            {/* Footer with Approve & Reject Actions */}
            <div className="p-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/90">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-400">
                  Reward to credit:{' '}
                  <strong className="text-emerald-400 font-bold">
                    +{selectedProofModalSub.userCurrency === 'PKR' ? `${selectedProofModalSub.rewardPkr || 10} PKR` : `$${(selectedProofModalSub.rewardUsd || 1.0).toFixed(2)} USD`}
                  </strong>
                </span>
                <a
                  href={selectedProofModalSub.screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-zinc-400 hover:text-white underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  <span>Open Full Size</span>
                </a>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {selectedProofModalSub.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => setRejectingSubId(selectedProofModalSub.id)}
                      className="px-4 py-2 bg-red-950/40 hover:bg-red-950/80 text-red-300 border border-red-500/40 font-mono font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      <span>Reject Proof</span>
                    </button>
                    <button
                      onClick={() => handleApproveWithFeedback(selectedProofModalSub)}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/30"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>Approve &amp; Credit Reward</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-mono font-bold text-zinc-400">
                    Status: <span className="capitalize text-white">{selectedProofModalSub.status}</span>
                  </span>
                )}
                <button
                  onClick={() => setSelectedProofModalSub(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingSubId && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <span className="material-symbols-outlined text-xl">warning</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">Reject Task Proof</h3>
                <p className="text-xs text-zinc-400 font-mono">Client will be notified to upload a valid screenshot.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-zinc-300 mb-1.5">
                Reason for Rejection
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-hidden focus:border-red-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'Channel not subscribed',
                  'Screenshot unclear or cropped',
                  'Incorrect task target',
                  'Duplicate proof'
                ].map(quickReason => (
                  <button
                    key={quickReason}
                    type="button"
                    onClick={() => setRejectReason(quickReason)}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 cursor-pointer"
                  >
                    {quickReason}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingSubId(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-xl cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
