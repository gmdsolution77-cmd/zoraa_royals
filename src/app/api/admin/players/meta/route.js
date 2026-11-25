import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { getSessionUser, ROLES } from '@/lib/auth';
import { sanitizeChatLabels, sanitizeStaffNotes } from '@/lib/chatConversationMeta';

function staffOk(session) {
  return session && session.role !== ROLES.PLAYER;
}

async function writePlayerStaffMeta(db, userId, patch) {
  const uid = String(userId).trim();
  await db.collection('player_staff_meta').updateOne(
    { userId: uid },
    { $set: { userId: uid, ...patch } },
    { upsert: true }
  );
  // Keep live-chat desk labels in sync for the same player thread
  await db.collection('chat_conversation_meta').updateOne(
    { conversationId: uid },
    { $set: { conversationId: uid, ...patch } },
    { upsert: true }
  );
}

export async function GET(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!staffOk(session)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const userId = new URL(req.url).searchParams.get('userId')?.trim();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const db = await getDb();
    const doc = await db.collection('player_staff_meta').findOne({ userId: String(userId) });

    return NextResponse.json({
      success: true,
      meta: doc
        ? {
            userId: doc.userId,
            labels: doc.labels || [],
            staffNotes: doc.staffNotes || '',
            updatedBy: doc.updatedBy || '',
            updatedAt: doc.updatedAt || null,
          }
        : { userId, labels: [], staffNotes: '' },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!staffOk(session)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const userId = String(body.userId || '').trim();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const labels = sanitizeChatLabels(body.labels);
    const staffNotes = sanitizeStaffNotes(body.staffNotes);
    const db = await getDb();

    const patch = {
      labels,
      staffNotes,
      updatedBy: session.username || session.email || 'staff',
      updatedAt: new Date(),
    };

    await writePlayerStaffMeta(db, userId, patch);

    return NextResponse.json({
      success: true,
      meta: { userId, ...patch, staffNotesPreview: staffNotes.slice(0, 72) },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}