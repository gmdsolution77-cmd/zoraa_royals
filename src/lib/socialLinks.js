/**
 * Normalize admin-entered Facebook URLs for safe public display.
 */
export function normalizeFacebookUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';

  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (!/facebook\.com|fb\.com|fb\.me/i.test(u.hostname)) return '';
      return u.href;
    } catch {
      return '';
    }
  }

  let slug = raw.replace(/^@/, '').trim();
  if (/^(www\.)?(facebook|fb)\.com\//i.test(slug) || /^fb\.me\//i.test(slug)) {
    return `https://${slug.replace(/^\/\//, '')}`;
  }

  slug = slug.replace(/^\/+/, '').split('?')[0];
  if (!slug) return '';
  return `https://www.facebook.com/${slug}`;
}

export function resolvePublicFacebook(settings = {}) {
  const enabled = settings.facebookPageEnabled !== false;
  const url = normalizeFacebookUrl(settings.facebookPageUrl || '');
  if (!enabled || !url) {
    return { url: '', label: '', visible: false };
  }
  const label = String(settings.facebookPageLabel || 'Follow us on Facebook').trim() || 'Follow us on Facebook';
  return { url, label, visible: true };
}