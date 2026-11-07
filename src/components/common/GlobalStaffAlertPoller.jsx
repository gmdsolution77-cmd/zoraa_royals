'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { playTune, unlockAudioContext } from '@/lib/soundAlerts';

const STAFF_ROLES = new Set([
  'super_admin',
  'admin',
  'operation_admin',
  'financial_manager',
  'coin_manager',
  'chat_support',
]);

function isStaffRole(role) {
  return Boolean(role && STAFF_ROLES.has(role));
}

/**
 * Plays admin desk chimes on any page when logged in as staff (admin tab not required).
 */
export default function GlobalStaffAlertPoller() {
  const pathname = usePathname();
  const [staffUser, setStaffUser] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      try {
        unlockAudioContext();
      } catch {}
    };
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  const prevCountsRef = useRef({
    deposits: 0,
    redemptions: 0,
    requests: 0,
    coinCashouts: 0,
    chat: 0,
  });
  const isInitialRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    const refreshStaffSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        const u = data?.user;
        if ((data.authenticated || data.success) && u && isStaffRole(u.role)) {
          setStaffUser(u);
        } else {
          setStaffUser(null);
          isInitialRef.current = true;
        }
      } catch {
        if (!cancelled) {
          setStaffUser(null);
          isInitialRef.current = true;
        }
      }
    };

    refreshStaffSession();

    const onUserSync = (e) => {
      const u = e?.detail;
      if (u && isStaffRole(u.role)) setStaffUser(u);
      else if (!u) {
        setStaffUser(null);
        isInitialRef.current = true;
      } else refreshStaffSession();
    };

    window.addEventListener('royal-user-sync', onUserSync);
    window.addEventListener('focus', refreshStaffSession);
    return () => {
      cancelled = true;
      window.removeEventListener('royal-user-sync', onUserSync);
      window.removeEventListener('focus', refreshStaffSession);
    };
  }, []);

  useEffect(() => {
    if (!staffUser) return;
    // Admin console has its own poller + toast UI
    if (pathname?.startsWith('/admin')) return;

    const playStaffChime = () => {
      if (typeof window === 'undefined') return;
      if (localStorage.getItem('zorra_admin_alert_enabled') === 'false') return;
      const tune = localStorage.getItem('zorra_admin_alert_tune') || 'chaching';
      const vol = parseFloat(localStorage.getItem('zorra_admin_alert_volume') || '0.7', 10);
      try {
        unlockAudioContext();
        playTune(tune, Number.isFinite(vol) ? vol : 0.7);
      } catch {}
    };

    const desktopPing = (title, body, url) => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      try {
        const n = new Notification(title, { body, icon: '/apple-touch-icon.png' });
        n.onclick = () => {
          window.focus();
          if (url) window.location.href = url;
        };
      } catch {}
    };

    const pollPendingWork = async () => {
      try {
        const fetches = [
          fetch('/api/payments/deposit?status=all', { cache: 'no-store', credentials: 'include' }),
          fetch('/api/payments/withdraw?status=all', { cache: 'no-store', credentials: 'include' }),
          fetch('/api/account-requests?status=all', { cache: 'no-store', credentials: 'include' }),
          fetch('/api/chat?inbox=true', { cache: 'no-store', credentials: 'include' }),
        ];

        const [depRes, withRes, reqRes, chatRes] = await Promise.all(fetches);
        const [depData, withData, reqData, chatData] = await Promise.all([
          depRes.json().catch(() => ({})),
          withRes.json().catch(() => ({})),
          reqRes.json().catch(() => ({})),
          chatRes.json().catch(() => ({})),
        ]);

        const pendingDeps = (depData.deposits || []).filter((d) => d.status === 'pending');
        const pendingWith = (withData.redemptions || []).filter((r) => r.status === 'pending');
        const pendingReqs = (reqData.accountRequests || []).filter(
          (r) => (r.status || '').toUpperCase() === 'PENDING'
        );
        const pendingCoinCashouts = (withData.redemptions || []).filter(
          (r) => r.status === 'pending_coin' || r.stage === 'coin_verification'
        );
        const unreadChatTotal = (chatData.conversations || [])
          .filter((c) => Boolean(c.unreadStaff || (c.unreadCount && c.unreadCount > 0)))
          .reduce((acc, c) => acc + (c.unreadCount || 1), 0);

        if (isInitialRef.current) {
          prevCountsRef.current = {
            deposits: pendingDeps.length,
            redemptions: pendingWith.length,
            requests: pendingReqs.length,
            coinCashouts: pendingCoinCashouts.length,
            chat: unreadChatTotal,
          };
          isInitialRef.current = false;
          return;
        }

        const prev = prevCountsRef.current;

        if (unreadChatTotal > (prev.chat || 0)) {
          playStaffChime();
          desktopPing('💬 New Live Chat Message', 'A patron needs assistance', '/admin?tab=chat');
        } else if (pendingDeps.length > (prev.deposits || 0)) {
          const newest = pendingDeps[0];
          playStaffChime();
          desktopPing(
            '💰 New Deposit Request',
            `$${Number(newest?.amount || 0).toFixed(2)} from ${newest?.username || 'Player'}`,
            '/admin?tab=finance'
          );
        } else if (pendingWith.length > (prev.redemptions || 0)) {
          const newest = pendingWith[0];
          playStaffChime();
          desktopPing(
            '💸 New Cashout Request',
            `$${Number(newest?.amount || 0).toFixed(2)} for ${newest?.username || 'Player'}`,
            '/admin?tab=finance'
          );
        } else if (pendingCoinCashouts.length > (prev.coinCashouts || 0)) {
          playStaffChime();
          desktopPing('🎮 Cashout verification needed', 'Coins desk review', '/admin?tab=coins_allotment');
        } else if (pendingReqs.length > (prev.requests || 0)) {
          playStaffChime();
          desktopPing('🎮 New game account request', 'Credentials desk', '/admin?tab=account_requests');
        }

        prevCountsRef.current = {
          deposits: pendingDeps.length,
          redemptions: pendingWith.length,
          requests: pendingReqs.length,
          coinCashouts: pendingCoinCashouts.length,
          chat: unreadChatTotal,
        };
      } catch {}
    };

    pollPendingWork();
    const interval = setInterval(pollPendingWork, 3500);
    return () => clearInterval(interval);
  }, [staffUser, pathname]);

  return null;
}
