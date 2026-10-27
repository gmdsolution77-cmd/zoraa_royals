'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  HelpCircle,
  UserPlus,
  KeyRound,
  Wallet,
  Play,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import RoyalFooter from '@/components/common/RoyalFooter';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/userSession';

export default function HowToPlayPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => getCachedUser());
  const [settings, setSettings] = useState({ freeplayAmountSC: 5.0 });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && (d.authenticated || d.success) && d.user) {
          setUser(d.user);
          saveCachedUser(d.user);
        } else {
          clearCachedUser();
        }
      })
      .catch(() => {});

    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d?.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  const steps = [
    {
      num: '01',
      title: 'Create Your Free VIP Account',
      desc: `Sign up in under 30 seconds with just a username, email, and phone number. Instantly unlock access to all sweepstakes platforms and claim your $${Number(settings.freeplayAmountSC || 5).toFixed(0)} Freeplay welcome reward.`,
      icon: UserPlus,
    },
    {
      num: '02',
      title: 'Request Your Game Platform ID',
      desc: 'Browse our catalog of verified platforms including Ultra Panda, Fire Kirin, Orion Stars, and Game Vault. Tap "Get ID" to have our 24/7 VIP staff create your dedicated platform credentials.',
      icon: KeyRound,
    },
    {
      num: '03',
      title: 'Load Credits & Start Spinning',
      desc: 'Deposit instantly via Cash App, Zelle, Chime, or Crypto. Credits are loaded onto your game ID immediately so you can jump straight into the action on mobile APK or browser.',
      icon: Wallet,
    },
    {
      num: '04',
      title: 'Cash Out Your Winnings Fast',
      desc: 'Ready to redeem? Simply go to Cashier -> Redeem, specify your Cashtag or payout address, and receive your cashout within 5 to 15 minutes guaranteed.',
      icon: Play,
    },
  ];

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col font-sans">
      {/* 1. Global Collapsible Royal Sidebar */}
      <RoyalSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        user={null}
        onOpenCashier={(tab) => router.push(tab === 'withdraw' ? '/cashout' : '/deposit')}
        onOpenChat={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('open-live-chat'));
          }
        }}
      />

      {/* 2. Main Content Layout with dynamic left padding on desktop */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <RoyalNavbar
          user={user}
          onOpenAuth={() => router.push('/')}
          onOpenCashier={() => router.push('/deposit')}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Page Inner Container */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffd700]/15 border border-[#ffd700]/35 text-[#ffd700] text-xs font-bold uppercase tracking-wider">
              <HelpCircle size={14} />
              <span>VIP ONBOARDING MANUAL</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-serif text-white">
              HOW TO PLAY AT <span className="text-gold-gradient">ZORRA ROYALS</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
              Follow our 4 simple steps to start spinning, fish hunting, and redeeming real cash prizes today.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-[#0d0f17]/85 border border-[#d4af37]/25 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:border-[#ffd700]/60 transition-all shadow-lg group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ffd700] via-[#d4af37] to-[#b38f26] text-black flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.35)] group-hover:scale-105 transition-transform">
                    {s.num}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#ffd700]" />
                      <h3 className="font-serif font-bold text-base text-white">{s.title}</h3>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-r from-[#181408] via-[#0d0f17] to-[#1a1405] border border-[#d4af37]/40 text-center space-y-4 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffd700]/15 text-[#ffd700] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} />
              <span>GET STARTED IN SECONDS</span>
            </div>
            <h2 className="font-serif font-black text-2xl md:text-3xl text-white">READY TO JOIN THE VIP PALACE?</h2>
            <p className="text-xs md:text-sm text-gray-300 max-w-md mx-auto">
              Sign up today and get your ${Number(settings.freeplayAmountSC || 5).toFixed(0)} signup freeplay reward plus instant access to all verified sweepstakes game vaults.
            </p>
            <button
              onClick={() => router.push('/')}
              className="btn-gold py-3 px-8 text-xs font-black inline-flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              <span>GET STARTED NOW</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </main>

        <RoyalFooter />
      </div>

      <MobileBottomNav />
    </div>
  );
}
