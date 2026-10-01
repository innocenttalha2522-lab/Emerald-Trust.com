import { DailyTask } from '../types';

export const INITIAL_SCHEDULED_TASKS: DailyTask[] = [
  // DAY 1 (Monday) - 3 Daily Tasks
  {
    id: 'task-d1-1',
    dayIndex: 0,
    dayName: 'Day 1 (Monday)',
    taskNumber: 1,
    title: 'YouTube: FIFA Fanpage Channel & Daily Shorts',
    category: 'youtube',
    url: 'https://youtube.com/@fifa_fanpage-f2d?si=dn7FZvuHa9jih4vW',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Subscribe to FIFA Fanpage, like the latest daily Short video, and share with 1 friend.',
    instructions: [
      'Open the official FIFA Fanpage YouTube channel',
      'Click the Subscribe button & turn on notification bell',
      'Watch today\'s featured Short video and tap Like',
      'Return here for automated verification'
    ],
    actionLabel: 'Subscribe & Watch Short',
    icon: 'play_circle',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d1-2',
    dayIndex: 0,
    dayName: 'Day 1 (Monday)',
    taskNumber: 2,
    title: 'Telegram: Pitbull Coin Mining App',
    category: 'telegram',
    url: 'https://t.me/pitbullcoinbot/app?startapp=8656370801',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Launch the Pitbull Coin Telegram Bot, start mining claim, and verify account link.',
    instructions: [
      'Tap to launch Pitbull Coin Telegram Bot',
      'Press Start / Launch App inside Telegram',
      'Claim your initial welcome mining tokens',
      'Return to auto-verify and receive instant wallet credit'
    ],
    actionLabel: 'Launch Pitbull Bot',
    icon: 'send',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d1-3',
    dayIndex: 0,
    dayName: 'Day 1 (Monday)',
    taskNumber: 3,
    title: 'Telegram: Music Mining MB Bot',
    category: 'mining',
    url: 'https://t.me/MusicMiningMB_Bot?start=MB006NDU',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Start Music Mining MB Telegram node to unlock background hash rate yield.',
    instructions: [
      'Open Music Mining MB Telegram Bot with referral ref',
      'Press /start and begin the daily mining session',
      'Attest your session status',
      'Verification completes automatically'
    ],
    actionLabel: 'Start Music Mining',
    icon: 'graphic_eq',
    isLive: true,
    timerSeconds: 12
  },

  // DAY 2 (Tuesday) - 3 Daily Tasks
  {
    id: 'task-d2-1',
    dayIndex: 1,
    dayName: 'Day 2 (Tuesday)',
    taskNumber: 1,
    title: 'YouTube: FIFA Skills Shorts & Engagement',
    category: 'youtube',
    url: 'https://youtube.com/@fifa_fanpage-f2d?si=dn7FZvuHa9jih4vW',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Watch Tuesday\'s featured FIFA soccer skills Short, hit Like and leave an encouraging comment.',
    instructions: [
      'Open FIFA Fanpage Tuesday Short selection',
      'Watch at least 15 seconds of the soccer highlight',
      'Hit Like and verify your active subscription',
      'Return to complete instant wallet claim'
    ],
    actionLabel: 'Watch Tuesday Short',
    icon: 'smart_display',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d2-2',
    dayIndex: 1,
    dayName: 'Day 2 (Tuesday)',
    taskNumber: 2,
    title: 'Telegram: Wisplings Mining Bot',
    category: 'telegram',
    url: 'https://t.me/wisplings_bot?startapp=yarIT0gYypc',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Initialize Wisplings Mining Bot and claim daily free airdrop energy tokens.',
    instructions: [
      'Open Wisplings Bot via Telegram',
      'Launch the Mini App and claim day 2 reward',
      'Ensure start parameter yarIT0gYypc is linked',
      'Auto-verify to credit your balance'
    ],
    actionLabel: 'Open Wisplings Bot',
    icon: 'bolt',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d2-3',
    dayIndex: 1,
    dayName: 'Day 2 (Tuesday)',
    taskNumber: 3,
    title: 'Telegram: Shards Earn Bot',
    category: 'mining',
    url: 'https://t.me/ShardsEarnBot/app?startapp=8656370801',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Activate Shards Earn Bot applet and collect daily crystal shards.',
    instructions: [
      'Open Shards Earn Bot on Telegram',
      'Tap Start Mining to activate shard harvesting',
      'Wait for the node activation handshake',
      'Verification unlocks automatically'
    ],
    actionLabel: 'Harvest Shards',
    icon: 'diamond',
    isLive: true,
    timerSeconds: 12
  },

  // DAY 3 (Wednesday) - 3 Daily Tasks
  {
    id: 'task-d3-1',
    dayIndex: 2,
    dayName: 'Day 3 (Wednesday)',
    taskNumber: 1,
    title: 'YouTube: FIFA World Cup Magic Shorts',
    category: 'youtube',
    url: 'https://youtube.com/@fifa_fanpage-f2d?si=dn7FZvuHa9jih4vW',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Watch Wednesday\'s best World Cup goals Short, like, and share.',
    instructions: [
      'Open channel video feed',
      'Watch the featured goal highlight Short',
      'Click Like and Share with social contact',
      'Return for automated wallet settlement'
    ],
    actionLabel: 'Watch Wednesday Short',
    icon: 'sports_soccer',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d3-2',
    dayIndex: 2,
    dayName: 'Day 3 (Wednesday)',
    taskNumber: 2,
    title: 'Zulti: Earning Platform Portal',
    category: 'earning',
    url: 'https://zulti.com/?r=GYDNNWTVVA',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Visit Zulti earning network with official invitation code and check today\'s offers.',
    instructions: [
      'Navigate to Zulti via referral ref GYDNNWTVVA',
      'Browse active earning campaigns',
      'Complete portal check-in',
      'Receive instant 10 PKR / $1.00 reward'
    ],
    actionLabel: 'Open Zulti Earning',
    icon: 'payments',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d3-3',
    dayIndex: 2,
    dayName: 'Day 3 (Wednesday)',
    taskNumber: 3,
    title: 'Ginger: Cash Flow Portal Registration',
    category: 'earning',
    url: 'https://ginger-cash-flow.base44.app/auth?ref=GC-364007',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Open Ginger Cash Flow authorization page with code GC-364007.',
    instructions: [
      'Open Ginger Cash Flow web application',
      'Verify the referral code GC-364007 is populated',
      'Review dashboard interface and activate session',
      'Return to auto-verify and receive credit'
    ],
    actionLabel: 'Open Ginger Cash Flow',
    icon: 'account_balance_wallet',
    isLive: true,
    timerSeconds: 12
  },

  // DAY 4 (Thursday) - 3 Daily Tasks
  {
    id: 'task-d4-1',
    dayIndex: 3,
    dayName: 'Day 4 (Thursday)',
    taskNumber: 1,
    title: 'YouTube: FIFA Fanpage Thursday Highlights Short',
    category: 'youtube',
    url: 'https://youtube.com/@fifa_fanpage-f2d?si=dn7FZvuHa9jih4vW',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Support FIFA Fanpage with Thursday\'s Shorts viewing and like verification.',
    instructions: [
      'Visit FIFA Fanpage channel',
      'Watch today\'s tactical highlights Short',
      'Leave a Like & verify bell notification',
      'Auto-verify completes in 12s'
    ],
    actionLabel: 'Watch Thursday Short',
    icon: 'video_library',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d4-2',
    dayIndex: 3,
    dayName: 'Day 4 (Thursday)',
    taskNumber: 2,
    title: 'Zenvora: Cash Portal Signup & Check',
    category: 'earning',
    url: 'https://zenvoracash.com/signup?ref=6534CAA0',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Open Zenvora Cash registration page with sponsor referral 6534CAA0.',
    instructions: [
      'Navigate to Zenvora Cash sign-up portal',
      'Confirm referral code 6534CAA0',
      'Explore available earnings tasks',
      'Return to claim 10 PKR / $1.00 USD reward'
    ],
    actionLabel: 'Visit Zenvora Cash',
    icon: 'monetization_on',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d4-3',
    dayIndex: 3,
    dayName: 'Day 4 (Thursday)',
    taskNumber: 3,
    title: 'Telegram: X-Earn Network Bot',
    category: 'telegram',
    url: 'https://t.me/XEarnNetwork_Bot/app?startapp=8656370801',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Open X-Earn Network Telegram Mini App and claim network reward.',
    instructions: [
      'Launch X-Earn Network Bot on Telegram',
      'Start the Mini App using ID 8656370801',
      'Perform the daily faucet claim',
      'Auto-verification credits wallet directly'
    ],
    actionLabel: 'Open X-Earn Bot',
    icon: 'stream',
    isLive: true,
    timerSeconds: 12
  },

  // DAY 5 (Friday) - 3 Daily Tasks
  {
    id: 'task-d5-1',
    dayIndex: 4,
    dayName: 'Day 5 (Friday)',
    taskNumber: 1,
    title: 'YouTube: FIFA Fanpage Friday Special Short',
    category: 'youtube',
    url: 'https://youtube.com/@fifa_fanpage-f2d?si=dn7FZvuHa9jih4vW',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Watch Friday\'s top 10 solo goals Short on FIFA Fanpage.',
    instructions: [
      'Visit FIFA Fanpage YouTube channel',
      'Watch Friday special Short release',
      'Hit Like and confirm subscription',
      'Automatic verification triggers in 12s'
    ],
    actionLabel: 'Watch Friday Short',
    icon: 'emoji_events',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d5-2',
    dayIndex: 4,
    dayName: 'Day 5 (Friday)',
    taskNumber: 2,
    title: 'Telegram: AI Novum Mining Node',
    category: 'mining',
    url: 'https://t.me/ainovum_bot?start=ref_8656370801',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Connect to AI Novum telegram intelligence node and trigger mining clock.',
    instructions: [
      'Launch AI Novum Bot via referral 8656370801',
      'Press Start to sync your cloud worker',
      'Attest worker status',
      'System credits wallet immediately'
    ],
    actionLabel: 'Connect AI Novum',
    icon: 'psychology',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d5-3',
    dayIndex: 4,
    dayName: 'Day 5 (Friday)',
    taskNumber: 3,
    title: 'Telegram: Nautilus Mine Bot',
    category: 'mining',
    url: 'https://t.me/NautilusMineBot/mine?startapp=8656370801',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Access Nautilus Mine Bot terminal and launch deep ocean hash miner.',
    instructions: [
      'Open Nautilus Mine Bot on Telegram',
      'Launch Mini App mining dashboard',
      'Collect current cycle yield',
      'Return to complete automated check'
    ],
    actionLabel: 'Mine Nautilus',
    icon: 'water_drop',
    isLive: true,
    timerSeconds: 12
  },

  // DAY 6 (Saturday) - 3 Daily Tasks
  {
    id: 'task-d6-1',
    dayIndex: 5,
    dayName: 'Day 6 (Saturday)',
    taskNumber: 1,
    title: 'YouTube: FIFA Fanpage Weekend Skills Short',
    category: 'youtube',
    url: 'https://youtube.com/@fifa_fanpage-f2d?si=dn7FZvuHa9jih4vW',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Watch Saturday\'s football tricks and freestyle Shorts compilation.',
    instructions: [
      'Open FIFA Fanpage channel',
      'Watch Saturday football freestyle Short',
      'Click Like and Share',
      'Auto-verification confirms completion'
    ],
    actionLabel: 'Watch Saturday Short',
    icon: 'thumb_up',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d6-2',
    dayIndex: 5,
    dayName: 'Day 6 (Saturday)',
    taskNumber: 2,
    title: 'Telegram: Auction Astra Bot',
    category: 'telegram',
    url: 'https://t.me/AuctionAstra_bot?start=ref_8656370801',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Join Auction Astra Telegram community and verify entry referral.',
    instructions: [
      'Launch Auction Astra Bot',
      'Start the bot with ref 8656370801',
      'Check active digital auctions',
      'Return to collect 10 PKR / $1.00 USD'
    ],
    actionLabel: 'Join Auction Astra',
    icon: 'gavel',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d6-3',
    dayIndex: 5,
    dayName: 'Day 6 (Saturday)',
    taskNumber: 3,
    title: 'Telegram: Bigram App Mining Bot',
    category: 'mining',
    url: 'https://t.me/bigramapp_bot?start=ref_819ba64c7cc52753f700663ebigram',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Activate Bigram Telegram App and initiate daily cloud mining block.',
    instructions: [
      'Open Bigram App Bot with start link',
      'Launch Bigram mining interface',
      'Initiate 24h block mining',
      'Automatic verification credits account'
    ],
    actionLabel: 'Start Bigram Mining',
    icon: 'memory',
    isLive: true,
    timerSeconds: 12
  },

  // DAY 7 (Sunday) - 3 Daily Tasks
  {
    id: 'task-d7-1',
    dayIndex: 6,
    dayName: 'Day 7 (Sunday)',
    taskNumber: 1,
    title: 'YouTube: FIFA Fanpage Sunday Ultimate Short',
    category: 'youtube',
    url: 'https://youtube.com/@fifa_fanpage-f2d?si=dn7FZvuHa9jih4vW',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Complete the 7-day cycle with Sunday\'s prime Short video on FIFA Fanpage.',
    instructions: [
      'Visit FIFA Fanpage channel',
      'Watch Sunday\'s prime match recap Short',
      'Like and confirm full subscription',
      'Automatic verification triggers in 12s'
    ],
    actionLabel: 'Watch Sunday Short',
    icon: 'star',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d7-2',
    dayIndex: 6,
    dayName: 'Day 7 (Sunday)',
    taskNumber: 2,
    title: 'Telegram: Volta Mining Bot',
    category: 'mining',
    url: 'https://t.me/volta_mining_bot?start=ref_8656370801',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Spin up Volta high-speed energy miner on Telegram.',
    instructions: [
      'Open Volta Mining Bot',
      'Tap Start Mining via ref 8656370801',
      'Collect Volta power units',
      'Verify to claim your wallet reward'
    ],
    actionLabel: 'Launch Volta Miner',
    icon: 'flash_on',
    isLive: true,
    timerSeconds: 12
  },
  {
    id: 'task-d7-3',
    dayIndex: 6,
    dayName: 'Day 7 (Sunday)',
    taskNumber: 3,
    title: 'Telegram: Epsilon Crypto App',
    category: 'earning',
    url: 'https://t.me/Epsiloncrypto_bot/Epsilon?startapp=EPS-29462071',
    rewardPkr: 10,
    rewardUsd: 1.0,
    description: 'Launch Epsilon Crypto Mini App and claim Sunday bonus allocation.',
    instructions: [
      'Open Epsilon Crypto Bot with code EPS-29462071',
      'Launch Epsilon Mini App',
      'Claim Sunday airdrop credit',
      'Automatic verification completes in 12s'
    ],
    actionLabel: 'Open Epsilon App',
    icon: 'token',
    isLive: true,
    timerSeconds: 12
  }
];

