import {
  getRealtimeHub,
  staffChannel,
  playerEmailChannel,
  playerIdChannel,
  guestChannel,
  conversationChannels,
  playerBroadcastChannel,
} from '@/lib/realtimeHub';

export const REALTIME_TYPES = {
  ACCOUNT_REQUEST_CREATED: 'ACCOUNT_REQUEST_CREATED',
  ACCOUNT_REQUEST_UPDATED: 'ACCOUNT_REQUEST_UPDATED',
  CHAT_MESSAGE: 'CHAT_MESSAGE',
  DESK_SYNC: 'DESK_SYNC',
  FINANCE_DEPOSIT: 'FINANCE_DEPOSIT',
  FINANCE_WITHDRAW: 'FINANCE_WITHDRAW',
  WALLET: 'WALLET',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  GAMES_CATALOG: 'GAMES_CATALOG',
  COIN_DESK: 'COIN_DESK',
};

function resolveChannels(targets = {}) {
  const channels = [];
  if (targets.staff) channels.push(staffChannel());
  if (targets.broadcast) channels.push(playerBroadcastChannel());
  if (targets.userEmail) {
    const ch = playerEmailChannel(targets.userEmail);
    if (ch) channels.push(ch);
  }
  if (targets.userId) {
    const ch = playerIdChannel(targets.userId);
    if (ch) channels.push(ch);
  }
  if (targets.guestId) {
    const ch = guestChannel(targets.guestId);
    if (ch) channels.push(ch);
  }
  if (targets.conversationId) {
    channels.push(...conversationChannels(targets.conversationId));
  }
  return [...new Set(channels)];
}

export function publishRealtimeEvent(opts) {
  const { type, targets = {}, ...rest } = opts;
  const channels = resolveChannels(targets);
  if (channels.length === 0) return;
  getRealtimeHub().publish(channels, { type, ...rest });
}

export function publishStaffPlayerSync(type, fields = {}) {
  const { userEmail, userId, staff = true, guestId, conversationId, ...rest } = fields;
  publishRealtimeEvent({
    type,
    userEmail,
    userId,
    ...rest,
    targets: { staff, userEmail, userId, guestId, conversationId },
  });
}

export function publishStaffSync(type, fields = {}) {
  publishRealtimeEvent({ type, ...fields, targets: { staff: true } });
}

export function publishChatRealtime({
  conversationId,
  senderRole,
  message,
  userEmail,
  userId,
  guestId,
}) {
  publishRealtimeEvent({
    type: REALTIME_TYPES.CHAT_MESSAGE,
    conversationId,
    senderRole,
    message,
    targets: {
      staff: true,
      userEmail,
      userId,
      guestId,
      conversationId,
    },
  });
}

export function publishFinanceDeposit(fields) {
  publishStaffPlayerSync(REALTIME_TYPES.FINANCE_DEPOSIT, fields);
}

export function publishFinanceWithdraw(fields) {
  publishStaffPlayerSync(REALTIME_TYPES.FINANCE_WITHDRAW, fields);
}

export function publishAccountRequestCreated({ request, userEmail, userId }) {
  publishStaffPlayerSync(REALTIME_TYPES.ACCOUNT_REQUEST_CREATED, {
    request,
    userEmail,
    userId,
    status: 'PENDING',
  });
}

export function publishAccountRequestUpdated(fields) {
  publishStaffPlayerSync(REALTIME_TYPES.ACCOUNT_REQUEST_UPDATED, fields);
}

export function publishDeskSync(payload = {}) {
  publishRealtimeEvent({
    type: REALTIME_TYPES.DESK_SYNC,
    ...payload,
    targets: { staff: true },
  });
}
