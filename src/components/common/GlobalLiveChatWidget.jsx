'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import LiveChatModal from '@/components/support/LiveChatModal';
import AuthModal from '@/components/common/AuthModal';

export default function GlobalLiveChatWidget() {
  const pathname = usePathname();
  const [chatOpen, setChatOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  // Sync user state on mount and window focus
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

    const handleOpenChat = () => setChatOpen(true);
    const handleUserUpdate = () => fetchUser();

    window.addEventListener('openRoyalChat', handleOpenChat);
    window.addEventListener('royalUserUpdated', handleUserUpdate);
    window.addEventListener('focus', fetchUser);

    return () => {
      isMounted = false;
      window.removeEventListener('openRoyalChat', handleOpenChat);
      window.removeEventListener('royalUserUpdated', handleUserUpdate);
      window.removeEventListener('focus', fetchUser);
    };
  }, []);

  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0);
  const isInitialChatCheck = useRef(true);

  // Mark all player messages as read on the server
  const markMessagesAsRead = async () => {
    try {
      setUnreadCount(0);
      prevUnreadRef.current = 0;
      await fetch('/api/chat?markRead=true', { cache: 'no-store' });
    } catch {}
  };

  // Poll for unread messages sent to the player
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      prevUnreadRef.current = 0;
      return;
    }

    const checkUnread = async () => {
      try {
        // If chat is open, automatically mark messages as read on server
        if (chatOpen) {
          await markMessagesAsRead();
          return;
        }

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

          // New staff reply arrived!
          if (count > prevUnreadRef.current) {
            const newest = unreadStaffMsgs[unreadStaffMsgs.length - 1];

            // 1. Play chime audio bell
            try {
              const { playTune, unlockAudioContext } = await import('@/lib/soundAlerts');
              unlockAudioContext();
              playTune('message', 0.85);
            } catch {}

            // 2. Browser Desktop Notification
            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                try {
                  const desktopNotif = new window.Notification('💬 VIP Concierge Support', {
                    body: newest?.text || 'VIP Support Desk has replied to your inquiry.',
                    icon: '/apple-touch-icon.png',
                    tag: 'zorra-chat-' + Date.now(),
                  });
                  desktopNotif.onclick = () => {
                    window.focus();
                    setChatOpen(true);
                    markMessagesAsRead();
                    desktopNotif.close();
                  };
                } catch {}
              } else if (Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
              }
            }

            // 3. Top-right toast banner popup
            if (typeof window !== 'undefined') {
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
          }

          prevUnreadRef.current = count;
          setUnreadCount(count);
        }
      } catch {}
    };

    checkUnread();
    const interval = setInterval(checkUnread, 4000);
    return () => clearInterval(interval);
  }, [user, chatOpen]);

  // Do NOT render on Admin Portal or dedicated full-screen /chat page
  if (pathname && (pathname.startsWith('/admin') || pathname === '/chat')) {
    return null;
  }

  const handleOpenClick = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setChatOpen(true);
    markMessagesAsRead();
  };

  return (
    <>
      {/* Floating 24/7 VIP Concierge Chat Button on bottom-right */}
      <button
        type="button"
        onClick={handleOpenClick}
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 p-3.5 rounded-full bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black shadow-[0_0_25px_rgba(212,175,55,0.7)] hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer group"
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

      {/* Global Live Chat Modal */}
      <LiveChatModal
        isOpen={chatOpen}
        onClose={() => {
          setChatOpen(false);
          markMessagesAsRead();
        }}
        user={user}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Auth Modal for unauthenticated visitors attempting to chat */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab="login"
        onLoginSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setAuthModalOpen(false);
          setChatOpen(true);
        }}
      />
    </>
  );
}
