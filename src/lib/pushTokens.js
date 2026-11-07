/** True FCM device tokens from Capacitor / Firebase (not browser placeholder IDs). */
export function isRealFcmToken(token) {
  if (typeof token !== 'string') return false;
  const t = token.trim();
  if (t.length < 20) return false;
  if (t.startsWith('chrome_web_')) return false;
  if (t.startsWith('web_placeholder_')) return false;
  return true;
}
