// Zorra Royals Service Worker (Web Push & Chrome Native Notifications)
const CACHE_NAME = 'zorra-royals-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification listener (Background Web Push via FCM / VAPID)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: '👑 VIP Bonus Alert!', body: event.data.text() };
    }
  }

  const title = data.title || '👑 Zorra Royals VIP Alert';
  const options = {
    body: data.body || data.message || 'VIP Bonus has been credited to your account. Tap to play now!',
    icon: '/apple-touch-icon.png',
    badge: '/apple-touch-icon.png',
    vibrate: [300, 100, 300],
    tag: data.tag || 'zorra-alert-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Open / Claim' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Message listener (Foreground Trigger from Web Page)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url, tag } = event.data;
    const options = {
      body: body || 'VIP bonus credited to your royal vault. Play now!',
      icon: '/apple-touch-icon.png',
      badge: '/apple-touch-icon.png',
      vibrate: [300, 100, 300],
      tag: tag || 'zorra-alert-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      data: {
        url: url || '/',
        dateOfArrival: Date.now(),
      },
      actions: [
        { action: 'open', title: 'Open / Claim' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(title || '👑 Zorra Royals VIP Alert', options)
    );
  }
});

// Notification click listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
