'use client';

import React from 'react';
import Image from 'next/image';
import { Crown, Gift, Key, Sparkles, Zap, ShieldCheck, Star } from 'lucide-react';

export default function HeroBannerCard({ currentSlide, welcomePct, regularPct, hasDeposited }) {
  if (currentSlide === 1) {
    // Slide 1: $3 Complimentary Freeplay Card
    return (
      <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden border-2 border-emerald-500/40 bg-gradient-to-br from-[#0a1813] via-[#08120e] to-[#040907] shadow-[0_15px_50px_rgba(16,185,129,0.35)] p-5 flex flex-col justify-between group transition-all duration-500">
        {/* Glow ambient */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#ffd700]/15 blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 shadow-sm">
              <Gift className="w-4 h-4 animate-bounce" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300">
              Freeplay Pass
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-black/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase">
            1-Time Claim
          </span>
        </div>

        {/* Center: Holographic VIP Voucher Ticket */}
        <div className="relative z-10 my-auto py-2">
          <div className="relative rounded-2xl bg-gradient-to-r from-[#12251e] via-[#1a382c] to-[#12251e] border border-emerald-400/50 p-4 shadow-xl text-center overflow-hidden">
            {/* Shimmer light bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300 font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Complimentary Starting Credits</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>

            <div className="text-4xl sm:text-5xl font-black font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-[#ffd700] to-emerald-200 drop-shadow-[0_2px_12px_rgba(212,175,55,0.5)] my-1">
              $3.00 USD
            </div>

            <p className="text-[11px] text-gray-300 font-medium">
              Zero Deposit Required • Instant Wallet Credit
            </p>

            {/* Stamp Badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-200 text-[10px] font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Sweepstakes Freeplay</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-emerald-500/20 text-[11px]">
          <span className="text-gray-400 font-medium">All 11 Platforms Eligible</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Instant Delivery
          </span>
        </div>
      </div>
    );
  }

  if (currentSlide === 2) {
    // Slide 2: 10+ Sweepstakes Platforms Showcase Card
    return (
      <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden border-2 border-purple-500/40 bg-gradient-to-br from-[#120a1f] via-[#0d0718] to-[#080410] shadow-[0_15px_50px_rgba(168,85,247,0.35)] p-5 flex flex-col justify-between group transition-all duration-500">
        {/* Glow ambient */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-purple-500/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-[#ffd700]/15 blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow-sm">
              <Key className="w-4 h-4 animate-pulse" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-purple-300">
              Sweepstakes Hub
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-black/60 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold tracking-wider uppercase">
            11 Networks
          </span>
        </div>

        {/* Center: Overlapping Platform Badges Showcase */}
        <div className="relative z-10 my-auto py-1 space-y-2">
          {/* Row of platform chips */}
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="p-2.5 rounded-xl bg-black/50 border border-purple-400/30 flex items-center gap-2 hover:border-[#ffd700]/60 transition">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-black text-[10px]">
                OS
              </div>
              <div className="truncate">
                <span className="text-[11px] font-black text-white block leading-tight">Orion Stars</span>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">● Online</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/50 border border-purple-400/30 flex items-center gap-2 hover:border-[#ffd700]/60 transition">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-600 to-red-500 flex items-center justify-center text-white font-black text-[10px]">
                FK
              </div>
              <div className="truncate">
                <span className="text-[11px] font-black text-white block leading-tight">Fire Kirin</span>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">● Online</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/50 border border-purple-400/30 flex items-center gap-2 hover:border-[#ffd700]/60 transition">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-[10px]">
                GV
              </div>
              <div className="truncate">
                <span className="text-[11px] font-black text-white block leading-tight">Game Vault</span>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">● Online</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-black/50 border border-purple-400/30 flex items-center gap-2 hover:border-[#ffd700]/60 transition">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-yellow-500 flex items-center justify-center text-black font-black text-[10px]">
                JW
              </div>
              <div className="truncate">
                <span className="text-[11px] font-black text-white block leading-tight">Juwa 777</span>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">● Online</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-1">
            <span className="text-[10px] text-gray-400 font-medium">
              + Ultra Panda, Golden Dragon, Panda Master & Milky Way
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-purple-500/20 text-[11px]">
          <span className="text-gray-400 font-medium">Auto-reveal Game Passwords</span>
          <span className="text-purple-300 font-bold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> 24/7 Loading
          </span>
        </div>
      </div>
    );
  }

  // Slide 0: Default High-Roller Welcome 3D Crown Showcase Card
  return (
    <div className="relative w-full max-w-md aspect-[4/3] rounded-3xl overflow-hidden border-2 border-[#ffd700]/50 bg-gradient-to-br from-[#161206] via-[#0d0b04] to-[#080702] shadow-[0_20px_55px_rgba(212,175,55,0.45)] p-5 flex flex-col justify-between group transition-all duration-500">
      {/* Background ambient gold lights */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#ffd700]/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#d4af37]/20 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#ffd700_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

      {/* Top Header Row */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-[#ffd700]/20 border border-[#ffd700]/40 text-[#ffd700] shadow-sm">
            <Crown className="w-4 h-4" />
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-[#ffd700]">
            {hasDeposited ? 'VIP Reload Club' : 'Zorra Royals VIP'}
          </span>
        </div>
        <span className="px-3 py-1 rounded-full bg-black/70 border border-[#ffd700]/50 text-[#ffd700] text-[10px] font-mono font-black tracking-wider uppercase shadow-md">
          {hasDeposited ? `+${regularPct}% RELOAD` : `+${welcomePct}% MATCH`}
        </span>
      </div>

      {/* Center: 3D Bevelled Crown Emblem with Floating Chips */}
      <div className="relative z-10 my-auto flex items-center justify-center py-1">
        {/* Glowing aura around emblem */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] opacity-30 blur-xl group-hover:opacity-60 transition duration-700 animate-pulse" />

          {/* User's High-Resolution 3D Emblem */}
          <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full p-1 bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] shadow-[0_0_30px_rgba(212,175,55,0.7)] group-hover:scale-105 transition-transform duration-500">
            <div className="w-full h-full rounded-full overflow-hidden relative bg-black">
              <Image
                src="/image.png"
                alt="Zorra Royals Crown Emblem"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          {/* Floating Pill Chip 1: Left */}
          <div className="absolute -left-6 top-4 bg-[#0a0c14]/90 backdrop-blur-md border border-[#ffd700]/60 rounded-xl px-2.5 py-1 shadow-lg transform -rotate-6 group-hover:rotate-0 transition duration-300">
            <div className="flex items-center gap-1.5">
              <Star className="w-3 h-3 text-[#ffd700] fill-[#ffd700]" />
              <span className="text-[10px] font-black text-gold-gradient uppercase tracking-wider">
                VIP Palace
              </span>
            </div>
          </div>

          {/* Floating Pill Chip 2: Right */}
          <div className="absolute -right-6 bottom-4 bg-[#0a0c14]/90 backdrop-blur-md border border-emerald-400/60 rounded-xl px-2.5 py-1 shadow-lg transform rotate-6 group-hover:rotate-0 transition duration-300">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider font-mono">
                1-Click Load
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-[#ffd700]/20 text-[11px]">
        <div className="flex items-center gap-1.5 text-gray-300 font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#ffd700]" />
          <span>Official Sweepstakes Partner</span>
        </div>
        <span className="text-gold-gradient font-black font-mono">
          $ USD WALLET
        </span>
      </div>
    </div>
  );
}
