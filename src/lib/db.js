import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zorra_royals';

let client;
let clientPromise;
let useFallback = false;

// Memory/File fallback database for local environments without live mongod
class FallbackCollection {
  constructor(name, getStore, saveStore) {
    this.name = name;
    this.getStore = getStore;
    this.saveStore = saveStore;
  }

  _getItems() {
    const store = this.getStore();
    if (!store[this.name]) {
      store[this.name] = [];
    }
    return store[this.name];
  }

  async countDocuments(query = {}) {
    const items = await this.find(query);
    return items.length;
  }

  async findOne(query = {}) {
    const items = this._getItems();
    return items.find(item => this._matches(item, query)) || null;
  }

  find(query = {}) {
    const items = this._getItems();
    let results = items.filter(item => this._matches(item, query));

    const createCursor = (data) => ({
      sort: (sortSpec) => {
        const [field, direction] = Object.entries(sortSpec || {})[0] || [];
        if (field) {
          data.sort((a, b) => {
            const valA = a[field] instanceof Date ? a[field].getTime() : a[field];
            const valB = b[field] instanceof Date ? b[field].getTime() : b[field];
            if (valA < valB) return direction === -1 ? 1 : -1;
            if (valA > valB) return direction === -1 ? -1 : 1;
            return 0;
          });
        }
        return createCursor(data);
      },
      limit: (n) => createCursor(data.slice(0, n)),
      skip: (n) => createCursor(data.slice(n)),
      project: (projection) => {
        if (!projection || typeof projection !== 'object') return createCursor(data);
        const projected = data.map(item => {
          const newItem = {};
          for (const [k, v] of Object.entries(projection)) {
            if (v) newItem[k] = item[k];
          }
          if (projection._id !== 0 && item._id !== undefined) {
            newItem._id = item._id;
          }
          return newItem;
        });
        return createCursor(projected);
      },
      toArray: async () => data,
    });

    return createCursor(results);
  }

  aggregate(pipeline = []) {
    let items = [...this._getItems()];
    for (const stage of pipeline) {
      if (stage.$match) {
        items = items.filter(item => this._matches(item, stage.$match));
      }
      if (stage.$group) {
        let total = 0;
        let count = items.length;
        let totalBets = 0;
        let totalWins = 0;
        for (const item of items) {
          if (stage.$group.total?.$sum) {
            const rawField = String(stage.$group.total.$sum).replace('$', '');
            total += Number(item[rawField]) || 0;
          }
          if (stage.$group.totalBets?.$sum) {
            const rawField = String(stage.$group.totalBets.$sum).replace('$', '');
            totalBets += Number(item[rawField]) || 0;
          }
          if (stage.$group.totalWins?.$sum) {
            const rawField = String(stage.$group.totalWins.$sum).replace('$', '');
            totalWins += Number(item[rawField]) || 0;
          }
        }
        items = [{ _id: null, total, count, totalBets, totalWins, totalRounds: count }];
      }
    }
    return {
      toArray: async () => items,
    };
  }

  async insertOne(doc) {
    const items = this._getItems();
    const timestampHex = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const hexId = (timestampHex + randomHex).toLowerCase();

    const newDoc = {
      _id: doc._id ? String(doc._id) : hexId,
      ...doc,
      createdAt: doc.createdAt || new Date(),
    };
    items.unshift(newDoc);
    this.saveStore();
    return { insertedId: newDoc._id };
  }

  async insertMany(docs) {
    const items = this._getItems();
    const insertedIds = [];
    for (const doc of docs) {
      const timestampHex = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
      const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const hexId = (timestampHex + randomHex).toLowerCase();

      const newDoc = {
        _id: doc._id ? String(doc._id) : hexId,
        ...doc,
        createdAt: doc.createdAt || new Date(),
      };
      items.unshift(newDoc);
      insertedIds.push(newDoc._id);
    }
    this.saveStore();
    return { insertedIds };
  }

