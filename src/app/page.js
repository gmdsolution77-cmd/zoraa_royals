'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  Wallet,
  Gift,
  Key,
  ShieldCheck,
  TrendingUp,
  Flame,
  Crown,
  Download,
  MessageSquare,
  Play,
  Gamepad2,
  Fish,
  Layers,
  Layers3,
  Search
} from 'lucide-react';

import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import RoyalFooter from '@/components/common/RoyalFooter';

// New Architecture Components
import HeroShowcase from '@/components/home/HeroShowcase';
import WinnersTicker from '@/components/home/WinnersTicker';
import QuickActionCards from '@/components/home/QuickActionCards';
import GameSectionRow from '@/components/home/GameSectionRow';
import VaultStation from '@/components/home/VaultStation';
import CrownClubSection from '@/components/home/CrownClubSection';
import RoyalGameGrid from '@/components/games/RoyalGameGrid';
import CashierHub from '@/components/cashier/CashierHub';
import GameCredentialsModal from '@/components/games/GameCredentialsModal';

// Modals
import AuthModal from '@/components/common/AuthModal';
import CashierModal from '@/components/cashier/CashierModal';
import GameVaultHub from '@/components/game-accounts/GameVaultHub';
import RoyalFreeplayModal from '@/components/freeplay/RoyalFreeplayModal';
import RoyalSlotModal from '@/components/games/RoyalSlotModal';
import RoyalCrashModal from '@/components/games/RoyalCrashModal';
import RoyalBlackjackModal from '@/components/games/RoyalBlackjackModal';
import LiveChatModal from '@/components/support/LiveChatModal';
import NotificationsModal from '@/components/common/NotificationsModal';
import KycModal from '@/components/common/KycModal';
import ReferralModal from '@/components/common/ReferralModal';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState('SC');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('lobby');
  const [currentView, setCurrentView] = useState('lobby'); // 'lobby', 'deposit', 'withdraw', 'load', 'history'

  // Game credentials & requests state
  const [gameAccounts, setGameAccounts] = useState([]);
  const [accountRequests, setAccountRequests] = useState([]);
  const [selectedGameForModal, setSelectedGameForModal] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || params.get('view');
      if (tabParam && ['deposit', 'withdraw', 'load', 'history'].includes(tabParam)) {
        setCurrentView(tabParam);
      }
    }
  }, []);

  const handleSwitchView = (view) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      const url = view === 'lobby' ? '/' : `/?tab=${view}`;
      window.history.replaceState(null, '', url);
      const scrollEl = document.getElementById('main-scroll-container');
      if (scrollEl) {
        scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Games state
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);

  // Modals state
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' });
  const [cashierModal, setCashierModal] = useState({ open: false, tab: 'deposit' });
  const [gameVaultOpen, setGameVaultOpen] = useState(false);
  const [freeplayOpen, setFreeplayOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [activeInternalGame, setActiveInternalGame] = useState(null);

  const fetchVaultData = async () => {
    try {
      const [accRes, reqRes] = await Promise.all([
        fetch('/api/game-accounts'),
        fetch('/api/account-requests'),
      ]);
      const accData = await accRes.json();
      const reqData = await reqRes.json();
      if (accData.success) setGameAccounts(accData.accounts || []);
      if (reqData.success) setAccountRequests(reqData.requests || []);
    } catch {}
  };

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        fetchVaultData();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const fetchGames = async () => {
    setLoadingGames(true);
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      if (data.success && data.games) {
        setGames(data.games);
      }
    } catch {}
    finally {
      setLoadingGames(false);
    }
  };

  const handleRequestAccount = async (game) => {
    try {
      const res = await fetch('/api/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.gameId,
          gameTitle: game.title,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchVaultData();
      }
      return data;
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  useEffect(() => {
    fetchUser();
    fetchGames();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch {}
  };

  // Group sweepstakes platforms
  const hotGames = games.filter(g => g.isHot).slice(0, 6);
  const featuredPlatforms = games.filter(g => g.isFeatured || !g.isHot).slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-[#07080b] text-[#f8fafc] font-sans">
      {/* 1. Global Collapsible Royal Sidebar */}
      <RoyalSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        user={user}
        onOpenCashier={(tab) => setCashierModal({ open: true, tab })}
        onOpenFreeplay={() => setFreeplayOpen(true)}
        onOpenGameVault={() => setGameVaultOpen(true)}
        onOpenChat={() => setChatOpen(true)}
        onOpenReferral={() => setReferralOpen(true)}
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
          currency={currency}
          setCurrency={setCurrency}
          onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
          onOpenCashier={(tab) => setCashierModal({ open: true, tab })}
          onOpenFreeplay={() => setFreeplayOpen(true)}
          onOpenGameVault={() => setGameVaultOpen(true)}
          onOpenNotifications={() => setNotifsOpen(true)}
          onOpenKyc={() => setKycOpen(true)}
          onOpenReferral={() => setReferralOpen(true)}
          onLogout={handleLogout}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Live Winners Marquee Ticker */}
        <div className="sticky top-0 z-20 shrink-0">
          <WinnersTicker />
        </div>

        {/* Main Content Sections */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-8 w-full max-w-full">
            {currentView === 'lobby' ? (
              <>
                {/* A. Hero Multi-Slide Showcase */}
                <HeroShowcase
                  user={user}
                  onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
                  onOpenCashier={(tab) => handleSwitchView(tab || 'deposit')}
                  onOpenFreeplay={() => setFreeplayOpen(true)}
                  onOpenVault={() => handleSwitchView('load')}
                  onOpenReferral={() => setReferralOpen(true)}
                />

                {/* B. 4 Quick VIP Service Stations */}
                <QuickActionCards
                  onOpenCashier={(tab) => handleSwitchView(tab || 'deposit')}
                  onOpenVault={() => handleSwitchView('load')}
                  onOpenFreeplay={() => setFreeplayOpen(true)}
                />

                {/* C. Master Sweepstakes Platforms Section (Single clean showcase) */}
                <div id="all-games-section" className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white font-serif tracking-wider flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-[#ffd700]" />
                        <span>OFFICIAL SWEEPSTAKES PLATFORMS</span>
                        <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-[#ffd700] border border-white/10">
                          {games.length} Platforms
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Click any platform to view credentials, request a new account, or transfer credits.
                      </p>
                    </div>
                  </div>

                  <RoyalGameGrid
                    games={games}
                    accounts={gameAccounts}
                    requests={accountRequests}
                    activeCategory={activeCategory}
                    onSelectCategory={setActiveCategory}
                    onSelectGame={(game) => setSelectedGameForModal(game)}
                    user={user}
                    onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
                  />
                </div>

                {/* D. VIP Crown Club Lounge Section */}
                <CrownClubSection onOpenChat={() => setChatOpen(true)} />
              </>
            ) : (
              <CashierHub
                activeTab={currentView}
                onTabChange={(tab) => handleSwitchView(tab)}
                user={user}
                onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
                onBackToLobby={() => handleSwitchView('lobby')}
              />
            )}
          </main>

          {/* Footer */}
          <RoyalFooter />
          <div className="h-16 md:hidden shrink-0" />
        </div>

      {/* Floating 24/7 Concierge Chat Button */}
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-40 p-3.5 rounded-full bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black shadow-[0_0_20px_rgba(212,175,55,0.6)] hover:scale-105 active:scale-95 transition"
        title="24/7 VIP Concierge"
      >
        <MessageSquare className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Mobile Bottom Dock */}
      <MobileBottomNav
        activeTab={mobileTab}
        onSelectTab={(tab) => {
          setMobileTab(tab);
          if (tab === 'games') {
            const el = document.getElementById('all-games-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          } else {
            const scrollEl = document.getElementById('main-scroll-container');
            if (scrollEl) {
              scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        }}
        onOpenCashier={(tab) => handleSwitchView(tab || 'deposit')}
        onOpenFreeplay={() => setFreeplayOpen(true)}
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModal.open}
        initialTab={authModal.tab}
        onClose={() => setAuthModal({ open: false, tab: 'login' })}
        onSuccess={(u) => {
          setUser(u);
          fetchUser();
        }}
      />

      <CashierModal
        isOpen={cashierModal.open}
        initialTab={cashierModal.tab}
        user={user}
        onClose={() => setCashierModal({ open: false, tab: 'deposit' })}
        onBalanceUpdated={fetchUser}
      />

      <GameVaultHub
        isOpen={gameVaultOpen}
        onClose={() => setGameVaultOpen(false)}
        user={user}
        onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
        onOpenCashier={(tab) => setCashierModal({ open: true, tab })}
      />

      <RoyalFreeplayModal
        isOpen={freeplayOpen}
        onClose={() => setFreeplayOpen(false)}
        user={user}
        onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
        onBalanceUpdated={fetchUser}
      />

      <LiveChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        user={user}
        onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
      />

      <NotificationsModal
        isOpen={notifsOpen}
        onClose={() => setNotifsOpen(false)}
        user={user}
      />

      <KycModal
        isOpen={kycOpen}
        onClose={() => setKycOpen(false)}
        user={user}
      />

      <ReferralModal
        isOpen={referralOpen}
        onClose={() => setReferralOpen(false)}
        user={user}
      />

      {/* Sweepstakes Game Credentials & Request Modal */}
      {selectedGameForModal && (
        <GameCredentialsModal
          isOpen={!!selectedGameForModal}
          onClose={() => setSelectedGameForModal(null)}
          game={selectedGameForModal}
          account={gameAccounts.find(
            (a) =>
              a.gameId === selectedGameForModal.gameId ||
              a.gameTitle?.toLowerCase() === selectedGameForModal.title?.toLowerCase()
          )}
          pendingRequest={accountRequests.find(
            (r) =>
              (r.gameId === selectedGameForModal.gameId ||
               r.gameTitle?.toLowerCase() === selectedGameForModal.title?.toLowerCase()) &&
              r.status === 'pending'
          )}
          onRequestAccount={handleRequestAccount}
          onLoadCredits={() => {
            setSelectedGameForModal(null);
            handleSwitchView('load');
          }}
          user={user}
        />
      )}

      {/* Internal Game Modals */}
      {activeInternalGame === 'royal-777' && (
        <RoyalSlotModal
          isOpen={true}
          onClose={() => setActiveInternalGame(null)}
          user={user}
          currency={currency}
          onBalanceUpdated={fetchUser}
        />
      )}

      {activeInternalGame === 'royal-crash' && (
        <RoyalCrashModal
          isOpen={true}
          onClose={() => setActiveInternalGame(null)}
          user={user}
          currency={currency}
          onBalanceUpdated={fetchUser}
        />
      )}

      {activeInternalGame === 'royal-blackjack' && (
        <RoyalBlackjackModal
          isOpen={true}
          onClose={() => setActiveInternalGame(null)}
          user={user}
          currency={currency}
          onBalanceUpdated={fetchUser}
        />
      )}
    </div>
  );
}
