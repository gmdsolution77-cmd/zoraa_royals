import { getDb, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { publishChatRealtime } from '@/lib/realtimePublish';
import { syncPendingRequestsToAdminChat } from '@/lib/adminChatRequests';

function isStaffRole(role) {
  const r = String(role || '').toLowerCase();
  return Boolean(r && r !== 'player');
}

// Group messages into conversations for Staff Inbox
async function buildStaffInbox(chatCol) {
  try {
    const rawMessages = await chatCol
      .find({})
      .project({
        conversationId: 1,
        userId: 1,
        userEmail: 1,
        customerUserId: 1,
        customerUsername: 1,
        username: 1,
        sender: 1,
        senderRole: 1,
        text: 1,
        imageUrl: 1,
        read: 1,
        createdAt: 1,
        messageType: 1,
        requestMeta: 1,
      })
      .sort({ createdAt: -1 })
      .limit(400)
      .toArray();

    const convMap = new Map();

    for (const msg of rawMessages) {
      const cid = String(msg.conversationId || msg.userId || msg.userEmail || '').trim();
      if (!cid) continue;

      const customerName =
        msg.customerUsername || (msg.sender === 'player' ? msg.username : null);
      const customerUid =
        msg.customerUserId || (msg.sender === 'player' ? msg.userId : null);

      const isUnreadPlayerMsg =
        msg.read !== true &&
        msg.sender !== 'support' &&
        msg.sender !== 'staff' &&
        msg.senderRole !== 'staff';

      const isPendingRequestCard =
        msg.messageType === 'request_card' &&
        String(msg.requestMeta?.status || 'pending').toLowerCase() === 'pending';

      if (!convMap.has(cid)) {
        convMap.set(cid, {
          _id: cid,
          userId: customerUid || msg.userId || cid,
          username: customerName || msg.username || 'VIP Patron',
          lastMessage:
            msg.text || (msg.imageUrl ? '📷 [Image Attachment]' : 'Active inquiry'),
          lastSenderRole: (msg.senderRole === 'staff' || msg.sender === 'support') ? 'staff' : 'player',
          updatedAt: msg.createdAt || new Date(),
          unreadCount: isUnreadPlayerMsg ? 1 : 0,
          unreadStaff: isUnreadPlayerMsg,
          pendingRequestCount: isPendingRequestCard ? 1 : 0,
        });
      } else {
        const conv = convMap.get(cid);
        if (customerName && (conv.username === 'VIP Patron' || conv.username === 'VIP Concierge')) {
          conv.username = customerName;
        }
        if (customerUid && conv.userId === cid) {
          conv.userId = customerUid;
        }
        if (isUnreadPlayerMsg) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
          conv.unreadStaff = true;
        }
        if (isPendingRequestCard) {
          conv.pendingRequestCount = (conv.pendingRequestCount || 0) + 1;
        }
      }
    }

    return Array.from(convMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (err) {
    console.error('buildStaffInbox error:', err);
    return [];
  }
}

async function attachConversationMeta(db, convList) {
  try {
    if (!db || !Array.isArray(convList) || convList.length === 0) return convList;
    const ids = convList.map((c) => String(c._id)).filter(Boolean);
    const metaCol = db.collection('chat_conversation_meta');
    const rows = await metaCol.find({ conversationId: { $in: ids } }).toArray();
    const metaMap = new Map(rows.map((m) => [String(m.conversationId), m]));
    return convList.map((c) => {
      const m = metaMap.get(String(c._id));
      if (!m) return c;
      const staffNotes = m.staffNotes || '';
      return {
        ...c,
        staffLabels: Array.isArray(m.labels) ? m.labels : [],
        staffNotes,
        staffNotesPreview: staffNotes.slice(0, 72),
        staffMetaUpdatedBy: m.updatedBy || '',
        staffMetaUpdatedAt: m.updatedAt || null,
      };
    });
  } catch (err) {
    console.error('attachConversationMeta error:', err);
    return convList;
  }
}

export async function GET(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const guestId = (searchParams.get('guestId') || searchParams.get('guest') || '').trim();
    const queryUserId = (searchParams.get('userId') || '').trim();
    const conversationId = (searchParams.get('conversationId') || '').trim();
    const inbox = searchParams.get('inbox') === 'true';

    const db = await getDb();
    const chatCol = db.collection('chat_messages');

    if (!session) {
      const lookupId = guestId || queryUserId || conversationId;
      if (!lookupId) {
        return Response.json({ success: true, messages: [] });
      }

      const guestOrList = [
        { conversationId: lookupId },
        { userId: lookupId },
        { userEmail: lookupId },
        { guestId: lookupId },
      ];

      const guestMessages = await chatCol
        .find({ $or: guestOrList, adminOnly: { $ne: true } })
        .sort({ createdAt: 1 })
        .toArray();

      guestMessages.sort((a, b) => {
        const tA = (a.createdAt || a.timestamp) ? new Date(a.createdAt || a.timestamp).getTime() : 0;
        const tB = (b.createdAt || b.timestamp) ? new Date(b.createdAt || b.timestamp).getTime() : 0;
        return tA - tB;
      });

      return Response.json({ success: true, messages: guestMessages });
    }

    const isStaff = isStaffRole(session.role);

    // 1. Staff Inbox
    if (isStaff && inbox) {
      await syncPendingRequestsToAdminChat(db);
      const activeConvs = await buildStaffInbox(chatCol);
      const enriched = await attachConversationMeta(db, activeConvs);
      return Response.json({ success: true, conversations: enriched });
    }

    // 2. Staff Viewing Specific Conversation
    if (isStaff && conversationId && conversationId !== 'all') {
      const orList = [
        { conversationId: conversationId },
        { userId: conversationId },
        { userEmail: conversationId },
        { customerUserId: conversationId },
      ];
      if (/^[0-9a-fA-F]{24}$/.test(conversationId)) {
        try {
          const { ObjectId } = require('mongodb');
          orList.push({ userId: new ObjectId(conversationId) });
          orList.push({ conversationId: new ObjectId(conversationId) });
        } catch {}
      }

      const messages = await chatCol
        .find({ $or: orList })
        .sort({ createdAt: 1 })
        .toArray();

      // Guarantee strictly chronological ascending order (oldest first, newest at the bottom)
      messages.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tA - tB;
      });

      // Mark staff-read: unconditionally mark all player messages in thread as read
      try {
        await chatCol.updateMany(
          {
            $or: orList,
            sender: { $nin: ['support', 'staff'] },
            senderRole: { $ne: 'staff' },
          },
          { $set: { read: true } }
        );
      } catch (err) {
        console.error('Mark read error:', err);
      }

      return Response.json({ success: true, messages });
    }

    // 3. Player Viewing Own Messages
    const shouldMarkRead = searchParams.get('markRead') === 'true' || searchParams.get('read') === 'true';
    const playerOrList = [
      { userId: session.id },
      { userEmail: session.email },
      { conversationId: session.id },
    ];
    if (session.id && /^[0-9a-fA-F]{24}$/.test(String(session.id))) {
      try {
        const { ObjectId } = require('mongodb');
        playerOrList.push({ userId: new ObjectId(session.id) });
        playerOrList.push({ conversationId: new ObjectId(session.id) });
      } catch {}
    }

    if (shouldMarkRead) {
      try {
        await chatCol.updateMany(
          {
            $and: [
              { $or: playerOrList },
              {
                $or: [
                  { sender: { $in: ['support', 'staff'] } },
                  { senderRole: 'staff' },
                ],
              },
            ],
          },
          { $set: { read: true } }
        );
      } catch (err) {
        console.error('Player mark read error:', err);
      }
    }

    const playerMessages = await chatCol
      .find({
        $or: playerOrList,
        adminOnly: { $ne: true },
      })
      .sort({ createdAt: 1 })
      .toArray();

    // Guarantee strictly chronological ascending order (oldest first, newest at the bottom)
    playerMessages.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tA - tB;
    });

    return Response.json({ success: true, messages: playerMessages });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    const body = await req.json();
    const { text, message, imageUrl, isStaffReply, targetUserId, targetUsername, conversationId, guestId } = body;

    if (!session && !guestId && !body.userId) {
      return Response.json({ success: false, error: 'Unauthorized or missing guest ID' }, { status: 401 });
    }

    const rawText = text !== undefined ? text : (message !== undefined ? message : '');
    const cleanText = typeof rawText === 'string' ? rawText.trim() : '';
    const cleanImage = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null;

    if (!cleanText && !cleanImage) {
      return Response.json(
        { success: false, error: 'Message text or image attachment required.' },
        { status: 400 }
      );
    }

    const isStaff = session ? isStaffRole(session.role) : false;
    const isExplicitStaff = Boolean(isStaffReply || (isStaff && (targetUserId || conversationId)));

    const resolvedConvId = isExplicitStaff
      ? String(conversationId || targetUserId).trim()
      : session
      ? String(session.id || session.email).trim()
      : String(guestId || body.userId || ('guest_' + Date.now().toString(36))).trim();

    const db = await getDb();
    const chatCol = db.collection('chat_messages');

    const effectiveSender = isExplicitStaff ? 'support' : 'player';
    const effectiveSenderRole = isExplicitStaff ? 'staff' : session ? 'player' : 'guest';
    const effectiveUserId = isExplicitStaff
      ? (targetUserId || resolvedConvId)
      : session
      ? session.id
      : (guestId || body.userId || resolvedConvId);
    const effectiveEmail = isExplicitStaff
      ? (targetUsername || 'player')
      : session
      ? session.email
      : (body.email || `${resolvedConvId}@guest.zoraaroyal.com`);
    const effectiveUsername = isExplicitStaff
      ? 'VIP Concierge'
      : session
      ? session.username
      : (body.username || 'Guest Patron');

    const messageDoc = {
      conversationId: resolvedConvId,
      userId: effectiveUserId,
      userEmail: effectiveEmail,
      username: effectiveUsername,
      customerUserId: isExplicitStaff ? (targetUserId || resolvedConvId) : effectiveUserId,
      customerUsername: isExplicitStaff ? targetUsername : effectiveUsername,
      sender: effectiveSender,
      senderRole: effectiveSenderRole,
      agentName: isExplicitStaff ? (session?.username || 'Staff') : null,
      guestId: !session ? (guestId || resolvedConvId) : null,
      text: cleanText,
      imageUrl: cleanImage,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const result = await chatCol.insertOne(messageDoc);
    const insertedId = result.insertedId ? String(result.insertedId) : '';

    publishChatRealtime({
      conversationId: resolvedConvId,
      senderRole: effectiveSenderRole,
      message: {
        ...messageDoc,
        id: insertedId,
        _id: insertedId,
      },
      userEmail: effectiveEmail,
      userId: String(effectiveUserId),
      guestId: !session ? String(guestId || resolvedConvId) : undefined,
    });

    if (isExplicitStaff) {
      try {
        await chatCol.updateMany(
          {
            $or: [
              { conversationId: resolvedConvId },
              { userId: resolvedConvId },
              { customerUserId: resolvedConvId },
            ],
            sender: { $nin: ['support', 'staff'] },
            senderRole: { $ne: 'staff' },
          },
          { $set: { read: true } }
        );
      } catch {}

      // Dispatch targeted push notification to this specific user ONLY
      try {
        const { notifyPlayer } = await import('@/lib/notify');
        notifyPlayer({
          userId: targetUserId || resolvedConvId,
          userEmail: targetUsername || resolvedConvId,
          title: '💬 VIP Concierge Reply',
          message: cleanText ? cleanText.slice(0, 120) : 'New attachment sent to your chat.',
          type: 'chat_message',
          data: { url: '/chat' },
        });
      } catch {}
    } else {
      // Player/Guest sent message -> Dispatch alert strictly to Staff Concierge desk ONLY
      try {
        const { notifyStaff } = await import('@/lib/notify');
        notifyStaff({
          title: '💬 New Live Chat Inquiry',
          message: `${effectiveUsername}: ${cleanText ? cleanText.slice(0, 100) : 'Sent an image attachment'}`,
          type: 'chat_message',
          data: { conversationId: resolvedConvId, url: '/admin' },
        });
      } catch {}
    }

    // Auto-bot assistant reply for first user message
    if (!isExplicitStaff) {
      const messageCount = await chatCol.countDocuments({
        $or: [
          { userId: effectiveUserId },
          { userEmail: effectiveEmail },
          { conversationId: resolvedConvId },
        ],
        adminOnly: { $ne: true },
      });

      if (messageCount === 1) {
        setTimeout(async () => {
          try {
            await chatCol.insertOne({
              conversationId: resolvedConvId,
              userId: effectiveUserId,
              userEmail: effectiveEmail,
              username: 'VIP Concierge',
              customerUserId: effectiveUserId,
              customerUsername: effectiveUsername,
              sender: 'support',
              senderRole: 'staff',
              agentName: 'Royal AI Desk',
              text: 'Hello! Thank you for contacting Zorra Royals VIP Concierge. Our 24/7 support officer has received your inquiry & attachments and will attend to you immediately.',
              imageUrl: null,
              read: false,
              createdAt: new Date().toISOString(),
            });
          } catch {}
        }, 800);
      }
    }

    return Response.json({
      success: true,
      messageId: result.insertedId,
      chatMessage: { ...messageDoc, _id: result.insertedId },
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
