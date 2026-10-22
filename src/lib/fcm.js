import fs from 'fs';
import path from 'path';
import { getDb } from './mongodb';

let messagingInstance = null;
let loadedAccountSource = null;
let lastInitError = null;

function findServiceAccount() {
  const possiblePaths = [
    path.join(process.cwd(), 'firebase-service-account.json'),
    path.join(process.cwd(), 'google-services.json'),
    path.join(process.cwd(), 'firebase-admin.json'),
    path.join(process.cwd(), 'android/app/google-services.json'),
  ];

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (parsed.private_key && parsed.client_email) {
        loadedAccountSource = 'env:FIREBASE_SERVICE_ACCOUNT';
        return parsed;
      }
    } catch (e) {
      console.warn('[FCM] Invalid FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
    }
  }

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (raw.type === 'service_account' && raw.private_key && raw.client_email) {
          loadedAccountSource = p;
          return raw;
        }
      } catch (err) {
        console.warn(`[FCM] Read error at ${p}:`, err.message);
      }
    }
  }

  return null;
}

export async function getFirebaseMessaging() {
  if (messagingInstance) return messagingInstance;

  try {
    let initializeApp, cert, getApps, getMessaging;
    try {
      ({ initializeApp, cert, getApps } = await import('firebase-admin/app'));
      ({ getMessaging } = await import('firebase-admin/messaging'));
    } catch (impErr) {
      lastInitError = `firebase-admin package import issue: ${impErr.message}`;
      console.warn('[FCM]', lastInitError);
      return null;
    }

    let serviceAccount = null;
    const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    if (envPath && fs.existsSync(envPath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(envPath, 'utf8'));
        loadedAccountSource = envPath;
      } catch (e) {
        lastInitError = `Invalid JSON at FIREBASE_SERVICE_ACCOUNT_PATH: ${e.message}`;
      }
    }
    if (!serviceAccount) serviceAccount = findServiceAccount();

    if (!serviceAccount) {
      lastInitError = `No valid Firebase service account JSON found. Place firebase-service-account.json in root or set FIREBASE_SERVICE_ACCOUNT.`;
      return null;
    }

    if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp({
      credential: cert(serviceAccount),
    });

    messagingInstance = getMessaging(app);
    lastInitError = null;
    console.log(`[FCM] Successfully initialized Firebase Messaging using: ${loadedAccountSource}`);
    return messagingInstance;
  } catch (err) {
    lastInitError = `Firebase init error: ${err.message}`;
    console.warn('[FCM]', lastInitError);
    return null;
  }
}

// Build Android & WebPush payload for lockscreen & high-priority heads-up delivery
function buildFcmPayload({ title, body, data = {} }) {
  const notifTitle = title || '👑 LIVE VIP BONUS: 10 SC Drop!';
  const notifBody = body || 'Instant Royal Bonus credited to your account! Tap to play now.';
  const targetUrl = data.url || '/';

  return {
    notification: {
      title: notifTitle,
      body: notifBody,
    },
    data: {
      ...data,
      title: notifTitle,
      body: notifBody,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      url: targetUrl,
    },
    android: {
      priority: 'high',
      ttl: 86400 * 1000,
      notification: {
        channelId: 'default',
        sound: 'default',
        defaultSound: true,
        defaultVibrateTimings: true,
        priority: 'max', // MAX priority ensures heads-up banner & lockscreen popup
        visibility: 'public',
        icon: 'ic_launcher',
        color: '#D4AF37',
        tag: 'zorra-royals-alert',
        clickAction: 'FLUTTER_NOTIFICATION_CLICK',
      },
    },
    webpush: {
      headers: {
        Urgency: 'high',
      },
      notification: {
        title: notifTitle,
        body: notifBody,
        icon: '/apple-touch-icon.png',
        badge: '/apple-touch-icon.png',
        vibrate: [300, 100, 300],
        requireInteraction: true,
      },
    },
  };
}

export async function sendPushNotification({ token, topic, title, body, data = {} }) {
  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.log(`[ZORRA ROYALS SIMULATED PUSH] Title: "${title}" | Body: "${body}"`);
    return { success: false, simulated: true, error: lastInitError };
  }

  const payload = buildFcmPayload({ title, body, data });

  // 1. Send to single device token if specified
  if (token) {
    try {
      const res = await messaging.send({ ...payload, token });
      return { success: true, messageId: res };
    } catch (err) {
      console.warn('[FCM] Send to token error:', err.message);
      return { success: false, error: err.message };
    }
  }

  // 2. Multicast to ALL active device tokens registered in subscriptions
  let multicastCount = 0;
  let allTokens = [];
  try {
    const db = await getDb();
    const subs = await db
      .collection('subscriptions')
      .find({
        $or: [
          { fcmToken: { $exists: true, $ne: null } },
          { token: { $exists: true, $ne: null } },
        ],
      })
      .toArray();

    allTokens = [
      ...new Set(
        subs
          .map((s) => s.fcmToken || s.token)
          .filter((t) => typeof t === 'string' && t.trim().length > 15)
      ),
    ];

    if (allTokens.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < allTokens.length; i += batchSize) {
        const tokenBatch = allTokens.slice(i, i + batchSize);
        try {
          const multiRes = await messaging.sendEachForMulticast({
            tokens: tokenBatch,
            ...payload,
          });
          multicastCount += multiRes.successCount;
        } catch (mErr) {
          console.warn('[FCM] Multicast batch error:', mErr.message);
        }
      }

      // Ensure all tokens are subscribed to broadcast topics
      try {
        await messaging.subscribeToTopic(allTokens, 'zorra_all_players');
        await messaging.subscribeToTopic(allTokens, 'all_players');
      } catch {}
    }
  } catch (dbErr) {
    console.warn('[FCM] Subscription lookup notice:', dbErr.message);
  }

  // 3. Send to broadcast topics
  const topicsToSend = [
    topic || 'zorra_all_players',
    'zorra_all_players',
    'all_players',
  ];
  const uniqueTopics = [...new Set(topicsToSend.filter(Boolean))];
  const topicResults = [];

  for (const t of uniqueTopics) {
    try {
      const topicRes = await messaging.send({
        ...payload,
        topic: t,
      });
      topicResults.push({ topic: t, success: true, messageId: topicRes });
    } catch (tErr) {
      topicResults.push({ topic: t, success: false, error: tErr.message });
    }
  }

  const anyTopicSuccess = topicResults.some((r) => r.success);
  console.log(`[ZORRA FCM BROADCAST] Multicast delivered: ${multicastCount} devices | Topics: ${JSON.stringify(topicResults)}`);

  return {
    success: multicastCount > 0 || anyTopicSuccess,
    multicastCount,
    totalTokens: allTokens.length,
    topicResults,
    source: loadedAccountSource,
  };
}
