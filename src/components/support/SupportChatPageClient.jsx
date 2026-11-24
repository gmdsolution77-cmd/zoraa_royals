'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LiveChatModal from '@/components/support/LiveChatModal';
import AuthModal from '@/components/common/AuthModal';
import { getCachedUser, saveCachedUser } from '@/lib/userSession';
import { registerSupportChatGlobals } from '@/lib/supportChatFlow';
import { ArrowLeft } from 'lucide-react';

export default function SupportChatPageClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    registerSupportChatGlobals();
    setUser(getCachedUser());
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if ((d.success || d.authenticated) && d.user) {
          setUser(d.user);
          saveCachedUser(d.user, { broadcast: false });
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  return (
    <div className="h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden bg-[#07080b] text-white">
      <header
        className="sticky top-0 z-50 shrink-0 flex items-center gap-3 px-4 py-3 border-b border-[#d4af37]/25 bg-[#0a0c12]/98 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.55)]"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}
      >
        <button
          type="button"
          onClick={() => router.push('/')}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#ffd700] hover:bg-white/10 transition"
          aria-label="Back to lobby"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-black font-serif tracking-wide text-white truncate">
            24/7 VIP LIVE SUPPORT
          </h1>
          <p className="text-[10px] text-emerald-400 font-semibold truncate">
            Your request was sent to our concierge — staff will reply here.
          </p>
        </div>
        <Link href="/" className="text-[10px] font-bold text-gray-400 hover:text-[#ffd700] uppercase tracking-wider">
          Lobby
        </Link>
      </header>

      <main className="flex-1 min-h-0 relative flex flex-col">
        {ready && (
          <LiveChatModal
            isOpen
            fullScreen
            embedded
            autoSendPending
            user={user}
            onOpenAuth={() => setAuthOpen(true)}
            onClose={() => router.push('/')}
          />
        )}
      </main>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab="login"
        onLoginSuccess={(u) => {
          setUser(u);
          saveCachedUser(u);
          setAuthOpen(false);
        }}
      />
    </div>
  );
}