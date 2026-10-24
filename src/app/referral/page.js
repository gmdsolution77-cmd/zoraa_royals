'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Copy,
  Check,
  DollarSign,
  Gift,
  Share2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Wallet,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import RoyalFooter from '@/components/common/RoyalFooter';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import AuthModal from '@/components/common/AuthModal';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/userSession';

export default function ReferralPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => getCachedUser());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' });

  const loadUserAndStats = async () => {
    try {
      const authRes = await fetch('/api/auth/me');
      const authData = await authRes.json();
      if (authData.authenticated && authData.user) {
        setUser(authData.user);
        saveCachedUser(authData.user);
        const refRes = await fetch('/api/affiliates');
        const refData = await refRes.json();
        if (refData.success && refData.stats) {
          setStats(refData.stats);
        }
      } else {
        setUser(null);
        clearCachedUser();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserAndStats();
  }, []);

  const referralCode = stats?.referralCode || user?.referralCode || user?.username || 'ROYALVIP';
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://zoraaroyal.com/?ref=${referralCode}`;

  const copyToClipboard = (text, isCode = false) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      if (isCode) {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    }
  };

  const handleClaimCommission = async () => {
    if (!user) {
      setAuthModal({ open: true, tab: 'login' });
      return;
    }
    setClaiming(true);
    setClaimSuccess('');
    try {
      const res = await fetch('/api/affiliates/claim', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setClaimSuccess(`Successfully transferred $${Number(data.claimedAmount || 0).toFixed(2)} to your wallet!`);
        loadUserAndStats();
      } else {
        alert(data.error || 'Failed to claim commissions.');
      }
    } catch {
      alert('Network error claiming commissions.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col font-sans">
      {/* 1. Global Collapsible Royal Sidebar */}
      <RoyalSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        user={user}
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
          onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
          onOpenCashier={() => router.push('/deposit')}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
          {/* Header Banner */}
          <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-[#181408] via-[#0d0f17] to-[#1a1405] border border-[#d4af37]/35 shadow-2xl overflow-hidden">
            <div className="relative z-10 space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffd700]/15 border border-[#ffd700]/35 text-[#ffd700] text-xs font-bold uppercase tracking-wider">
                <Gift size={14} />
                <span>ZORRA ROYALS VIP AFFILIATE PROGRAM</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black font-serif text-white tracking-tight">
                INVITE FRIENDS &amp; <span className="text-gold-gradient">EARN DAILY</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Earn up to <strong className="text-[#ffd700]">{stats?.commissionRate ?? 20}% lifetime bonus</strong> on every single deposit made by players you introduce to the VIP palace. Uncapped daily cash payouts.
              </p>
            </div>
          </div>

          {claimSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm flex items-center gap-3 font-bold shadow-lg animate-fade-in">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <span>{claimSuccess}</span>
            </div>
          )}

          {!user ? (
            <div className="p-8 rounded-3xl bg-[#0d0f17]/85 border border-[#d4af37]/25 text-center space-y-4 shadow-xl">
              <Users size={40} className="text-[#ffd700] mx-auto animate-bounce" />
              <h2 className="font-serif font-black text-xl text-white">Sign In To Access Your Referral Links</h2>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Join our VIP affiliate partner program to track impressions, conversions, and withdraw your commission directly to your wallet.
              </p>
              <button
                onClick={() => setAuthModal({ open: true, tab: 'login' })}
                className="btn-gold py-2.5 px-6 text-xs font-black shadow-[0_0_15px_rgba(212,175,55,0.4)]"
              >
                Sign In or Register
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Link and Code Sharing Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Referral Link Box */}
                <div className="p-5 rounded-2xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-2.5 shadow-lg">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <Share2 size={15} className="text-[#ffd700]" />
                    Your Referral Invite Link
                  </span>
                  <div className="flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-white/5">
                    <span className="font-mono text-xs text-gray-300 truncate px-2 flex-1">
                      {referralLink}
                    </span>
                    <button
                      onClick={() => copyToClipboard(referralLink, false)}
                      className="btn-gold px-3 py-1.5 text-xs font-black flex items-center gap-1.5 shrink-0"
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Referral Code Box */}
                <div className="p-5 rounded-2xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                      <Gift size={15} className="text-[#ffd700]" />
                      Your Referral Code
                    </span>
                    <span className="text-[10px] text-[#ffd700] font-mono font-bold bg-[#ffd700]/15 px-2 py-0.5 rounded-md border border-[#ffd700]/30">
                      {stats?.commissionRate ?? 20}% BONUS
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-white/5">
                    <span className="font-mono font-black text-sm text-[#ffd700] px-3 tracking-widest flex-1">
                      {referralCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(referralCode, true)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition border border-slate-700 shrink-0"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Commission Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#0d0f17]/90 border border-[#d4af37]/25 flex flex-col justify-between shadow-lg">
                  <span className="text-[11px] text-gray-400 font-medium">Total Players Referred</span>
                  <div className="font-serif font-black text-2xl text-white mt-2">
                    {stats?.totalReferrals ?? 0}
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono mt-1">Lifetime Signups</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0d0f17]/90 border border-[#d4af37]/25 flex flex-col justify-between shadow-lg">
                  <span className="text-[11px] text-gray-400 font-medium">Active Depositors</span>
                  <div className="font-serif font-black text-2xl text-emerald-400 mt-2">
                    {stats?.activeDepositors ?? 0}
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono mt-1">Generating Comm.</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0d0f17]/90 border border-[#d4af37]/25 flex flex-col justify-between shadow-lg">
                  <span className="text-[11px] text-gray-400 font-medium">Total Comm. Earned</span>
                  <div className="font-serif font-black text-2xl text-[#ffd700] mt-2">
                    ${Number(stats?.commissionsEarned || 0).toFixed(2)}
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono mt-1">All-time Earnings</span>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-[#0d0f17] to-black border border-emerald-500/40 flex flex-col justify-between shadow-lg">
                  <span className="text-[11px] text-emerald-300 font-bold">Unclaimed Balance</span>
                  <div className="font-serif font-black text-2xl text-emerald-400 mt-2">
                    ${Number(stats?.commissionsUnpaid || 0).toFixed(2)}
                  </div>
                  <button
                    onClick={handleClaimCommission}
                    disabled={claiming || Number(stats?.commissionsUnpaid || 0) <= 0}
                    className="mt-2 w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black text-[11px] font-black transition active:scale-95 shadow-md"
                  >
                    {claiming ? 'Claiming...' : 'Claim to Wallet'}
                  </button>
                </div>
              </div>

              {/* Referees Table */}
              <div className="p-5 rounded-2xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-4 shadow-xl">
                <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                  <Users size={16} className="text-[#ffd700]" />
                  <span>Recent Referred Players</span>
                </h3>

                {(!stats?.referees || stats.referees.length === 0) ? (
                  <div className="text-center py-8 text-gray-500 text-xs">
                    No players referred yet. Share your referral link above to start earning!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-400 font-mono text-[10px] uppercase">
                          <th className="py-2 px-3">Player</th>
                          <th className="py-2 px-3">Joined Date</th>
                          <th className="py-2 px-3">Deposit Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        {stats.referees.map((r, i) => (
                          <tr key={i} className="hover:bg-white/5 transition">
                            <td className="py-2.5 px-3 text-white font-bold">{r.username}</td>
                            <td className="py-2.5 px-3 text-gray-400">
                              {r.joinedAt ? new Date(r.joinedAt).toLocaleDateString() : 'Recent'}
                            </td>
                            <td className="py-2.5 px-3">
                              {r.hasDeposited ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                                  ACTIVE DEPOSITOR
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-gray-400">
                                  Signed Up
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <RoyalFooter />
      </div>

      <MobileBottomNav />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.open}
        initialTab={authModal.tab}
        onClose={() => setAuthModal({ open: false, tab: 'login' })}
        onSuccess={(u) => {
          setUser(u);
          setAuthModal({ open: false, tab: 'login' });
          loadUserAndStats();
        }}
      />
    </div>
  );
}
