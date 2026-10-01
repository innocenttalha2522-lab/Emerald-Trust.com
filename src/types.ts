export type UserRole = 'owner' | 'admin' | 'client';
export type CurrencyType = 'USD' | 'PKR';
export type DepositStatus = 'none' | 'pending' | 'active' | 'rejected';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'processing';

export interface PackageTier {
  id: string;
  name: string;
  usdPrice: number;
  pkrPrice: number;
  dailyRate: number; // percentage, e.g. 2.5%, 3.5%, 5.0%
  dailyAdsCount: number;
  referralBonusRate: number; // 20%
  withdrawalTime: string;
  badge?: string;
  isPopular?: boolean;
  features: string[];
}

export interface AdCampaign {
  id: string;
  title: string;
  sponsor: string;
  category: 'Fintech' | 'AI Infrastructure' | 'Green Energy' | 'Global Commodities' | 'Enterprise Cloud';
  payoutUsd: number;
  payoutPkr: number;
  durationSeconds: number;
  engagementType: string;
  status: 'available' | 'completed' | 'in-progress';
  icon: string;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  packageId: string;
  packageName: string;
  currency: CurrencyType;
  amount: number;
  paymentMethod: 'Meezan Bank' | 'Easypaisa' | 'Payoneer Citibank';
  senderName: string;
  senderAccountOrPhone: string;
  transactionReference: string;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId?: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: CurrencyType;
  method: 'Easypaisa' | 'Meezan Bank' | 'Payoneer Citibank' | 'Bank Transfer' | 'USDT TRC20' | 'Other';
  accountTitle: string;
  accountNumberOrIban: string;
  status: WithdrawalStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  txHashOrRef?: string;
}

export interface Transaction {
  id: string;
  type: 'payout' | 'deposit' | 'ad_yield' | 'referral';
  user: string;
  country: string;
  amount: number;
  currency: CurrencyType;
  timestamp: string;
  method: string;
  status: 'completed' | 'processing' | 'pending';
  description?: string;
}

export interface DailyTask {
  id: string;
  dayIndex: number; // 0..6 (Day 1..7)
  dayName: string;
  taskNumber: number; // 1, 2, or 3
  title: string;
  category: 'youtube' | 'telegram' | 'mining' | 'earning';
  url: string;
  rewardPkr: number; // 10 PKR
  rewardUsd: number; // $1 USD
  description: string;
  instructions: string[];
  actionLabel: string;
  icon: string;
  isLive: boolean;
  timerSeconds?: number;
}

export type TaskSubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface TaskSubmission {
  id: string;
  taskId: string;
  userId?: string;
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
  status: TaskSubmissionStatus;
  submittedAt: string;
  submittedTimestamp: number;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface ChatMessage {
  id: string;
  senderEmail: string;
  senderName: string;
  senderRole: 'user' | 'owner' | 'support';
  message: string;
  timestamp: string;
  isRead?: boolean;
}

export interface UserAccount {
  isRegistered: boolean;
  uid?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  currency: CurrencyType;
  country?: string;
  tierId: string;
  depositStatus: DepositStatus;
  activePackageName?: string;
  depositAmount: number;
  depositMethod?: string;
  depositTxId?: string;
  balance: number;
  totalEarned: number;
  pendingYield: number;
  referralCode: string;
  referredBy?: string;
  teamName?: string;
  referralCount: number;
  referralEarnings: number;
  completedAdsCount: number;
  completedTasksCount?: number;
  completedTaskIds?: string[];
  taskCompletionTimestamps?: Record<string, number>;
  currentTaskDay?: number;
  taskResetTimestamp?: number;
  taskLockedByOwner?: boolean;
  taskLockReason?: string;
  withdrawalLockedByOwner?: boolean;
  withdrawalLockReason?: string;
  activePaidReferralsCount?: number;
  kycVerified: boolean;
  isOnline?: boolean;
  lastActive?: string;
  createdAt?: string;
}

export interface UserTeamMember {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  tierId: string;
  depositStatus: DepositStatus;
  depositAmount: number;
  currency: CurrencyType;
  balance: number;
  completedAdsCount: number;
  referralCommissionEarned: number;
  isOnline: boolean;
  lastActive: string;
  joinedAt: string;
}

export interface UserTeam {
  id: string;
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  leaderUid: string;
  leaderCountry: string;
  leaderTier: string;
  leaderReferralCode: string;
  totalMembers: number;
  activeDepositingMembers: number;
  totalTeamCapitalPKR: number;
  totalTeamCapitalUSD: number;
  totalTeamAdsCompleted: number;
  totalReferralBonusPaidToLeader: number;
  teamStatus: 'elite' | 'high_volume' | 'growing' | 'new';
  members: UserTeamMember[];
}

export interface OwnerPaymentDetails {
  ownerName: string;
  meezan: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
  };
  easypaisa: {
    accountTitle: string;
    accountNumber: string;
  };
  payoneer: {
    beneficiaryName: string;
    bankName: string;
    routingNumber: string;
    swiftCode: string;
    accountNumber: string;
    accountType: string;
  };
}

export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

