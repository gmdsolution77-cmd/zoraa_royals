#!/usr/bin/env node
/**
 * Verifies MONGODB_URI from .env.local (loads file manually; no secrets logged).
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadMongoUri() {
  const envPath = resolve(root, '.env.local');
  if (!existsSync(envPath)) {
    console.error('❌ Missing .env.local in project root.');
    process.exit(1);
  }
  const text = readFileSync(envPath, 'utf8');
  const line = text.split('\n').find((l) => l.trim().startsWith('MONGODB_URI='));
  if (!line) {
    console.error('❌ MONGODB_URI not set in .env.local');
    process.exit(1);
  }
  const raw = line.slice('MONGODB_URI='.length).trim();
  const unquoted = raw.replace(/^["']|["']$/g, '');
  return unquoted;
}

function hostFromUri(uri) {
  try {
    if (uri.startsWith('mongodb+srv://')) {
      const afterAt = uri.split('@')[1];
      const host = afterAt?.split('/')[0]?.split('?')[0];
      return host || null;
    }
    if (uri.startsWith('mongodb://')) {
      const stripped = uri.replace('mongodb://', '');
      const hostPart = stripped.includes('@') ? stripped.split('@')[1] : stripped;
      return hostPart?.split('/')[0]?.split('?')[0] || null;
    }
  } catch {}
  return null;
}

const PLACEHOLDER_HOSTS = [/cluster0\.abcde\.mongodb\.net/i, /<cluster>/i, /YOUR_CLUSTER/i];

async function main() {
  const uri = loadMongoUri();
  const host = hostFromUri(uri);
  console.log('Host:', host || '(could not parse)');

  if (!host) {
    console.error('❌ Invalid MONGODB_URI format.');
    process.exit(1);
  }

  if (PLACEHOLDER_HOSTS.some((re) => re.test(uri) || re.test(host))) {
    console.error('\n❌ Your URI still uses the EXAMPLE hostname (e.g. cluster0.abcde.mongodb.net).');
    console.error('   Atlas → Database → Connect → Drivers → copy the full mongodb+srv:// string.');
    console.error('   Real host looks like: cluster0.x1y2z3w.mongodb.net (not "abcde").\n');
    process.exit(1);
  }

  const { promises: dnsPromises } = await import('dns');
  if (uri.startsWith('mongodb+srv://')) {
    try {
      await dnsPromises.resolveSrv(`_mongodb._tcp.${host}`);
      console.log('✓ DNS SRV lookup OK');
    } catch (e) {
      console.error('❌ DNS SRV failed:', e.code || e.message);
      console.error('   Wrong cluster hostname or no internet/DNS.');
      process.exit(1);
    }
  }

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  try {
    await client.connect();
    const db = client.db();
    await db.command({ ping: 1 });
    console.log('✅ MongoDB connected. Database:', db.databaseName);
  } catch (e) {
    console.error('❌ MongoDB connection failed:', e.message);
    if (/auth|bad auth|Authentication/i.test(e.message)) {
      console.error('   Check Database Access user + password (reset in Atlas if needed).');
      console.error('   Special chars in password must be URL-encoded in the URI.');
    }
    process.exit(1);
  } finally {
    await client.close().catch(() => {});
  }
}

main();
