/** Fallback only when admin settings are missing (keep in sync with admin default). */
export const DEFAULT_FREEPLAY_SC = 3;

export function resolveFreeplayAmountSC(settings) {
  if (!settings || typeof settings !== 'object') return DEFAULT_FREEPLAY_SC;
  const raw = settings.freeplayAmountSC ?? settings.signupBonusAmount;
  if (raw === undefined || raw === null || raw === '') return DEFAULT_FREEPLAY_SC;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_FREEPLAY_SC;
}

/** True when player may still complete the inbox freeplay verification flow. */
export function playerEligibleForFreeplay(user) {
  if (!user) return true;
  return !Boolean(user.freeplayClaimed);
}

/** e.g. $3 or $3.50 for UI copy */
export function formatFreeplayUSD(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$0';
  const fixed = Math.abs(n % 1) < 1e-9 ? String(Math.round(n)) : n.toFixed(2);
  return `$${fixed}`;
}
