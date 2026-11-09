/** Maps SSE payloads to in-app sync events (3.5s poll stays as backup). */

import { REALTIME_TYPES } from '@/lib/realtimePublish';

const ADMIN_PULSE_TYPES = new Set([
  REALTIME_TYPES.ACCOUNT_REQUEST_CREATED,
  REALTIME_TYPES.ACCOUNT_REQUEST_UPDATED,
  REALTIME_TYPES.CHAT_MESSAGE,
  REALTIME_TYPES.DESK_SYNC,
  REALTIME_TYPES.FINANCE_DEPOSIT,
  REALTIME_TYPES.FINANCE_WITHDRAW,
  REALTIME_TYPES.COIN_DESK,
]);

const PLAYER_PULSE_TYPES = new Set([
  REALTIME_TYPES.ACCOUNT_REQUEST_CREATED,
  REALTIME_TYPES.ACCOUNT_REQUEST_UPDATED,
  REALTIME_TYPES.CHAT_MESSAGE,
  REALTIME_TYPES.FINANCE_DEPOSIT,
  REALTIME_TYPES.FINANCE_WITHDRAW,
  REALTIME_TYPES.WALLET,
]);

export function buildRealtimeUrl() {
  if (typeof window === 'undefined') return '/api/realtime';
  const params = new URLSearchParams();
  try {
    const guestId = (localStorage.getItem('zorra_guest_id') || '').trim();
    if (guestId) params.set('guestId', guestId);
  } catch {}
  const qs = params.toString();
  return qs ? `/api/realtime?${qs}` : '/api/realtime';
}

function adminDeskPulse(event) {
  window.dispatchEvent(new CustomEvent('zorra-admin-desk-sync', { detail: event }));
}

function playerInstantPulse() {
  window.dispatchEvent(new CustomEvent('balanceUpdate'));
  window.dispatchEvent(new CustomEvent('zorra-cashier-refresh'));
  window.dispatchEvent(new CustomEvent('zorra-instant-sync'));
}

export function applyRealtimeEvent(event) {
  if (!event || typeof window === 'undefined') return;
  if (event.type === 'CONNECTED') return;

  window.dispatchEvent(new CustomEvent('zorra-realtime', { detail: event }));

  switch (event.type) {
    case REALTIME_TYPES.ACCOUNT_REQUEST_CREATED:
    case REALTIME_TYPES.ACCOUNT_REQUEST_UPDATED: {
      const detail = {
        type: 'ACCOUNTS_UPDATED',
        status: event.status,
        gameTitle: event.gameTitle,
        userEmail: event.userEmail,
        request: event.request,
        t: event.t,
      };
      window.dispatchEvent(new CustomEvent('accountRequestUpdated', { detail }));
      const req = event.request || {};
      const isLoad = req.requestType === 'COIN_LOAD' || Number(req.transferAmount || 0) > 0;
      if (event.type === REALTIME_TYPES.ACCOUNT_REQUEST_CREATED) {
        window.dispatchEvent(
          new CustomEvent('zorra_staff_event_local', {
            detail: {
              type: isLoad ? 'NEW_COIN_LOAD' : 'NEW_REQUEST',
              request: req,
              userEmail: event.userEmail,
              timestamp: event.t,
            },
          })
        );
      }
      break;
    }
    case REALTIME_TYPES.CHAT_MESSAGE: {
      const convId = event.conversationId;
      const msg = event.message || {};
      if (event.senderRole !== 'staff') {
        window.dispatchEvent(
          new CustomEvent('zorra_staff_event_local', {
            detail: {
              type: 'NEW_CHAT_MESSAGE',
              conversationId: convId,
              text: msg.text || '',
              username: msg.username || msg.customerUsername || 'VIP Patron',
              message: {
                ...msg,
                id: msg.id || msg._id,
              },
              senderRole: event.senderRole,
              timestamp: event.t,
            },
          })
        );
      }
      try {
        const ch = new BroadcastChannel('zorra_player_chat_sync');
        ch.postMessage({
          type: 'CHAT_MESSAGE',
          conversationId: convId,
          time: event.t,
        });
        ch.close();
      } catch {}
      break;
    }
    case REALTIME_TYPES.FINANCE_DEPOSIT:
      if (event.action === 'created' || event.status === 'pending') {
        window.dispatchEvent(
          new CustomEvent('zorra_staff_event_local', {
            detail: {
              type: 'NEW_DEPOSIT',
              depositId: event.depositId,
              amount: event.amount,
              username: event.username,
              methodName: event.methodName,
              timestamp: event.t,
            },
          })
        );
      }
      window.dispatchEvent(new CustomEvent('zorra-deposit-updated', { detail: event }));
      break;
    case REALTIME_TYPES.FINANCE_WITHDRAW:
      if (event.action === 'created' || event.status === 'pending' || event.status === 'pending_coin') {
        window.dispatchEvent(
          new CustomEvent('zorra_staff_event_local', {
            detail: {
              type: 'NEW_WITHDRAW',
              redemptionId: event.redemptionId,
              amount: event.amount,
              username: event.username,
              timestamp: event.t,
            },
          })
        );
      }
      break;
    default:
      break;
  }

  if (ADMIN_PULSE_TYPES.has(event.type)) {
    adminDeskPulse(event);
  }

  if (PLAYER_PULSE_TYPES.has(event.type) || event.userEmail || event.userId) {
    playerInstantPulse();
  }
}
