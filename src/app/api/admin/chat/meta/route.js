import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { sanitizeChatLabels, sanitizeStaffNotes } from '@/lib/chatConversationMeta';

function staffOk(session) {
  return session && hasPermission(session.role, 'chat');
}

export async function GET(req) {
  try {
    await initDb();
    const session = await getSessionUser();
    if (!staffOk(session)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = (searchParams.get('conversationId') || '').trim();
    const db = await getDb();
    const col = db.collection('chat_conversation_meta');

    if (conversationId) {
      const doc = await col.findOne({ conversationId: String(conversationId) });
      return NextResponse.json({
        success: true,
        meta: doc
          ? {
              conversationId: doc.conversationId,
              labels: doc.labels || [],
              staffNotes: doc.staffNotes || '',
              updatedBy: doc.updatedBy || '',
              updatedAt: doc.updatedAt || null,
            }
          : { conversationId, labels: [], staffNotes: '' },
      });
    }

    const rows = await col.find({}).sort({ updatedAt: -1 }).limit(800).toArray();
    const byConversation = {};
    for (const doc of rows) {
      byConversation[String(doc.conversationId)] = {
        labels: doc.labels || [],
        staffNotes: doc.staffNotes || '',
        staffNotesPreview: String(doc.staffNotes || '').slice(0, 72),
        updatedBy: doc.updatedBy || '',
        updatedAt: doc.updatedAt || null,
      };
    }

    return NextResponse.json({ success: true, byConversation });
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
    const conversationId = String(body.conversationId || '').trim();
    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId is required' }, { status: 400 });
    }

    const labels = sanitizeChatLabels(body.labels);
    const staffNotes = sanitizeStaffNotes(body.staffNotes);
    const db = await getDb();
    const col = db.collection('chat_conversation_meta');

    const patch = {
      conversationId,
      labels,
      staffNotes,
      updatedBy: session.username || session.email || 'staff',
      updatedAt: new Date(),
    };

    await col.updateOne({ conversationId }, { $set: patch }, { upsert: true });

    if (/^[0-9a-fA-F]{24}$/.test(conversationId)) {
      await db.collection('player_staff_meta').updateOne(
        { userId: conversationId },
        {
          $set: {
            userId: conversationId,
            labels,
            staffNotes,
            updatedBy: patch.updatedBy,
            updatedAt: patch.updatedAt,
          },
        },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      meta: {
        ...patch,
        staffNotesPreview: staffNotes.slice(0, 72),
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}