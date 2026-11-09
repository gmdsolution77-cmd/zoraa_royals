import { readClientCache, writeClientCache, adminTabCacheKey } from './clientDataCache';

export function hydrateAdminTabFromCache(tab, extras, apply) {
  const key = adminTabCacheKey(tab, extras);
  const cached = readClientCache(key);
  if (!cached) return false;
  apply(tab, cached);
  return true;
}

export function storeAdminTabCache(tab, extras, payload) {
  writeClientCache(adminTabCacheKey(tab, extras), payload, 120000);
}

export async function fetchAdminTabPayload(tab, extras = {}) {
  switch (tab) {
    case 'overview': {
      const d = await fetch('/api/admin/stats').then((r) => r.json());
      return d.success ? { stats: d.stats } : null;
    }
    case 'games': {
      const d = await fetch('/api/games?all=true').then((r) => r.json());
      return d.success ? { games: d.games || [] } : null;
    }
    case 'finance': {
      const [m, dep, wit] = await Promise.all([
        fetch('/api/payments/methods?all=true').then((r) => r.json()),
        fetch('/api/payments/deposit?status=all').then((r) => r.json()),
        fetch('/api/payments/withdraw?status=all').then((r) => r.json()),
      ]);
      return {
        paymentMethods: m.success ? m.methods || [] : [],
        deposits: dep.success ? dep.deposits || [] : [],
        redemptions: wit.success ? wit.redemptions || [] : [],
      };
    }
    case 'chat': {
      const d = await fetch('/api/chat?inbox=true').then((r) => r.json());
      return d.success ? { conversations: d.conversations || [] } : null;
    }
    case 'kyc': {
      const d = await fetch('/api/kyc?status=all').then((r) => r.json());
      return d.success ? { kycRequests: d.requests || [] } : null;
    }
    case 'promos': {
      const [p, b] = await Promise.all([
        fetch('/api/promos?all=true').then((r) => r.json()),
        fetch('/api/notifications?admin=true').then((r) => r.json()),
      ]);
      return {
        promos: p.success ? p.promotions || [] : [],
        broadcastLogs: b.success ? b.broadcasts || [] : [],
      };
    }
    case 'affiliates':
    case 'affiliate_commissions': {
      const d = await fetch('/api/affiliates?mode=admin', { cache: 'no-store' }).then((r) => r.json());
      return d.success
        ? { affiliates: d.affiliates || [], affiliateSummary: d.summary || null }
        : null;
    }
    case 'staff': {
      const d = await fetch('/api/admin/staff').then((r) => r.json());
      return d.success ? { staffList: d.staff || [] } : null;
    }
    case 'account_requests': {
      const status = extras.accountReqFilter || 'PENDING';
      const d = await fetch(`/api/account-requests?status=${encodeURIComponent(status)}`).then((r) =>
        r.json()
      );
      return d.success ? { accountRequests: d.accountRequests || [] } : null;
    }
    case 'coins_allotment': {
      const q = extras.allotmentSearch || '';
      const [playersRes, histRes] = await Promise.all([
        fetch(`/api/coins/allotment?q=${encodeURIComponent(q)}`).then((r) => r.json()),
        fetch('/api/coins/allotment?history=true').then((r) => r.json()),
      ]);
      return {
        allotmentPlayers: playersRes.success ? playersRes.players || [] : [],
        allotmentHistory: histRes.success ? histRes.history || [] : [],
      };
    }
    case 'users': {
      const d = await fetch(`/api/users?search=${encodeURIComponent(extras.userSearchQuery || '')}`).then(
        (r) => r.json()
      );
      return d.success ? { usersList: d.users || [] } : null;
    }
    case 'gateways': {
      const d = await fetch('/api/payments/methods?all=true').then((r) => r.json());
      return d.success ? { paymentMethods: d.methods || [] } : null;
    }
    case 'tx_search': {
      const d = await fetch(
        `/api/ledger?username=${encodeURIComponent(extras.ledgerFilterUser || '')}&type=${extras.ledgerFilterType || 'all'}`
      ).then((r) => r.json());
      return d.success ? { ledgerRecords: d.records || [] } : null;
    }
    case 'settings': {
      const d = await fetch('/api/admin/settings').then((r) => r.json());
      return d.success ? { sysSettings: d.settings } : null;
    }
    default:
      return null;
  }
}

/** Apply cached/fresh payload into admin page state setters */
export function applyAdminTabPayload(tab, payload, ctx) {
  if (!payload) return;
  const {
    setStats,
    setGames,
    setPaymentMethods,
    setDeposits,
    setRedemptions,
    setChatConversations,
    activeChatConvRef,
    setKycRequests,
    setPromos,
    setBroadcastLogs,
    setAffiliates,
    setAffiliateSummary,
    setStaffList,
    setAccountRequests,
    setAllotmentPlayers,
    setAllotmentHistory,
    setSelectedPlayer,
    setUsersList,
    setLedgerRecords,
    setSysSettings,
    diffSet,
  } = ctx;

  switch (tab) {
    case 'overview':
      if (payload.stats) diffSet(setStats, payload.stats);
      break;
    case 'games':
      if (payload.games) diffSet(setGames, payload.games);
      break;
    case 'finance':
    case 'gateways':
      if (payload.paymentMethods) diffSet(setPaymentMethods, payload.paymentMethods);
      if (payload.deposits) diffSet(setDeposits, payload.deposits);
      if (payload.redemptions) diffSet(setRedemptions, payload.redemptions);
      break;
    case 'chat':
      if (payload.conversations) {
        const mapped = payload.conversations.map((item) => {
          const active = activeChatConvRef?.current;
          if (
            active &&
            (item._id === active._id || (active.userId && item.userId === active.userId))
          ) {
            return { ...item, unreadCount: 0, unreadStaff: false };
          }
          return item;
        });
        diffSet(setChatConversations, mapped);
      }
      break;
    case 'kyc':
      if (payload.kycRequests) diffSet(setKycRequests, payload.kycRequests);
      break;
    case 'promos':
      if (payload.promos) diffSet(setPromos, payload.promos);
      if (payload.broadcastLogs) diffSet(setBroadcastLogs, payload.broadcastLogs);
      break;
    case 'affiliates':
    case 'affiliate_commissions':
      if (payload.affiliates) diffSet(setAffiliates, payload.affiliates);
      if (payload.affiliateSummary !== undefined) diffSet(setAffiliateSummary, payload.affiliateSummary);
      break;
    case 'staff':
      if (payload.staffList) diffSet(setStaffList, payload.staffList);
      break;
    case 'account_requests':
      if (payload.accountRequests) diffSet(setAccountRequests, payload.accountRequests);
      break;
    case 'coins_allotment':
      if (payload.allotmentPlayers) {
        diffSet(setAllotmentPlayers, payload.allotmentPlayers);
        setSelectedPlayer((prev) => {
          if (prev) {
            const updated = payload.allotmentPlayers.find((p) => p.id === prev.id);
            return updated || prev;
          }
          return payload.allotmentPlayers.length > 0 ? payload.allotmentPlayers[0] : null;
        });
      }
      if (payload.allotmentHistory) diffSet(setAllotmentHistory, payload.allotmentHistory);
      break;
    case 'users':
      if (payload.usersList) diffSet(setUsersList, payload.usersList);
      break;
    case 'tx_search':
      if (payload.ledgerRecords) diffSet(setLedgerRecords, payload.ledgerRecords);
      break;
    case 'settings':
      if (payload.sysSettings) diffSet(setSysSettings, payload.sysSettings);
      break;
    default:
      break;
  }
}
