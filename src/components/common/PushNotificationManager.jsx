'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, X, ExternalLink, Sparkles, Crown, MessageSquare } from 'lucide-react';
import { playTune, unlockAudioContext } from '@/lib/soundAlerts';

export default function PushNotificationManager() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeToast, setActiveToast] = useState(null);
  const [toastProgress, setToastProgress] = useState(100);
  const [showAllowPrompt, setShowAllowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const timer = setTimeout(() => setShowAllowPrompt(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const registerWebAudience = async (liveUser) => {
    let email = (liveUser?.email || '').toLowerCase().trim();
    let userId = liveUser?.userId || liveUser?.id || liveUser?._id || '';
    let username = liveUser?.username || '';
    if (!email) {
      try {
        const raw = localStorage.getItem('zr_user_session');
        if (raw) {
          const u = JSON.parse(raw);
          email = (u?.email || '').toLowerCase().trim();
          userId = userId || u?.userId || u?.id || u?._id || '';
          username = username || u?.username || '';
        }
      } catch {}
    }
    if (!email) {
      email = (localStorage.getItem('zorra_user_email') || '').toLowerCase().trim();
    }
    if (!email && !userId) return;

    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: email || undefined,
        userId: userId ? String(userId) : undefined,
        username: username || undefined,
        device: 'web_chrome',
      }),
    }).catch(() => {});
  };

  const handleAllowNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        unlockAudioContext();
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          playTune('jackpot', 0.8);
          setShowAllowPrompt(false);
          await registerWebAudience();

          triggerChromeDesktopNotification({
            title: '👑 Royal Push Notifications Enabled!',
            message: 'You will now receive instant push alerts for deposit approvals, Game IDs, and VIP bonuses.',
          });
        } else {
          setShowAllowPrompt(false);
        }
      } catch (e) {
        setShowAllowPrompt(false);
      }
    }
  };

  useEffect(() => {
    const syncFromNavbar = async () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission === 'granted') {
        setShowAllowPrompt(false);
        await registerWebAudience();
      }
    };
    window.addEventListener('royal-push-enabled', syncFromNavbar);
    return () => window.removeEventListener('royal-push-enabled', syncFromNavbar);
  }, []);

  const lastSeenIdRef = useRef(null);
  const isInitialRef = useRef(true);

  const triggerChromeDesktopNotification = async (item) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const title = item.title || '👑 Zorra Royals VIP Alert';
    const body = item.message || item.body || 'VIP reward credited to your account! Tap to claim.';
    const url = item.url || '/';
    const tag = 'zorra-alert-' + (item.id || Date.now());

    try {
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg?.showNotification) {
            await reg.showNotification(title, {
              body,
              icon: '/apple-touch-icon.png',
              badge: '/apple-touch-icon.png',
              tag,
              renotify: true,
              requireInteraction: true,
              vibrate: [300, 100, 300],
              data: { url, dateOfArrival: Date.now() },
              actions: [
                { action: 'open', title: 'Open / Claim' },
                { action: 'dismiss', title: 'Dismiss' },
              ],
            });
            return;
          }
        } catch (swErr) {
          console.warn('SW showNotification notice:', swErr);
        }

        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            body,
            url,
            tag,
          });
          return;
        }
      }

      const desktopNotif = new window.Notification(title, {
        body,
        icon: '/apple-touch-icon.png',
        tag,
      });
      desktopNotif.onclick = () => {
        window.focus();
        if (url && url !== '/') router.push(url);
        desktopNotif.close();
      };
    } catch (err) {
      console.warn('Chrome notification dispatch error:', err);
    }
  };

  // Play royal alert chime + vibrate device
  const dispatchAlert = (notif) => {
    try {
      unlockAudioContext();
      playTune('jackpot', 0.8);
    } catch {}

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {}
    }

    setActiveToast(notif);
    setToastProgress(100);

    triggerChromeDesktopNotification({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      url: notif.url || '/',
    });
  };

  // Auto-dismiss countdown timer for active toast banner
  useEffect(() => {
    if (!activeToast) return;

    const duration = 9000;
    const interval = 100;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setToastProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          setActiveToast(null);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [activeToast]);

  // 1. Capacitor Native Push Notifications Setup (Android APK & iOS)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initCapacitor = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor && Capacitor.isNativePlatform()) {
          const { PushNotifications } = await import('@capacitor/push-notifications');

          let permStatus = await PushNotifications.checkPermissions();
          if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === 'granted') {
            try {
              await PushNotifications.createChannel({
                id: 'default',
                name: 'Zorra Royals Alerts',
                description: 'Deposit approvals, Game IDs, VIP bonuses',
                importance: 5,
                visibility: 1,
                sound: 'default',
                vibration: true,
                lights: true,
                lightColor: '#D4AF37',
              });
            } catch {}

            await PushNotifications.removeAllListeners().catch(() => {});

            await PushNotifications.addListener('registration', async (token) => {
              if (token?.value) {
                try {
                  let storedEmail = localStorage.getItem('zorra_user_email') || '';
                  try {
                    const raw = localStorage.getItem('zr_user_session');
                    if (raw) {
                      const u = JSON.parse(raw);
                      if (u?.email) storedEmail = u.email;
                    }
                  } catch {}

                  const meRes = await fetch('/api/auth/me', { credentials: 'include' }).catch(() => null);
                  const meData = meRes ? await meRes.json().catch(() => ({})) : {};
                  if (meData?.user?.email) storedEmail = meData.user.email;

                  try {
                    localStorage.setItem('zorra_fcm_device_token', token.value);
                  } catch {}

                  await fetch('/api/notifications', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      token: token.value,
                      fcmToken: token.value,
                      device: Capacitor.getPlatform(),
                      email: storedEmail,
                    }),
                  });
                } catch {}
              }
            });

            await PushNotifications.addListener('pushNotificationReceived', (notification) => {
              dispatchAlert({
                title: notification.title,
                message: notification.body,
                url: notification.data?.url || '/',
              });
            });

            await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
              const url = notification.notification.data?.url;
              if (url) router.push(url);
            });

            await PushNotifications.register();
          }
        }
      } catch (err) {
        console.warn('Capacitor native push note:', err.message);
      }
    };

    initCapacitor();
  }, [router]);

  // Re-bind FCM token to logged-in user (APK often registers before login → userId was null)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const resyncToken = async (e) => {
      try {
        const liveUser = e?.detail;
        const storedToken = localStorage.getItem('zorra_fcm_device_token') || '';
        if (liveUser && (liveUser.userId || liveUser.email)) {
          await registerWebAudience(liveUser);
        }
        if (storedToken && liveUser && (liveUser.userId || liveUser.email)) {
          await fetch('/api/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              token: storedToken,
              fcmToken: storedToken,
              email: liveUser.email,
              userId: liveUser.userId || liveUser.id || liveUser._id,
              username: liveUser.username,
              device: 'android',
            }),
          }).catch(() => {});
        }
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor?.isNativePlatform()) return;
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await PushNotifications.register();
      } catch {}
    };
    window.addEventListener('royal-user-sync', resyncToken);
    return () => window.removeEventListener('royal-user-sync', resyncToken);
  }, []);

  // 2. Browser Service Worker & Chrome Permission Setup
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    }

    // Auto-request Chrome permission if not decided
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const askPermission = () => {
          Notification.requestPermission()
            .then((perm) => {
              if (perm === 'granted') {
                triggerChromeDesktopNotification({
                  title: '👑 Royal Notifications Enabled!',
                  message: 'You will now receive instant alerts for deposits, cashouts, and VIP bonuses.',
                });
              }
            })
            .catch(() => {});
        };

        const timer = setTimeout(askPermission, 3000);
        window.addEventListener('click', askPermission, { once: true });
        return () => {
          clearTimeout(timer);
          window.removeEventListener('click', askPermission);
        };
      }
    }
  }, []);

  // 3. Poll for incoming broadcast notifications in real time without refresh
  useEffect(() => {
    let isCancelled = false;

    const checkIncomingNotifications = async () => {
      if (pathname && pathname.startsWith('/admin')) return;

      try {
        let storedEmail = (localStorage.getItem('zorra_user_email') || '').toLowerCase().trim();
        try {
          const raw = localStorage.getItem('zr_user_session');
          if (raw) {
            const u = JSON.parse(raw);
            if (u?.email) storedEmail = u.email.toLowerCase().trim();
          }
        } catch {}
        const params = new URLSearchParams();
        if (storedEmail) params.set('email', storedEmail);
        const notifUrl = params.toString() ? `/api/notifications?${params.toString()}` : '/api/notifications';
        const res = await fetch(notifUrl, { cache: 'no-store', credentials: 'include' });
        const data = await res.json();
        if (isCancelled || !data.success || !Array.isArray(data.notifications)) return;

        const notifs = data.notifications;
        if (notifs.length === 0) return;

        const newest = notifs[0];

        // On first run, record newest ID so we don't spam historical alerts
        if (isInitialRef.current) {
          lastSeenIdRef.current = newest.id;
          isInitialRef.current = false;
          return;
        }

        // If a new unread notification arrived with a different ID
        if (newest.id && newest.id !== lastSeenIdRef.current && !newest.read) {
          lastSeenIdRef.current = newest.id;
          dispatchAlert(newest);
        }
      } catch {}
    };

    checkIncomingNotifications();
    const interval = setInterval(checkIncomingNotifications, 4000);

    // Event listener for in-app custom triggers
    const handleCustomTrigger = (e) => {
      if (pathname && pathname.startsWith('/admin')) return;
      if (e.detail) dispatchAlert(e.detail);
    };

    window.addEventListener('zorra-show-notification', handleCustomTrigger);

    // Global developer / test shortcut
    if (typeof window !== 'undefined') {
      window.triggerZorraPush = (customTitle, customMessage) => {
        dispatchAlert({
          title: customTitle || '👑 VIP Royal Drop Credited!',
          message: customMessage || '10.00 SC + 100,000 GC royal bonus added to your vault. Enjoy the palace!',
          url: '/cashier',
        });
      };
    }

    return () => {
      isCancelled = true;
      clearInterval(interval);
      window.removeEventListener('zorra-show-notification', handleCustomTrigger);
    };
  }, [pathname]);

  // Dev / QA: trigger real FCM to this device (lock screen / heads-up) while logged in as player
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.sendZorraLockScreenTestPush = async (opts = {}) => {
      try {
        const res = await fetch('/api/notifications/test-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            typeof opts === 'object' && opts !== null
              ? opts
              : { message: String(opts) }
          ),
        });
        return await res.json();
      } catch (e) {
        return { success: false, error: e?.message || 'Request failed' };
      }
    };

    return () => {
      try {
        delete window.sendZorraLockScreenTestPush;
      } catch {
        window.sendZorraLockScreenTestPush = undefined;
      }
    };
  }, []);

  const isChatToast = activeToast?.type === 'chat' || activeToast?.action === 'chat';

  const handleOpenAction = () => {
    if (!activeToast) return;
    if (activeToast.type === 'chat' || activeToast.action === 'chat') {
      window.dispatchEvent(new CustomEvent('zorra-open-chat'));
    } else if (activeToast.url) {
      router.push(activeToast.url);
    }
    setActiveToast(null);
  };

  const getActionLabel = () => {
    if (!activeToast) return 'View';
    if (activeToast.type === 'chat' || activeToast.action === 'chat') return 'Open Chat';
    if (activeToast.url?.includes('deposit') || activeToast.url?.includes('cashier')) return 'View Deposit';
    if (activeToast.url?.includes('game')) return 'View Games';
    return 'View Details';
  };

  if ((!activeToast && !showAllowPrompt) || (pathname && pathname.startsWith('/admin'))) {
    return null;
  }

  return (
    <>
      {/* Floating Prompt Bar for Customer to Allow Notifications */}
      {showAllowPrompt && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-40 p-4 rounded-2xl bg-gradient-to-r from-[#121624] via-[#1a1f30] to-[#121624] border-2 border-[#ffd700] shadow-[0_10px_40px_rgba(0,0,0,0.95)] animate-slide-up">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#ffd700]/20 text-[#ffd700] shrink-0 border border-[#ffd700]/40">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white font-serif tracking-wide">
                  ENABLE PUSH NOTIFICATIONS
                </h4>
                <p className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                  Get instant push alerts for deposit approvals, Game ID credentials &amp; VIP drops!
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAllowNotifications}
                    className="btn-gold py-1.5 px-3.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-105 transition"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Allow Notifications</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllowPrompt(false)}
                    className="text-[11px] text-gray-400 hover:text-white px-2 py-1 font-semibold"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowAllowPrompt(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Active Toast Notification */}
      {activeToast && (
        <div
          role="alert"
          className="fixed top-4 right-4 z-[9999] max-w-sm w-full mx-auto p-4 rounded-2xl bg-[#090b10]/95 backdrop-blur-2xl border border-[#d4af37]/60 shadow-[0_12px_40px_rgba(212,175,55,0.35)] animate-in slide-in-from-top duration-300 overflow-hidden"
          style={{
            boxShadow: '0 0 25px rgba(212, 175, 55, 0.25), inset 0 0 15px rgba(212, 175, 55, 0.1)',
          }}
        >
      <div className="flex items-start gap-3">
        {/* Glowing Royal Icon */}
        <div className="relative shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37]/25 to-amber-600/20 border border-[#d4af37]/70 flex items-center justify-center text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.5)]">
          {isChatToast ? (
            <MessageSquare size={19} className="animate-pulse text-[#ffd700]" />
          ) : (
            <Crown size={20} className="animate-bounce text-[#d4af37]" />
          )}
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#d4af37]" />
        </div>

        {/* Message Text */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#d4af37] px-1.5 py-0.2 rounded bg-amber-950/60 border border-[#d4af37]/30">
              {isChatToast ? 'SUPPORT ALERT' : 'ROYAL ALERT'}
            </span>
            <span className="text-[10px] text-zinc-400">Just now</span>
          </div>

          <h4 className="text-xs font-heading font-black text-white truncate tracking-wide">
            {activeToast.title || '👑 VIP Royal Drop Credited!'}
          </h4>

          <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug line-clamp-2">
            {activeToast.message}
          </p>

          {/* Quick Action Button */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={handleOpenAction}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#d4af37] via-amber-400 to-[#b89728] text-black text-[11px] font-heading font-black hover:scale-102 active:scale-98 transition-all flex items-center gap-1 shadow-[0_0_12px_rgba(212,175,55,0.5)]"
            >
              <span>{getActionLabel()}</span>
              <ExternalLink size={11} strokeWidth={3} />
            </button>

            <button
              onClick={() => setActiveToast(null)}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setActiveToast(null)}
          className="shrink-0 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          title="Close alert"
        >
          <X size={15} />
        </button>
      </div>

      {/* Auto-Dismiss Gold Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/80">
        <div
          className="h-full bg-gradient-to-r from-[#d4af37] via-amber-300 to-[#d4af37] transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(212,175,55,0.7)]"
          style={{ width: `${toastProgress}%` }}
        />
      </div>
    </div>
  )}
</>
  );
}
