'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Key,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  Coins,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import RoyalFooter from '@/components/common/RoyalFooter';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import AuthModal from '@/components/common/AuthModal';
import LiveChatModal from '@/components/support/LiveChatModal';
import LoadCoinsModal from '@/components/player/LoadCoinsModal';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/userSession';

export default function GameStationPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id;

  const [user, setUser] = useState(() => getCachedUser());
  const [game, setGame] = useState(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' });
  const [chatOpen, setChatOpen] = useState(false);
  const [loadCoinsOpen, setLoadCoinsOpen] = useState(false);

  // Game account state
  const [accountStatus, setAccountStatus] = useState(null); // null | 'PENDING' | 'READY' | 'REJECTED'
  const [credentials, setCredentials] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [copiedField, setCopiedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepTimer, setStepTimer] = useState(0);

  // Fetch logged in user
  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if ((data.success || data.authenticated) && data.user) {
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
    fetchUser();
  }, []);

  // Fetch Game details
  useEffect(() => {
    if (!gameId) return;

    const fetchGame = async () => {
      setLoadingGame(true);
      try {
        const res = await fetch('/api/games');
        const data = await res.json();
        if (data.success && Array.isArray(data.games)) {
          const target = data.games.find(
            (g) =>
              String(g.gameId || '').toLowerCase() === String(gameId).toLowerCase() ||
              String(g.id || '').toLowerCase() === String(gameId).toLowerCase() ||
              String(g._id || '').toLowerCase() === String(gameId).toLowerCase()
          );

          if (target) {
            setGame(target);
          } else {
            const fallbackTitle = decodeURIComponent(String(gameId))
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());

            setGame({
              id: gameId,
              gameId: gameId,
              title: fallbackTitle,
              category: 'sweepstakes',
              provider: 'Zorra Royals Premier',
              thumbnail: '/images/hero-slot.webp',
              description: 'Official Sovereign Sweepstakes platform. High volatility, certified RNG reels and arcade multiplayer fish tables.',
              url: 'https://orionstars.vip',
            });
          }
        }
      } catch {
        setGame({
          id: gameId,
          gameId: gameId,
          title: 'Sweepstakes Terminal',
          category: 'sweepstakes',
          provider: 'Zorra Royals Premier',
          thumbnail: '/images/hero-slot.webp',
          description: 'Official Sovereign Sweepstakes platform.',
          url: 'https://orionstars.vip',
        });
      } finally {
        setLoadingGame(false);
      }
    };

    fetchGame();
  }, [gameId]);

  // Real-time status poller for this game
  const checkGameAccount = async () => {
    if (!user || !game) return;

    try {
      const emailParam = encodeURIComponent(user.email);
      const [credRes, reqRes] = await Promise.all([
        fetch(`/api/game-accounts?email=${emailParam}`),
        fetch(`/api/account-requests?email=${emailParam}`),
      ]);

      const credData = await credRes.json();
      const reqData = await reqRes.json();

      // Check existing ready credentials
      const credList = credData.gameAccounts || credData.accounts || [];
      const matchCred = credList.find(
        (a) =>
          String(a.gameTitle || '').toLowerCase().trim() === String(game.title || '').toLowerCase().trim() ||
          (game.gameId && a.gameId === game.gameId)
      );

      if (matchCred) {
        setAccountStatus('READY');
        setCredentials({
          username: matchCred.username,
          password: matchCred.password,
          pin: matchCred.pin,
        });
        setRejectionReason(null);
      }

      // Check requests history
      const reqsList = reqData.accountRequests || reqData.requests || [];
      const gameReqs = reqsList.filter(
        (r) =>
          String(r.gameTitle || '').toLowerCase().trim() === String(game.title || '').toLowerCase().trim() ||
          (game.gameId && r.gameId === game.gameId)
      );
      setGameHistory(gameReqs);

      const latestReq = gameReqs[0];
      if (latestReq && !matchCred) {
        const s = (latestReq.status || '').toUpperCase();
        if (s === 'READY') {
          setAccountStatus('READY');
          setCredentials({
            username: latestReq.gameAccountUsername || latestReq.username,
            password: latestReq.gameAccountPassword || latestReq.password,
          });
          setRejectionReason(null);
        } else if (s === 'PENDING') {
          setAccountStatus('PENDING');
          setRejectionReason(null);
        } else if (s === 'REJECTED' || s === 'CANCELLED') {
          setAccountStatus('REJECTED');
          setRejectionReason(
            latestReq.rejectionReason ||
            latestReq.rejectReason ||
            latestReq.adminNote ||
            latestReq.notes ||
            'Staff desk rejected request or platform currently unavailable. Please contact support.'
          );
        }
      }
    } catch (err) {
      console.error('Check game account error:', err);
    }
  };

  useEffect(() => {
    checkGameAccount();
    const interval = setInterval(checkGameAccount, 3500);
    return () => clearInterval(interval);
  }, [user, game]);

  // 30-second progress animation timer when pending
  useEffect(() => {
    if (accountStatus === 'PENDING') {
      const timer = setInterval(() => {
        setStepTimer((prev) => (prev < 100 ? prev + 3.33 : 100));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setStepTimer(0);
    }
  }, [accountStatus]);

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRequestAccount = async () => {
    if (!user) {
      setAuthModal({ open: true, tab: 'login' });
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameTitle: game.title,
          gameId: game.gameId || game.id,
          userEmail: user.email,
          userName: user.username,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAccountStatus('PENDING');
        setStepTimer(5);
        checkGameAccount();
      }
    } catch (err) {
      console.error('Request account error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLinked = accountStatus === 'READY' && credentials;
  const isPending = accountStatus === 'PENDING' && !isLinked;
  const isRejected = accountStatus === 'REJECTED' && !isLinked;

  const gameUrl = game?.url || 'https://orionstars.vip';

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] font-sans antialiased flex flex-col justify-between selection:bg-[#ffd700] selection:text-black">
      {/* 1. Sidebar */}
      <RoyalSidebar
        user={user}
        activeTab="games"
        onSelectTab={(t) => {
          if (t === 'lobby' || t === 'home') router.push('/');
          else if (t.startsWith('/')) router.push(t);
        }}
        onOpenAuth={(t) => setAuthModal({ open: true, tab: t })}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 2. Main Page Area */}
      <div className="w-full flex flex-col flex-1">
        {/* Top Navbar */}
        <RoyalNavbar
          user={user}
          onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenChat={() => setChatOpen(true)}
        />

        {/* Central Content */}
        <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[#ffd700] hover:underline font-bold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Lobby</span>
              </Link>
              <span>/</span>
              <span>Sweepstakes Platform</span>
              <span>/</span>
              <span className="text-white font-bold">{game?.title || 'Game Station'}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#d4af37]/15 text-[#ffd700] border border-[#d4af37]/35 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE SECURE TERMINAL
              </span>
            </div>
          </div>

          {/* Loading or Game Station */}
          {loadingGame ? (
            <div className="p-20 text-center rounded-3xl bg-[#0c0f17] border border-[#d4af37]/20 space-y-4">
              <RefreshCw className="w-8 h-8 text-[#ffd700] animate-spin mx-auto" />
              <p className="text-sm font-bold text-gray-300">
                Initializing Sovereign Station...
              </p>
            </div>
          ) : game ? (
            <div className="space-y-6">
              {/* Station Hero Card */}
              <div className="relative rounded-3xl bg-gradient-to-br from-[#101422] to-[#0a0d14] border border-[#d4af37]/35 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#ffd700]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="relative w-20 h-24 sm:w-24 sm:h-32 rounded-2xl overflow-hidden border border-[#d4af37]/40 shadow-xl shrink-0 bg-black">
                      <Image
                        src={game.thumbnail || '/images/hero-slot.webp'}
                        alt={game.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40">
                          {game.category || 'SWEEPSTAKES'}
                        </span>
                        {isLinked && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> CREDENTIALS READY
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" /> PENDING STAFF ASSIGNMENT
                          </span>
                        )}
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-white font-serif tracking-wide m-0">
                        {game.title}
                      </h1>
                      <p className="text-xs text-gray-400 mt-1 max-w-xl">
                        {game.description || 'Official Sweepstakes terminal. Enjoy certified RNG mechanics and 24/7 coin transfers.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {isLinked && (
                      <button
                        onClick={() => setLoadCoinsOpen(true)}
                        className="btn-gold flex-1 md:flex-none text-xs sm:text-sm py-3 px-6 font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                      >
                        <Coins className="w-4 h-4 stroke-[2.5]" />
                        <span>Load Coins ($ USD)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Central Station Body */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Credentials / Request Box */}
                <div className="lg:col-span-2 rounded-3xl bg-[#0c0f17] border border-[#d4af37]/30 p-6 sm:p-8 space-y-6">
                  {isLinked ? (
                    <div className="space-y-6">
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
                        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <strong className="block text-white">Active Verified Terminal Credentials</strong>
                          <span>Use the username and password below to login to the official game web client or mobile APK.</span>
                        </div>
                      </div>

                      {/* Credentials Container */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Username */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                            Platform Username / ID
                          </label>
                          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141824] border border-[#d4af37]/25">
                            <span className="font-mono font-black text-sm text-white select-all">
                              {credentials.username}
                            </span>
                            <button
                              onClick={() => handleCopy(credentials.username, 'username')}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#ffd700] transition flex items-center gap-1 text-xs cursor-pointer"
                            >
                              {copiedField === 'username' ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                              <span className="text-[10px] font-bold">
                                {copiedField === 'username' ? 'Copied' : 'Copy'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                            Game Password
                          </label>
                          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141824] border border-[#d4af37]/25">
                            <span className="font-mono font-black text-sm text-white select-all">
                              {showPassword ? credentials.password : '••••••••••••'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleCopy(credentials.password, 'password')}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#ffd700] transition flex items-center gap-1 text-xs cursor-pointer"
                              >
                                {copiedField === 'password' ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                                <span className="text-[10px] font-bold">
                                  {copiedField === 'password' ? 'Copied' : 'Copy'}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <a
                          href={gameUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-gold text-xs sm:text-sm py-3.5 px-4 font-black flex items-center justify-center gap-2 shadow-lg"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Launch Web Game</span>
                        </a>

                        <button
                          onClick={() => setLoadCoinsOpen(true)}
                          className="btn-surface text-xs sm:text-sm py-3.5 px-4 font-bold flex items-center justify-center gap-2 border border-[#ffd700]/40 hover:border-[#ffd700] text-[#ffd700] cursor-pointer"
                        >
                          <Coins className="w-4 h-4 text-[#ffd700]" />
                          <span>Load Credits from Wallet</span>
                        </button>
                      </div>
                    </div>
                  ) : isPending ? (
                    <div className="py-10 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-amber-500/15 border-2 border-amber-400/50 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] animate-pulse">
                        <Clock className="w-8 h-8" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xl font-black text-white font-serif">
                          Account Request Processing
                        </h4>
                        <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                          Your request for <strong className="text-[#ffd700]">{game.title}</strong> is currently being fulfilled by the Coin Operations desk. Your credentials will appear here automatically upon assignment.
                        </p>
                      </div>

                      <div className="w-full max-w-md mx-auto bg-black/50 border border-white/10 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-[#ffd700] h-full transition-all duration-500 rounded-full"
                          style={{ width: `${Math.max(10, stepTimer)}%` }}
                        />
                      </div>

                      <div className="p-3.5 rounded-2xl bg-[#141824] border border-white/5 text-xs text-gray-400 max-w-md mx-auto flex items-center justify-between">
                        <span>Live Verification Status:</span>
                        <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                          Reviewing by Admin
                        </span>
                      </div>
                    </div>
                  ) : isRejected ? (
                    <div className="py-8 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-red-500/15 border-2 border-red-400/50 flex items-center justify-center mx-auto text-red-400">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-black text-white font-serif">
                          Account Request Declined
                        </h4>
                        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 max-w-md mx-auto text-left">
                          <p className="text-[10px] uppercase font-black text-red-400 mb-1 tracking-wider">Note from Staff Desk:</p>
                          <p className="leading-relaxed text-gray-200">
                            {rejectionReason || 'Staff desk could not process this request. The game may be temporarily unavailable or undergoing maintenance.'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleRequestAccount}
                        disabled={isSubmitting}
                        className="btn-gold text-xs py-3 px-6 font-black inline-flex items-center gap-2 cursor-pointer shadow-lg"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Re-Submit Account Request</span>
                      </button>
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-5">
                      <div className="w-16 h-16 rounded-full bg-[#d4af37]/15 border-2 border-[#ffd700]/50 flex items-center justify-center mx-auto text-[#ffd700] shadow-[0_0_25px_rgba(212,175,55,0.3)]">
                        <Key className="w-8 h-8 stroke-[2.5]" />
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-2xl font-black text-white font-serif">
                          Request Your {game.title} Player ID
                        </h4>
                        <p className="text-xs text-gray-300 max-w-md mx-auto leading-relaxed">
                          Connect to this premier sweepstakes network. Our 24/7 Coin Operations desk will issue your personal login credentials directly to your vault.
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#141824] border border-white/5 text-xs text-gray-400 space-y-2 text-left max-w-md mx-auto">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Instant Setup & Free Account Creation</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Seamless Escrow-Protected Coin Loading from $ USD Wallet</span>
                        </div>
                      </div>

                      <button
                        onClick={handleRequestAccount}
                        disabled={isSubmitting}
                        className="btn-gold text-sm py-4 px-8 font-black inline-flex items-center gap-2 shadow-[0_0_30px_rgba(212,175,55,0.4)] cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Submitting to Coin Desk...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 stroke-[2.5]" />
                            <span>Request Game Account Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Right 1 Col: Platform Specs & Wallet Quick View */}
                <div className="space-y-6">
                  {/* Wallet Balance Card */}
                  <div className="rounded-3xl bg-[#0c0f17] border border-[#d4af37]/30 p-6 space-y-4">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                      Your Available Balance
                    </h4>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        ${Number(user?.availableBalance !== undefined ? user.availableBalance : (user?.balanceSC || user?.balance || 0)).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400 uppercase font-bold">USD</span>
                    </div>

                    {Number(user?.frozenBalance || 0) > 0 && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Lock className="w-3.5 h-3.5" /> In Escrow
                        </span>
                        <span className="font-mono font-black">${Number(user.frozenBalance).toFixed(2)}</span>
                      </div>
                    )}

                    <button
                      onClick={() => router.push('/cashier?tab=deposit')}
                      className="w-full btn-gold text-xs py-3 font-black shadow-md cursor-pointer"
                    >
                      Deposit Funds
                    </button>
                  </div>

                  {/* Terminal Security Info */}
                  <div className="rounded-3xl bg-[#0c0f17] border border-white/5 p-6 space-y-3 text-xs text-gray-400">
                    <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#ffd700]" />
                      <span>Security & Fair Play</span>
                    </h4>
                    <p className="leading-relaxed text-[11px]">
                      All sweepstakes systems are certified and monitored by Zorra Royals security. All game load transactions are recorded in the immutable staff ledger.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center rounded-3xl bg-[#0c0f17] border border-white/5 space-y-4">
              <h2 className="text-xl font-bold text-white font-serif">Platform Not Found</h2>
              <p className="text-xs text-gray-400">The requested game terminal is currently offline.</p>
              <Link href="/" className="btn-gold text-xs py-3 px-6 font-bold inline-block">
                Return to Grand Collection
              </Link>
            </div>
          )}
        </main>

        {/* Footer */}
        <RoyalFooter />

        {/* Mobile Bottom Dock */}
        <MobileBottomNav
          activeTab="games"
          onSelectTab={(t) => {
            if (t === 'lobby' || t === 'home') router.push('/');
            else router.push(`/cashier?tab=${t}`);
          }}
          onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
          user={user}
        />
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModal.open}
        initialTab={authModal.tab}
        onClose={() => setAuthModal({ open: false, tab: 'login' })}
        onAuthSuccess={(u) => {
          setUser(u);
          fetchUser();
        }}
      />

      <LiveChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        user={user}
        onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
      />

      <LoadCoinsModal
        isOpen={loadCoinsOpen}
        onClose={() => setLoadCoinsOpen(false)}
        game={game}
        user={user}
        onSuccess={() => {
          fetchUser();
          checkGameAccount();
        }}
      />
    </div>
  );
}
