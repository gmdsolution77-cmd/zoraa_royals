'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Key, Flame, Sparkles, Star } from 'lucide-react';

export default function GameCard({
  game,
  account,
  pendingRequest,
  onSelectGame,
  user,
  onOpenAuth,
}) {
  const handleClick = () => {
    if (!user) {
      onOpenAuth('login');
      return;
    }
    if (onSelectGame) {
      onSelectGame(game);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="group relative rounded-2xl overflow-hidden bg-[#10131d] border border-[#d4af37]/20 hover:border-[#ffd700] hover:shadow-[0_12px_32px_rgba(212,175,55,0.35)] transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      {/* Poster Image (Aspect 3/4 Portrait) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#07080b]">
        <Image
          src={game.thumbnail || '/images/hero-slot.webp'}
          alt={game.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover group-hover:scale-108 transition-transform duration-500"
          priority={game.isHot}
        />

        {/* Ambient Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#10131d] via-black/10 to-black/35 opacity-80 group-hover:opacity-50 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
          {game.isHot ? (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md border border-red-400/40">
              <Flame className="w-2.5 h-2.5 fill-white" /> HOT
            </span>
          ) : game.isFeatured ? (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-md border border-amber-300/50">
              <Sparkles className="w-2.5 h-2.5 fill-black" /> VIP
            </span>
          ) : null}
        </div>

        {/* Top Right: Status Badge */}
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          {account ? (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/90 text-black border border-emerald-300 shadow-md">
              <Key className="w-2.5 h-2.5 stroke-[3]" /> CREDS READY
            </span>
          ) : pendingRequest ? (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/90 text-black border border-amber-300 shadow-md animate-pulse">
              PENDING
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/80 text-[#ffd700] border border-[#d4af37]/40 backdrop-blur-sm">
              + GET ACCOUNT
            </span>
          )}
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-center">
          <div className="p-3.5 rounded-full bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black shadow-[0_0_25px_rgba(212,175,55,0.8)] group-hover:scale-110 transition-transform">
            <Key className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#ffd700]">
            {account ? 'View Credentials & Play' : pendingRequest ? 'Check Request Status' : 'Request Game Account'}
          </span>
          <span className="text-[9px] text-gray-300 font-mono">
            {account ? `ID: ${account.username}` : 'Official Sweepstakes Portal'}
          </span>
        </div>
      </div>

      {/* Info Bar */}
      <div className="p-2.5 bg-[#0e111a] border-t border-white/5 flex items-center justify-between gap-1.5">
        <div className="min-w-0 flex-1">
          <h4 className="font-extrabold text-xs text-white truncate group-hover:text-[#ffd700] transition">
            {game.title}
          </h4>
          <p className="text-[10px] text-gray-400 truncate mt-0.5">
            {account ? `Active Username: ${account.username}` : 'Sweepstakes Network'}
          </p>
        </div>

        <span className="text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#ffd700] border border-[#d4af37]/35 shrink-0">
          SWEEPS
        </span>
      </div>
    </div>
  );
}
