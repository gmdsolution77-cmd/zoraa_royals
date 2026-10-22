'use client';

import React from 'react';
import GameCard from '@/components/game-card/GameCard';
import { ArrowRight } from 'lucide-react';

export default function GameSectionRow({
  title,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'text-[#ffd700] bg-[#d4af37]/15 border-[#d4af37]/30',
  games = [],
  onPlay,
  onOpenVault,
  user,
  onOpenAuth,
  onViewAll,
}) {
  if (!games || games.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-2 rounded-xl bg-white/5 text-[#ffd700] border border-white/10">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white font-serif tracking-wider">
                {title}
              </h3>
              {badge && (
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-gray-400 hover:text-[#ffd700] flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {games.map((g) => (
          <GameCard
            key={g.gameId || g._id}
            game={g}
            onPlay={onPlay}
            onOpenVault={onOpenVault}
            user={user}
            onOpenAuth={onOpenAuth}
          />
        ))}
      </div>
    </section>
  );
}
