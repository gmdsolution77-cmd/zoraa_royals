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

    // Player view: notifications broadcast to all or specific user
    const userConditions = [
      { target: 'all' },
      { channel: 'all', target: { $ne: 'staff' } },
    ];

    if (session) {
      const uid = session.id || session.userId;
      if (uid) {
        userConditions.push({ userId: uid });
        userConditions.push({ userId: uid.toString() });
        try {
          userConditions.push({ userId: toIdQuery(uid)._id });
        } catch {}
      }
      if (session.email) {
        userConditions.push({ userEmail: session.email.toLowerCase().trim() });
      }
      if (session.username) {
        userConditions.push({ username: session.username });
      }
    }

    // STRICT: Never return staff alerts to players, strictly personal + public
    const items = await notifsCol
      .find({
        $and: [
          { $or: userConditions },
          { target: { $ne: 'staff' } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(30)
      .toArray();

    return NextResponse.json({
      success: true,
      notifications: items.map(n => ({
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        type: n.type || 'promo',
        url: n.url || '/',
        read: !!n.read,
        createdAt: n.createdAt,
      })),
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

    // Send push notification via FCM to all players
    try {
      await sendPushNotification({
        topic: 'zorra_all_players',
        title: title.trim(),
        body: message.trim(),
        data: { url },
        broadcast: true,
      });
    } catch (fcmErr) {
      console.warn('FCM delivery note:', fcmErr.message);
    }

    // Optional email dispatch to players in background
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

    return NextResponse.json({
      success: true,
      message: `Broadcast successfully dispatched via [${channel.toUpperCase()}] to [${segment.toUpperCase()}]!`,
      broadcast: { ...newRecord, id: res.insertedId.toString() },
    });
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
          userId: session?.id || session?.userId || null,
          username: session?.username || effectiveEmail.split('@')[0],
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

// PATCH: Mark notification as read
export async function PATCH(req) {
  try {
    const session = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const notificationId = body.notificationId || body.id || null;

    const db = await getDb();
    const notifsCol = db.collection('notifications');

    if (notificationId) {
      await notifsCol.updateOne(toIdQuery(notificationId), {
        $set: { read: true, readAt: new Date() },
      });
      return NextResponse.json({ success: true, message: 'Notification marked as read.' });
    }

    return NextResponse.json({ success: false, error: 'Notification ID required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