// Master Pool of all 31 Links shared by Owner for rotation & Owner Portal management
export const ALL_OWNER_TASK_LINKS = [
  { id: 'pool-0', name: 'YouTube: FIFA Fanpage (Like, Subscribe, Share)', url: 'https://youtube.com/@fifa_fanpage-f2d?si=dn7FZvuHa9jih4vW', type: 'youtube' },
  { id: 'pool-1', name: 'Telegram: Pitbull Coin Bot', url: 'https://t.me/pitbullcoinbot/app?startapp=8656370801', type: 'telegram' },
  { id: 'pool-2', name: 'Telegram: Music Mining MB Bot', url: 'https://t.me/MusicMiningMB_Bot?start=MB006NDU', type: 'mining' },
  { id: 'pool-3', name: 'Telegram: Wisplings Bot', url: 'https://t.me/wisplings_bot?startapp=yarIT0gYypc', type: 'telegram' },
  { id: 'pool-4', name: 'Telegram: Shards Earn Bot', url: 'https://t.me/ShardsEarnBot/app?startapp=8656370801', type: 'mining' },
  { id: 'pool-5', name: 'Zulti: Earning Link (Account 1)', url: 'https://zulti.com/?r=GYDNNWTVVA', type: 'earning' },
  { id: 'pool-6', name: 'Ginger: Cash Flow Portal', url: 'https://ginger-cash-flow.base44.app/auth?ref=GC-364007', type: 'earning' },
  { id: 'pool-7', name: 'Zulti: Earning Link (Account 2)', url: 'https://zulti.com/?r=77F9R7PFMT', type: 'earning' },
  { id: 'pool-8', name: 'Zenvora: Cash Signup', url: 'https://zenvoracash.com/signup?ref=6534CAA0', type: 'earning' },
  { id: 'pool-9', name: 'Telegram: X-Earn Network Bot', url: 'https://t.me/XEarnNetwork_Bot/app?startapp=8656370801', type: 'telegram' },
  { id: 'pool-10', name: 'Telegram: AI Novum Bot', url: 'https://t.me/ainovum_bot?start=ref_8656370801', type: 'mining' },
  { id: 'pool-11', name: 'Telegram: Pitbull Coin Web App', url: 'https://t.me/pitbullcoinbot/app?startapp=8656370801', type: 'telegram' },
  { id: 'pool-12', name: 'Telegram: Nautilus Mine Bot', url: 'https://t.me/NautilusMineBot/mine?startapp=8656370801', type: 'mining' },
  { id: 'pool-13', name: 'Telegram: Auction Astra Bot', url: 'https://t.me/AuctionAstra_bot?start=ref_8656370801', type: 'telegram' },
  { id: 'pool-14', name: 'Telegram: Bigram App Bot', url: 'https://t.me/bigramapp_bot?start=ref_819ba64c7cc52753f700663ebigram', type: 'mining' },
  { id: 'pool-15', name: 'Telegram: Volta Mining Bot', url: 'https://t.me/volta_mining_bot?start=ref_8656370801', type: 'mining' },
  { id: 'pool-16', name: 'Telegram: Epsilon Crypto Bot', url: 'https://t.me/Epsiloncrypto_bot/Epsilon?startapp=EPS-29462071', type: 'telegram' },
  { id: 'pool-17', name: 'Telegram: ProgCoin Bot (Invite 1)', url: 'https://t.me/progcoinbot/app?startapp=invite_8656370801', type: 'telegram' },
  { id: 'pool-18', name: 'Telegram: ProgCoin Bot (Invite 2)', url: 'https://t.me/progcoinbot/app?startapp=invite_7045171660', type: 'telegram' },
  { id: 'pool-19', name: 'Telegram: ATF Airdrop Bot', url: 'https://t.me/ATF_AIRDROP_bot?start=7045171660', type: 'telegram' },
  { id: 'pool-20', name: 'Telegram: Zyntrix Mining Bot', url: 'https://t.me/ZyntrixMiningBot?startapp=8656370801', type: 'mining' },
  { id: 'pool-21', name: 'Ravevolut: Earn Register', url: 'https://rave-volut-earn.base44.app/register?ref=talhaahmed', type: 'earning' },
  { id: 'pool-22', name: 'Strings: Network Ref', url: 'https://ref.stringsnet.com/talhaahmed', type: 'earning' },
  { id: 'pool-23', name: 'Nova Network: Earning App', url: 'https://mynovanetwork.app/r/VY15XO34', type: 'earning' },
  { id: 'pool-24', name: 'Grey Network: MineGrey Cloud', url: 'https://app.minegrey.com/TalhaAhmed', type: 'mining' },
  { id: 'pool-25', name: 'GoMining: Bitcoin Miner', url: 'https://gomining.com/?ref=0D5Z9XH', type: 'mining' },
  { id: 'pool-26', name: 'BitToken: Bitcoin Miner App', url: 'https://bittokenapp.com/register?ref=9044003793', type: 'mining' },
  { id: 'pool-27', name: 'Telegram: Bitcoin Booster Nova Bot', url: 'https://t.me/BitcoinBoosterNovaBot/App?startapp=8656370801', type: 'mining' },
  { id: 'pool-28', name: 'Telegram: Coinrush Robot', url: 'https://t.me/Coinrushrobot/app?startapp=ref_', type: 'telegram' },
  { id: 'pool-29', name: 'Telegram: Ruby Earn Bot', url: 'https://t.me/RubyEarn_Bot/myapp?startapp=7045171660', type: 'mining' },
  { id: 'pool-30', name: 'Telegram: Datamineer Bot', url: 'https://t.me/Datamineer_bot?start=DATARQGIXB', type: 'mining' }
];

