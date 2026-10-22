'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Gift,
  Users,
  Coins,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function ReferralModal({ isOpen, onClose, user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchStats();
    }
  }, [isOpen, user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/affiliates');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Error fetching referral stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const referralCode = stats?.referralCode || user?.referralCode || user?.username || 'ROYALVIP';
  const fullLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://zoraaroyal.com/?ref=${referralCode}`;

  const bonusPercent = stats?.referralBonusPercent ?? 50;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(fullLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto scrollbar-none rounded-2xl bg-[#0c0e16] border border-[#d4af37]/30 shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-5 sm:p-7 text-white animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#d4af37] via-[#ffd700] to-[#997b24] shadow-[0_0_20px_rgba(212,175,55,0.4)] mb-3">
            <Gift className="w-7 h-7 text-black stroke-[2.2]" />
          </div>
          <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
            👑 Active {bonusPercent}% First Deposit Bonus
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-gold-gradient tracking-wide">
            Invite Friends & Earn Rewards
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Invite your friends to Zorra Royals. When they make their first deposit, you instantly receive a <span className="text-[#ffd700] font-bold">{bonusPercent}% cash bonus</span> added directly to your wallet!
          </p>
        </div>

        {/* 3 Step Flow */}
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/5 mb-5 text-center">
          <div className="p-2">
            <div className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#ffd700] flex items-center justify-center text-xs font-black mx-auto mb-1 font-mono">
              1
            </div>
            <p className="text-[10px] font-bold text-gray-200">Share Code</p>
            <p className="text-[9px] text-gray-500">Send invite link</p>
          </div>
          <div className="p-2 border-x border-white/5">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black mx-auto mb-1 font-mono">
              2
            </div>
            <p className="text-[10px] font-bold text-gray-200">Friend Deposits</p>
            <p className="text-[9px] text-gray-500">First deposit approved</p>
          </div>
          <div className="p-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black mx-auto mb-1 font-mono">
              3
            </div>
            <p className="text-[10px] font-bold text-gray-200">Get {bonusPercent}% Added</p>
            <p className="text-[9px] text-gray-500">Instant wallet credit</p>
          </div>
        </div>

        {/* Share Link & Code Box */}
        <div className="space-y-3 mb-6">
          {/* Referral Code Box */}
          <div className="p-3.5 rounded-xl bg-[#121522] border border-[#d4af37]/25 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-0.5">
                Your Personal Referral Code
              </span>
              <span className="font-mono text-base font-black text-[#ffd700] tracking-widest">
                {referralCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#ffd700] border border-[#d4af37]/35 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shrink-0"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Referral Link Box */}
          <div className="p-3.5 rounded-xl bg-[#121522] border border-white/10 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-0.5">
                1-Click Direct Invite Link
              </span>
              <p className="font-mono text-xs text-gray-300 truncate">
                {fullLink}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className="btn-gold py-1.5 px-3.5 text-xs font-black flex items-center gap-1.5 shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Realtime Referral Stats */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#ffd700]" />
            <span>Your Referral Earnings</span>
          </h4>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-[#10141f] border border-white/5 text-center">
              <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-medium">Invited Friends</p>
              <p className="text-base font-black text-white font-mono mt-0.5">
                {loading ? '...' : (stats?.totalReferrals || 0)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#10141f] border border-white/5 text-center">
              <ShieldCheck className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-medium">Deposited</p>
              <p className="text-base font-black text-white font-mono mt-0.5">
                {loading ? '...' : (stats?.activeDepositors || 0)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#10141f] border border-emerald-500/20 text-center">
              <Coins className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 font-medium">Bonus Earned</p>
              <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                ${loading ? '...' : (stats?.commissionsEarned || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Referred Friends Activity */}
        <div>
          <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Referred Friends Activity</span>
            <span className="text-[10px] text-gray-500 font-mono">
              {stats?.referees?.length || 0} friends
            </span>
          </h4>

          {loading ? (
            <div className="py-6 text-center text-xs text-gray-500">Loading referral activity...</div>
          ) : stats?.referees && stats.referees.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-none">
              {stats.referees.map((friend, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#d4af37]/15 text-[#ffd700] flex items-center justify-center text-[10px] font-bold">
                      {friend.username ? friend.username[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <span className="font-bold text-gray-200">@{friend.username}</span>
                      <span className="text-[10px] text-gray-500 block">
                        {friend.joinedAt ? new Date(friend.joinedAt).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>

                  <div>
                    {friend.hasDeposited ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        Bonus Credited
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-medium">
                        <Clock className="w-3 h-3" />
                        Awaiting 1st Deposit
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-gray-400">
              No friends have joined yet. Share your link above to start earning {bonusPercent}% on every friend&apos;s first deposit!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
