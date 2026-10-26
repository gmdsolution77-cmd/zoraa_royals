import { getDb, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

function isStaffRole(role) {
  const r = String(role || '').toLowerCase();
  return Boolean(r && r !== 'player');
}

// Group messages into conversations for Staff Inbox
async function buildStaffInbox(chatCol) {
  try {
    const rawMessages = await chatCol
      .find({})
      .sort({ createdAt: -1 })
      .limit(2000)
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

export async function GET(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, messages: [], error: 'Unauthorized' });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = (searchParams.get('conversationId') || '').trim();
    const inbox = searchParams.get('inbox') === 'true';

    const db = await getDb();
    const chatCol = db.collection('chat_messages');
    const isStaff = isStaffRole(session.role);

    // 1. Staff Inbox
    if (isStaff && inbox) {
      const activeConvs = await buildStaffInbox(chatCol);
      return Response.json({ success: true, conversations: activeConvs });
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
      })
      .sort({ createdAt: 1 })
      .toArray();

    return Response.json({ success: true, messages: playerMessages });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { text, imageUrl, isStaffReply, targetUserId, targetUsername, conversationId } = body;

    const cleanText = typeof text === 'string' ? text.trim() : '';
    const cleanImage = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null;

    if (!cleanText && !cleanImage) {
      return Response.json(
        { success: false, error: 'Message text or image attachment required.' },
        { status: 400 }
      );
    }

    const isStaff = isStaffRole(session.role);
    const isExplicitStaff = Boolean(isStaffReply || (isStaff && (targetUserId || conversationId)));

    const resolvedConvId = isExplicitStaff
      ? String(conversationId || targetUserId).trim()
      : String(session.id || session.email).trim();

    const db = await getDb();
    const chatCol = db.collection('chat_messages');

    const messageDoc = {
      conversationId: resolvedConvId,
      userId: isExplicitStaff ? (targetUserId || resolvedConvId) : session.id,
      userEmail: isExplicitStaff ? (targetUsername || 'player') : session.email,
      username: isExplicitStaff ? 'VIP Concierge' : session.username,
      customerUserId: isExplicitStaff ? (targetUserId || resolvedConvId) : session.id,
      customerUsername: isExplicitStaff ? targetUsername : session.username,
      sender: isExplicitStaff ? 'support' : 'player',
      senderRole: isExplicitStaff ? 'staff' : 'player',
      agentName: isExplicitStaff ? session.username : null,
      text: cleanText,
      imageUrl: cleanImage,
      read: false,
      createdAt: new Date(),
    };

    const result = await chatCol.insertOne(messageDoc);

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
    }

    // Auto-bot assistant reply for first user message
    if (!isExplicitStaff) {
      const messageCount = await chatCol.countDocuments({
        $or: [{ userId: session.id }, { userEmail: session.email }, { conversationId: resolvedConvId }],
      });

      if (messageCount === 1) {
        setTimeout(async () => {
          try {
            await chatCol.insertOne({
              conversationId: resolvedConvId,
              userId: session.id,
              userEmail: session.email,
              username: 'VIP Concierge',
              customerUserId: session.id,
              customerUsername: session.username,
              sender: 'support',
              senderRole: 'staff',
              agentName: 'Royal AI Desk',
              text: 'Hello! Thank you for contacting Zorra Royals VIP Concierge. Our 24/7 support officer has received your inquiry & attachments and will attend to you immediately.',
              imageUrl: null,
              read: false,
              createdAt: new Date(),
            });
          } catch {}
        }, 800);
      }
    }

    return Response.json({ success: true, messageId: result.insertedId });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
