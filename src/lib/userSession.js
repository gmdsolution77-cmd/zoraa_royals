'use client';

import { areEqual } from './fastDiff';

// Persistent Client-Side User Session Cache for Zero-Flicker Navigation
export function getCachedUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('zr_user_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed._id || parsed.userId || parsed.email || parsed.username)) {
      return parsed;
    }
  } catch {}
  return null;
}

export function saveCachedUser(userData) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCachedUser();
    if (userData && (userData._id || userData.userId || userData.email || userData.username)) {
      if (!areEqual(existing, userData)) {
        localStorage.setItem('zr_user_session', JSON.stringify(userData));
        window.dispatchEvent(new CustomEvent('royal-user-sync', { detail: userData }));
      }
    } else {
      if (existing !== null) {
        localStorage.removeItem('zr_user_session');
        window.dispatchEvent(new CustomEvent('royal-user-sync', { detail: null }));
      }
    }
  } catch {}
}

export function clearCachedUser() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('zr_user_session');
    window.dispatchEvent(new CustomEvent('royal-user-sync', { detail: null }));
  } catch {}
}
