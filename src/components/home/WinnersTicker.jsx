'use client';

import React from 'react';
import { Flame } from 'lucide-react';

export default function WinnersTicker() {
  const wins = [
    { player: 'Marcus_VIP', game: 'Orion Stars VIP', amount: '$450.00 USD', time: '2m ago' },
    { player: 'KingRoyal77', game: 'Game Vault 999', amount: '$1,280.00 USD', time: '4m ago' },
    { player: 'Elena_TX', game: 'Ultra Panda Golden', amount: '$620.00 USD', time: '7m ago' },
    { player: 'Shadow_99', game: 'Fire Kirin Ultimate', amount: '$810.00 USD', time: '9m ago' },
    { player: 'VipAce_88', game: 'Golden Dragon VIP', amount: '$500.00 USD', time: '11m ago' },
    { player: 'GoldenDragonX', game: 'Juwa 777 Palace', amount: '$940.00 USD', time: '14m ago' },
    { player: 'DiamondPlayer', game: 'Milky Way Galaxy', amount: '$1,150.00 USD', time: '18m ago' },
    { player: 'Apex_Winner', game: 'Panda Master VIP', amount: '$730.00 USD', time: '21m ago' },
  ];

  // Duplicate list to achieve seamless infinite looping marquee
  const marqueeItems = [...wins, ...wins];

  return (
    <div className="w-full bg-[#0b0e18] border-b border-[#d4af37]/30 py-2.5 px-3 sm:px-6 relative overflow-hidden shadow-md z-10 shrink-0">
      <div className="flex items-center gap-3 w-full">
        {/* Left Live Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500/25 via-amber-500/20 to-yellow-500/15 border border-[#ffd700]/50 shadow-[0_0_15px_rgba(255,215,0,0.25)] shrink-0 z-20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <Flame className="w-3.5 h-3.5 text-[#ffd700] fill-[#ffd700] shrink-0" />
          <span className="text-white font-serif font-black text-[11px] sm:text-xs tracking-wider uppercase whitespace-nowrap">
            Live Payouts
          </span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-white/10 shrink-0 z-20" />

        {/* Marquee Ticker Track */}
        <div className="flex-1 overflow-hidden relative">
          {/* Subtle gradient fades on edges */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0b0e18] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0b0e18] to-transparent z-10" />

          {/* Scrolling strip */}
          <div className="animate-marquee-smooth flex items-center gap-4 text-xs select-none">
            {marqueeItems.map((w, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 bg-[#141828] border border-white/10 hover:border-[#ffd700]/50 px-3.5 py-1.5 rounded-full shadow-sm shrink-0 transition-all hover:bg-[#191f33]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                <span className="font-extrabold text-white text-xs tracking-tight">{w.player}</span>
                <span className="text-[11px] text-gray-400 font-medium">cashed out</span>
                <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]">
                  {w.amount}
                </span>
                <span className="text-[10px] font-bold text-[#ffd700] bg-[#ffd700]/10 px-2 py-0.5 rounded-md border border-[#ffd700]/25">
                  {w.game}
                </span>
                <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">{w.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
