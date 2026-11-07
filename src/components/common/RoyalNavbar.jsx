'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Coins,
  Wallet,
  Gift,
  Bell,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Download,
  Key,
  History
} from 'lucide-react';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/userSession';
import { diffSet } from '@/lib/fastDiff';
import NotificationsModal from '@/components/common/NotificationsModal';

export default function RoyalNavbar({
  user,
  currency,
  setCurrency,
  onOpenAuth,
  onOpenCashier,
  onOpenFreeplay,
  onOpenGameVault,
  onOpenNotifications,
  onOpenKyc,
  onOpenSpinWheel,
  onLogout,
  onToggleSidebar,
}) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileMenuCoords, setProfileMenuCoords] = useState(null);
  const profileBtnRef = useRef(null);
  const profileMenuRef = useRef(null);
  const [tickerAmount, setTickerAmount] = useState(1842950.45);
  const [bonusSettings, setBonusSettings] = useState({ freeplayAmountSC: 3.0, freeplayActive: true });
  const [liveBalance, setLiveBalance] = useState(null);
  const [balancePulse, setBalancePulse] = useState(false);
  const lastBalanceRef = useRef(null);

  const updateProfileMenuCoords = useCallback(() => {
    if (!profileBtnRef.current || typeof window === 'undefined') return;
    const rect = profileBtnRef.current.getBoundingClientRect();
    setProfileMenuCoords({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }, []);

  const toggleProfileMenu = () => {
    if (!dropdownOpen) {
      updateProfileMenuCoords();
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
  };

  // Close profile menu on outside click; reposition on scroll/resize
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e) => {
      if (profileBtnRef.current?.contains(e.target)) return;
      if (profileMenuRef.current?.contains(e.target)) return;
      setDropdownOpen(false);
    };

    const handleReposition = () => updateProfileMenuCoords();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [dropdownOpen, updateProfileMenuCoords]);

  // Persistent Client-Side Cached User (Eliminates login/signup flicker on tab switches)
  const [cachedUser, setCachedUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [showPushPromptButton, setShowPushPromptButton] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      setShowPushPromptButton(true);
    }
  }, []);

  const handleEnablePushNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        window.dispatchEvent(new CustomEvent('royal-push-enabled'));
        setShowPushPromptButton(false);
      }
    } catch {}
  };

  useEffect(() => {
    setMounted(true);
    const cached = getCachedUser();
    if (cached) setCachedUser(cached);
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.settings) diffSet(setBonusSettings, d.settings);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      diffSet(setCachedUser, user);
      saveCachedUser(user);
      const bal = Number(user.balance ?? user.balanceSC ?? 0);
      setLiveBalance(bal);
      lastBalanceRef.current = bal;
    }
  }, [user]);

  useEffect(() => {
    const handleSync = (e) => {
      diffSet(setCachedUser, e.detail || null);
    };
    window.addEventListener('royal-user-sync', handleSync);
    return () => window.removeEventListener('royal-user-sync', handleSync);
  }, []);

  const activeUser = mounted ? (user || cachedUser) : null;
  const displayBalance = liveBalance ?? Number(activeUser?.balance ?? activeUser?.balanceSC ?? 0);

  useEffect(() => {
    if (!activeUser) return;
    let cancelled = false;

    const syncBalance = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
        const data = await res.json();
        if (cancelled || !data?.user) return;
        const bal = Number(data.user.balance ?? data.user.balanceSC ?? 0);
        if (lastBalanceRef.current !== null && bal !== lastBalanceRef.current) {
          setBalancePulse(true);
          setTimeout(() => setBalancePulse(false), 1200);
        }
        lastBalanceRef.current = bal;
        setLiveBalance(bal);
      } catch {}
    };

    syncBalance();
    const interval = setInterval(syncBalance, 10000);
    const onRefresh = () => syncBalance();
    window.addEventListener('focus', onRefresh);
    window.addEventListener('royal-user-sync', onRefresh);
    window.addEventListener('royal-balance-updated', onRefresh);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onRefresh);
      window.removeEventListener('royal-user-sync', onRefresh);
      window.removeEventListener('royal-balance-updated', onRefresh);
    };
  }, [activeUser?.userId, activeUser?.email, activeUser?.id]);

  const handleFreeplayClick = () => {
    if (onOpenFreeplay) {
      onOpenFreeplay();
      return;
    }
    router.push('/?freeplay=1');
  };

  const showFreeplayButton =
    bonusSettings?.freeplayActive !== false &&
    activeUser &&
    !activeUser.signupBonusClaimed &&
    !activeUser.freeplayClaimed;

  const freeplayLabel = Number(bonusSettings?.freeplayAmountSC ?? bonusSettings?.signupBonusAmount ?? 3);

  const handleLogoutClick = () => {
    setDropdownOpen(false);
    setCachedUser(null);
    clearCachedUser();
    if (onLogout) {
      onLogout();
    } else {
      fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
        window.location.href = '/';
      });
    }
  };

  // Progressive jackpot ticker micro-increment
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerAmount(prev => +(prev + 0.12).toFixed(2));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
    <header
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)' }}
      className="sticky top-0 z-[120] w-full border-b border-[rgba(212,175,55,0.2)] bg-[#07080b]/90 backdrop-blur-md overflow-visible"
    >
      <div className="w-full px-2.5 sm:px-6 lg:px-8 min-h-16 sm:min-h-20 py-1 flex items-center justify-between gap-1 sm:gap-2 overflow-visible">
        {/* Left: Mobile Toggle & Logo (Hidden on desktop since Sidebar already displays logo) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-1 sm:p-2 text-gray-300 hover:text-[#d4af37] lg:hidden rounded-lg hover:bg-white/5 transition cursor-pointer shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <Link href="/" className="flex items-center gap-1 sm:gap-2 group lg:hidden shrink-0">
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-[#d4af37] via-[#fff0a8] to-[#997b24] shadow-[0_0_12px_rgba(212,175,55,0.4)] shrink-0">
              <Image
                src="/logo.png"
                alt="Zorra Royals Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-full bg-black"
                priority
              />
            </div>
            <span className="font-extrabold text-[11px] sm:text-sm tracking-wider text-gold-gradient font-serif whitespace-nowrap">
              ZORRA ROYALS
            </span>
          </Link>
        </div>

        {/* Center: Live Progressive Jackpot Counter (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#131622] via-[#1a1f30] to-[#131622] border border-[#d4af37]/30 shadow-inner">
          <Sparkles className="w-4 h-4 text-[#ffd700] animate-pulse" />
          <span className="text-sm font-black text-gold-gradient font-mono">
            ${tickerAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </span>
        </div>

        {/* Right: Actions, Currency, Balance & User Menu */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 min-w-0 overflow-visible">
          {activeUser ? (
            <>
              {/* Balance first so it stays visible when header scrolls horizontally */}
              <button
                type="button"
                onClick={() => onOpenCashier && onOpenCashier('deposit')}
                className={`order-first inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border transition-all shrink-0 ${
                  balancePulse
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-[0_0_14px_rgba(16,185,129,0.45)] scale-[1.02]'
                    : 'border-emerald-500/35 bg-[#0e1218]/90 hover:border-emerald-400/60'
                }`}
                title="Wallet balance — tap to deposit"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0 sm:hidden" />
                <span className="text-[9px] font-black px-1 py-0.5 rounded bg-emerald-500 text-black uppercase hidden sm:inline">
                  Bal
                </span>
                <span className="font-mono font-bold text-[11px] sm:text-xs text-emerald-300 tabular-nums whitespace-nowrap">
                  ${displayBalance.toFixed(2)}
                </span>
              </button>

              {showPushPromptButton && (
                  <button
                    type="button"
                    onClick={handleEnablePushNotifications}
                    className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-[10px] font-black uppercase tracking-wide hover:bg-emerald-500/25 transition shrink-0"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    Allow alerts
                  </button>
                )}

              {/* Quick Deposit */}
              <button
                onClick={() => onOpenCashier && onOpenCashier('deposit')}
                className="header-deposit-btn inline-flex btn-gold text-[11px] sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 font-bold items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Deposit</span>
              </button>

              {showFreeplayButton && (
                <button
                  type="button"
                  onClick={handleFreeplayClick}
                  className="inline-flex px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/80 text-amber-300 hover:brightness-125 transition items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-black shadow-md cursor-pointer shrink-0"
                  title={`Claim $${freeplayLabel.toFixed(0)} signup freeplay`}
                >
                  <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-bounce shrink-0" />
                  <span className="whitespace-nowrap">${freeplayLabel.toFixed(0)} Freeplay</span>
                </button>
              )}

              {/* Notifications Button */}
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setNotifsOpen(true);
                  if (typeof onOpenNotifications === 'function') onOpenNotifications();
                }}
                className="relative p-1.5 sm:p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-[#d4af37]/40 transition shrink-0 cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full bg-[#d4af37] ring-2 ring-black animate-ping" />
                <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 rounded-full bg-[#d4af37]" />
              </button>

              {/* User profile — menu rendered in portal so it is not clipped by header scroll */}
              <div className="relative shrink-0 z-[130]">
                <button
                  ref={profileBtnRef}
                  type="button"
                  onClick={toggleProfileMenu}
                  className="flex items-center gap-1 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 border border-[#d4af37]/30 hover:border-[#d4af37] transition cursor-pointer"
                  aria-label="User Profile Menu"
                  aria-expanded={dropdownOpen}
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#131622] flex items-center justify-center text-xs font-black text-black shrink-0">
                    {activeUser.username ? activeUser.username[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-bold text-gray-200 hidden md:inline max-w-[90px] truncate">
                    {activeUser.username}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="btn-surface text-xs sm:text-sm px-3.5 py-2 font-bold"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="btn-gold text-xs sm:text-sm px-4 py-2 font-extrabold flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Join VIP</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    <NotificationsModal
      isOpen={notifsOpen}
      onClose={() => setNotifsOpen(false)}
      user={activeUser}
    />

    {dropdownOpen &&
      profileMenuCoords &&
      typeof document !== 'undefined' &&
      createPortal(
        <div
          ref={profileMenuRef}
          role="menu"
          className="fixed w-52 max-w-[calc(100vw-16px)] rounded-2xl bg-[#0f121b] border border-[#d4af37]/30 shadow-[0_20px_50px_rgba(0,0,0,0.85)] py-2 z-[10100] animate-slide-up"
          style={{
            top: profileMenuCoords.top,
            right: profileMenuCoords.right,
          }}
        >
          <div className="px-4 py-2.5 border-b border-white/10">
            <p className="text-xs font-bold text-white truncate">{activeUser?.username}</p>
            <p className="text-[10px] text-gray-400 truncate">{activeUser?.email}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#ffd700] border border-[#d4af37]/40">
                {activeUser?.vipTier || 'VIP Tier'}
              </span>
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/promotions"
              onClick={() => setDropdownOpen(false)}
              className="w-full text-left px-4 py-2.5 text-xs text-gray-200 hover:bg-[#d4af37]/10 hover:text-[#ffd700] flex items-center gap-2.5 transition font-semibold"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> VIP &amp; Promotions
            </Link>
          </div>

          <div className="pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={handleLogoutClick}
              className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2.5 transition cursor-pointer font-bold"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
