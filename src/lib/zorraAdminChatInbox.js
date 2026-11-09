/** Live Support inbox — instant SSE bumps + poll merge (Richroom pattern). */

export function mergeChatInboxPreservingUnread(local, remote, { exceptConvId = null } = {}) {
  const localMap = new Map((local || []).map((c) => [String(c._id), c]));
  const remoteIds = new Set((remote || []).map((c) => String(c._id)));
  const merged = (remote || []).map((c) => {
    const id = String(c._id);
    if (exceptConvId && id === String(exceptConvId)) {
      return { ...c, unreadCount: 0, unreadStaff: false };
    }
    const loc = localMap.get(id);
    if (!loc) return c;
    const localUnread = Number(loc.unreadCount || 0);
    const remoteUnread = Number(c.unreadCount || 0);
    let unreadCount = Math.max(localUnread, remoteUnread);
    if (remoteUnread > 0 && localUnread > remoteUnread) {
      unreadCount = remoteUnread;
    }
    const locTs = new Date(loc.updatedAt || 0).getTime();
    const remTs = new Date(c.updatedAt || 0).getTime();
    return {
      ...c,
      unreadCount,
      unreadStaff: unreadCount > 0,
      lastMessage: locTs > remTs ? loc.lastMessage : c.lastMessage,
      lastSenderRole: locTs > remTs ? loc.lastSenderRole : c.lastSenderRole,
      updatedAt: locTs > remTs ? loc.updatedAt : c.updatedAt,
      username: loc.username && loc.username !== 'VIP Patron' ? loc.username : c.username,
    };
  });
  const orphanLocal = (local || []).filter((lc) => !remoteIds.has(String(lc._id)));
  return [...orphanLocal, ...merged].sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );
}

export function createChatInboxDedup() {
  const seen = new Set();
  return (key) => {
    if (seen.has(key)) return false;
    seen.add(key);
    setTimeout(() => seen.delete(key), 5000);
    return true;
  };
}

export function applyInboundChatInboxBump(setChatConversations, payload, ctx) {
  const incomingCid = String(payload.conversationId || '').trim();
  if (!incomingCid) return;
  const snippet = String(
    payload.text || payload.message?.text || (payload.message?.imageUrl ? '📷 [Image]' : 'New message')
  ).slice(0, 160);
  const uName = payload.username || payload.message?.username || payload.message?.customerUsername || 'VIP Patron';
  const ts = payload.timestamp || payload.time || Date.now();
  const openCid = String(ctx.activeChatConvRef?.current?._id || '');
  const viewingThread =
    ctx.activeTabRef?.current === 'chat' && openCid && openCid === incomingCid;

  setChatConversations((prev) => {
    const idx = prev.findIndex((c) => String(c._id) === incomingCid);
    const next = {
      ...(idx >= 0 ? prev[idx] : {}),
      _id: incomingCid,
      userId: payload.userId || payload.message?.userId || (idx >= 0 ? prev[idx].userId : incomingCid),
      username: uName,
      lastMessage: snippet,
      lastSenderRole: 'player',
      updatedAt: new Date(ts).toISOString(),
      unreadCount: viewingThread ? 0 : Number(idx >= 0 ? prev[idx].unreadCount || 0 : 0) + 1,
      unreadStaff: !viewingThread,
    };
    const rest = idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
    return [next, ...rest];
  });
}

export function dedupeChatMessagesById(msgs) {
  if (!Array.isArray(msgs) || msgs.length === 0) return [];
  const seen = new Set();
  const out = [];
  for (const m of msgs) {
    const id = String(m?.id || m?._id || '').trim();
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ ...m, id });
      continue;
    }
    out.push(m);
  }
  return out;
}
