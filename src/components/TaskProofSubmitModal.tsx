import React, { useState, useRef } from 'react';
import { DailyTask, CurrencyType } from '../types';

interface TaskProofSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DailyTask | null;
  currency: CurrencyType;
  userEmail: string;
  userName: string;
  userCountry?: string;
  existingSubmission?: {
    screenshotUrl: string;
    notes?: string;
    status: string;
    rejectionReason?: string;
  } | null;
  onSubmitProof: (data: {
    taskId: string;
    taskTitle: string;
    taskCategory: string;
    dayIndex: number;
    taskNumber: number;
    userEmail: string;
    userName: string;
    userCountry?: string;
    userCurrency: CurrencyType;
    rewardPkr: number;
    rewardUsd: number;
    screenshotUrl: string;
    notes?: string;
  }) => Promise<void> | void;
}

export const TaskProofSubmitModal: React.FC<TaskProofSubmitModalProps> = ({
  isOpen,
  onClose,
  task,
  currency,
  userEmail,
  userName,
  userCountry = 'Pakistan',
  existingSubmission,
  onSubmitProof
}) => {
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string>(existingSubmission?.screenshotUrl || '');
  const [notes, setNotes] = useState<string>(existingSubmission?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !task) return null;

  const rewardText = currency === 'PKR' ? `${task.rewardPkr || 10} PKR` : `$${(task.rewardUsd || 1).toFixed(2)} USD`;

  // Compress & convert file to data URL
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) return;

      // Optimize image through canvas to keep payload small & crisp
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1200;
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setScreenshotDataUrl(compressed);
        } else {
          setScreenshotDataUrl(result);
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Helper to generate a realistic sample screenshot for immediate testing
  const handleUseSampleScreenshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 800, 500);

      // Header bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 800, 70);

      // Accent dot
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(35, 35, 14, 0, Math.PI * 2);
      ctx.fill();

      // App Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('Emerald Trust • Daily Task Verification Proof', 65, 42);

      // Card container
      ctx.fillStyle = '#1e293b';
      ctx.roundRect(40, 100, 720, 350, 16);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Details
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(`✓ Task #${task.taskNumber}: ${task.title}`, 70, 160);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px monospace';
      ctx.fillText(`URL Target: ${task.url}`, 70, 205);
      ctx.fillText(`Client: ${userName} (${userEmail})`, 70, 245);
      ctx.fillText(`Verification Timestamp: ${new Date().toLocaleString()}`, 70, 285);
      ctx.fillText(`Task Status: Engagement Completed & Screenshot Verified`, 70, 325);

      // Badge
      ctx.fillStyle = '#064e3b';
      ctx.roundRect(70, 360, 280, 44, 8);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`Reward Entitlement: ${rewardText}`, 90, 388);

      const sampleDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setScreenshotDataUrl(sampleDataUrl);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotDataUrl) {
      setErrorMsg('Please upload a screenshot of your completed task before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmitProof({
        taskId: task.id,
        taskTitle: task.title,
        taskCategory: task.category,
        dayIndex: task.dayIndex,
        taskNumber: task.taskNumber,
        userEmail,
        userName,
        userCountry,
        userCurrency: currency,
        rewardPkr: task.rewardPkr || 10,
        rewardUsd: task.rewardUsd || 1.0,
        screenshotUrl: screenshotDataUrl,
        notes
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl space-y-6 relative my-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <span className="material-symbols-outlined text-2xl">add_a_photo</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold uppercase">
                  Task #{task.taskNumber} Proof
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  +{rewardText}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white font-mono mt-1 leading-snug">
                Submit Task Screenshot Proof
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Task Summary Banner */}
        <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 font-bold uppercase text-[10px]">Task Target</span>
            <a
              href={task.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>{task.actionLabel || 'Open Link'}</span>
              <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            </a>
          </div>
          <p className="text-white font-bold text-sm font-mono">{task.title}</p>
          <div className="text-[11px] font-mono text-zinc-400 space-y-1 pt-1">
            <span className="text-zinc-300 font-bold block">Verification Checklist:</span>
            {task.instructions.slice(0, 3).map((inst, i) => (
              <div key={i} className="flex items-start gap-1.5 text-zinc-300">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{inst}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Owner Review Notice */}
        <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-2xl flex items-start gap-2.5 text-xs font-mono text-amber-300">
          <span className="material-symbols-outlined text-amber-400 text-[18px] shrink-0 mt-0.5">verified_user</span>
          <div>
            <span className="font-bold block">Owner Review Authority:</span>
            <span className="text-zinc-300 text-[11px] mt-0.5 block">
              After you submit your screenshot, <strong>Talha Ahmed (Owner)</strong> will verify your proof. Once verified, the{' '}
              <strong className="text-emerald-400">{rewardText}</strong> reward is credited immediately to your balance and the task closes for 24 hours.
            </span>
          </div>
        </div>

        {/* Previous Rejection Warning (if re-submitting) */}
        {existingSubmission?.status === 'rejected' && existingSubmission.rejectionReason && (
          <div className="p-3.5 bg-red-950/40 border border-red-500/50 rounded-2xl flex items-start gap-2.5 text-xs font-mono text-red-300">
            <span className="material-symbols-outlined text-red-400 text-[18px] shrink-0 mt-0.5">cancel</span>
            <div>
              <span className="font-bold text-red-200">Previous Proof Was Rejected:</span>
              <span className="text-zinc-300 text-[11px] block mt-0.5">
                Owner Note: <em className="text-white">"{existingSubmission.rejectionReason}"</em>
              </span>
              <span className="text-zinc-400 text-[10px] block mt-1">
                Please attach a clear, updated screenshot showing full task completion.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Screenshot Upload Dropzone */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-300 mb-2 flex items-center justify-between">
              <span>Upload Task Screenshot (Required) *</span>
              {screenshotDataUrl && (
                <button
                  type="button"
                  onClick={() => setScreenshotDataUrl('')}
                  className="text-red-400 hover:underline text-[11px] cursor-pointer"
                >
                  Remove &amp; Replace
                </button>
              )}
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!screenshotDataUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-zinc-700 hover:border-emerald-500/60 bg-black/40 hover:bg-zinc-900/60'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto mb-3">
                  <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  Click to Browse or Drag &amp; Drop Screenshot
                </div>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  Supports PNG, JPG, JPEG, WEBP (Max 15MB)
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Screenshot of subscribe / like / join / mine
                  </span>
                </div>
              </div>
            ) : (
              <div className="border border-zinc-700 rounded-2xl p-3 bg-black/60 space-y-2">
                <div className="relative rounded-xl overflow-hidden max-h-56 bg-zinc-900 flex items-center justify-center">
                  <img
                    src={screenshotDataUrl}
                    alt="Task Screenshot Proof"
                    className="w-full h-auto max-h-56 object-contain rounded-lg"
                  />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-black font-mono font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    <span>Ready for Submission</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-1">
                  <span>Screenshot attached</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            )}

            {/* Quick Testing Helper */}
            {!screenshotDataUrl && (
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={handleUseSampleScreenshot}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  ⚡ Generate Sample Proof Screenshot (Quick Testing)
                </button>
              </div>
            )}
          </div>

          {/* Optional Notes / Handle Input */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-zinc-300 mb-1.5">
              Account Handle / Username / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. YouTube name: @talha_investor or Telegram handle: @talha"
              className="w-full bg-black border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500 placeholder:text-zinc-600"
            />
            <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
              Helps Owner match your screenshot with your platform engagement.
            </span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs font-mono text-red-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!screenshotDataUrl || isSubmitting}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Submitting Proof...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Submit Proof to Owner</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
