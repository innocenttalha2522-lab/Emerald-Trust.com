import { UserAccount, DepositRequest, WithdrawalRequest } from '../types';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

export interface SheetSyncResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  updatedRange?: string;
  syncedAt: string;
}

/**
 * Lists files from Google Drive
 */
export async function listGoogleDriveFiles(
  accessToken: string,
  query = '',
  pageSize = 20
): Promise<DriveFileItem[]> {
  try {
    let q = "trashed = false";
    if (query.trim()) {
      q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
    }
    const params = new URLSearchParams({
      q,
      pageSize: String(pageSize),
      fields: 'files(id, name, mimeType, webViewLink, iconLink, createdTime, modifiedTime, size)',
      orderBy: 'modifiedTime desc'
    });

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Drive API error (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error: any) {
    console.error('Failed to list Google Drive files:', error);
    throw error;
  }
}

/**
 * Creates a folder in Google Drive
 */
export async function createGoogleDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<DriveFileItem> {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Drive folder');
  }

  return await res.json();
}

/**
 * Uploads a text/JSON/CSV file or creates a Google Doc / Backup file in Drive
 */
export async function uploadFileToGoogleDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType = 'text/plain',
  folderId?: string
): Promise<DriveFileItem> {
  const metadata: any = {
    name: fileName,
    mimeType
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload file to Google Drive');
  }

  return await res.json();
}

/**
 * Deletes a file from Google Drive (Destructive operation)
 */
export async function deleteGoogleDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to delete file from Google Drive');
  }

  return true;
}

/**
 * Creates or synchronizes a comprehensive Google Sheets spreadsheet
 * with separate tabs for Account Overview, Deposits, and Withdrawals.
 */
export async function syncFinancialLedgerToGoogleSheets(
  accessToken: string,
  user: UserAccount,
  deposits: DepositRequest[],
  withdrawals: WithdrawalRequest[],
  existingSpreadsheetId?: string
): Promise<SheetSyncResult> {
  const title = `Emerald Trust Ledger - ${user.name || user.email} (${new Date().toLocaleDateString()})`;

  let spreadsheetId = existingSpreadsheetId;
  let spreadsheetUrl = '';

  // 1. If no existing spreadsheet, create one with tabs
  if (!spreadsheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [
          { properties: { title: 'Account Overview' } },
          { properties: { title: 'Deposit History' } },
          { properties: { title: 'Payout Requests' } }
        ]
      })
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
    }

    const createData = await createRes.json();
    spreadsheetId = createData.spreadsheetId;
    spreadsheetUrl = createData.spreadsheetUrl;
  } else {
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }

  // 2. Format and populate sheets data
  const overviewValues = [
    ['EMERALD TRUST - INSTITUTIONAL EARNING & LEDGER AUDIT'],
    ['Generated On', new Date().toLocaleString()],
    ['User Name', user.name],
    ['User Email', user.email],
    ['Role', user.role.toUpperCase()],
    ['Account Tier', user.tierId.toUpperCase()],
    ['Deposit Status', user.depositStatus.toUpperCase()],
    ['Current Available Balance', `${user.currency} ${user.balance.toLocaleString()}`],
    ['Total Earned To Date', `${user.currency} ${user.totalEarned.toLocaleString()}`],
    ['Active Deposit Capital', `${user.currency} ${user.depositAmount.toLocaleString()}`],
    ['Referral Code', user.referralCode],
    ['Total Direct Referrals', user.referralCount],
    ['Referral Bonus Earnings', `${user.currency} ${user.referralEarnings.toLocaleString()}`],
    ['Total Completed Ads', user.completedAdsCount]
  ];

  const depositHeader = [
    'Request ID',
    'Date & Time',
    'Package',
    'Currency',
    'Amount',
    'Payment Gateway',
    'Sender Name',
    'Sender Account / IBAN',
    'Transaction Reference #',
    'Status',
    'Reviewed By',
    'Review Notes'
  ];

  const depositRows = deposits.map(d => [
    d.id,
    d.createdAt,
    d.packageName,
    d.currency,
    d.amount,
    d.paymentMethod,
    d.senderName,
    d.senderAccountOrPhone,
    d.transactionReference,
    d.status.toUpperCase(),
    d.reviewedBy || 'Pending',
    d.notes || ''
  ]);

  const withdrawalHeader = [
    'Payout ID',
    'Date & Time',
    'Currency',
    'Payout Amount',
    'Gateway Method',
    'Account Title',
    'Account # / IBAN / Address',
    'Settlement Ref Hash',
    'Status',
    'Reviewed At',
    'Reviewer / Authority',
    'Notes & Status Reason'
  ];

  const withdrawalRows = withdrawals.map(w => [
    w.id,
    w.createdAt,
    w.currency,
    w.amount,
    w.method,
    w.accountTitle,
    w.accountNumberOrIban,
    w.txHashOrRef || 'Pending Settlement',
    w.status.toUpperCase(),
    w.reviewedAt || 'Pending',
    w.reviewedBy || 'Talha Ahmed (Owner)',
    w.notes || ''
  ]);

  const valueData = [
    {
      range: "'Account Overview'!A1:B14",
      values: overviewValues
    },
    {
      range: `'Deposit History'!A1:L${depositRows.length + 1}`,
      values: [depositHeader, ...depositRows]
    },
    {
      range: `'Payout Requests'!A1:L${withdrawalRows.length + 1}`,
      values: [withdrawalHeader, ...withdrawalRows]
    }
  ];

  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: valueData
      })
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update Google Spreadsheet rows');
  }

  return {
    spreadsheetId: spreadsheetId!,
    spreadsheetUrl,
    title,
    syncedAt: new Date().toLocaleTimeString()
  };
}

/**
 * Clear rows in Google Sheets (Destructive operation requiring confirmation)
 */
export async function clearGoogleSheetRange(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<boolean> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to clear spreadsheet data');
  }

  return true;
}
