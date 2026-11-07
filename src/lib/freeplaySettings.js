/** Fallback only when admin settings are missing (keep in sync with admin default). */
export const DEFAULT_FREEPLAY_SC = 3;

export function resolveFreeplayAmountSC(settings) {
  if (!settings || typeof settings !== 'object') return DEFAULT_FREEPLAY_SC;
  const raw = settings.freeplayAmountSC ?? settings.signupBonusAmount;
  if (raw === undefined || raw === null || raw === '') return DEFAULT_FREEPLAY_SC;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_FREEPLAY_SC;
}

/** True when player has not received their one-time signup freeplay approval. */
export function playerEligibleForFreeplay(user) {
  if (!user) return true;
  return !Boolean(user.freeplayClaimed);
}

/** UI / CTA: eligible and no open desk review blocking a new submission. */
export function playerCanUseFreeplayPromo(user, opts = {}) {
  if (!playerEligibleForFreeplay(user)) return false;
  if (opts.pending) return false;
  return true;
}

/** e.g. $3 or $3.50 for UI copy */
export function formatFreeplayUSD(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$0';
  const fixed = Math.abs(n % 1) < 1e-9 ? String(Math.round(n)) : n.toFixed(2);
  return `$${fixed}`;
}
