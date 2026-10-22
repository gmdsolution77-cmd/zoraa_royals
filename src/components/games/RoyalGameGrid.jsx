'use client';

import React, { useState } from 'react';
import {
  Gamepad2,
  Sparkles,
  Flame,
  Key,
  Search,
  Crown
} from 'lucide-react';
import GameCard from '@/components/game-card/GameCard';

export default function RoyalGameGrid({
  games = [],
  accounts = [],
  requests = [],
  activeCategory = 'all',
  onSelectCategory,
  onSelectGame,
  user,
  onOpenAuth,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Sweepstakes (11)' },
    { id: 'hot', label: 'Hot & Trending' },
    { id: 'featured', label: 'VIP Networks' },
  ];

  const filteredGames = games.filter((g) => {
    let matchesCategory = true;
    if (activeCategory === 'hot') matchesCategory = g.isHot;
    else if (activeCategory === 'featured') matchesCategory = g.isFeatured || !g.isHot;

    const matchesSearch = !searchQuery ||
      g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.provider?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Category Pills & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#0d0f17] border border-[#d4af37]/25 shadow-lg">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#b38f26] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-102'
                    : 'text-gray-300 hover:text-white bg-[#131622] hover:bg-[#1a1f30] border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sweepstakes platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#131622] border border-white/10 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition shadow-inner"
          />
        </div>
      </div>

      {/* Grid of Games */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {filteredGames.map((game) => {
          // Find matching user account for this game
          const account = accounts.find(
            (a) =>
              a.gameId === game.gameId ||
              a.gameTitle?.toLowerCase() === game.title?.toLowerCase()
          );

          // Find matching pending request
          const pendingRequest = requests.find(
            (r) =>
              (r.gameId === game.gameId ||
               r.gameTitle?.toLowerCase() === game.title?.toLowerCase()) &&
              r.status === 'pending'
          );

          return (
            <GameCard
              key={game.gameId || game._id}
              game={game}
              account={account}
              pendingRequest={pendingRequest}
              onSelectGame={onSelectGame}
              user={user}
              onOpenAuth={onOpenAuth}
            />
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="py-16 text-center text-gray-500 text-sm">
          No sweepstakes platform found matching "{searchQuery}".
        </div>
      )}
    </div>
  );
}
