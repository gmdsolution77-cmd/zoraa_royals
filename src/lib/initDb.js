import bcrypt from 'bcryptjs';
import { getDb } from './mongodb';
import { ROLES } from './auth';

export async function ensureDbInitialized() {
  try {
    const db = await getDb();

    // 1. Ensure Super Admin and Staff accounts
    const usersCol = db.collection('users');
    const existingAdmin = await usersCol.findOne({ role: ROLES.SUPER_ADMIN });

    if (!existingAdmin) {
      console.log('Seeding initial administrators and staff...');
      const adminPasswordHash = await bcrypt.hash('VegasOne@2026!', 10);
      const staffPasswordHash = await bcrypt.hash('Staff@2026!', 10);

      await usersCol.insertMany([
        {
          username: 'superadmin',
          email: 'admin@vegasone.games',
          passwordHash: adminPasswordHash,
          role: ROLES.SUPER_ADMIN,
          balanceSC: 10000.0,
          balanceGC: 10000000,
          kycStatus: 'approved',
          createdAt: new Date(),
        },
        {
          username: 'financemanager',
          email: 'finance@vegasone.games',
          passwordHash: staffPasswordHash,
          role: ROLES.FINANCIAL_MANAGER,
          balanceSC: 0,
          balanceGC: 0,
          kycStatus: 'approved',
          createdAt: new Date(),
        },
        {
          username: 'coinofficer',
          email: 'coins@vegasone.games',
          passwordHash: staffPasswordHash,
          role: ROLES.COIN_MANAGER,
          balanceSC: 0,
          balanceGC: 0,
          kycStatus: 'approved',
          createdAt: new Date(),
        },
        {
          username: 'operationadmin',
          email: 'ops@vegasone.games',
          passwordHash: staffPasswordHash,
          role: ROLES.OPERATION_ADMIN,
          balanceSC: 0,
          balanceGC: 0,
          kycStatus: 'approved',
          createdAt: new Date(),
        },
        {
          username: 'chatsupport',
          email: 'support@vegasone.games',
          passwordHash: staffPasswordHash,
          role: ROLES.CHAT_SUPPORT,
          balanceSC: 0,
          balanceGC: 0,
          kycStatus: 'approved',
          createdAt: new Date(),
        },
      ]);
    }

    // 2. Ensure Initial Games
    const gamesCol = db.collection('games');
    const gameCount = await gamesCol.countDocuments();
    if (gameCount === 0) {
      console.log('Seeding initial games...');
      await gamesCol.insertMany([
        {
          gameId: 'vegas-777',
          title: 'Vegas 777 Deluxe',
          category: 'slots',
          provider: 'Vegas One Studio',
          thumbnail: '/images/vegas-777.webp',
          type: 'internal',
          minBetSC: 0.2,
          maxBetSC: 50.0,
          minBetGC: 100,
          maxBetGC: 25000,
          rtp: 96.5,
          isActive: true,
          isHot: true,
          isFeatured: true,
          playsCount: 14200,
          createdAt: new Date(),
        },
        {
          gameId: 'neon-crash',
          title: 'Neon Rocket Crash',
          category: 'crash',
          provider: 'Vegas One Studio',
          thumbnail: '/images/neon-crash.webp',
          type: 'internal',
          minBetSC: 0.5,
          maxBetSC: 100.0,
          minBetGC: 250,
          maxBetGC: 50000,
          rtp: 97.0,
          isActive: true,
          isHot: true,
          isFeatured: true,
          playsCount: 22100,
          createdAt: new Date(),
        },
        {
          gameId: 'royal-roulette',
          title: 'Royal European Roulette',
          category: 'roulette',
          provider: 'Vegas One Studio',
          thumbnail: '/images/royal-roulette.webp',
          type: 'internal',
          minBetSC: 1.0,
          maxBetSC: 200.0,
          minBetGC: 500,
          maxBetGC: 100000,
          rtp: 97.3,
          isActive: true,
          isHot: false,
          isFeatured: true,
          playsCount: 8900,
          createdAt: new Date(),
        },
        {
          gameId: 'vegas-blackjack',
          title: 'Blackjack High Roller',
          category: 'blackjack',
          provider: 'Vegas One Studio',
          thumbnail: '/images/vegas-blackjack.webp',
          type: 'internal',
          minBetSC: 1.0,
          maxBetSC: 500.0,
          minBetGC: 500,
          maxBetGC: 250000,
          rtp: 99.4,
          isActive: true,
          isHot: true,
          isFeatured: true,
          playsCount: 18450,
          createdAt: new Date(),
        },
        {
          gameId: 'orion-stars',
          title: 'Orion Stars',
          category: 'fish',
          provider: 'Orion Sweepstakes',
          thumbnail: '/images/orion-stars.webp',
          type: 'external',
          url: 'https://orionstars.vip',
          minBetSC: 0.5,
          maxBetSC: 100.0,
          rtp: 96.0,
          isActive: true,
          isHot: true,
          isFeatured: false,
          playsCount: 31200,
          createdAt: new Date(),
        },
        {
          gameId: 'milky-way',
          title: 'Milky Way',
          category: 'fish',
          provider: 'Milky Way Games',
          thumbnail: '/images/milky-way.webp',
          type: 'external',
          url: 'https://milkywayapp.com',
          minBetSC: 0.5,
          maxBetSC: 100.0,
          rtp: 96.2,
          isActive: true,
          isHot: true,
          isFeatured: false,
          playsCount: 27800,
          createdAt: new Date(),
        },
        {
          gameId: 'fire-kirin',
          title: 'Fire Kirin',
          category: 'fish',
          provider: 'Kirin Gaming',
          thumbnail: '/images/fire-kirin.webp',
          type: 'external',
          url: 'https://firekirin.xyz',
          minBetSC: 0.5,
          maxBetSC: 100.0,
          rtp: 96.0,
          isActive: true,
          isHot: true,
          isFeatured: false,
          playsCount: 45900,
          createdAt: new Date(),
        },
        {
          gameId: 'game-vault',
          title: 'Game Vault 999',
          category: 'slots',
          provider: 'Game Vault Inc',
          thumbnail: '/images/game-vault.webp',
          type: 'external',
          url: 'https://download.gamevault999.com',
          minBetSC: 0.25,
          maxBetSC: 100.0,
          rtp: 95.8,
          isActive: true,
          isHot: false,
          isFeatured: false,
          playsCount: 19500,
          createdAt: new Date(),
        },
        {
          gameId: 'juwa-777',
          title: 'Juwa 777',
          category: 'slots',
          provider: 'Juwa Online',
          thumbnail: '/images/juwa-777.webp',
          type: 'external',
          url: 'https://juwa777.com',
          minBetSC: 0.25,
          maxBetSC: 100.0,
          rtp: 96.1,
          isActive: true,
          isHot: true,
          isFeatured: false,
          playsCount: 33100,
          createdAt: new Date(),
        },
        {
          gameId: 'ultra-panda',
          title: 'Ultra Panda',
          category: 'slots',
          provider: 'Panda Sweeps',
          thumbnail: '/images/ultra-panda.webp',
          type: 'external',
          url: 'https://ultrapanda.mobi',
          minBetSC: 0.25,
          maxBetSC: 100.0,
          rtp: 96.3,
          isActive: true,
          isHot: false,
          isFeatured: false,
          playsCount: 16700,
          createdAt: new Date(),
        },
        {
          gameId: 'vegas-keno',
          title: 'Neon Keno Numbers',
          category: 'keno',
          provider: 'Vegas One Studio',
          thumbnail: '/images/vegas-keno.webp',
          type: 'internal',
          minBetSC: 0.5,
          maxBetSC: 50.0,
          rtp: 95.5,
          isActive: true,
          isHot: false,
          isFeatured: false,
          playsCount: 6400,
          createdAt: new Date(),
        },
      ]);
    }

    // 3. Ensure Payment Methods
    const methodsCol = db.collection('payment_methods');
    const methodCount = await methodsCol.countDocuments();
    if (methodCount === 0) {
      console.log('Seeding initial payment gateways...');
      await methodsCol.insertMany([
        {
          methodId: 'cashapp',
          name: 'Cash App',
          tag: 'Instant',
          type: 'cashapp',
          accountDetails: '$VegasOnePay',
          instructions: 'Send payment with your Vegas One username as note. Take a screenshot of the confirmation screen.',
          minDeposit: 10.0,
          maxDeposit: 1500.0,
          isActive: true,
          createdAt: new Date(),
        },
        {
          methodId: 'zelle',
          name: 'Zelle Pay',
          tag: 'Zero Fee',
          type: 'zelle',
          accountDetails: 'pay@vegasone.games',
          instructions: 'Send payment via your bank app. Include your account email in memo.',
          minDeposit: 20.0,
          maxDeposit: 2500.0,
          isActive: true,
          createdAt: new Date(),
        },
        {
          methodId: 'venmo',
          name: 'Venmo',
          tag: 'Popular',
          type: 'venmo',
          accountDetails: '@VegasOneGames',
          instructions: 'Turn off "purchase protection" for instant crediting. Add username in note.',
          minDeposit: 10.0,
          maxDeposit: 1000.0,
          isActive: true,
          createdAt: new Date(),
        },
        {
          methodId: 'crypto_usdt',
          name: 'USDT (TRC-20)',
          tag: 'Fast Crypto',
          type: 'crypto',
          accountDetails: 'TJqV7R8W4nKm8VegasOneTRC20Address99X',
          instructions: 'Transfer USDT on Tron (TRC-20) network only. Submit TXID hash after transfer.',
          minDeposit: 20.0,
          maxDeposit: 10000.0,
          isActive: true,
          createdAt: new Date(),
        },
        {
          methodId: 'crypto_btc',
          name: 'Bitcoin (BTC)',
          tag: 'Crypto',
          type: 'crypto',
          accountDetails: 'bc1qvegasonecasinopayments99999xxxx',
          instructions: 'Send exact BTC amount. Funds credit immediately upon 1 network confirmation.',
          minDeposit: 30.0,
          maxDeposit: 10000.0,
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
        siteName: 'Vegas One',
        domain: 'vegasone.games',
        currencyRate: '1 USD = 1 SC',
        signupBonusSC: 5.0,
        signupBonusGC: 50000,
        minRedemptionSC: 50.0,
        maxDailyRedemptionSC: 2000.0,
        geoRestrictionEnabled: true,
        restrictedStates: ['WA', 'ID', 'NV', 'MI'],
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
          promoId: 'VEGAS140',
          code: 'VEGAS140',
          title: '140% Welcome Boost',
          rewardSC: 10.0,
          rewardGC: 100000,
          minDeposit: 20.0,
          usageLimit: 5000,
          timesUsed: 142,
          expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000),
          isActive: true,
          createdAt: new Date(),
        },
        {
          promoId: 'FREE5SC',
          code: 'FREE5SC',
          title: '5 Free Sweeps Coins',
          rewardSC: 5.0,
          rewardGC: 25000,
          minDeposit: 0.0,
          usageLimit: 10000,
          timesUsed: 890,
          expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000),
          isActive: true,
          createdAt: new Date(),
        },
      ]);
    }

    console.log('✅ Vegas One database verified & initial records populated.');
    return true;
  } catch (error) {
    console.error('Init DB warning:', error.message);
    return false;
  }
}
