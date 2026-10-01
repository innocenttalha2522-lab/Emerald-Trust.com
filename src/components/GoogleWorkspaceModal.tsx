import React, { useState, useEffect } from 'react';
import {
  listGoogleDriveFiles,
  createGoogleDriveFolder,
  uploadFileToGoogleDrive,
  deleteGoogleDriveFile,
  syncFinancialLedgerToGoogleSheets,
  clearGoogleSheetRange,
  DriveFileItem,
  SheetSyncResult
} from '../lib/workspaceService';
import { googleSignIn, getAccessToken, auth, logout } from '../lib/firebase';
import { UserAccount, DepositRequest, WithdrawalRequest } from '../types';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  deposits: DepositRequest[];
  withdrawals: WithdrawalRequest[];
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  user,
  deposits,
  withdrawals
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'drive'>('sheets');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);

  // Google Sheets state
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SheetSyncResult | null>(() => {
    const saved = localStorage.getItem('emerald_trust_last_sheet_sync');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Destructive Action Confirmation Modal state (Mandatory per Skill guidelines)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Refresh token on open
  useEffect(() => {
    if (isOpen) {
      getAccessToken().then(tok => {
        setAccessToken(tok);
        if (tok) {
          fetchDriveFiles(tok);
        }
      });
    }
  }, [isOpen]);

  const handleGoogleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setAccessToken(res.accessToken);
        setSuccessMsg('Google Workspace successfully connected with Drive and Sheets permissions.');
        fetchDriveFiles(res.accessToken);
      } else {
        setErrorMsg('Sign-in succeeded, but access token was not returned. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate with Google.');
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchDriveFiles = async (token: string, q = searchQuery) => {
    setIsLoadingFiles(true);
    setErrorMsg(null);
    try {
      const files = await listGoogleDriveFiles(token, q);
      setDriveFiles(files);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve Google Drive files.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // 1-Click Sync to Google Sheets
  const handleSyncToSheets = async () => {
    if (!accessToken) {
      setErrorMsg('Please connect your Google Account first.');
      return;
    }
    setIsSyncingSheets(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const result = await syncFinancialLedgerToGoogleSheets(
        accessToken,
        user,
        deposits,
        withdrawals,
        lastSyncResult?.spreadsheetId
      );
      setLastSyncResult(result);
      localStorage.setItem('emerald_trust_last_sheet_sync', JSON.stringify(result));
      setSuccessMsg(`Successfully synced financial ledger to Google Sheets! (${result.syncedAt})`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sync with Google Sheets.');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Export Financial Portfolio statement as a text/audit document in Google Drive
  const handleExportStatementToDrive = async () => {
    if (!accessToken) {
      setErrorMsg('Please connect your Google Account first.');
      return;
    }
    setIsExportingToDrive(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const statementContent = `=====================================================
EMERALD TRUST - INSTITUTIONAL AUDIT & FINANCIAL PORTFOLIO
=====================================================
Generated: ${new Date().toISOString()}
Client Name: ${user.name}
Client Email: ${user.email}
Account Tier: ${user.tierId.toUpperCase()}
Deposit Status: ${user.depositStatus.toUpperCase()}
Available Balance: ${user.currency} ${user.balance.toLocaleString()}
Total Earned to Date: ${user.currency} ${user.totalEarned.toLocaleString()}
Active Deposit Capital: ${user.currency} ${user.depositAmount.toLocaleString()}

--- SUMMARY OF RECENT DEPOSITS ---
${deposits.map(d => `[${d.createdAt}] ${d.currency} ${d.amount} - ${d.packageName} (${d.paymentMethod}) - Status: ${d.status.toUpperCase()} - Ref: ${d.transactionReference}`).join('\n')}

--- SUMMARY OF RECENT PAYOUTS ---
${withdrawals.map(w => `[${w.createdAt}] ${w.currency} ${w.amount} to ${w.accountTitle} (${w.method}: ${w.accountNumberOrIban}) - Status: ${w.status.toUpperCase()} - Settlement Ref: ${w.txHashOrRef || 'Pending'}`).join('\n')}

=====================================================
Cryptographically signed by Emerald Trust Master System
=====================================================`;

      const fileName = `Emerald_Trust_Statement_${new Date().toISOString().slice(0, 10)}.txt`;
      const uploadedFile = await uploadFileToGoogleDrive(
        accessToken,
        fileName,
        statementContent,
        'text/plain'
      );
      setSuccessMsg(`Portfolio Statement saved to Google Drive: "${uploadedFile.name}"`);
      fetchDriveFiles(accessToken);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export statement to Google Drive.');
    } finally {
      setIsExportingToDrive(false);
    }
  };

  // Create "Emerald Trust Backups" folder on Google Drive
  const handleCreateDriveFolder = async () => {
    if (!accessToken) return;
    try {
      const folder = await createGoogleDriveFolder(accessToken, 'Emerald Trust Backups & Audit');
      setSuccessMsg(`Folder "${folder.name}" created in your Google Drive.`);
      fetchDriveFiles(accessToken);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create folder.');
    }
  };

  // Trigger Destructive Action: Delete Drive File (Requires Confirmation)
  const promptDeleteDriveFile = (file: DriveFileItem) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete File "${file.name}"?`,
      description: `Are you sure you want to permanently delete this file from your Google Drive? This action cannot be undone.`,
      actionLabel: 'Delete File',
      onConfirm: async () => {
        if (!accessToken) return;
        try {
          await deleteGoogleDriveFile(accessToken, file.id);
          setSuccessMsg(`File "${file.name}" was deleted from Google Drive.`);
          setDriveFiles(prev => prev.filter(f => f.id !== file.id));
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to delete file.');
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  // Trigger Destructive Action: Clear Google Sheet Range (Requires Confirmation)
  const promptClearSheetData = () => {
    if (!lastSyncResult) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Reset & Clear Google Sheet Records?',
      description: `Are you sure you want to clear the synchronized records from the spreadsheet "${lastSyncResult.title}"? You will need to trigger a fresh sync.`,
      actionLabel: 'Clear Sheet Data',
      onConfirm: async () => {
        if (!accessToken || !lastSyncResult) return;
        try {
          await clearGoogleSheetRange(
            accessToken,
            lastSyncResult.spreadsheetId,
            "'Deposit History'!A2:L100"
          );
          setSuccessMsg('Spreadsheet records cleared successfully.');
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to clear spreadsheet data.');
        } finally {
          setConfirmDialog(null);
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f1115] rounded-2xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-zinc-800 text-white relative max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-400 text-[22px]">cloud_sync</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Google Workspace Integration</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Drive &amp; Sheets Live
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Sync live financial ledgers, backup statements to Drive, and manage audit spreadsheets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Auth Banner & Sign In with Google */}
        <div className="mt-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${accessToken ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                <span className="text-xs font-bold text-white font-mono">
                  {accessToken ? 'Google Workspace Connected' : 'Google Authorization Required'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                {accessToken
                  ? `Connected for ${user.email} (Drive & Sheets permissions active)`
                  : 'Authorize Google Drive & Sheets to backup portfolio reports and sync ledgers.'}
              </p>
            </div>

            {!accessToken ? (
              <button
                onClick={handleGoogleConnect}
                disabled={isConnecting}
                className="gsi-material-button px-4 py-2 bg-white text-zinc-800 hover:bg-zinc-100 font-semibold text-xs rounded-lg flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isConnecting ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-md">
                  Active
                </span>
                <button
                  onClick={handleGoogleConnect}
                  className="text-[11px] font-mono text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                  title="Refresh Google Token"
                >
                  Refresh Token
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-red-200 text-xs font-mono flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-red-400">error</span>
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 text-xs font-mono flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 border-b border-zinc-800 pb-2 shrink-0">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sheets'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">table_view</span>
            <span>Google Sheets Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('drive')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono uppercase flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'drive'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">add_to_drive</span>
            <span>Google Drive Storage ({driveFiles.length})</span>
          </button>
        </div>

        {/* Main Content Body */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/50 p-5 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-400 text-[18px]">table_chart</span>
                      Multi-Tab Financial Ledger Spreadsheet
                    </h4>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Automatically structures and writes 3 tabs: <strong className="text-white">Overview</strong>, <strong className="text-white">Deposit History</strong>, and <strong className="text-white">Payout Requests</strong>.
                    </p>
                  </div>

                  <button
                    onClick={handleSyncToSheets}
                    disabled={isSyncingSheets}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase rounded-lg flex items-center gap-2 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isSyncingSheets ? 'animate-spin' : ''}`}>
                      {isSyncingSheets ? 'sync' : 'publish'}
                    </span>
                    <span>{isSyncingSheets ? 'Syncing...' : 'Sync to Google Sheets'}</span>
                  </button>
                </div>

                {/* Spreadsheet Status & Actions */}
                {lastSyncResult ? (
                  <div className="p-4 rounded-lg bg-zinc-950/80 border border-emerald-500/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block">Connected Spreadsheet:</span>
                        <span className="text-sm font-bold text-white">{lastSyncResult.title}</span>
                        <p className="text-[11px] text-zinc-400 font-mono">Last updated: {lastSyncResult.syncedAt}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={lastSyncResult.spreadsheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono rounded-lg flex items-center gap-1.5 transition-all"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          <span>Open in Sheets</span>
                        </a>

                        <button
                          onClick={promptClearSheetData}
                          className="px-2.5 py-1.5 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-300 border border-zinc-800 hover:border-red-800 font-bold text-xs font-mono rounded-lg transition-all"
                          title="Clear Range with Confirmation"
                        >
                          Clear Sheet
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800 text-[11px] font-mono">
                      <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800">
                        <span className="text-zinc-500 block">Account Tab</span>
                        <span className="text-emerald-400 font-bold">14 Parameters</span>
                      </div>
                      <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800">
                        <span className="text-zinc-500 block">Deposits Tab</span>
                        <span className="text-emerald-400 font-bold">{deposits.length} Records</span>
                      </div>
                      <div className="bg-zinc-900/60 p-2 rounded border border-zinc-800">
                        <span className="text-zinc-500 block">Payouts Tab</span>
                        <span className="text-emerald-400 font-bold">{withdrawals.length} Records</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-zinc-950/40 border border-zinc-800 text-xs font-mono text-zinc-500 text-center">
                    No Google Spreadsheet linked yet. Click <strong className="text-emerald-400">Sync to Google Sheets</strong> to create your live financial workbook.
                  </div>
                )}
              </div>

              {/* Data Preview Summary */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                <h5 className="text-xs font-bold text-zinc-300 uppercase font-mono tracking-wider">Sync Preview Payload:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
                    <span className="text-zinc-500 block text-[10px]">User Account</span>
                    <span className="text-white font-bold">{user.name} ({user.email})</span>
                    <span className="text-emerald-400 block mt-1">Tier: {user.tierId} | Balance: {user.currency} {user.balance}</span>
                  </div>
                  <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/80">
                    <span className="text-zinc-500 block text-[10px]">Ledger Aggregates</span>
                    <span className="text-white font-bold">{deposits.length} Deposits / {withdrawals.length} Payouts</span>
                    <span className="text-emerald-400 block mt-1">Total Earned: {user.currency} {user.totalEarned}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search files in Google Drive..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && accessToken && fetchDriveFiles(accessToken, searchQuery)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-zinc-600 focus:border-emerald-500 outline-none flex-1"
                  />
                  <button
                    onClick={() => accessToken && fetchDriveFiles(accessToken, searchQuery)}
                    disabled={isLoadingFiles}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono rounded-lg cursor-pointer"
                  >
                    Search
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportStatementToDrive}
                    disabled={isExportingToDrive || !accessToken}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[15px]">description</span>
                    <span>{isExportingToDrive ? 'Exporting...' : 'Save Statement to Drive'}</span>
                  </button>

                  <button
                    onClick={handleCreateDriveFolder}
                    disabled={!accessToken}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs font-mono rounded-lg flex items-center gap-1.5 cursor-pointer"
                    title="Create Backup Folder"
                  >
                    <span className="material-symbols-outlined text-[15px]">create_new_folder</span>
                    <span>New Folder</span>
                  </button>
                </div>
              </div>

              {/* Drive Files List */}
              {isLoadingFiles ? (
                <div className="p-8 text-center bg-zinc-900/30 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-500">
                  <span className="material-symbols-outlined animate-spin text-[24px] text-emerald-400 block mx-auto mb-2">sync</span>
                  Loading Drive files...
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="p-8 text-center bg-zinc-900/30 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-500 space-y-2">
                  <span className="material-symbols-outlined text-[32px] text-zinc-600 block mx-auto">folder_open</span>
                  <p>No files found in Google Drive matching query.</p>
                  <p className="text-zinc-600">Click &quot;Save Statement to Drive&quot; above to export your first report.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto">
                  {driveFiles.map((file) => {
                    const isSheet = file.mimeType.includes('spreadsheet') || file.mimeType.includes('sheet');
                    const isDoc = file.mimeType.includes('document') || file.mimeType.includes('text');
                    const isFolder = file.mimeType.includes('folder');

                    return (
                      <div
                        key={file.id}
                        className="p-3 rounded-lg bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`material-symbols-outlined text-[20px] ${
                            isSheet ? 'text-emerald-400' : isDoc ? 'text-blue-400' : isFolder ? 'text-amber-400' : 'text-zinc-400'
                          }`}>
                            {isFolder ? 'folder' : isSheet ? 'table_chart' : isDoc ? 'article' : 'draft'}
                          </span>

                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-white block truncate">{file.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono block truncate">
                              ID: {file.id} {file.modifiedTime ? `• Modified: ${new Date(file.modifiedTime).toLocaleDateString()}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-md text-xs transition-colors"
                              title="Open in Google Drive"
                            >
                              <span className="material-symbols-outlined text-[15px] block">open_in_new</span>
                            </a>
                          )}

                          <button
                            onClick={() => promptDeleteDriveFile(file)}
                            className="p-1.5 bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-300 rounded-md text-xs transition-colors"
                            title="Delete file (with confirmation)"
                          >
                            <span className="material-symbols-outlined text-[15px] block">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mandatory Destructive Action Confirmation Modal */}
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#14161b] rounded-xl max-w-md w-full p-5 border border-red-500/50 shadow-2xl text-white space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-950/80 border border-red-700 flex items-center justify-center text-red-400">
                  <span className="material-symbols-outlined text-[22px]">warning</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{confirmDialog.title}</h4>
                  <span className="text-[11px] font-mono text-red-400">Destructive Action Confirmation Required</span>
                </div>
              </div>

              <p className="text-xs text-zinc-300 font-mono leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800">
                {confirmDialog.description}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDialog.onConfirm()}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono uppercase rounded-lg cursor-pointer shadow-sm transition-colors"
                >
                  {confirmDialog.actionLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
