'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  onOpenReferral,
  onOpenSpinWheel,
  onLogout,
  onToggleSidebar,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tickerAmount, setTickerAmount] = useState(1842950.45);

  // Persistent Client-Side Cached User (Eliminates login/signup flicker on tab switches)
  const [cachedUser, setCachedUser] = useState(() => getCachedUser());

  useEffect(() => {
    if (user) {
      setCachedUser(user);
      saveCachedUser(user);
    }
  }, [user]);

  useEffect(() => {
    const handleSync = (e) => {
      setCachedUser(e.detail || null);
    };
    window.addEventListener('royal-user-sync', handleSync);
    return () => window.removeEventListener('royal-user-sync', handleSync);
  }, []);

  const activeUser = user || cachedUser;

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
    <header
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 0px)' }}
      className="sticky top-0 z-40 w-full border-b border-[rgba(212,175,55,0.2)] bg-[#07080b]/90 backdrop-blur-md"
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Logo (Hidden on desktop since Sidebar already displays logo) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-300 hover:text-[#d4af37] lg:hidden rounded-lg hover:bg-white/5 transition"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link href="/" className="flex items-center gap-2 group lg:hidden">
            <div className="relative w-8 h-8 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-[#d4af37] via-[#fff0a8] to-[#997b24] shadow-[0_0_12px_rgba(212,175,55,0.4)]">
              <Image
                src="/logo.png"
                alt="Zorra Royals Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-full bg-black"
                priority
              />
            </div>
            <span className="font-extrabold text-sm tracking-wider text-gold-gradient font-serif">
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
        <div className="flex items-center gap-2 sm:gap-3">
          {activeUser ? (
            <>
              {/* Single Dollar Balance ($ USD) */}
              <button
                onClick={() => onOpenCashier && onOpenCashier('deposit')}
                className="flex items-center gap-2 bg-[#0d0f17] border border-[#d4af37]/35 hover:border-[#ffd700] rounded-xl px-3 py-1.5 shadow-md transition group text-left"
                title={`Total Balance: $${(activeUser.balance || 0).toFixed(2)} USD • Available: $${((activeUser.availableBalance !== undefined ? activeUser.availableBalance : activeUser.balance) || 0).toFixed(2)}`}
              >
                <div className="p-1 rounded-md bg-[#d4af37]/15 text-[#ffd700]">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-gray-400 block font-bold leading-none">
                      {activeUser.frozenBalance > 0 ? 'Available' : 'Balance'}
                    </span>
                    {activeUser.frozenBalance > 0 && (
                      <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-1 rounded font-mono">
                        ❄️ ${activeUser.frozenBalance.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-black text-gold-gradient group-hover:brightness-110 leading-none">
                    ${((activeUser.availableBalance !== undefined ? activeUser.availableBalance : activeUser.balance) || 0).toFixed(2)}
                  </span>
                </div>
              </button>

              {/* Quick Deposit Button */}
              <button
                onClick={() => onOpenCashier && onOpenCashier('deposit')}
                className="btn-gold text-xs sm:text-sm px-3 sm:px-4 py-2 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Deposit</span>
              </button>

              {/* Freeplay $3 Signup Reward Quick Button if not claimed */}
              {!activeUser.signupBonusClaimed && !activeUser.freeplayClaimed && (
                <button
                  onClick={onOpenFreeplay}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400 text-amber-300 hover:brightness-125 transition flex items-center gap-1.5 text-xs font-black shadow-md cursor-pointer"
                  title="Claim $3 Signup Freeplay"
                >
                  <Gift className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span className="hidden md:inline">$3 Freeplay</span>
                </button>
              )}

              {/* Notifications Button */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-[#d4af37]/40 transition"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d4af37] ring-2 ring-black animate-ping" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d4af37]" />
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 border border-[#d4af37]/30 hover:border-[#d4af37] transition"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#131622] flex items-center justify-center text-xs font-black text-black">
                    {activeUser.username ? activeUser.username[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-bold text-gray-200 hidden md:inline max-w-[90px] truncate">
                    {activeUser.username}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f121b] border border-[#d4af37]/30 shadow-2xl py-2 z-50 animate-slide-up">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-xs font-bold text-white truncate">{activeUser.username}</p>
                      <p className="text-[10px] text-gray-400 truncate">{activeUser.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#ffd700] border border-[#d4af37]/40">
                          {activeUser.vipTier || 'VIP Tier'}
                        </span>
                        {activeUser.role && activeUser.role !== 'player' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            {activeUser.role}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/deposit"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-[#d4af37]/10 hover:text-[#ffd700] flex items-center gap-2 transition"
                      >
                        <Wallet className="w-4 h-4 text-[#d4af37]" /> Deposit Balance
                      </Link>
                      <Link
                        href="/cashout"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-[#d4af37]/10 hover:text-[#ffd700] flex items-center gap-2 transition"
                      >
                        <TrendingUp className="w-4 h-4 text-emerald-400" /> Cashout / Redeem
                      </Link>
                      <Link
                        href="/accounts"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-[#d4af37]/10 hover:text-[#ffd700] flex items-center gap-2 transition"
                      >
                        <Key className="w-4 h-4 text-purple-400" /> My Game Accounts
                      </Link>
                      <Link
                        href="/promotions"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-[#d4af37]/10 hover:text-[#ffd700] flex items-center gap-2 transition"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" /> VIP &amp; Promotions
                      </Link>
                      <button
                        onClick={() => { setDropdownOpen(false); onOpenKyc(); }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-200 hover:bg-[#d4af37]/10 hover:text-[#ffd700] flex items-center gap-2 transition"
                      >
                        <Shield className="w-4 h-4 text-blue-400" /> VIP Identity Verification
                      </button>
                      <button
                        onClick={() => { setDropdownOpen(false); onOpenReferral && onOpenReferral(); }}
                        className="w-full text-left px-4 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 font-bold transition border-t border-white/5"
                      >
                        <Gift className="w-4 h-4 text-emerald-400" /> Invite Friends & Earn Bonus
                      </button>

                      {activeUser.role && activeUser.role !== 'player' && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs text-amber-300 hover:bg-amber-500/20 flex items-center gap-2 font-bold border-t border-white/5 transition"
                        >
                          <Shield className="w-4 h-4 text-amber-400" /> Admin Command Portal
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-white/10">
                      <button
                        onClick={handleLogoutClick}
                        className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
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
  );
}
