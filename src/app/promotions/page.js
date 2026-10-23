'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Gift,
  Flame,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Tag,
  Coins,
  Clock,
  Send
} from 'lucide-react';
import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import RoyalFooter from '@/components/common/RoyalFooter';
import LiveChatModal from '@/components/support/LiveChatModal';
import AuthModal from '@/components/common/AuthModal';
import CashierModal from '@/components/cashier/CashierModal';

export default function PromotionsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' });
  const [cashierModal, setCashierModal] = useState({ open: false, tab: 'deposit' });
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Promo Code State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [redeemingCode, setRedeemingCode] = useState(false);
  const [dailyClaiming, setDailyClaiming] = useState(false);
  const [promoMessage, setPromoMessage] = useState(null);
  const [promoError, setPromoError] = useState(null);

  // 1. Fetch user session
  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Redeem Promo Code
  const handleRedeemCode = async (e) => {
    e.preventDefault();
    if (!user) {
      setAuthModal({ open: true, tab: 'login' });
      return;
    }
    if (!promoCodeInput.trim()) return;

    setRedeemingCode(true);
    setPromoMessage(null);
    setPromoError(null);

    try {
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCodeInput.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setPromoMessage(data.message || '🎉 Promo code successfully claimed!');
        setPromoCodeInput('');
        refreshUser();
      } else {
        setPromoError(data.error || 'Invalid or expired promo code.');
      }
    } catch {
      setPromoError('Network error while claiming promo code.');
    } finally {
      setRedeemingCode(false);
    }
  };

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
        setPromoMessage(data.message || `🎉 Claimed Day ${data.streak} Daily Reward: +$${data.rewardUSD}!`);
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

  // Claim $3 Instant Signup Freeplay
  const [freeplayClaiming, setFreeplayClaiming] = useState(false);
  const handleClaimFreeplay = async () => {
    if (!user) {
      setAuthModal({ open: true, tab: 'register' });
      return;
    }

    setFreeplayClaiming(true);
    setPromoMessage(null);
    setPromoError(null);

    try {
      const res = await fetch('/api/freeplay', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setPromoMessage(data.message || '🎉 Successfully claimed $3.00 Instant Freeplay Bonus!');
        refreshUser();
      } else {
        setPromoError(data.error || 'Freeplay bonus already claimed.');
      }
    } catch {
      setPromoError('Error claiming signup freeplay.');
    } finally {
      setFreeplayClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col justify-between selection:bg-[#ffd700] selection:text-black font-sans">
      {/* 1. Global Collapsible Royal Sidebar */}
      <RoyalSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        user={user}
        onOpenCashier={(tab) => setCashierModal({ open: true, tab: tab || 'deposit' })}
        onOpenChat={() => setChatOpen(true)}
      />

      {/* 2. Main Content Layout with dynamic left padding on desktop */}
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

        {/* 3. Main Promo Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full pb-24 md:pb-12">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ffd700] hover:text-[#fff0a8] transition"
            >
              <ArrowLeft size={14} />
              <span>Back to Casino Lobby</span>
            </Link>
          </div>

          {/* Alert Messages */}
          {promoMessage && (
            <div className="p-4 mb-6 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>{promoMessage}</span>
            </div>
          )}

          {promoError && (
            <div className="p-4 mb-6 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg">
              <AlertCircle size={18} className="text-rose-400 shrink-0" />
              <span>{promoError}</span>
            </div>
          )}

          {/* Facebook Official VIP Promo Drop Highlight */}
          <div className="rounded-3xl p-6 sm:p-8 mb-8 bg-gradient-to-r from-[#1877F2]/90 via-[#0D47A1] to-[#07080b] border border-[#1877F2]/40 shadow-[0_20px_50px_rgba(24,119,242,0.3)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-black uppercase tracking-wider mb-2.5">
                <span>OFFICIAL FACEBOOK &amp; TELEGRAM PROMO HUB</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white m-0 font-serif leading-tight">
                Daily Freeplay Drops &amp; Exclusive Tournament Rewards
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-2 m-0 leading-relaxed">
                Follow our official social channels and join the VIP royal palace circle. We drop exclusive <strong>$5 - $50 Instant Freeplay codes</strong> every 6 hours and host high-roller weekly cash giveaways!
              </p>
            </div>

            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-full bg-white text-[#1877F2] font-black text-xs sm:text-sm flex items-center gap-2 shadow-2xl hover:scale-105 transition whitespace-nowrap"
            >
              <span>JOIN OFFICIAL GROUP</span>
              <ExternalLink size={15} />
            </a>
          </div>

          {/* Interactive Promo Code Box */}
          <div className="p-6 rounded-3xl bg-[#10141e] border border-[rgba(212,175,55,0.35)] shadow-xl mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Tag size={22} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white m-0 font-serif">
                    Redeem Palace Promo Code
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 m-0">
                    Enter your VIP voucher or event coupon code to credit dollars directly to your wallet.
                  </p>
                </div>
              </div>

              <form onSubmit={handleRedeemCode} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="e.g. ROYALVIP, BONUS100"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-[#07080b] border border-white/10 text-white text-xs font-mono placeholder-gray-500 uppercase focus:outline-none focus:border-[#ffd700] transition"
                />
                <button
                  type="submit"
                  disabled={redeemingCode || !promoCodeInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black text-xs font-black shadow-md hover:scale-105 transition disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {redeemingCode ? 'Redeeming...' : 'Apply Code'}
                </button>
              </form>
            </div>
          </div>

          {/* Active Promotions Grid */}
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-white mb-5 font-serif flex items-center gap-2">
              <Sparkles size={20} className="text-[#ffd700]" />
              <span>Active Palace Promotions &amp; Privileges</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Promo 1: Welcome Pack */}
              <div className="p-6 rounded-3xl bg-[#10141e] border border-[rgba(212,175,55,0.3)] flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center gap-2 text-[#ffd700] text-xs font-black uppercase tracking-wider mb-2">
                    <Gift size={16} />
                    <span>NEW SIGNUP PRIVILEGE</span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 font-serif">
                    $3.00 Instant Freeplay Bonus
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed mb-4">
                    Create your royal account today and claim 3 Freeplay Dollars with zero deposit required. Keep what you win!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!user) setAuthModal({ open: true, tab: 'register' });
                    else handleClaimFreeplay();
                  }}
                  disabled={freeplayClaiming}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black text-xs font-black shadow-md hover:scale-102 transition text-center disabled:opacity-50 cursor-pointer"
                >
                  {user ? (freeplayClaiming ? 'Claiming...' : (user.signupBonusClaimed ? 'FREEPLAY CLAIMED ✓' : 'CLAIM $3 FREEPLAY')) : 'REGISTER & CLAIM'}
                </button>
              </div>

              {/* Promo 2: 300% Welcome Match */}
              <div className="p-6 rounded-3xl bg-[#10141e] border border-amber-500/30 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
                    <Flame size={16} />
                    <span>FIRST PURCHASE BOOST</span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 font-serif">
                    300% Bonus Up to $7,500
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed mb-4">
                    Deposit using Cash App, Zelle, Venmo, or Crypto to get 300% extra game dollars credited immediately upon deposit approval.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!user) setAuthModal({ open: true, tab: 'login' });
                    else setCashierModal({ open: true, tab: 'deposit' });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-[#ffd700] to-yellow-200 text-black text-xs font-black shadow-md hover:scale-102 transition text-center"
                >
                  LOAD WALLET
                </button>
              </div>

              {/* Promo 3: Daily Palace Streak Rewards */}
              <div className="p-6 rounded-3xl bg-[#10141e] border border-purple-500/30 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-wider mb-2">
                    <Coins size={16} />
                    <span>DAILY PALACE STREAK</span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2 font-serif">
                    Up to $5.00 Daily Reward
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed mb-4">
                    Log in every 24 hours to claim increasing daily loyalty coins. Maintain your 7-day streak to unlock maximum rewards!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleClaimDailyBonus}
                  disabled={dailyClaiming}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-black shadow-md hover:bg-purple-500/30 transition text-center flex items-center justify-center gap-2"
                >
                  <Coins size={14} className="text-purple-400" />
                  <span>{dailyClaiming ? 'Claiming...' : 'Claim Daily Reward'}</span>
                </button>
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

      {/* Modals */}
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
