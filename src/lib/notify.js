import { getDb } from './mongodb';
import { sendPushNotification } from './fcm';

/**
 * Dispatches an instant royal in-app notification & push notification without blocking caller.
 */
export function notifyPlayer({ userId, userEmail, username, title, message, type = 'general', data = {} }) {
  // Fire asynchronously in background
  (async () => {
    try {
      const db = await getDb();
      if (!db || !db.collection) return;

      let cleanEmail = (userEmail || '').toLowerCase().trim();
      let cleanUid = userId ? userId.toString() : null;
      let cleanUsername = username || null;

      // Automatically resolve missing email or userId from users collection
      if ((!cleanEmail || !cleanUid) && (cleanUid || cleanEmail)) {
        try {
          const { ObjectId } = require('mongodb');
          const userOr = [];
          if (cleanUid) {
            userOr.push({ _id: cleanUid });
            if (/^[0-9a-fA-F]{24}$/.test(cleanUid)) {
              try { userOr.push({ _id: new ObjectId(cleanUid) }); } catch {}
            }
          }
          if (cleanEmail) userOr.push({ email: cleanEmail });

          const foundUser = await db.collection('users').findOne({ $or: userOr });
          if (foundUser) {
            if (!cleanEmail && foundUser.email) cleanEmail = foundUser.email.toLowerCase().trim();
            if (!cleanUid && foundUser._id) cleanUid = foundUser._id.toString();
            if (!cleanUsername && foundUser.username) cleanUsername = foundUser.username;
          }
        } catch {}
      }

      // 1. In-app notification record for targeted player
      await db.collection('notifications').insertOne({
        userId: cleanUid,
        userEmail: cleanEmail,
        target: 'player',
        username: cleanUsername || cleanEmail.split('@')[0] || 'Player',
        title,
        message,
        type,
        url: data?.url || (type === 'chat_message' ? '/chat' : '/'),
        read: false,
        createdAt: new Date(),
      }).catch(() => {});

      // 2. Find FCM device push tokens specifically for this player
      const tokenQueries = [];
      if (cleanEmail) tokenQueries.push({ email: cleanEmail });
      if (cleanUid) tokenQueries.push({ userId: cleanUid });
      if (cleanUsername) tokenQueries.push({ username: cleanUsername });

      if (tokenQueries.length > 0) {
        const subs = await db.collection('subscriptions').find({ $or: tokenQueries }).toArray();
        const userTokens = [...new Set(subs.map(s => s.fcmToken || s.token).filter(Boolean))];

        // 3. Send Push Notification to player's devices ONLY
        for (const tok of userTokens) {
          await sendPushNotification({
            token: tok,
            title,
            body: message,
            data: { ...data, type, target: 'player', userId: cleanUid || '', userEmail: cleanEmail || '' },
          }).catch((e) => {
            console.warn('[Notify Royal User Push]:', e.message);
          });
        }
      }
    } catch (err) {
      console.warn('[Notify Royal Helper Error]:', err.message);
    }
  })();
}

/**
 * Dispatches staff alerts strictly to authorized staff members and admin concierge desk.
 */
export function notifyStaff({ title, message, type = 'staff_alert', data = {} }) {
  (async () => {
    try {
      const db = await getDb();
      if (!db || !db.collection) return;

      // 1. In-app notification record for Staff
      await db.collection('notifications').insertOne({
        target: 'staff',
        channel: 'all',
        title,
        message,
        type,
        conversationId: data.conversationId || null,
        url: data.url || '/admin',
        read: false,
        createdAt: new Date(),
      }).catch(() => {});

      // 2. Find Staff members & their push device tokens ONLY
      const staffRoles = ['super_admin', 'admin', 'chat_support', 'operation_admin', 'financial_manager', 'coin_manager'];
      const staffUsers = await db.collection('users').find(
        { role: { $in: staffRoles } },
        { projection: { _id: 1, email: 1, username: 1 } }
      ).toArray().catch(() => []);

      const staffQueries = [{ role: { $in: staffRoles } }];
      for (const u of staffUsers) {
        staffQueries.push({ userId: u._id.toString() });
        if (u.email) staffQueries.push({ email: u.email.toLowerCase().trim() });
        if (u.username) staffQueries.push({ username: u.username });
      }

      const staffSubs = await db.collection('subscriptions').find({ $or: staffQueries }).toArray().catch(() => []);
      const staffTokens = [
        ...new Set(
          staffSubs
            .map((s) => s.fcmToken || s.token)
            .filter((t) => typeof t === 'string' && t.trim().length > 15)
        ),
      ];

      if (staffTokens.length > 0) {
        for (const tok of staffTokens) {
          await sendPushNotification({
            token: tok,
            title,
            body: message,
            data: { ...data, type, target: 'staff' },
          }).catch(() => {});
        }
      }

      // 3. Send strictly to staff topic ONLY
      await sendPushNotification({
        topic: 'zorra_staff_alerts',
        title,
        body: message,
        data: { ...data, type, target: 'staff' },
      }).catch(() => {});
    } catch (err) {
      console.warn('[Notify Staff Helper Error]:', err.message);
    }
  })();
}
