import { PackageTier, AdCampaign, Transaction, FaqItem, OwnerPaymentDetails, DepositRequest } from '../types';

export const OWNER_PAYMENT_DETAILS: OwnerPaymentDetails = {
  ownerName: 'Talha Ahmed',
  meezan: {
    bankName: 'Meezan Bank Limited',
    accountTitle: 'Talha Ahmed',
    accountNumber: '00300111747050',
    iban: 'PK36MEZ0000300111747050'
  },
  easypaisa: {
    accountTitle: 'Talha Ahmed',
    accountNumber: '03195006433'
  },
  payoneer: {
    beneficiaryName: 'Talha Ahmed',
    bankName: 'CITIBANK',
    routingNumber: '031100209',
    swiftCode: 'CITIUS33',
    accountNumber: '70584210002304212',
    accountType: 'Checking / Receiving Account'
  }
};

export const PACKAGE_TIERS: PackageTier[] = [
  {
    id: 'basic',
    name: 'Basic Package',
    usdPrice: 20,
    pkrPrice: 600,
    dailyRate: 2.5,
    dailyAdsCount: 5,
    referralBonusRate: 20,
    withdrawalTime: '< 15 mins',
    badge: 'Starter',
    features: [
      'Daily 2.50% capital yield (USD $0.50 / PKR 45+ daily)',
      '5 Verified sponsor ad tasks / day',
      '20% Direct lifelong referral commission',
      'Standard automated payout queue',
      'Multi-currency payment verification',
      'Active for full 365-day earning cycle'
    ]
  },
  {
    id: 'gold',
    name: 'Gold Package',
    usdPrice: 50,
    pkrPrice: 1200,
    dailyRate: 3.5,
    dailyAdsCount: 15,
    referralBonusRate: 20,
    withdrawalTime: '< 0.1s (Instant)',
    badge: 'Popular Choice',
    isPopular: true,
    features: [
      'Daily 3.50% accelerated yield (USD $1.75 / PKR 120+ daily)',
      '15 High-tier sponsor ad tasks / day',
      '20% Direct lifelong referral commission',
      'Sub-second instant withdrawal routing',
      'Priority payment gateway approval queue',
      'Automated daily reinvestment option',
      'Dedicated compliance manager'
    ]
  },
  {
    id: 'diamond',
    name: 'Diamond VIP Package',
    usdPrice: 100,
    pkrPrice: 2000,
    dailyRate: 5.0,
    dailyAdsCount: 30,
    referralBonusRate: 20,
    withdrawalTime: '< 0.1s (Instant VIP)',
    badge: 'Maximum Yield',
    features: [
      'Daily 5.00% maximum yield (USD $5.00 / PKR 260+ daily)',
      '30 VIP institutional sponsor ad tasks / day',
      '20% Direct lifelong referral commission',
      'Zero fee priority blockchain & bank settlements',
      'Direct Private WhatsApp & Telegram desk support',
      'Weekly institutional market report',
      'Personal account manager assigned'
    ]
  }
];

export const INITIAL_AD_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'ad-1',
    title: 'Institutional GPU Compute Cluster Allocation',
    sponsor: 'Aether Cloud Data Corp',
    category: 'AI Infrastructure',
    payoutUsd: 0.75,
    payoutPkr: 55,
    durationSeconds: 3,
    engagementType: 'Verified View & Compute Check',
    status: 'available',
    icon: 'memory'
  },
  {
    id: 'ad-2',
    title: 'Cross-Border Liquidity Routing Protocol',
    sponsor: 'Nordic Sovereign Clearing',
    category: 'Fintech',
    payoutUsd: 0.85,
    payoutPkr: 65,
    durationSeconds: 3,
    engagementType: 'Smart Contract Audit Review',
    status: 'available',
    icon: 'account_balance'
  },
  {
    id: 'ad-3',
    title: 'Offshore Solar Grid Tokenized Securitization',
    sponsor: 'Helios Renewable Trust',
    category: 'Green Energy',
    payoutUsd: 0.90,
    payoutPkr: 70,
    durationSeconds: 3,
    engagementType: 'ESG Compliance Endorsement',
    status: 'available',
    icon: 'solar_power'
  },
  {
    id: 'ad-4',
    title: 'Physical Gold & Rare Metals Custody Vault',
    sponsor: 'Geneva Bullion Reserve',
    category: 'Global Commodities',
    payoutUsd: 1.20,
    payoutPkr: 95,
    durationSeconds: 3,
    engagementType: 'Proof-of-Reserve Verification',
    status: 'available',
    icon: 'inventory_2'
  },
  {
    id: 'ad-5',
    title: 'Zero-Knowledge Decentralized Identity Proofs',
    sponsor: 'CipherZero Labs',
    category: 'Enterprise Cloud',
    payoutUsd: 1.10,
    payoutPkr: 85,
    durationSeconds: 3,
    engagementType: 'Cryptographic Attestation',
    status: 'available',
    icon: 'verified_user'
  },
  {
    id: 'ad-6',
    title: 'Quantum-Resistant Distributed Ledger Mesh',
    sponsor: 'Apex FinSec Networks',
    category: 'Enterprise Cloud',
    payoutUsd: 1.50,
    payoutPkr: 110,
    durationSeconds: 3,
    engagementType: 'Network Integrity Verification',
    status: 'available',
    icon: 'security'
  }
];

export const INITIAL_DEPOSIT_REQUESTS: DepositRequest[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'Deposit & Activation',
    question: 'Why do I see a Deposit Warning right after creating my account?',
    answer: 'To prevent bot abuse and ensure guaranteed sponsor payouts, all new client accounts require an active deposit package (Basic: $20 / PKR 600, Gold: $50 / PKR 1200, Diamond: $100 / PKR 2000) to activate daily ad task allocations and unlock instant withdrawals.'
  },
  {
    category: 'Payment Methods',
    question: 'How do Pakistani and International clients deposit?',
    answer: 'Pakistani clients can deposit via Meezan Bank or Easypaisa directly to the official Owner account (Talha Ahmed). International clients can deposit in USD via Payoneer Citibank checking wire with zero exchange friction.'
  },
  {
    category: 'Referral Program',
    question: 'How does the 20% Referral Bonus work?',
    answer: 'You earn an instant 20% direct commission whenever your invited partner activates any package (e.g., earn $20 on a $100 Diamond package or PKR 400 on a PKR 2,000 package), plus 20% recurring yield on their daily task earnings.'
  },
  {
    category: 'Withdrawals & Payouts',
    question: 'What is the minimum withdrawal amount and execution speed?',
    answer: 'Minimum withdrawal is just $5 or PKR 300. Withdrawals are processed instantly (<0.1s) directly to your local bank, Easypaisa, or Payoneer account.'
  },
  {
    category: 'Portals & Access',
    question: 'How do Owner and Admin portals work?',
    answer: 'The platform provides a Master Owner Portal link with complete access to manage packages, approve/reject deposits, edit balances, and export to Google Workspace, alongside an Admin Portal link with restricted verification privileges.'
  }
];
