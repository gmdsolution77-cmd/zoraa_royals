/** In-memory client cache for admin/player API payloads (per browser tab). */

const store = new Map();

export function readClientCache(key) {
  if (!key) return null;
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function writeClientCache(key, data, ttlMs = 120000) {
  if (!key) return;
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateClientCache(keyOrPrefix) {
  if (!keyOrPrefix) return;
  if (store.has(keyOrPrefix)) {
    store.delete(keyOrPrefix);
    return;
  }
  for (const k of [...store.keys()]) {
    if (k.startsWith(keyOrPrefix)) store.delete(k);
  }
}

export function adminTabCacheKey(tab, extras = {}) {
  const parts = [tab];
  if (extras.userSearchQuery) parts.push(`u:${extras.userSearchQuery}`);
  if (extras.ledgerFilterUser) parts.push(`l:${extras.ledgerFilterUser}:${extras.ledgerFilterType || 'all'}`);
  if (extras.accountReqFilter) parts.push(`ar:${extras.accountReqFilter}`);
  if (extras.allotmentSearch) parts.push(`al:${extras.allotmentSearch}`);
  return `admin-tab:${parts.join('|')}`;
}
