'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Crown,
  Sparkles,
  Zap,
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

  // Dynamic system settings
  const [sysSettings, setSysSettings] = useState({
    welcomeBonusPercent: 100,
    welcomeBonusTitle: 'FIRST DEPOSIT DOUBLE PACKAGE',
    welcomeBonusSubtitle: 'Claim a royal match on your first deposit! Fast credits & prompt payouts.',
    regularBonusPercent: 20,
    regularBonusTitle: 'REGULAR RELOAD BONUS',
    regularBonusSubtitle: 'Enjoy bonus on every reload! Boost your palace treasury anytime.',
  });

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

  // Fetch dynamic settings
  const loadPromosAndSettings = async () => {
    try {
      fetch('/api/settings')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.settings) {
            setSysSettings(prev => ({
              ...prev,
              welcomeBonusPercent: Number(d.settings.welcomeBonusPercent ?? d.settings.welcomeBonusPercentage ?? 100),
              welcomeBonusTitle: d.settings.welcomeBonusTitle || prev.welcomeBonusTitle,
              welcomeBonusSubtitle: d.settings.welcomeBonusSubtitle || prev.welcomeBonusSubtitle,
              regularBonusPercent: Number(d.settings.regularBonusPercent ?? d.settings.regularBonusPercentage ?? 20),
              regularBonusTitle: d.settings.regularBonusTitle || prev.regularBonusTitle,
              regularBonusSubtitle: d.settings.regularBonusSubtitle || prev.regularBonusSubtitle,
              freeplayAmountSC: Number(d.settings.freeplayAmountSC ?? 5.0),
            }));
          }
        })
        .catch(() => {});
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    refreshUser();
    loadPromosAndSettings();
  }, []);

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
              Welcome and reload bonuses on deposits, plus depositor spin rewards. Use the header <strong className="text-[#ffd700]">Allow alerts</strong> button to turn on push notifications for approvals and updates.
            </p>
          </div>

          {/* Dynamic Core Bonus Packages */}
          <div className="space-y-4">
            <h2 className="font-serif font-black text-xl text-white tracking-wide flex items-center gap-2">
              <Crown size={18} className="text-[#ffd700]" />
              <span>Palace Membership Packages</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Dynamic First Deposit Match */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/60 to-slate-900 border border-purple-500/40 space-y-3 flex flex-col justify-between shadow-xl">
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500 text-white font-mono">
                    {sysSettings.welcomeBonusPercent}% MATCH BOOST
                  </span>
                  <h3 className="font-serif font-black text-lg text-white">
                    {sysSettings.welcomeBonusTitle}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {sysSettings.welcomeBonusSubtitle}
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
                  LOAD WALLET (+{sysSettings.welcomeBonusPercent}%)
                </button>
              </div>

              {/* Card 2: Regular Reload Bonus */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#10141e] to-slate-900 border border-[#d4af37]/40 space-y-3 flex flex-col justify-between shadow-xl">
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-[#ffd700] text-black font-mono font-bold">
                    +{sysSettings.regularBonusPercent}% EVERY RELOAD
                  </span>
                  <h3 className="font-serif font-black text-lg text-white">
                    {sysSettings.regularBonusTitle}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {sysSettings.regularBonusSubtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!user) setAuthModal({ open: true, tab: 'login' });
                    else setCashierModal({ open: true, tab: 'deposit' });
                  }}
                  className="mt-3 w-full py-2.5 px-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-black shadow-md transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Zap size={14} className="text-[#ffd700]" />
                  <span>RELOAD TREASURY (+{sysSettings.regularBonusPercent}%)</span>
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
