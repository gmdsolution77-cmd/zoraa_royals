'use client';

import React from 'react';
import Link from 'next/link';
import { Wallet, Key, Gift, Download, ArrowUpRight } from 'lucide-react';

export default function QuickActionCards({
  onOpenCashier,
  onOpenVault,
  onOpenFreeplay,
}) {
  const cards = [
    {
      title: 'Deposit & Match Bonus',
      subtitle: 'Instant Cash App, Zelle & Crypto',
      badge: 'MATCH BONUS',
      icon: Wallet,
      iconColor: 'text-[#ffd700]',
      iconBg: 'bg-[#d4af37]/20 border border-[#ffd700]/40',
      gradient: 'from-[#221a08] via-[#13151f] to-[#090b12]',
      border: 'border-[#d4af37]/35 hover:border-[#ffd700]',
      glow: 'hover:shadow-[0_10px_35px_rgba(212,175,55,0.3)]',
      badgeClass: 'bg-[#d4af37]/20 text-[#ffd700] border-[#d4af37]/40',
      tab: 'deposit',
    },
    {
      title: 'Redeem & Cashout',
      subtitle: 'Fast Payouts within 1-2 Hours',
      badge: 'FAST CASHOUT',
      icon: ArrowUpRight,
      iconColor: 'text-emerald-300',
      iconBg: 'bg-emerald-500/20 border border-emerald-400/40',
      gradient: 'from-[#0a1e14] via-[#13151f] to-[#090b12]',
      border: 'border-emerald-500/35 hover:border-emerald-400',
      glow: 'hover:shadow-[0_10px_35px_rgba(16,185,129,0.3)]',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      tab: 'withdraw',
    },
    {
      title: 'Load Game Credits',
      subtitle: 'Orion, Kirin, Juwa & Milky Way',
      badge: 'TRANSFER CREDITS',
      icon: Key,
      iconColor: 'text-purple-300',
      iconBg: 'bg-purple-500/20 border border-purple-400/40',
      gradient: 'from-[#1e0f2d] via-[#13151f] to-[#090b12]',
      border: 'border-purple-500/35 hover:border-purple-400',
      glow: 'hover:shadow-[0_10px_35px_rgba(168,85,247,0.3)]',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
      tab: 'load',
    },
    {
      title: 'Transaction History',
      subtitle: 'Audit Logs & Rejection Status',
      badge: 'LIVE LEDGER',
      icon: Gift,
      iconColor: 'text-cyan-300',
      iconBg: 'bg-cyan-500/20 border border-cyan-400/40',
      gradient: 'from-[#081e28] via-[#13151f] to-[#090b12]',
      border: 'border-cyan-500/35 hover:border-cyan-400',
      glow: 'hover:shadow-[0_10px_35px_rgba(6,182,212,0.3)]',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
      tab: 'history',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            onClick={() => onOpenCashier && onOpenCashier(c.tab)}
            className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br ${c.gradient} border ${c.border} ${c.glow} transition-all duration-300 cursor-pointer shadow-xl group flex flex-col justify-between min-h-[118px] relative overflow-hidden`}
          >
            <div className="flex items-center justify-between z-10">
              <div className={`p-2.5 rounded-xl ${c.iconBg} ${c.iconColor} group-hover:scale-110 transition-transform shadow-md`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${c.badgeClass}`}>
                {c.badge}
              </span>
            </div>

            <div className="mt-3.5 z-10">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-white group-hover:text-[#ffd700] transition-colors">
                  {c.title}
                </h4>
                <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-[#ffd700] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{c.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
