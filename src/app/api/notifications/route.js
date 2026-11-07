import { NextResponse } from 'next/server';
import { getSessionUser, ROLES } from '@/lib/auth';
import { getDb, toIdQuery } from '@/lib/mongodb';
import { sendPushNotification } from '@/lib/fcm';

// GET: Fetch in-app notifications for player OR broadcast history for admin
export async function GET(req) {
  try {
    const session = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get('admin') === 'true';

    const db = await getDb();
    const notifsCol = db.collection('notifications');

    // Admin view: list recent broadcasts
    if (isAdmin) {
      if (!session || session.role === 'player') {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
      }

      const items = await notifsCol
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      return NextResponse.json({
        success: true,
        broadcasts: items.map(n => ({
          id: n._id.toString(),
          title: n.title,
          message: n.message,
          channel: n.channel || 'all',
          segment: n.segment || 'all',
          target: n.target || 'all',
          url: n.url || '/',
          sentBy: n.sentBy || 'Admin',
          createdAt: n.createdAt,
        })),
      });
    }

    // Player view: broadcasts + personal alerts (parity with player_pradise targeting)
    const emailParam = searchParams.get('email');
    const targetConditions = [{ target: 'all' }, { target: 'player' }];
    const userKeys = [];

    if (session?.userId || session?.id) {
      const uidStr = (session.userId || session.id).toString().trim();
      targetConditions.push({ userId: uidStr });
      userKeys.push(uidStr);
      try {
        targetConditions.push({ userId: toIdQuery(uidStr)._id });
      } catch {}
    }
    if (session?.username) {
      const uLower = session.username.toLowerCase().trim();
      targetConditions.push({ username: uLower });
      targetConditions.push({ username: session.username.trim() });
      userKeys.push(uLower);
    }
    if (session?.email) {
      const cleanEmail = session.email.toLowerCase().trim();
      targetConditions.push({ email: cleanEmail });
      targetConditions.push({ userEmail: cleanEmail });
      userKeys.push(cleanEmail);
    }
    if (emailParam && emailParam.trim()) {
      const cleanEmail = emailParam.toLowerCase().trim();
      targetConditions.push({ email: cleanEmail });
      targetConditions.push({ userEmail: cleanEmail });
      userKeys.push(cleanEmail);
      try {
        const uDoc = await db.collection('users').findOne({ email: cleanEmail });
        if (uDoc) {
          const uDocId = uDoc._id.toString();
          targetConditions.push({ userId: uDocId });
          targetConditions.push({ userId: uDoc._id });
          targetConditions.push({ username: uDoc.username });
          userKeys.push(uDocId);
        }
      } catch {}
    }

    const items = await notifsCol
      .find({
        target: { $ne: 'staff' },
        $or: targetConditions,
      })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();

    return NextResponse.json({
      success: true,
      notifications: items.map(n => {
        let isRead = Boolean(n.read);
        if (!isRead && Array.isArray(n.readBy) && userKeys.length > 0) {
          isRead = userKeys.some((k) => n.readBy.includes(k));
        }
        return {
          id: n._id.toString(),
          title: n.title,
          message: n.message,
          type: n.type || 'promo',
          url: n.url || (n.type === 'chat_message' ? '/chat' : '/'),
          read: isRead,
          createdAt: n.createdAt,
        };
      }),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Broadcast Push Notification (Admin)
export async function POST(req) {
  try {
    const session = await getSessionUser();
    if (!session || session.role === 'player') {
      return NextResponse.json({ success: false, error: 'Unauthorized. Staff only.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, message, target = 'all', channel = 'all', segment = 'all', url = '/' } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required.' }, { status: 400 });
    }

    const db = await getDb();
    const notifsCol = db.collection('notifications');

    // Save in-app notification & broadcast record
    const newRecord = {
      title: title.trim(),
      message: message.trim(),
      target,
      channel,
      segment,
      url,
      type: 'broadcast',
      sentBy: session.username || 'Admin',
      createdAt: new Date(),
    };

    const res = await notifsCol.insertOne(newRecord);

    const responsePayload = {
      success: true,
      message: `Broadcast successfully dispatched via [${channel.toUpperCase()}] to [${segment.toUpperCase()}]!`,
      broadcast: { ...newRecord, id: res.insertedId.toString() },
    };

    // FCM + email in background (fast HTTP response, like player_pradise)
    setImmediate(async () => {
      if (channel === 'all' || channel === 'push' || channel === 'alert' || channel === 'vip') {
        try {
          await sendPushNotification({
            broadcast: true,
            topic: 'zorra_all_players',
            title: title.trim(),
            body: message.trim(),
            data: { url: url || '/' },
          });
        } catch (fcmErr) {
          console.warn('FCM delivery note:', fcmErr.message);
        }
      }

    if (channel === 'all' || channel === 'email') {
      (async () => {
        try {
          const { sendEmail } = await import('@/lib/email');
          const usersCol = db.collection('users');
          const targetUsers = await usersCol
            .find({ role: 'player' }, { projection: { email: 1, username: 1 } })
            .limit(100)
            .toArray();

          for (const u of targetUsers) {
            if (u.email) {
              const html = `
                <div style="background-color: #08090C; color: #FFFFFF; padding: 40px 24px; font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 540px; margin: auto; border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.4); text-align: center;">
                  <img src="https://zoraaroyal.com/apple-touch-icon.png" alt="Zorra Royals" style="height: 56px; margin-bottom: 8px;" />
                  <h1 style="color: #D4AF37; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">ZORRA ROYALS</h1>
                  <p style="color: #F59E0B; font-size: 11px; margin: 4px 0 20px 0; text-transform: uppercase; letter-spacing: 2px;">Official Royal Broadcast</p>
                  <div style="background: #11131A; border: 1px solid rgba(212, 175, 55, 0.2); border-radius: 12px; padding: 22px; text-align: left; margin: 20px 0;">
                    <h2 style="font-size: 18px; margin: 0 0 10px 0; color: #FFFFFF;">${title.trim()}</h2>
                    <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6; margin: 0;">${message.trim()}</p>
                  </div>
                  <a href="${url && url.startsWith('http') ? url : `https://zoraaroyal.com${url}`}" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #F59E0B 100%); color: #08090C; font-weight: 900; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-size: 14px; letter-spacing: 0.5px;">
                    ACCESS NOW &amp; PLAY
                  </a>
                </div>
              `;
              sendEmail({ to: u.email, subject: `👑 Zorra Royals: ${title.trim()}`, html }).catch(() => {});
            }
          }
        } catch (emailErr) {
          console.warn('Broadcast email batch note:', emailErr.message);
        }
      })();
    }
    });

    return NextResponse.json(responsePayload);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Player subscribes to Web Push & VIP Promos
export async function PUT(req) {
  try {
    const session = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const email = (session?.email || body.email || '').toLowerCase().trim();
    const fcmToken = body.token || body.fcmToken || null;
    const device = body.device || 'web_chrome';

    if (!fcmToken && !email) {
      return NextResponse.json({ success: false, error: 'Push token or email is required' }, { status: 400 });
    }

    const db = await getDb();
    const subsCol = db.collection('subscriptions');
    const usersCol = db.collection('users');

    const resolvedUserId = body.userId || session?.id || session?.userId || null;
    const resolvedUsername = body.username || session?.username || null;
    const effectiveEmail = email || (fcmToken ? `device_${fcmToken.slice(-10)}@push.zoraaroyal.com` : 'anonymous@push.zoraaroyal.com');
    const filter = fcmToken ? { $or: [{ fcmToken }, { token: fcmToken }] } : { email: effectiveEmail };

    await subsCol.updateOne(
      filter,
      {
        $set: {
          email: effectiveEmail,
          fcmToken,
          token: fcmToken,
          device,
          userId: resolvedUserId ? String(resolvedUserId) : null,
          username: resolvedUsername || effectiveEmail.split('@')[0],
          isSubscribed: true,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    const uid = session?.id || session?.userId;
    if (uid) {
      try {
        await usersCol.updateOne(
          toIdQuery(uid),
          { $set: { isSubscribed: true } }
        );
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to VIP Promos & Royal Push Notifications!',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Mark notification(s) as read
export async function PATCH(req) {
  try {
    const session = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const email = (session?.email || body.email || '').toLowerCase().trim();
    const userId = session?.userId || session?.id || body.userId || null;
    const notificationId = body.notificationId || body.id || null;
    const markAll = body.markAll === true || body.notificationId === 'all';

    const db = await getDb();
    const notifsCol = db.collection('notifications');

    const userKeys = [];
    if (email) userKeys.push(email);
    if (userId) userKeys.push(userId.toString());
    if (session?.username) userKeys.push(session.username.toLowerCase());

    const readUpdate = { $set: { read: true, readAt: new Date() } };
    if (userKeys.length > 0) {
      readUpdate.$addToSet = { readBy: { $each: userKeys } };
    }

    if (notificationId && !markAll) {
      await notifsCol.updateOne(toIdQuery(notificationId), readUpdate);
      return NextResponse.json({ success: true, message: 'Notification marked as read.' });
    }

    const targetConditions = [{ target: 'all' }, { target: 'player' }];
    if (userId) {
      const uidStr = userId.toString();
      targetConditions.push({ userId: uidStr });
      try {
        targetConditions.push({ userId: toIdQuery(uidStr)._id });
      } catch {}
    }
    if (email) {
      targetConditions.push({ email });
      targetConditions.push({ userEmail: email });
    }
    if (session?.username) {
      targetConditions.push({ username: session.username });
    }

    await notifsCol.updateMany(
      {
        target: { $ne: 'staff' },
        $or: targetConditions,
      },
      readUpdate
    );

    return NextResponse.json({ success: true, message: 'Notifications marked as read.' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