  async updateOne(query, update, options = {}) {
    const item = await this.findOne(query);
    if (!item) {
      if (options && options.upsert) {
        const timestampHex = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
        const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        const hexId = (timestampHex + randomHex).toLowerCase();
        const baseQuery = {};
        if (query && typeof query === 'object') {
          for (const [k, v] of Object.entries(query)) {
            if (!k.startsWith('$') && typeof v !== 'object') {
              baseQuery[k] = v;
            }
          }
        }
        const newDoc = {
          _id: hexId,
          ...baseQuery,
          ...(update.$set || {}),
          createdAt: new Date(),
        };
        this._getItems().unshift(newDoc);
        this.saveStore();
        return { matchedCount: 0, modifiedCount: 1, upsertedId: hexId };
      }
      return { matchedCount: 0, modifiedCount: 0 };
    }

    if (update.$set) {
      Object.assign(item, update.$set);
    }
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        item[k] = (item[k] || 0) + v;
      }
    }
    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        if (!Array.isArray(item[k])) item[k] = [];
        item[k].push(v);
      }
    }
    item.updatedAt = new Date();
    this.saveStore();
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async updateMany(query, update, options = {}) {
    const items = this._getItems();
    const matches = items.filter(item => this._matches(item, query));
    let modifiedCount = 0;

    for (const item of matches) {
      if (update.$set) {
        Object.assign(item, update.$set);
      }
      if (update.$inc) {
        for (const [k, v] of Object.entries(update.$inc)) {
          item[k] = (item[k] || 0) + v;
        }
      }
      if (update.$push) {
        for (const [k, v] of Object.entries(update.$push)) {
          if (!Array.isArray(item[k])) item[k] = [];
          item[k].push(v);
        }
      }
      item.updatedAt = new Date();
      modifiedCount++;
    }

    if (modifiedCount > 0) {
      this.saveStore();
    }
    return { matchedCount: matches.length, modifiedCount };
  }

  async deleteOne(query) {
    const items = this._getItems();
    const idx = items.findIndex(item => this._matches(item, query));
    if (idx !== -1) {
      items.splice(idx, 1);
      this.saveStore();
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(query) {
    const items = this._getItems();
    const initialLen = items.length;
    const remaining = items.filter(item => !this._matches(item, query));
    const deletedCount = initialLen - remaining.length;
    if (deletedCount > 0) {
      this.getStore()[this.name] = remaining;
      this.saveStore();
    }
    return { deletedCount };
  }

  _matches(item, query) {
    if (!query || Object.keys(query).length === 0) return true;
    for (const [k, v] of Object.entries(query)) {
      if (k === '$or' && Array.isArray(v)) {
        const orMatch = v.some(subQuery => this._matches(item, subQuery));
        if (!orMatch) return false;
        continue;
      }
      if (k === '$and' && Array.isArray(v)) {
        const andMatch = v.every(subQuery => this._matches(item, subQuery));
        if (!andMatch) return false;
        continue;
      }
      // If v is an ObjectId
      if (v && typeof v === 'object' && (v._bsontype === 'ObjectID' || v.constructor?.name === 'ObjectId')) {
        if (String(item[k] || '') !== String(v)) return false;
        continue;
      }
      // If v is a query operator object ($in, $nin, $ne, $gte, $lte, $regex)
      if (v && typeof v === 'object' && !(v instanceof Date)) {
        if (v.$ne !== undefined && String(item[k] || '') === String(v.$ne)) return false;
        if (v.$in !== undefined && Array.isArray(v.$in)) {
          const matched = v.$in.some(target => String(target) === String(item[k] || ''));
          if (!matched) return false;
          continue;
        }
        if (v.$nin !== undefined && Array.isArray(v.$nin)) {
          const matched = v.$nin.some(target => String(target) === String(item[k] || ''));
          if (matched) return false;
          continue;
        }
        if (v.$gte !== undefined && (item[k] === undefined || item[k] < v.$gte)) return false;
        if (v.$lte !== undefined && (item[k] === undefined || item[k] > v.$lte)) return false;
        if (v.$gt !== undefined && (item[k] === undefined || item[k] <= v.$gt)) return false;
        if (v.$lt !== undefined && (item[k] === undefined || item[k] >= v.$lt)) return false;
        if (v.$regex !== undefined) {
          const re = new RegExp(v.$regex, v.$options || '');
          if (!re.test(String(item[k] || ''))) return false;
          continue;
        }
        continue;
      }
      // Direct comparison (normalize strings for IDs)
      if (k === '_id' || k.endsWith('Id') || k.endsWith('id')) {
        if (String(item[k] || '') !== String(v || '')) return false;
      } else {
        if (item[k] !== v) return false;
      }
    }
    return true;
  }
}

let storeData = null;
const STORE_PATH = path.join(process.cwd(), '.zorra_store.json');

function loadStore() {
  if (storeData) return storeData;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, 'utf-8');
      storeData = JSON.parse(content);
      return storeData;
    }
  } catch {
    // fallback
  }
  storeData = {};
  return storeData;
}

function saveStore() {
  try {
    if (storeData) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(storeData, null, 2), 'utf-8');
    }
  } catch {
    // silent
  }
}

class FallbackDatabase {
  collection(name) {
    return new FallbackCollection(name, loadStore, saveStore);
  }
}

export async function getDb(dbName = 'zorra_royals') {
  if (useFallback) {
    return new FallbackDatabase();
  }

  try {
    if (!clientPromise) {
      client = new MongoClient(uri, {
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 2000,
      });
      clientPromise = client.connect();
    }
    const c = await clientPromise;
    return c.db(dbName);
  } catch (err) {
    console.warn('⚡ Using Zorra Royals resilient local storage engine (MongoDB not active):', err.message);
    useFallback = true;
    return new FallbackDatabase();
  }
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
      welcomeBonusPercentage: 100, // 100% on first deposit
      regularBonusPercentage: 20,   // 20% on recurring deposits
      signupBonusAmount: 3.0,       // $3 one-time signup freeplay
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
