'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Flame, Heart, Sparkles, Gamepad2, Crown, Fish } from 'lucide-react';
import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import RoyalFooter from '@/components/common/RoyalFooter';
import LiveChatModal from '@/components/support/LiveChatModal';
import AuthModal from '@/components/common/AuthModal';
import CashierModal from '@/components/cashier/CashierModal';
import GameCredentialsModal from '@/components/games/GameCredentialsModal';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/userSession';

export default function GamesPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => getCachedUser());
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' });
  const [cashierModal, setCashierModal] = useState({ open: false, tab: 'deposit' });
  const [selectedGameForModal, setSelectedGameForModal] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 1. Fetch user session
  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if ((data.authenticated || data.success) && data.user) {
        setUser(data.user);
        saveCachedUser(data.user);
      } else {
        setUser(null);
        clearCachedUser();
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // 2. Fetch games library & load favorites
  useEffect(() => {
    fetch('/api/games')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.games) {
          setGames(data.games);
        }
      })
      .catch(() => {});

    try {
      const saved = localStorage.getItem('zorra_favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  const toggleFavorite = (e, gameId) => {
    e.stopPropagation();
    let updated;
    if (favorites.includes(gameId)) {
      updated = favorites.filter((id) => id !== gameId);
    } else {
      updated = [...favorites, gameId];
    }
    setFavorites(updated);
    try {
      localStorage.setItem('zorra_favorites', JSON.stringify(updated));
    } catch {}
  };

  const handleGameClick = (game) => {
    if (!user) {
      setAuthModal({ open: true, tab: 'login' });
      return;
    }
    // Open credentials modal directly
    setSelectedGameForModal(game);
  };

  const categories = [
    { id: 'all', label: 'All Platforms', icon: Gamepad2 },
    { id: 'featured', label: 'VIP Featured', icon: Crown },
    { id: 'slots', label: 'Slots & Reels', icon: Flame },
    { id: 'fish', label: 'Fish & Arcade', icon: Fish },
    { id: 'favorites', label: 'Favorites', icon: Heart },
  ];

  const filteredGames = games.filter((game) => {
    const title = (game.title || game.name || '').toLowerCase();
    const cat = (game.category || '').toLowerCase();
    const gid = (game.gameId || game.id || '').toString();

    // Search filter
    if (searchQuery.trim() && !title.includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (activeFilter === 'featured') return game.isFeatured || game.featured;
    if (activeFilter === 'slots') return cat.includes('slot');
    if (activeFilter === 'fish') return cat.includes('fish') || cat.includes('arcade');
    if (activeFilter === 'favorites') return favorites.includes(gid);

    return true;
  });

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

        {/* 3. Main Games Content */}
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

          {/* Page Headline & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#ffd700] uppercase tracking-wider mb-1.5">
                <Sparkles size={14} />
                <span>SWEEPSTAKES CATALOG</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white m-0 font-serif">
                Sweepstakes Games &amp; Platforms
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 m-0">
                Play on verified sweepstakes platforms with instant credential issuance and 24/7 coin transfers.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search games or platforms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#10141e] border border-[rgba(212,175,55,0.25)] text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#ffd700] transition"
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap flex items-center gap-2 transition cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                      : 'bg-[#10141e] border border-white/10 text-gray-300 hover:text-white hover:border-[rgba(212,175,55,0.3)]'
                  }`}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Games Grid */}
          {filteredGames.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#0e111a] border border-dashed border-white/10 text-center">
              <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-300 font-bold text-sm">No Games Found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your search query or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
              {filteredGames.map((game) => {
                const gid = (game.gameId || game.id || game._id).toString();
                const isFav = favorites.includes(gid);
                const thumb = game.thumbnail || game.image || '/games/orion-stars.jpg';

                return (
                  <div
                    key={gid}
                    onClick={() => handleGameClick(game)}
                    className="group relative rounded-2xl bg-[#10141e] border border-[rgba(212,175,55,0.2)] hover:border-[#ffd700] p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(212,175,55,0.2)] cursor-pointer overflow-hidden"
                  >
                    {/* Favorite Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(e, gid)}
                      className={`absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                        isFav
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/60 text-gray-300 hover:text-white'
                      }`}
                      title={isFav ? 'Remove Favorite' : 'Add to Favorites'}
                    >
                      <Heart size={14} className={isFav ? 'fill-current' : ''} />
                    </button>

                    {/* Image / Thumbnail */}
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/60 mb-2.5">
                      <img
                        src={thumb}
                        alt={game.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <span className="w-full py-1.5 rounded-lg bg-gradient-to-r from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black text-[11px] font-black text-center shadow-lg">
                          PLAY NOW
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-white truncate font-serif m-0">
                        {game.title}
                      </h3>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                        <span className="uppercase font-bold tracking-wider">{game.category || 'Sweepstakes'}</span>
                        <span className="text-[#ffd700] font-black">98.5% RTP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
        {/* Footer */}
        <RoyalFooter />
      </div>

      {/* Mobile Bottom Bar */}
      <MobileBottomNav
        activeTab="games"
        onSelectTab={(tab) => {
          if (tab === 'lobby') router.push('/');
          else if (tab === 'games') router.push('/games');
        }}
        onOpenCashier={(tab) => setCashierModal({ open: true, tab: tab || 'deposit' })}
      />

      {/* Game Credentials Modal */}
      <GameCredentialsModal
        isOpen={!!selectedGameForModal}
        onClose={() => setSelectedGameForModal(null)}
        game={selectedGameForModal}
        user={user}
        onOpenAuth={(tab) => setAuthModal({ open: true, tab: tab || 'login' })}
      />

      {/* Live Chat & Auth & Cashier Modals */}
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