// Helper to get current day index (0 = Monday .. 6 = Sunday)
export const getCurrentDayIndex = (): number => {
  const day = new Date().getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  // Map so 0 = Monday, 6 = Sunday
  return day === 0 ? 6 : day - 1;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Get or calculate the active day index (0..6) using 24-hour cycle progression
export const getActiveDayIndex = (): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const savedDayStr = localStorage.getItem('emerald_trust_active_day_index');
    const savedTimestampStr = localStorage.getItem('emerald_trust_active_day_start_time');

    if (savedDayStr !== null && savedTimestampStr !== null) {
      const savedDay = parseInt(savedDayStr, 10);
      const startTime = parseInt(savedTimestampStr, 10);
      const now = Date.now();
      const elapsed = now - startTime;

      if (!isNaN(savedDay) && !isNaN(startTime) && elapsed >= DAY_IN_MS) {
        // 24 hours have passed! Automatically advance to next day!
        const daysPassed = Math.floor(elapsed / DAY_IN_MS);
        const nextDay = (savedDay + daysPassed) % 7;
        const newStartTime = startTime + daysPassed * DAY_IN_MS;
        localStorage.setItem('emerald_trust_active_day_index', nextDay.toString());
        localStorage.setItem('emerald_trust_active_day_start_time', newStartTime.toString());
        return nextDay;
      }
      if (!isNaN(savedDay) && savedDay >= 0 && savedDay < 7) {
        return savedDay;
      }
    }

    // First time initialization: initialize to Day 1 (index 0) or current day of week
    const initialDay = 0; // Starts from Day 1
    localStorage.setItem('emerald_trust_active_day_index', initialDay.toString());
    localStorage.setItem('emerald_trust_active_day_start_time', Date.now().toString());
    return initialDay;
  } catch (e) {
    return 0;
  }
};

