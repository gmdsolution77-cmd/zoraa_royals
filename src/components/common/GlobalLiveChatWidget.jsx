'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { openSupportChat } from '@/lib/supportChatFlow';
import { MessageSquare } from 'lucide-react';

export default function GlobalLiveChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          if (isMounted) setUser(null);
          return;
        }
        const data = await res.json();
        if (isMounted) {
          if ((data.authenticated || data.success) && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (isMounted) setUser(null);
      }
    };

    fetchUser();

    const handleUserUpdate = () => fetchUser();

    window.addEventListener('royalUserUpdated', handleUserUpdate);
    window.addEventListener('focus', fetchUser);

    return () => {
      isMounted = false;
      window.removeEventListener('royalUserUpdated', handleUserUpdate);
      window.removeEventListener('focus', fetchUser);
    };
  }, [pathname]);

  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0);
  const isInitialChatCheck = useRef(true);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      prevUnreadRef.current = 0;
      return;
    }

    const checkUnread = async () => {
      try {
        if (pathname === '/chat') return;

        const res = await fetch('/api/chat', { cache: 'no-store' });
        const d = await res.json();
        if (d.success && Array.isArray(d.messages)) {
          const unreadStaffMsgs = d.messages.filter(
            (m) => m.read === false && (m.sender === 'support' || m.senderRole === 'staff')
          );
          const count = unreadStaffMsgs.length;

          if (isInitialChatCheck.current) {
            isInitialChatCheck.current = false;
            prevUnreadRef.current = count;
            setUnreadCount(count);
            return;
          }

          if (count > prevUnreadRef.current) {
            const newest = unreadStaffMsgs[unreadStaffMsgs.length - 1];
            try {
              const { playTune, unlockAudioContext } = await import('@/lib/soundAlerts');
              unlockAudioContext();
              playTune('message', 0.85);
            } catch {}

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                const desktopNotif = new window.Notification('💬 VIP Concierge Support', {
                  body: newest?.text || 'VIP Support Desk has replied to your inquiry.',
                  icon: '/apple-touch-icon.png',
                  tag: 'zorra-chat-' + Date.now(),
                });
                desktopNotif.onclick = () => {
                  window.focus();
                  router.push('/chat');
                  desktopNotif.close();
                };
              } catch {}
            }

            window.dispatchEvent(
              new CustomEvent('zorra-show-notification', {
                detail: {
                  type: 'chat',
                  action: 'chat',
                  title: '💬 VIP Concierge Reply',
                  message: newest?.text || 'Support Desk has sent you an inquiry reply.',
                  actionText: 'Open Chat',
                },
              })
            );
          }

          prevUnreadRef.current = count;
          setUnreadCount(count);
        }
      } catch {}
    };

    checkUnread();
    const interval = setInterval(checkUnread, 4000);
    return () => clearInterval(interval);
  }, [user, pathname, router]);

  if (pathname && (pathname.startsWith('/admin') || pathname === '/chat')) {
    return null;
  }

  const handleOpenClick = () => {
    openSupportChat({ action: 'support', user, router });
  };

  return (
    <button
      type="button"
      onClick={handleOpenClick}
      className="fixed right-4 sm:right-6 z-[55] p-3.5 rounded-full bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black shadow-[0_0_25px_rgba(212,175,55,0.7)] hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer group bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6"
      title="24/7 VIP Concierge Support"
      aria-label="24/7 VIP Concierge Support"
    >
      <MessageSquare className="w-6 h-6 stroke-[2.5]" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center shadow-lg border-2 border-black animate-bounce">
          {unreadCount}
        </span>
      )}
      <span className="sr-only">Live Chat Support</span>
    </button>
  );
}