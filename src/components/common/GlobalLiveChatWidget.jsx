'use client';

import React, { useState, useEffect } from 'react';
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

  // Do NOT render on Admin Portal or dedicated full-screen /chat page
  if (pathname && (pathname.startsWith('/admin') || pathname === '/chat')) {
    return null;
  }

  return (
    <>
      {/* Floating 24/7 VIP Concierge Chat Button on bottom-right */}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 p-3.5 rounded-full bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black shadow-[0_0_20px_rgba(212,175,55,0.6)] hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer group"
        title="24/7 VIP Concierge Support"
        aria-label="24/7 VIP Concierge Support"
      >
        <MessageSquare className="w-6 h-6 stroke-[2.5]" />
        <span className="sr-only">Live Chat Support</span>
      </button>

      {/* Global Live Chat Modal */}
      <LiveChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
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
