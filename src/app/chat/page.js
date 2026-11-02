'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LiveChatModal from '@/components/support/LiveChatModal';
import { getCachedUser } from '@/lib/userSession';

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => getCachedUser());
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('openRoyalChat'));
      window.dispatchEvent(new CustomEvent('zorra-open-chat'));
      router.replace('/?chat=open');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#07080b] flex items-center justify-center p-4">
      <LiveChatModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          router.push('/');
        }}
        user={user}
      />
    </div>
  );
}
