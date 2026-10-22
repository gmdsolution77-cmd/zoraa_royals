'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Lock, Award, HeartHandshake } from 'lucide-react';

export default function RoyalFooter() {
  return (
    <footer className="border-t border-[#d4af37]/20 bg-[#06070a] text-gray-400 text-xs py-12 px-4 sm:px-6 mb-16 md:mb-0">
      <div className="max-w-[1600px] mx-auto space-y-10">
        {/* Top Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-[#0d0f17] border border-[#d4af37]/15">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#ffd700]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Provably Fair</p>
              <p className="text-[11px] text-gray-500">Certified RNG Systems</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">256-Bit SSL</p>
              <p className="text-[11px] text-gray-500">Encrypted Banking</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Instant Redemptions</p>
              <p className="text-[11px] text-gray-500">Cash App & Zelle 24/7</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">21+ Adults Only</p>
              <p className="text-[11px] text-gray-500">Responsible Gaming</p>
            </div>
          </div>
        </div>

        {/* Middle Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded-full" />
              <span className="font-serif font-black text-white text-sm tracking-wider">ZORRA ROYALS</span>
            </div>
            <p className="text-[11px] leading-relaxed text-gray-400">
              The premier social sweepstakes gaming palace. Play cutting-edge slots, crash games, table classics, and external platform favorites with 100% compliant redemption.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Royal Gaming</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link href="/" className="hover:text-[#ffd700] transition">All Games Lobby</Link></li>
              <li><Link href="/download-app" className="hover:text-[#ffd700] transition">Mobile App (APK & iOS)</Link></li>
              <li><Link href="/rules" className="hover:text-[#ffd700] transition">Sweepstakes Rules</Link></li>
              <li><Link href="/how-to-play" className="hover:text-[#ffd700] transition">How to Play & Redeem</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Legal & Security</h4>
            <ul className="space-y-2 text-[11px]">
              <li><Link href="/terms" className="hover:text-[#ffd700] transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-[#ffd700] transition">Privacy Policy</Link></li>
              <li><Link href="/responsible-gaming" className="hover:text-[#ffd700] transition">Responsible Play</Link></li>
              <li><Link href="/contact" className="hover:text-[#ffd700] transition">VIP Concierge Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Supported Cashier</h4>
            <p className="text-[11px] text-gray-400 mb-2">
              Instant deposit verification and fast payouts via verified gateways:
            </p>
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">Cash App</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">Zelle Pay</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">Venmo</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">USDT TRC-20</span>
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">Bitcoin BTC</span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="pt-6 border-t border-white/5 text-center text-[10px] text-gray-400 space-y-2">
          <p>
            NO PURCHASE NECESSARY to enter Sweepstakes. Sweepstakes entries are void where prohibited by law. Available to legal residents of eligible jurisdictions who are 21 years of age or older.
          </p>
          <p className="text-gray-400 font-mono">
            &copy; {new Date().getFullYear()} ZORRA ROYALS VIP. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
