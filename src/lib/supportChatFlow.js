'use client';

const STORAGE_KEY = 'zorra_pending_support_message';

/** Default params do not apply when callers pass `user: null` explicitly */
function normalizeUser(user) {
  if (user && typeof user === 'object') return user;
  return {};
}

const ACTION_TEMPLATES = {
  deposit: (u = {}) =>
    `👑 VIP DEPOSIT REQUEST\n\nPlayer: ${u.username || u.email || 'Guest'}\nEmail: ${u.email || '—'}\n\nI would like to make a deposit. Please send me the current payment methods (Cash App / Zelle / Crypto) and instructions.`,
  cashout: (u = {}) =>
    `💸 CASHOUT / REDEEM REQUEST\n\nPlayer: ${u.username || u.email || 'Guest'}\nEmail: ${u.email || '—'}\n\nI would like to redeem my balance. Please guide me through the cashout process.`,
  withdraw: (u = {}) => ACTION_TEMPLATES.cashout(normalizeUser(u)),
  freeplay: (u = {}) =>
    `🎁 FREEPLAY / SIGNUP BONUS REQUEST\n\nPlayer: ${u.username || u.email || 'Guest'}\nEmail: ${u.email || '—'}\n\nPlease help me claim my freeplay bonus and complete verification.`,
  game_id: (u = {}, meta = {}) =>
    `🎮 NEW GAME ID REQUEST\n\nPlayer: ${u.username || u.email || 'Guest'}\nGame: ${meta.gameTitle || meta.game || '—'}\n\nPlease create my game credentials for this platform.`,
  load_coins: (u = {}, meta = {}) =>
    `💰 LOAD COINS REQUEST\n\nPlayer: ${u.username || u.email || 'Guest'}\nGame: ${meta.gameTitle || '—'}\nAmount: ${meta.amount != null ? `$${meta.amount}` : '—'} SC\n\nPlease load coins into my game account.`,
  spin_wheel: (u = {}) =>
    `🎡 LUCKY SPIN WHEEL\n\nPlayer: ${u.username || u.email || 'Guest'}\n\nI would like to use my daily lucky spin (once per 24 hours). Please assist.`,
  games: (u = {}, meta = {}) =>
    `🕹️ GAME ACCESS REQUEST\n\nPlayer: ${u.username || u.email || 'Guest'}\nGame: ${meta.gameTitle || meta.game || '—'}\n\nPlease help me access / set up this game.`,
  download_app: () =>
    `📲 MOBILE APP REQUEST\n\nPlease send me the official Zorra Royals Android APK or iOS install steps.`,
  support: (u = {}, meta = {}) =>
    meta.message ||
    `💬 VIP SUPPORT\n\nPlayer: ${u.username || u.email || 'Guest'}\n\nI need assistance from the concierge desk.`,
  kyc: (u = {}) =>
    `🪪 ACCOUNT VERIFICATION\n\nPlayer: ${u.username || u.email || 'Guest'}\nEmail: ${u.email || '—'}\n\nI need help with KYC / identity verification.`,
  promotion: (u = {}, meta = {}) =>
    `✨ PROMOTION / VIP OFFER\n\nPlayer: ${u.username || u.email || 'Guest'}\nTopic: ${meta.title || meta.promo || 'VIP bonus'}\n\nPlease help me claim this offer.`,
  custom: (u = {}, meta = {}) => meta.message || ACTION_TEMPLATES.support(normalizeUser(u), meta),
};

export function buildSupportMessage(action, user, meta = {}) {
  const fn = ACTION_TEMPLATES[action] || ACTION_TEMPLATES.support;
  const u = normalizeUser(user);
  const m = meta && typeof meta === 'object' ? meta : {};
  return fn(u, m);
}

/** Queue message + navigate to full-screen support chat */
export function openSupportChat({ action = 'support', user = null, meta = {}, message, router = null }) {
  if (typeof window === 'undefined') return;

  let u = normalizeUser(user);
  if (!u.username && !u.email) {
    try {
      const raw = localStorage.getItem('zr_user_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') u = parsed;
      }
    } catch {}
  }

  const text = message || buildSupportMessage(action, u, { ...meta, action });
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      text,
      action,
      createdAt: Date.now(),
    })
  );

  const path = '/chat';
  if (router && typeof router.push === 'function') {
    router.push(path);
  } else {
    window.location.href = path;
  }
}

export function consumePendingSupportMessage() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    sessionStorage.removeItem(STORAGE_KEY);
    if (parsed?.createdAt && Date.now() - parsed.createdAt > 120000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function registerSupportChatGlobals() {
  if (typeof window === 'undefined') return;
  window.openZorraSupportChat = (opts) => openSupportChat(typeof opts === 'string' ? { action: opts } : opts || {});
  window.addEventListener('zorra-support-request', (e) => {
    if (e?.detail) openSupportChat(e.detail);
  });
}