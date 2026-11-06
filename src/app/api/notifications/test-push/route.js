import { NextResponse } from 'next/server';
import { getSessionUser, ROLES } from '@/lib/auth';
import { getDb, toObjectId } from '@/lib/mongodb';
import { sendPushNotification } from '@/lib/fcm';

/**
 * POST: Send a single high-priority FCM to this player's registered device (lock screen test).
 * Requires logged-in player session + a stored token from Capacitor/Push registration.
 */
export async function POST(req) {
  try {
    const session = await getSessionUser('player');
    if (!session || (session.role && session.role !== 'player' && session.role !== ROLES.PLAYER)) {
      return NextResponse.json(
        { success: false, error: 'Sign in as a player to test lock screen push.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const title = (body.title || 'Zorra Royals test').trim();
    const message = (body.message || 'Lock screen notification test — if you see this on the lock screen, push is working.').trim();
    const url = typeof body.url === 'string' ? body.url : '/';

    const uid = session.id || session.userId;
    if (!uid) {
      return NextResponse.json({ success: false, error: 'Session has no user id.' }, { status: 400 });
    }

    const db = await getDb();
    const subsCol = db.collection('subscriptions');

    const orConditions = [{ userId: uid }, { userId: String(uid) }];
    try {
      const oid = toObjectId(uid);
      if (oid && oid !== uid && oid !== String(uid)) {
        orConditions.push({ userId: oid });
      }
    } catch {
      /* ignore */
    }

    const sub = await subsCol.findOne({ $or: orConditions }, { sort: { updatedAt: -1 } });
    const token = sub?.fcmToken || sub?.token;

    if (!token || typeof token !== 'string' || token.trim().length < 15) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No device push token on file. Open the app on your phone, allow notifications, then try again.',
        },
        { status: 400 }
      );
    }

    const result = await sendPushNotification({
      token: token.trim(),
      title,
      body: message,
      data: { url },
    });

    return NextResponse.json({
      success: !!result?.success,
      messageId: result?.messageId,
      error: result?.error,
      simulated: result?.simulated,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
