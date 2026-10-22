import { getDb, initDb } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!session) {
      return Response.json({ success: false, messages: [] });
    }

    const db = await getDb();
    const messages = await db.collection('chat_messages').find({
      $or: [{ userId: session.id }, { userEmail: session.email }]
    }).sort({ createdAt: 1 }).toArray();

    return Response.json({ success: true, messages });
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

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return Response.json({ success: false, error: 'Message cannot be empty' }, { status: 400 });
    }

    const db = await getDb();
    const messageDoc = {
      userId: session.id,
      userEmail: session.email,
      username: session.username,
      sender: 'player',
      text: text.trim(),
      read: false,
      createdAt: new Date(),
    };

    const result = await db.collection('chat_messages').insertOne(messageDoc);

    // Auto-bot assistant response if this is first message or night hours
    const messageCount = await db.collection('chat_messages').countDocuments({
      $or: [{ userId: session.id }, { userEmail: session.email }]
    });

    if (messageCount === 1) {
      setTimeout(async () => {
        try {
          await db.collection('chat_messages').insertOne({
            userId: session.id,
            userEmail: session.email,
            username: session.username,
            sender: 'support',
            text: 'Hello! Thank you for contacting Zorra Royals VIP Concierge. Our 24/7 support officer has received your inquiry and will attend to you immediately.',
            read: false,
            createdAt: new Date(),
          });
        } catch {}
      }, 800);
    }

    return Response.json({ success: true, messageId: result.insertedId });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
