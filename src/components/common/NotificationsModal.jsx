'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { getCachedUser } from '@/lib/userSession';
import { diffSet } from '@/lib/fastDiff';

export default function NotificationsModal({
  isOpen,
  onClose,
  user,
  onAllRead,
}) {
  const router = useRouter();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resolvedUser, setResolvedUser] = useState(user || null);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user || resolvedUser;
  }, [user, resolvedUser]);

  useEffect(() => {
    if (user) setResolvedUser(user);
  }, [user]);

  const ensureUser = useCallback(async () => {
    if (userRef.current) return userRef.current;
    const cached = getCachedUser();
    if (cached) {
      setResolvedUser(cached);
      return cached;
    }
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      const data = await res.json();
      if (data?.user) {
        setResolvedUser(data.user);
        return data.user;
      }
    } catch {}
    return null;
  }, []);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const activeUser = userRef.current || (await ensureUser());
      const email = activeUser?.email ? encodeURIComponent(activeUser.email.toLowerCase().trim()) : '';
      const url = email ? `/api/notifications?email=${email}` : '/api/notifications';
      const res = await fetch(url, { cache: 'no-store', credentials: 'include' });
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        diffSet(setNotifs, data.notifications);
      } else {
        setNotifs([]);
      }
    } catch {
      setNotifs([]);
    } finally {
      setLoading(false);
    }
  }, [ensureUser]);

  useEffect(() => {
    if (!isOpen) return;
    ensureUser().then(() => fetchNotifs());
  }, [isOpen, ensureUser, fetchNotifs]);

  const handleMarkAllRead = async () => {
    try {
      const activeUser = userRef.current || (await ensureUser());
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          markAll: true,
          email: activeUser?.email || '',
          userId: activeUser?.userId || activeUser?.id || activeUser?._id || '',
        }),
      });
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      if (onAllRead) onAllRead();
    } catch {}
  };

  const handleNotifClick = async (notif) => {
    if (!notif.read && notif.id) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ notificationId: notif.id }),
        });
        setNotifs((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
      } catch {}
    }
    if (notif.url && notif.url !== '/') {
      onClose?.();
      router.push(notif.url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-[#090b12] border border-[#d4af37]/35 shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-6 animate-slide-up z-[1000]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d4af37]/15 text-[#ffd700]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Notifications</h3>
              <p className="text-[10px] text-gray-400">Deposits, promos &amp; account updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="p-1.5 text-xs text-[#ffd700] hover:underline flex items-center gap-1 font-bold"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="text-[10px]">Read all</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-[#ffd700]/15 via-[#d4af37]/20 to-[#ffd700]/15 border border-[#ffd700]/40 shadow-lg text-center space-y-2">
            <p className="text-[11px] text-gray-300 leading-tight">
              Allow browser alerts for deposit approvals, game IDs, and VIP promos.
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  const perm = await Notification.requestPermission();
                  if (perm === 'granted') {
                    const u = userRef.current;
                    const email = u?.email || localStorage.getItem('zorra_user_email') || '';
                    await fetch('/api/notifications', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        email,
                        token: `chrome_web_${u?.id || u?._id || Date.now().toString(36)}`,
                        device: 'web_chrome',
                      }),
                    }).catch(() => {});
                    fetchNotifs();
                  }
                } catch {}
              }}
              className="w-full btn-gold py-2.5 px-4 text-xs font-black uppercase tracking-wider"
            >
              Allow notifications
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          {loading ? (
            <div className="py-12 text-center text-gray-500 text-xs">Loading notifications…</div>
          ) : notifs.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No notifications yet. You&apos;re up to date!
            </div>
          ) : (
            notifs.map((notif) => (
              <button
                key={notif.id}
                type="button"
                onClick={() => handleNotifClick(notif)}
                className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                  notif.read
                    ? 'bg-[#10131d] border-white/5 text-gray-300'
                    : 'bg-[#151928] border-[#d4af37]/30 text-white shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-xs text-[#ffd700]">{notif.title}</h4>
                  <span className="text-[9px] text-gray-500 font-mono">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">{notif.message}</p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
