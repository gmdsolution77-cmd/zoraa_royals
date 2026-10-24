'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Crown,
  Sparkles,
  Zap,
  Gift,
  ShieldCheck,
  Trophy,
  CheckCircle2,
  ArrowRight,
  Flame,
  Coins,
  AlertCircle
} from 'lucide-react';
import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import RoyalFooter from '@/components/common/RoyalFooter';
import LiveChatModal from '@/components/support/LiveChatModal';
import AuthModal from '@/components/common/AuthModal';
import CashierModal from '@/components/cashier/CashierModal';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/userSession';

export default function PromotionsPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => getCachedUser());
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' });
  const [cashierModal, setCashierModal] = useState({ open: false, tab: 'deposit' });
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [dailyClaiming, setDailyClaiming] = useState(false);
  const [promoMessage, setPromoMessage] = useState(null);
  const [promoError, setPromoError] = useState(null);

  // Fetch user session
  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        saveCachedUser(data.user);
      } else {
        setUser(null);
        clearCachedUser();
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Claim Daily Palace Bonus
  const handleClaimDailyBonus = async () => {
    if (!user) {
      setAuthModal({ open: true, tab: 'login' });
      return;
    }

    setDailyClaiming(true);
    setPromoMessage(null);
    setPromoError(null);

    try {
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'daily_bonus' }),
      });
      const data = await res.json();

      if (data.success) {
        setPromoMessage(data.message || `🎉 Claimed Day ${data.streak || 1} Daily Reward: +$${data.rewardUSD || '1.00'}!`);
        refreshUser();
      } else {
        setPromoError(data.error || 'Daily bonus already claimed for today.');
      }
    } catch {
      setPromoError('Error claiming daily palace reward.');
    } finally {
      setDailyClaiming(false);
    }
  };

  const tiers = [
    {
      name: 'Bronze Royal',
      badge: 'TIER 1',
      perks: [
        'Free $3.00 Welcome Package',
        'Daily Mystery Crate',
        '24/7 Concierge Support',
        'Standard Cashout Queue',
      ],
      scMin: '$0+',
      border: 'border-slate-700',
    },
    {
      name: 'Silver Knight',
      badge: 'TIER 2',
      perks: [
        '5% Weekly Loss Rebate',
        'Higher Daily Mystery Drops',
        'Priority Game ID Release',
        'Direct Cash App Desk',
      ],
      scMin: '$250+',
      border: 'border-amber-600/40',
    },
    {
      name: 'Gold Crown',
      badge: 'TIER 3',
      perks: [
        '10% Weekly Loss Rebate',
        'Personal VIP Host Access',
        'Expedited 3-Min Cashouts',
        'Monthly Level-up Gift',
      ],
      scMin: '$1,000+',
      border: 'border-[#ffd700]/50',
    },
    {
      name: 'Diamond Elite',
      badge: 'TIER 4',
      perks: [
        '15% Instant Rakeback',
        'No Cashout Limits',
        'Private Discord & Telegram Desk',
        'Custom Platform Bonus Codes',
      ],
      scMin: '$5,000+',
      border: 'border-purple-500/50',
    },
    {
      name: 'Palace Legend',
      badge: 'TIER 5',
      perks: [
        '25% Exclusive VIP Rakeback',
        'Dedicated 24/7 Account Executive',
        'Instant Unlimited Redemptions',
        'VIP Birthday & Holiday Trips',
      ],
      scMin: '$25,000+',
      border: 'border-rose-500/60',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col justify-between selection:bg-[#ffd700] selection:text-black font-sans">
      {/* 1. Global Royal Sidebar */}
      <RoyalSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        user={user}
        onOpenCashier={(tab) => setCashierModal({ open: true, tab: tab || 'deposit' })}
        onOpenChat={() => setChatOpen(true)}
      />

      {/* 2. Main Content Layout */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Navbar */}
        <RoyalNavbar
          user={user}
          onOpenAuth={(tab) => setAuthModal({ open: true, tab: tab || 'login' })}
          onOpenCashier={(tab) => setCashierModal({ open: true, tab: tab || 'deposit' })}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* 3. VIP Lounge Main */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10 pb-24 md:pb-12">
          {/* Header Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-heading font-bold">
              <Crown size={14} className="text-[#ffd700]" />
              <span>CROWN VIP CLUB &amp; REWARDS</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-serif text-white tracking-tight">
              ZORRA ROYALS <span className="text-[#ffd700]">VIP LOUNGE</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Every spin on Ultra Panda, Fire Kirin, Orion Stars, Game Vault, and our in-house games advances your VIP rank. Climb from Bronze Royal to Palace Legend!
            </p>
          </div>

          {/* Feedback alerts */}
          {promoMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>{promoMessage}</span>
            </div>
          )}

          {promoError && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg">
              <AlertCircle size={18} className="text-rose-400 shrink-0" />
              <span>{promoError}</span>
            </div>
          )}

          {/* Active Promotions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: 100% Match */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/40 space-y-3 flex flex-col justify-between shadow-xl">
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500 text-white font-mono">
                  100% MATCH
                </span>
                <h3 className="font-serif font-black text-lg text-white">
                  FIRST DEPOSIT DOUBLE PACKAGE
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Deposit $20 or more via Cash App, Zelle, Venmo, or Crypto and get 100% bonus match credits + 10,000 free Game Coins!
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!user) setAuthModal({ open: true, tab: 'login' });
                  else setCashierModal({ open: true, tab: 'deposit' });
                }}
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black text-xs font-black shadow-md hover:scale-102 transition text-center cursor-pointer"
              >
                LOAD WALLET
              </button>
            </div>

            {/* Card 2: Daily Mystery Crate */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-[#ffd700]/40 space-y-3 flex flex-col justify-between shadow-xl">
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-[#ffd700] text-black font-mono font-bold">
                  EVERY 24 HOURS
                </span>
                <h3 className="font-serif font-black text-lg text-white">
                  DAILY PALACE MYSTERY CRATE
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Log in each day and unlock the gift box in your header bar for up to $10.00 in free SC credits and 50,000 GC.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClaimDailyBonus}
                disabled={dailyClaiming}
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-black shadow-md transition text-center cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Coins size={14} className="text-[#ffd700]" />
                <span>{dailyClaiming ? 'Claiming...' : 'CLAIM DAILY REWARD'}</span>
              </button>
            </div>

            {/* Card 3: Depositor Lucky Spin Wheel */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/40 space-y-3 flex flex-col justify-between shadow-xl">
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-400 text-black font-mono font-bold">
                  DEPOSITOR EXCLUSIVE
                </span>
                <h3 className="font-serif font-black text-lg text-white">
                  LUCKY SPIN WHEEL
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Get 2 Free Spins on every approved deposit! Win real wallet cash directly credited with zero playthrough requirements.
                </p>
              </div>

              <Link
                href="/spin-wheel"
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-black shadow-md transition text-center flex items-center justify-center gap-1.5"
              >
                <Sparkles size={14} className="text-cyan-400" />
                <span>SPIN LUCKY WHEEL</span>
              </Link>
            </div>
          </div>

          {/* VIP Tiers */}
          <div className="space-y-5">
            <h2 className="font-serif font-black text-xl md:text-2xl text-white text-center tracking-wide">
              LOYALTY TIERS &amp; REBATES
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {tiers.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl bg-slate-900/80 border ${t.border} space-y-3 flex flex-col justify-between shadow-lg hover:border-[#ffd700]/70 transition`}
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{t.badge}</span>
                    <h4 className="font-serif font-bold text-sm text-white">{t.name}</h4>
                    <span className="text-xs font-mono font-bold text-emerald-400 block">{t.scMin}</span>
                    <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300">
                      {t.perks.map((p, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 size={12} className="text-[#ffd700] mt-0.5 shrink-0" />
                          <span className="leading-tight">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <RoyalFooter />
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBottomNav
        activeTab="promos"
        onSelectTab={(tab) => {
          if (tab === 'lobby') router.push('/');
          else if (tab === 'games') router.push('/games');
        }}
        onOpenCashier={(tab) => setCashierModal({ open: true, tab: tab || 'deposit' })}
      />

      {/* Floating Support Modal */}
      <LiveChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        user={user}
      />

      <AuthModal
        isOpen={authModal.open}
        initialTab={authModal.tab}
        onClose={() => setAuthModal({ open: false, tab: 'login' })}
        onAuthSuccess={refreshUser}
      />

      <CashierModal
        isOpen={cashierModal.open}
        initialTab={cashierModal.tab}
        onClose={() => setCashierModal({ open: false, tab: 'deposit' })}
        user={user}
        onBalanceChange={refreshUser}
      />
    </div>
  );
}
