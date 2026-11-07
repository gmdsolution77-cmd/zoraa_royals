#!/usr/bin/env node
/**
 * Push pipeline health check (Mongo subs + optional FCM send to latest Android token).
 * Usage: npm run test:push
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvLocal() {
  const p = resolve(root, '.env.local');
  if (!existsSync(p)) throw new Error('Missing .env.local');
  const lines = readFileSync(p, 'utf8').split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 1) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

async function main() {
  loadEnvLocal();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('zorra_royals');
  const subsCol = db.collection('subscriptions');
  const count = await subsCol.countDocuments();
  const subs = await subsCol.find({}).sort({ updatedAt: -1 }).limit(10).toArray();

  console.log('\n=== MongoDB subscriptions ===');
  console.log('Total:', count);
  for (const s of subs) {
    const tok = s.fcmToken || s.token || '';
    const real = tok.length > 80 && !tok.startsWith('chrome_web_');
    console.log({
      device: s.device,
      email: s.email,
      userId: s.userId,
      username: s.username,
      realFcm: real,
      tokenLen: tok.length,
    });
  }

  const saPath = resolve(root, 'firebase-service-account.json');
  console.log('\n=== Firebase Admin (server push) ===');
  if (!existsSync(saPath)) {
    console.log('❌ firebase-service-account.json NOT in project root.');
    console.log('   Firebase Console → project "zorra-royals" → Service accounts → Generate new private key');
    console.log('   Save file here, then run: npm run test:push again\n');
    await client.close();
    process.exit(1);
  }

  const sa = JSON.parse(readFileSync(saPath, 'utf8'));
  if (sa.project_id !== 'zorra-royals') {
    console.log('⚠️  Service account project_id is', sa.project_id, '— should be zorra-royals for this app.');
  }

  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getMessaging } = await import('firebase-admin/messaging');
  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(sa) });
  const messaging = getMessaging(app);
  console.log('✓ FCM initialized for project', sa.project_id);

  const best = subs.find((s) => {
    const t = s.fcmToken || s.token || '';
    return t.length > 80 && !t.startsWith('chrome_web_');
  });

  if (!best) {
    console.log('❌ No real device token. Open Android APK → login → allow notifications.');
    await client.close();
    process.exit(1);
  }

  const token = (best.fcmToken || best.token).trim();
  console.log('\n=== Sending test push to latest real device token ===');
  try {
    const messageId = await messaging.send({
      token,
      notification: {
        title: 'Zorra Royals — test push',
        body: 'Agar yeh lock screen par dikhe to FCM theek hai.',
      },
      data: { url: '/' },
      android: { priority: 'high' },
    });
    console.log('✅ Sent. messageId:', messageId);
    console.log('   Check phone notification shade / lock screen.');
  } catch (e) {
    console.log('❌ Send failed:', e.message);
  }

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
