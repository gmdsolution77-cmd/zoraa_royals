import { getDb, initDb } from '@/lib/db';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'chat')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const db = await getDb();
    const messages = await db.collection('chat_messages').find().sort({ createdAt: 1 }).toArray();

    // Ensure strictly chronological ascending order (oldest first, newest at the bottom)
    messages.sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tA - tB;
    });

    // Group by user
    const threads = {};
    for (const msg of messages) {
      const key = msg.userEmail || msg.userId;
      if (!threads[key]) {
        threads[key] = {
          userEmail: msg.userEmail,
          username: msg.username,
          userId: msg.userId,
          messages: [],
          lastMessageAt: msg.createdAt,
        };
      }
      threads[key].messages.push(msg);
      threads[key].lastMessageAt = msg.createdAt;
    }

    return Response.json({ success: true, threads: Object.values(threads) });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session || !hasPermission(session.role, 'chat')) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { targetEmail, targetUserId, text } = await req.json();

    if (!text || !text.trim()) {
      return Response.json({ success: false, error: 'Reply text cannot be empty' }, { status: 400 });
    }

    const db = await getDb();
    const replyDoc = {
      conversationId: targetUserId || targetEmail,
      userId: targetUserId,
      userEmail: targetEmail,
      username: 'VIP Support',
      customerUserId: targetUserId,
      sender: 'support',
      senderRole: 'staff',
      agentName: session.username,
      text: text.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection('chat_messages').insertOne(replyDoc);

    return Response.json({ success: true, messageId: result.insertedId, chatMessage: { ...replyDoc, _id: result.insertedId } });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
