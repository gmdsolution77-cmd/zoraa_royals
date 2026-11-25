import bcrypt from 'bcryptjs';
import { ROLES } from './auth';
import { loadStaffSessionEpoch, syncAdminEnvPasswordRotation } from './staffSessionEpoch';

// Legacy fallbacks when .env passwords are not set (existing deployments keep working)
const LEGACY_ADMIN_HASH = '$2b$10$m7amydLEDDfTUwexEkCUD.Z2cjts2O.LA094rrFjkH7Lu.65f2UcK';
const LEGACY_STAFF_HASH = '$2b$10$20/BBo/av3V9Hyx//vMKh.FLEHQl3E0sIxXgIfPe1ISLwr8AI0IPa';
const LEGACY_DEMO_PLAYER_HASH = '$2b$10$yA5gS.jldJs.7yOhCTk1subq0rM/OHgEFdErGUSTA.Je.kJKboLLO';

async function passwordHashFromEnv(envPlain, legacyHash) {
  const plain = typeof envPlain === 'string' ? envPlain.trim() : '';
  if (plain) {
    return bcrypt.hash(plain, 10);
  }
  return legacyHash;
}

/**
 * Sync super-admin, staff, and optional demo player from .env on every initDb / ensureDbInitialized run.
 * No plaintext passwords in source — values come from ADMIN_PASSWORD and STAFF_DEFAULT_PASSWORD.
 */
export async function ensureStaffAccountsFromEnv(db) {
  const usersCol = db.collection('users');

  const adminEmail = process.env.ADMIN_EMAIL?.trim() || 'admin@zoraaroyal.com';
  const adminUsername = process.env.ADMIN_USERNAME?.trim() || 'superadmin';
  const adminAlias = process.env.ADMIN_USERNAME_ALIAS?.trim() || 'RoyalAdmin';

  const adminPasswordHash = await passwordHashFromEnv(process.env.ADMIN_PASSWORD, LEGACY_ADMIN_HASH);
  const staffPasswordHash = await passwordHashFromEnv(process.env.STAFF_DEFAULT_PASSWORD, LEGACY_STAFF_HASH);

  const superAdminFields = {
    email: adminEmail,
    passwordHash: adminPasswordHash,
    role: ROLES.SUPER_ADMIN,
    balanceSC: 10000.0,
    balanceGC: 10000000,
    kycStatus: 'approved',
    vipTier: 'Royal Emperor',
    isBanned: false,
    isVerified: true,
    updatedAt: new Date(),
  };

  await usersCol.updateOne(
    { username: adminUsername },
    {
      $set: { username: adminUsername, ...superAdminFields },
      $setOnInsert: { createdAt: new Date() },
      $unset: { password: '' },
    },
    { upsert: true }
  );

  await usersCol.updateOne(
    { username: adminAlias },
    {
      $set: { username: adminAlias, ...superAdminFields },
      $setOnInsert: { createdAt: new Date() },
      $unset: { password: '' },
    },
    { upsert: true }
  );

  await syncAdminEnvPasswordRotation(db);
  await loadStaffSessionEpoch(db);

  const staffSeeds = [
    {
      username: 'financemanager',
      email: 'finance@zoraaroyal.com',
      role: ROLES.FINANCIAL_MANAGER,
      vipTier: 'Diamond Elite',
    },
    {
      username: 'coinofficer',
      email: 'coins@zoraaroyal.com',
      role: ROLES.COIN_MANAGER,
      vipTier: 'Gold Titan',
    },
    {
      username: 'operationadmin',
      email: 'ops@zoraaroyal.com',
      role: ROLES.OPERATION_ADMIN,
      vipTier: 'Royal Staff',
    },
    {
      username: 'chatsupport',
      email: 'support@zoraaroyal.com',
      role: ROLES.CHAT_SUPPORT,
      vipTier: 'Silver Cyber',
    },
  ];

  for (const seed of staffSeeds) {
    await usersCol.updateOne(
      { username: seed.username },
      {
        $set: {
          username: seed.username,
          email: seed.email,
          passwordHash: staffPasswordHash,
          role: seed.role,
          balanceSC: 0,
          balanceGC: 0,
          kycStatus: 'approved',
          vipTier: seed.vipTier,
          isBanned: false,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
        $unset: { password: '' },
      },
      { upsert: true }
    );
  }

  const demoPasswordHash = await passwordHashFromEnv(
    process.env.DEMO_PLAYER_PASSWORD,
    LEGACY_DEMO_PLAYER_HASH
  );

  await usersCol.updateOne(
    { username: 'CrownPlayer' },
    {
      $set: {
        username: 'CrownPlayer',
        email: 'player@zorraroyals.com',
        role: ROLES.PLAYER,
        vipTier: 'Gold',
        balance: 150.0,
        balanceSC: 150.0,
        balanceGC: 5000,
        firstDepositMade: false,
        signupBonusClaimed: true,
        isVerified: true,
        isBanned: false,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        passwordHash: demoPasswordHash,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
}