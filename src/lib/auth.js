import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'zorra_royals_ultra_vip_jwt_secret_token_2026_royal_luxury';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OPERATION_ADMIN: 'operation_admin',
  FINANCIAL_MANAGER: 'financial_manager',
  COIN_MANAGER: 'coin_manager',
  CHAT_SUPPORT: 'chat_support',
  PLAYER: 'player',
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    'overview',
    'requests',
    'account_requests',
    'coins_allotment',
    'games',
    'finance',
    'gateways',
    'tx_search',
    'users',
    'ledger',
    'chat',
    'kyc',
    'promos',
    'affiliates',
    'affiliate_commissions',
    'staff',
    'settings',
  ],
  [ROLES.OPERATION_ADMIN]: [
    'overview',
    'requests',
    'account_requests',
    'coins_allotment',
    'games',
    'finance',
    'gateways',
    'tx_search',
    'users',
    'ledger',
    'chat',
    'kyc',
    'promos',
    'affiliates',
    'affiliate_commissions',
  ],
  [ROLES.FINANCIAL_MANAGER]: [
    'overview',
    'finance',
    'coins_allotment',
    'ledger',
    'gateways',
    'tx_search',
    'affiliate_commissions',
    'kyc',
  ],
  [ROLES.COIN_MANAGER]: [
    'overview',
    'requests',
    'account_requests',
    'coins_allotment',
    'tx_search',
  ],
  [ROLES.CHAT_SUPPORT]: [
    'overview',
    'chat',
  ],
  [ROLES.PLAYER]: [],
};

export function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getSessionUser(preferredType = null) {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_session')?.value;
    const playerToken = cookieStore.get('zorra_session')?.value || cookieStore.get('players_session')?.value || cookieStore.get('vegas_session')?.value;

    let isAdminContext = preferredType === 'admin';
    let isPlayerContext = preferredType === 'player';

    if (!preferredType) {
      try {
        const { headers } = require('next/headers');
        const reqHeaders = await headers();
        const referer = reqHeaders.get('referer') || '';
        const xPortal = reqHeaders.get('x-portal-mode') || '';
        if (referer.includes('/admin') || xPortal === 'admin') {
          isAdminContext = true;
        } else {
          isPlayerContext = true;
        }
      } catch {
        isPlayerContext = true;
      }
    }

    if (isAdminContext) {
      if (adminToken) {
        const decoded = verifyToken(adminToken);
        if (decoded) {
          const uid = decoded.id || decoded.userId || decoded.sub;
          return { ...decoded, id: uid, userId: uid };
        }
      }
      return null;
    }

    if (isPlayerContext) {
      if (playerToken) {
        const decoded = verifyToken(playerToken);
        if (decoded) {
          const uid = decoded.id || decoded.userId || decoded.sub;
          return { ...decoded, id: uid, userId: uid };
        }
      }
      return null;
    }

    return null;
  } catch {
    return null;
  }
}

export async function getAdminSessionUser() {
  return getSessionUser('admin');
}

export async function getPlayerSessionUser() {
  return getSessionUser('player');
}

export function hasPermission(role, section) {
  if (role === ROLES.SUPER_ADMIN) return true;
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(section);
}

export function getUserFilter(sessionUser) {
  if (!sessionUser) return { _id: null };
  const uid = typeof sessionUser === 'object' ? (sessionUser.userId || sessionUser.id) : sessionUser;
  const strId = String(uid || '');
  const or = [];
  if (strId) {
    or.push({ _id: strId });
    if (/^[0-9a-fA-F]{24}$/.test(strId)) {
      try {
        const { ObjectId } = require('mongodb');
        or.push({ _id: new ObjectId(strId) });
      } catch {}
    }
  }
  if (typeof sessionUser === 'object') {
    if (sessionUser.username) or.push({ username: sessionUser.username });
    if (sessionUser.email) or.push({ email: sessionUser.email });
  }
  return or.length > 0 ? { $or: or } : { _id: strId };
}

export function safeIdFilter(id, extraFields = []) {
  if (!id) return { _id: null };
  const strId = String(id);
  const or = [{ _id: strId }, { id: strId }];
  if (/^[0-9a-fA-F]{24}$/.test(strId)) {
    try {
      const { ObjectId } = require('mongodb');
      or.push({ _id: new ObjectId(strId) });
    } catch {}
  }
  for (const field of extraFields) {
    or.push({ [field]: strId });
  }
  return { $or: or };
}
