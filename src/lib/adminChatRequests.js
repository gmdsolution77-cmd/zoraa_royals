import { publishRealtimeEvent, REALTIME_TYPES } from '@/lib/realtimePublish';

function buildRequestSummaryText(requestKind, meta = {}) {
  if (requestKind === 'deposit') {
    const amt = Number(meta.amount || 0).toFixed(2);
    const method = meta.methodName || 'Direct';
    return `💵 Deposit Request: $${amt} via ${method}`;
  }
  if (requestKind === 'cashout') {
    const amt = Number(meta.amount || 0).toFixed(2);
    const method = meta.payoutMethod || 'Direct';
    return `💸 Cashout Request: $${amt} via ${method}`;
  }
  if (requestKind === 'coin_load') {
    const amt = Number(meta.transferAmount || 0).toFixed(2);
    const game = meta.gameTitle || 'Game';
    return `🪙 Load Coins Request: $${amt} SC → ${game}`;
  }
  if (requestKind === 'game_load') {
    const amt = Number(meta.amount || 0).toFixed(2);
    const game = meta.gameName || meta.gameTitle || 'Game';
    return `🪙 Game Load Request: $${amt} → ${game}`;
  }
  const game = meta.gameTitle || 'Game Platform';
  return `🎮 Account Request: ${game}`;
}

/**
 * Inserts a structured admin-only request card into chat_messages for the player's
 * conversation and publishes a staff-only realtime chat event so it appears
 * immediately in the Admin Live Chat inbox.
 */
