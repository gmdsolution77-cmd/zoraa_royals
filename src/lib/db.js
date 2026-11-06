import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zorra_royals';

let client;
let clientPromise;

/**
 * Single MongoDB connection — no local JSON fallback (.zorra_store.json removed).
 * Set MONGODB_URI in production (and ensure mongod is running for local dev).
 */
export async function getDb(dbName = 'zorra_royals') {
  if (!uri || !String(uri).trim()) {
    throw new Error('MONGODB_URI is not set. File-based storage has been removed; use MongoDB only.');
  }

  if (!clientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 15000,
    });
    clientPromise = client.connect();
  }

  const c = await clientPromise;
  return c.db(dbName);
}

export async function initDb() {
  const db = await getDb();

  // 1. Ensure Super Admin & Staff
  const usersCol = db.collection('users');
  const adminExists = await usersCol.findOne({ email: 'admin@zorraroyals.com' });
  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('RoyalAdmin2026!', salt);
    await usersCol.insertOne({
      username: 'RoyalAdmin',
      email: 'admin@zorraroyals.com',
      password: hash,
      role: 'super_admin',
      vipTier: 'Royal Emperor',
      balance: 100000.0,
      isVerified: true,
      createdAt: new Date(),
    });
  }

  // Ensure Demo VIP Player
  const playerExists = await usersCol.findOne({ email: 'player@zorraroyals.com' });
  if (!playerExists) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Player123!', salt);
    await usersCol.insertOne({
      username: 'CrownPlayer',
      email: 'player@zorraroyals.com',
      password: hash,
      role: 'player',
      vipTier: 'Gold',
      balance: 150.0,
      firstDepositMade: false,
      signupBonusClaimed: true,
      isVerified: true,
      createdAt: new Date(),
    });
  }

  // 2. Ensure Curated Games
  const gamesCol = db.collection('games');
  const gameCount = await gamesCol.countDocuments();
  if (gameCount === 0) {
    await gamesCol.insertMany([
      {
        gameId: 'royal-777',
        title: 'Zorra Royal 777 Slots',
        category: 'slots',
        provider: 'Zorra Royals Studio',
        thumbnail: '/images/games/royal-777.jpg',
        type: 'internal',
        minBetSC: 0.2,
        maxBetSC: 200.0,
        minBetGC: 100,
        maxBetGC: 100000,
        rtp: 97.5,
        isActive: true,
        isHot: true,
        isFeatured: true,
        playsCount: 28400,
        createdAt: new Date(),
      },
      {
        gameId: 'orion-stars',
        title: 'Orion Stars VIP',
        category: 'fish',
        provider: 'Orion Platform',
        thumbnail: '/images/games/orion-stars.jpg',
        type: 'external',
        url: 'https://orionstars.vip',
        minBetSC: 0.5,
        maxBetSC: 100.0,
        rtp: 96.5,
        isActive: true,
        isHot: true,
        isFeatured: true,
        playsCount: 52300,
        createdAt: new Date(),
      },
      {
        gameId: 'fire-kirin',
        title: 'Fire Kirin Ultimate',
        category: 'fish',
        provider: 'Fire Kirin',
        thumbnail: '/images/games/fire-kirin.jpg',
        type: 'external',
        url: 'https://firekirin.xyz',
        minBetSC: 0.5,
        maxBetSC: 100.0,
        rtp: 96.2,
        isActive: true,
        isHot: true,
        isFeatured: false,
        playsCount: 61400,
        createdAt: new Date(),
      },
      {
        gameId: 'royal-crash',
        title: 'Crown Rocket Crash',
        category: 'arcade',
        provider: 'Zorra Royals Studio',
        thumbnail: '/images/games/royal-crash.jpg',
        type: 'internal',
        minBetSC: 0.5,
        maxBetSC: 500.0,
        minBetGC: 500,
        maxBetGC: 250000,
        rtp: 98.2,
        isActive: true,
        isHot: true,
        isFeatured: true,
        playsCount: 42100,
        createdAt: new Date(),
      },
      {
        gameId: 'milky-way',
        title: 'Milky Way Galaxy',
        category: 'fish',
        provider: 'Milky Way',
        thumbnail: '/images/games/milky-way.jpg',
        type: 'external',
        url: 'https://milkywayapp.com',
        minBetSC: 0.5,
        maxBetSC: 100.0,
        rtp: 96.0,
        isActive: true,
        isHot: true,
        isFeatured: false,
        playsCount: 38900,
        createdAt: new Date(),
      },
      {
        gameId: 'game-vault',
        title: 'Game Vault 999 VIP',
        category: 'slots',
        provider: 'Game Vault',
        thumbnail: '/images/games/game-vault.jpg',
        type: 'external',
        url: 'https://download.gamevault999.com',
        minBetSC: 0.25,
        maxBetSC: 100.0,
        rtp: 96.0,
        isActive: true,
        isHot: false,
        isFeatured: false,
        playsCount: 24700,
        createdAt: new Date(),
      },
      {
        gameId: 'juwa-777',
        title: 'Juwa 777 Palace',
        category: 'slots',
        provider: 'Juwa',
        thumbnail: '/images/games/juwa.jpg',
        type: 'external',
        url: 'https://juwa777.com',
        minBetSC: 0.25,
        maxBetSC: 100.0,
        rtp: 96.4,
        isActive: true,
        isHot: true,
        isFeatured: false,
        playsCount: 41200,
        createdAt: new Date(),
      },
      {
        gameId: 'ultra-panda',
        title: 'Ultra Panda Golden',
        category: 'slots',
        provider: 'Panda Sweeps',
        thumbnail: '/images/games/ultra-panda.jpg',
        type: 'external',
        url: 'https://ultrapanda.mobi',
        minBetSC: 0.25,
        maxBetSC: 100.0,
        rtp: 96.1,
        isActive: true,
        isHot: false,
        isFeatured: false,
        playsCount: 21900,
        createdAt: new Date(),
      },
      {
        gameId: 'golden-dragon',
        title: 'Golden Dragon Sweeps',
        category: 'fish',
        provider: 'Golden Dragon',
        thumbnail: '/images/games/golden-dragon.jpg',
        type: 'external',
        url: 'https://playgd.city',
        minBetSC: 0.5,
        maxBetSC: 100.0,
        rtp: 96.3,
        isActive: true,
        isHot: true,
        isFeatured: true,
        playsCount: 35600,
        createdAt: new Date(),
      },
      {
        gameId: 'panda-master',
        title: 'Panda Master VIP',
        category: 'slots',
        provider: 'Panda Master',
        thumbnail: '/images/games/panda-master.jpg',
        type: 'external',
        url: 'https://pandamaster.vip',
        minBetSC: 0.25,
        maxBetSC: 100.0,
        rtp: 96.2,
        isActive: true,
        isHot: false,
        isFeatured: false,
        playsCount: 18400,
        createdAt: new Date(),
      },
      {
        gameId: 'royal-blackjack',
        title: 'High Stakes VIP Blackjack',
        category: 'tables',
        provider: 'Zorra Royals Studio',
        thumbnail: '/images/games/royal-blackjack.jpg',
        type: 'internal',
        minBetSC: 1.0,
        maxBetSC: 1000.0,
        minBetGC: 500,
        maxBetGC: 500000,
        rtp: 99.6,
        isActive: true,
        isHot: true,
        isFeatured: true,
        playsCount: 19800,
        createdAt: new Date(),
      },
      {
        gameId: 'royal-roulette',
        title: 'Emperor European Roulette',
        category: 'tables',
        provider: 'Zorra Royals Studio',
        thumbnail: '/images/royal-roulette.webp',
        type: 'internal',
        minBetSC: 0.5,
        maxBetSC: 500.0,
        rtp: 97.3,
        isActive: true,
        isHot: true,
        isFeatured: false,
        playsCount: 15200,
        createdAt: new Date(),
      },
    ]);
  }

  // 3. Ensure Payment Methods
  const methodsCol = db.collection('payment_methods');
  const methodCount = await methodsCol.countDocuments();
  if (methodCount === 0) {
    await methodsCol.insertMany([
      {
        methodId: 'cashapp',
        name: 'Cash App',
        tag: 'Instant 24/7',
        type: 'cashapp',
        accountDetails: '$ZorraRoyalsPay',
        instructions: 'Send exact amount with your Zorra Royals username in note. Instant deposit verification upon confirmation.',
        minDeposit: 10.0,
        maxDeposit: 2500.0,
        isActive: true,
        createdAt: new Date(),
      },
      {
        methodId: 'zelle',
        name: 'Zelle Pay',
        tag: 'Zero Fee',
        type: 'zelle',
        accountDetails: 'pay@zorraroyals.com',
        instructions: 'Send payment via bank app with Zelle. Enter your account registered email in payment note.',
        minDeposit: 20.0,
        maxDeposit: 5000.0,
        isActive: true,
        createdAt: new Date(),
      },
      {
        methodId: 'venmo',
        name: 'Venmo',
        tag: 'Popular',
        type: 'venmo',
        accountDetails: '@ZorraRoyals',
        instructions: 'Turn off "purchase protection" for instant crediting. Add username in note.',
        minDeposit: 15.0,
        maxDeposit: 1500.0,
        isActive: true,
        createdAt: new Date(),
      },
      {
        methodId: 'crypto_usdt',
        name: 'USDT (TRC-20)',
        tag: 'VIP Crypto',
        type: 'crypto',
        accountDetails: 'TZrRoyalsVIPTRC20OfficialWallet999',
        instructions: 'Transfer USDT on Tron TRC-20 network only. Provide transaction TXID hash for automatic crediting.',
        minDeposit: 25.0,
        maxDeposit: 25000.0,
        isActive: true,
        createdAt: new Date(),
      },
      {
        methodId: 'crypto_btc',
        name: 'Bitcoin (BTC)',
        tag: 'VIP Crypto',
        type: 'crypto',
        accountDetails: 'bc1qzorraroyalscasinoofficialbtc999',
        instructions: 'Send exact BTC amount. Coins credited immediately upon 1 blockchain confirmation.',
        minDeposit: 30.0,
        maxDeposit: 50000.0,
        isActive: true,
        createdAt: new Date(),
      },
    ]);
  }

  // 4. Ensure System Settings
  const settingsCol = db.collection('system_settings');
  const settings = await settingsCol.findOne({ key: 'general' });
  if (!settings) {
    await settingsCol.insertOne({
      key: 'general',
      siteName: 'Zorra Royals',
      domain: 'zoraaroyal.com',
      welcomeBonusPercentage: 100,
      regularBonusPercentage: 20,
      signupBonusAmount: 3.0,
      minDeposit: 10.0,
      maxDeposit: 10000.0,
      minWithdrawal: 25.0,
      maxDailyWithdrawal: 5000.0,
      maintenanceMode: false,
      updatedAt: new Date(),
    });
  }

  // 5. Ensure Default Promotions
  const promosCol = db.collection('promotions');
  const promoCount = await promosCol.countDocuments();
  if (promoCount === 0) {
    await promosCol.insertMany([
      {
        promoId: 'ROYAL150',
        code: 'ROYAL150',
        title: '150% Royal Crown Welcome Match',
        rewardSC: 15.0,
        rewardGC: 150000,
        minDeposit: 20.0,
        usageLimit: 5000,
        timesUsed: 128,
        isActive: true,
        createdAt: new Date(),
      },
      {
        promoId: 'FREE10SC',
        code: 'FREE10SC',
        title: '10 Free Sweeps Coins VIP Pass',
        rewardSC: 10.0,
        rewardGC: 50000,
        minDeposit: 0.0,
        usageLimit: 10000,
        timesUsed: 620,
        isActive: true,
        createdAt: new Date(),
      },
    ]);
  }

  return true;
}
