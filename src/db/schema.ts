import { pgTable, serial, text, integer, doublePrecision, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal unique identifier
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('client'), // 'owner' | 'admin' | 'client'
  currency: text('currency').notNull().default('USD'), // 'USD' | 'PKR'
  country: text('country').default('Global'),
  packageTier: text('package_tier').notNull().default('none'), // 'basic' | 'gold' | 'diamond' | 'none'
  depositStatus: text('deposit_status').notNull().default('none'), // 'none' | 'pending' | 'active' | 'rejected'
  depositAmount: doublePrecision('deposit_amount').default(0),
  depositMethod: text('deposit_method'),
  depositTxId: text('deposit_tx_id'),
  balance: doublePrecision('balance').default(0),
  totalEarned: doublePrecision('total_earned').default(0),
  pendingYield: doublePrecision('pending_yield').default(0),
  adsWatchedCount: integer('ads_watched_count').default(0),
  referralCode: text('referral_code').notNull().unique(),
  referredBy: text('referred_by'),
  referralEarnings: doublePrecision('referral_earnings').default(0),
  referralsCount: integer('referrals_count').default(0),
  kycVerified: boolean('kyc_verified').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Deposit verification requests table
export const depositRequests = pgTable('deposit_requests', {
  id: serial('id').primaryKey(),
  requestId: text('request_id').notNull().unique(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name').notNull(),
  packageId: text('package_id').notNull(),
  packageName: text('package_name').notNull(),
  currency: text('currency').notNull(),
  amount: doublePrecision('amount').notNull(),
  paymentMethod: text('payment_method').notNull(),
  senderName: text('sender_name').notNull(),
  senderAccountOrPhone: text('sender_account_or_phone').notNull(),
  transactionReference: text('transaction_reference').notNull(),
  screenshotUrl: text('screenshot_url'),
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  notes: text('notes'),
  reviewedBy: text('reviewed_by'),
  createdAt: timestamp('created_at').defaultNow(),
  reviewedAt: timestamp('reviewed_at'),
});

// Transactions log
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  txId: text('tx_id').notNull().unique(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email'),
  type: text('type').notNull(), // 'deposit' | 'ad_yield' | 'referral' | 'payout'
  currency: text('currency').notNull().default('USD'),
  amount: doublePrecision('amount').notNull(),
  method: text('method').notNull(),
  status: text('status').notNull().default('completed'), // 'completed' | 'processing' | 'pending'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

// System configuration settings
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  referralBonusPercent: doublePrecision('referral_bonus_percent').default(20.0),
  ownerName: text('owner_name').default('Talha Ahmed'),
  ownerMeezanAccount: text('owner_meezan_account').default('00300111747050'),
  ownerMeezanIban: text('owner_meezan_iban').default('PK36MEZ0000300111747050'),
  ownerEasypaisaAccount: text('owner_easypaisa_account').default('03195006433'),
  ownerPayoneerAccount: text('owner_payoneer_account').default('70584210002304212'),
  ownerPayoneerRouting: text('owner_payoneer_routing').default('031100209'),
  ownerPayoneerSwift: text('owner_payoneer_swift').default('CITIUS33'),
  basicUsdPrice: doublePrecision('basic_usd_price').default(20.0),
  goldUsdPrice: doublePrecision('gold_usd_price').default(50.0),
  diamondUsdPrice: doublePrecision('diamond_usd_price').default(100.0),
  basicPkrPrice: doublePrecision('basic_pkr_price').default(600.0),
  goldPkrPrice: doublePrecision('gold_pkr_price').default(1200.0),
  diamondPkrPrice: doublePrecision('diamond_pkr_price').default(2000.0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  depositRequests: many(depositRequests),
  transactions: many(transactions),
}));