export async function postRequestToAdminChat(db, {
  requestKind,
  requestId,
  userId,
  userEmail,
  username,
  requestMeta = {},
}) {
  try {
    if (!db || !requestId) return null;
    const cleanEmail = String(userEmail || '').toLowerCase().trim();
    const cleanUid = String(userId || cleanEmail || '').trim();
    if (!cleanUid) return null;

    const cleanUsername = String(username || cleanEmail.split('@')[0] || 'VIP Patron').trim();
    const text = buildRequestSummaryText(requestKind, requestMeta);

    const chatCol = db.collection('chat_messages');

    const messageDoc = {
      conversationId: cleanUid,
      userId: cleanUid,
      userEmail: cleanEmail,
      username: cleanUsername,
      customerUserId: cleanUid,
      customerUsername: cleanUsername,
      sender: 'player',
      senderRole: 'player',
      agentName: null,
      guestId: null,
      messageType: 'request_card',
      adminOnly: true,
      requestKind,
      requestId: String(requestId),
      requestMeta: {
        status: 'pending',
        ...requestMeta,
      },
      text,
      imageUrl: null,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Atomic upsert prevents duplicate cards even under concurrent requests/polls
    const result = await chatCol.updateOne(
      {
        messageType: 'request_card',
        requestId: String(requestId),
        requestKind,
      },
      { $setOnInsert: messageDoc },
      { upsert: true }
    );

    if (!result.upsertedId) {
      return null;
    }

    const insertedId = String(result.upsertedId);

    // Notify staff ONLY (never broadcast adminOnly cards to player SSE channels)
    try {
      publishRealtimeEvent({
        type: REALTIME_TYPES.CHAT_MESSAGE,
        conversationId: cleanUid,
        senderRole: 'player',
        message: {
          ...messageDoc,
          id: insertedId,
          _id: insertedId,
        },
        targets: { staff: true },
      });
    } catch {}

    return { ...messageDoc, _id: insertedId, id: insertedId };
  } catch (err) {
    console.error('postRequestToAdminChat error:', err);
    return null;
  }
}

/**
 * Keeps the request card inside chat_messages synchronized whenever a request
 * is approved or rejected (whether from Admin Chat or from Finance/Accounts/Coins tabs).
 */
export async function syncRequestCardStatusInChat(db, {
  requestId,
  status,
  updates = {},
}) {
  try {
    if (!db || !requestId) return;
    const chatCol = db.collection('chat_messages');
    const setFields = {
      'requestMeta.status': status,
      read: true,
    };
    for (const [k, v] of Object.entries(updates || {})) {
      if (v !== undefined) {
        setFields[`requestMeta.${k}`] = v;
      }
    }

    await chatCol.updateMany(
      {
        messageType: 'request_card',
        requestId: String(requestId),
      },
      { $set: setFields }
    );

    try {
      publishRealtimeEvent({
        type: REALTIME_TYPES.DESK_SYNC,
        requestId: String(requestId),
        status,
        targets: { staff: true },
      });
    } catch {}
  } catch (err) {
    console.error('syncRequestCardStatusInChat error:', err);
  }
}

/**
 * Backfills any PENDING deposits, accountRequests (including load coins & freeplay),
 * or game_load_requests that don't yet have a request_card in chat_messages.
 * Guarantees Admin Live Chat NEVER misses a pending request.
 */
export async function syncPendingRequestsToAdminChat(db) {
  try {
    if (!db) return;
    const chatCol = db.collection('chat_messages');
    const usersCol = db.collection('users');

    const [pendingDeposits, pendingAccReqs, pendingGameLoads, pendingRedemptions, existingCards] = await Promise.all([
      db.collection('deposits').find({ status: 'pending' }).sort({ createdAt: -1 }).limit(100).toArray(),
      db.collection('accountRequests').find({ status: { $in: ['PENDING', 'pending'] } }).sort({ createdAt: -1 }).limit(100).toArray(),
      db.collection('game_load_requests').find({ status: 'pending' }).sort({ createdAt: -1 }).limit(100).toArray(),
      db.collection('redemptions').find({ status: { $in: ['pending', 'pending_coin'] } }).sort({ createdAt: -1 }).limit(100).toArray(),
      chatCol.find({ messageType: 'request_card' }, { projection: { requestId: 1, requestKind: 1 } }).toArray(),
    ]);

    const existingSet = new Set(existingCards.map((c) => `${c.requestKind}:${String(c.requestId)}`));

    // Cache email -> user lookups
    const emailSet = new Set();
    for (const r of pendingAccReqs) {
      if (r.userEmail) emailSet.add(String(r.userEmail).toLowerCase().trim());
    }
    const userByEmail = new Map();
    if (emailSet.size > 0) {
      const users = await usersCol
        .find({ email: { $in: Array.from(emailSet) } }, { projection: { _id: 1, email: 1, username: 1 } })
        .toArray();
      for (const u of users) {
        if (u.email) userByEmail.set(String(u.email).toLowerCase().trim(), u);
      }
    }

    // 1. Pending Deposits
    for (const d of pendingDeposits) {
      const rid = String(d._id);
      if (existingSet.has(`deposit:${rid}`)) continue;
      const uid = String(d.userId || d.senderEmail || d.username || '').trim();
      if (!uid) continue;
      await postRequestToAdminChat(db, {
        requestKind: 'deposit',
        requestId: rid,
        userId: uid,
        userEmail: d.senderEmail || '',
        username: d.username || 'VIP Patron',
        requestMeta: {
          status: 'pending',
          amount: d.amount,
          methodName: d.methodName,
          senderTag: d.senderTag || d.senderNote || '',
          senderEmail: d.senderEmail || '',
          senderNote: d.senderNote || '',
          txHash: d.txHash || '',
          bonusType: d.bonusType || 'welcome',
          bonusPercent: d.bonusPercent ?? 0,
          bonusSC: d.bonusSC ?? 0,
          totalSC: d.totalSC ?? d.amount,
          totalGC: d.totalGC ?? (d.amount * 10000),
          gameTitle: d.gameTitle || 'Orion Stars',
          gameUsername: d.gameUsername || null,
          proofImage: d.proofImage || null,
        },
      });
    }

    // 2. Pending Account Requests & Coin Loads
    for (const r of pendingAccReqs) {
      const rid = String(r._id);
      const isCoinLoad = Number(r.transferAmount || 0) > 0;
      const kind = isCoinLoad ? 'coin_load' : 'account_request';
      if (existingSet.has(`${kind}:${rid}`)) continue;

      const cleanEmail = String(r.userEmail || '').toLowerCase().trim();
      const matchedUser = userByEmail.get(cleanEmail);
      const uid = matchedUser ? String(matchedUser._id) : String(r.userId || cleanEmail || '').trim();
      if (!uid) continue;

      let resolvedGameUsername = r.gameAccountUsername || r.gameUsername || '';
      if (!resolvedGameUsername && cleanEmail && r.gameTitle) {
        const titleRegex = new RegExp(`^${String(r.gameTitle).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const gAcc = await db.collection('gameAccounts').findOne({
          userEmail: cleanEmail,
          gameTitle: titleRegex,
          status: { $in: ['READY', 'ready', 'active'] },
        });
        resolvedGameUsername = gAcc?.username || '';
      }

      await postRequestToAdminChat(db, {
        requestKind: kind,
        requestId: rid,
        userId: uid,
        userEmail: cleanEmail,
        username: matchedUser?.username || r.userName || cleanEmail.split('@')[0] || 'VIP Patron',
        requestMeta: {
          status: 'pending',
          gameTitle: r.gameTitle || 'Game Platform',
          gameId: r.gameId || '',
          gameUsername: resolvedGameUsername,
          transferAmount: Number(r.transferAmount || 0),
          source: r.source || 'player_request',
          initialDepositAmount: r.initialDepositAmount || null,
          freeplayPending: Boolean(r.freeplayPending),
          freeplayAmount: Number(r.freeplayAmount || 0),
          freeplayScreenshot: r.freeplayScreenshot || r.screenshot || '',
        },
      });
    }

    // 3. Pending Legacy Game Loads
    for (const gl of pendingGameLoads) {
      const rid = String(gl._id);
      if (existingSet.has(`game_load:${rid}`)) continue;
      const uid = String(gl.userId || gl.clientEmail || '').trim();
      if (!uid) continue;
      await postRequestToAdminChat(db, {
        requestKind: 'game_load',
        requestId: rid,
        userId: uid,
        userEmail: gl.clientEmail || '',
        username: gl.clientName || 'VIP Patron',
        requestMeta: {
          status: 'pending',
          gameId: gl.gameId || '',
          gameName: gl.gameName || '',
          gameTitle: gl.gameName || gl.gameId || 'Game',
          gameUsername: gl.gameUsername || '',
          amount: Number(gl.amount || 0),
          transferAmount: Number(gl.amount || 0),
        },
      });
    }

    // 4. Pending Cashouts / Redemptions
    for (const w of pendingRedemptions) {
      const rid = String(w._id);
      if (existingSet.has(`cashout:${rid}`)) continue;
      const uid = String(w.userId || w.username || '').trim();
      if (!uid) continue;
      await postRequestToAdminChat(db, {
        requestKind: 'cashout',
        requestId: rid,
        userId: uid,
        userEmail: w.userEmail || '',
        username: w.username || 'VIP Patron',
        requestMeta: {
          status: 'pending',
          amount: Number(w.amount || 0),
          payoutMethod: w.payoutMethod || 'Direct',
          destinationAddress: w.destinationAddress || '',
          gameTitle: w.gameTitle || 'Game Platform',
          gameUsername: w.gameUsername || '',
          gameScreenshot: w.gameScreenshot || null,
          qrCodeImage: w.qrCodeImage || null,
          notes: w.notes || '',
        },
      });
    }
  } catch (err) {
    console.error('syncPendingRequestsToAdminChat error:', err);
  }
}

