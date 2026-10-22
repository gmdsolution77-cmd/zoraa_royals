'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, X, ExternalLink, Sparkles, Crown } from 'lucide-react';
import { playTune, unlockAudioContext } from '@/lib/soundAlerts';

export default function PushNotificationManager() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeToast, setActiveToast] = useState(null);
  const [toastProgress, setToastProgress] = useState(100);

  const lastSeenIdRef = useRef(null);
  const isInitialRef = useRef(true);

  // Trigger Chrome Native Notification
  const triggerChromeDesktopNotification = ({ title, message, url = '/' }) => {
    if (typeof window === 'undefined') return;

    const notifTitle = title || '👑 Zorra Royals VIP Alert';
    const notifBody = message || 'VIP reward credited to your account! Tap to claim.';

    // Web Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const desktopNotif = new window.Notification(notifTitle, {
          body: notifBody,
          icon: '/apple-touch-icon.png',
          badge: '/apple-touch-icon.png',
          tag: 'zorra-push-' + Date.now(),
          renotify: true,
          requireInteraction: false,
          silent: false,
        });

        desktopNotif.onclick = () => {
          window.focus();
          if (url && url !== '/') {
            router.push(url);
          }
          desktopNotif.close();
        };
      } catch (err) {
        console.warn('Native notification fallback:', err);
      }
    }

    // Try service worker background notification if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: notifTitle,
        body: notifBody,
        url,
      });
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
            await PushNotifications.addListener('registration', async (token) => {
              if (token?.value) {
                try {
                  const storedEmail = localStorage.getItem('zorra_user_email') || '';
                  await fetch('/api/notifications', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      token: token.value,
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
      if (document.hidden) return; // Save resources when tab inactive
      if (pathname && pathname.startsWith('/admin')) return; // Never show player alerts on admin console

      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' });
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

        // If a new notification arrived with a different ID
        if (newest.id && newest.id !== lastSeenIdRef.current) {
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

  if (!activeToast || (pathname && pathname.startsWith('/admin'))) return null;

  const handleOpenAction = () => {
    setActiveToast(null);
    if (activeToast?.url && activeToast.url !== '/') {
      router.push(activeToast.url);
    } else {
      window.dispatchEvent(new CustomEvent('zorra-open-notifications'));
    }
  };

  return (
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
          <Crown size={20} className="animate-bounce text-[#d4af37]" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#d4af37] animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#d4af37]" />
        </div>

        {/* Message Text */}
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#d4af37] px-1.5 py-0.2 rounded bg-amber-950/60 border border-[#d4af37]/30">
              ROYAL ALERT
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
              <span>CLAIM / VIEW</span>
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
  );
}