// Returns remaining milliseconds until the active day 24-hour cycle ends and next day appears
export const getTimeUntilNextDayMs = (): number => {
  if (typeof window === 'undefined') return DAY_IN_MS;
  try {
    const savedTimestampStr = localStorage.getItem('emerald_trust_active_day_start_time');
    if (savedTimestampStr) {
      const startTime = parseInt(savedTimestampStr, 10);
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = DAY_IN_MS - (elapsed % DAY_IN_MS);
      return Math.max(0, remaining);
    }
  } catch (e) {}
  return DAY_IN_MS;
};

// Manually advance to next day (useful for testing or manual progression)
export const advanceActiveDay = (): number => {
  const current = getActiveDayIndex();
  const next = (current + 1) % 7;
  try {
    localStorage.setItem('emerald_trust_active_day_index', next.toString());
    localStorage.setItem('emerald_trust_active_day_start_time', Date.now().toString());
  } catch (e) {}
  return next;
};

// Helper to get today's 3 scheduled tasks for the given day index
export const getTasksForDay = (allTasks: DailyTask[], dayIndex: number): DailyTask[] => {
  const dayTasks = allTasks.filter(t => t.dayIndex === dayIndex && t.isLive);
  if (dayTasks.length >= 3) {
    return dayTasks.slice(0, 3);
  }
  // fallback: return first 3 live tasks
  return allTasks.filter(t => t.isLive).slice(0, 3);
};

// Helper to get today's 3 scheduled tasks
export const getTodayTasks = (allTasks: DailyTask[]): DailyTask[] => {
  const dayIndex = getActiveDayIndex();
  return getTasksForDay(allTasks, dayIndex);
};
