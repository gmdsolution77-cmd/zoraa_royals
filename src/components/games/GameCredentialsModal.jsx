'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  Wallet,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Coins
} from 'lucide-react';
import LoadCoinsModal from '@/components/player/LoadCoinsModal';

export default function GameCredentialsModal({
  isOpen,
  onClose,
  game,
  account: initialAccount,
  pendingRequest: initialPendingRequest,
  onRequestAccount,
  onLoadCredits,
  user,
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [accountStatus, setAccountStatus] = useState(null); // null | 'PENDING' | 'READY' | 'REJECTED'
  const [credentials, setCredentials] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(null);
  const [stepTimer, setStepTimer] = useState(0);
  const [loadModalOpen, setLoadModalOpen] = useState(false);

  // Sync with props initially
  useEffect(() => {
    if (initialAccount) {
      setAccountStatus('READY');
      setCredentials({
        username: initialAccount.username,
        password: initialAccount.password,
        pin: initialAccount.pin,
      });
    } else if (initialPendingRequest) {
      setAccountStatus('PENDING');
    }
  }, [initialAccount, initialPendingRequest]);

  // Live real-time poller (every 3.5 seconds)
  const pollGameAccount = async () => {
    if (!user || !game || !isOpen) return;

    try {
      const emailParam = encodeURIComponent(user.email);
      const [credRes, reqRes] = await Promise.all([
        fetch(`/api/game-accounts?email=${emailParam}`),
        fetch(`/api/account-requests?email=${emailParam}`),
      ]);

      const credData = await credRes.json();
      const reqData = await reqRes.json();

      // Check ready credentials
      const accountsList = credData.gameAccounts || credData.accounts || [];
      const matchCred = accountsList.find(
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
        return;
      }

      // Check requests status
      const reqsList = reqData.accountRequests || reqData.requests || [];
      const matchReq = reqsList.find(
        (r) =>
          String(r.gameTitle || '').toLowerCase().trim() === String(game.title || '').toLowerCase().trim() ||
          (game.gameId && r.gameId === game.gameId)
      );

      if (matchReq) {
        const s = (matchReq.status || '').toUpperCase();
        if (s === 'READY') {
          setAccountStatus('READY');
          setCredentials({
            username: matchReq.gameAccountUsername || matchReq.username,
            password: matchReq.gameAccountPassword || matchReq.password,
          });
          setRejectionReason(null);
        } else if (s === 'PENDING') {
          setAccountStatus('PENDING');
          setRejectionReason(null);
        } else if (s === 'REJECTED' || s === 'CANCELLED') {
          setAccountStatus('REJECTED');
          setRejectionReason(
            matchReq.rejectionReason ||
            matchReq.rejectReason ||
            matchReq.adminNote ||
            matchReq.notes ||
            'Staff desk rejected request or platform currently unavailable. Please contact 24/7 support.'
          );
        }
      }
    } catch (err) {
      console.error('Game status polling error:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    pollGameAccount();
    const interval = setInterval(pollGameAccount, 3500);
    return () => clearInterval(interval);
  }, [isOpen, user, game]);

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

  if (!isOpen || !game) return null;

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRequest = async () => {
    if (!user) return;
    setRequesting(true);
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
        if (onRequestAccount) onRequestAccount(game);
      }
    } catch (err) {
      console.error('Request account error:', err);
    } finally {
      setRequesting(false);
    }
  };

  const gameUrl = game.url || game.downloadUrl || 'https://orionstars.vip';

  const isLinked = accountStatus === 'READY' && credentials;
  const isPending = accountStatus === 'PENDING' && !isLinked;
  const isRejected = accountStatus === 'REJECTED' && !isLinked;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto scrollbar-none rounded-3xl bg-[#0c0f17] border border-[#d4af37]/40 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.15)]"
        >
          {/* Top Header Background Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#ffd700]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="p-6 border-b border-white/10 flex items-center gap-4">
            <div className="relative w-16 h-20 rounded-xl overflow-hidden border border-[#d4af37]/35 shadow-md shrink-0 bg-black">
              <Image
                src={game.thumbnail || '/images/hero-slot.webp'}
                alt={game.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#d4af37]/15 text-[#ffd700] border border-[#d4af37]/35">
                  SWEEPSTAKES VAULT
                </span>
                {isLinked && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> CREDENTIALS READY
                  </span>
                )}
                {isPending && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3" /> PENDING REVIEW
                  </span>
                )}
                {isRejected && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-400/40 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> REJECTED
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-white font-serif tracking-wide truncate">
                {game.title}
              </h3>
              <p className="text-xs text-gray-400">
                Official Sovereign Platform • 100% Payouts
              </p>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {/* CASE 1: ACCOUNT ALREADY EXISTS - SHOW FULL CREDENTIALS */}
            {isLinked ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Your official game account credentials are verified and active.</span>
                </div>

                {/* Username Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between">
                    <span>Platform Username / ID</span>
                    <span className="text-[10px] text-gray-500 font-normal">Use this to log into the game app</span>
                  </label>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141824] border border-[#d4af37]/25 hover:border-[#ffd700]/50 transition">
                    <span className="font-mono font-black text-sm text-white select-all">
                      {credentials.username}
                    </span>
                    <button
                      onClick={() => handleCopy(credentials.username, 'username')}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#ffd700] transition flex items-center gap-1 text-xs cursor-pointer"
                      title="Copy Username"
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

                {/* Password Box */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between">
                    <span>Game Password</span>
                    <span className="text-[10px] text-gray-500 font-normal">Keep credentials safe</span>
                  </label>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141824] border border-[#d4af37]/25 hover:border-[#ffd700]/50 transition">
                    <span className="font-mono font-black text-sm text-white select-all">
                      {showPassword ? credentials.password : '••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleCopy(credentials.password, 'password')}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#ffd700] transition flex items-center gap-1 text-xs cursor-pointer"
                        title="Copy Password"
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

                {/* PIN (If exists) */}
                {credentials.pin && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                      Game PIN / Agent Code
                    </label>
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141824] border border-[#d4af37]/25">
                      <span className="font-mono font-black text-sm text-white">
                        {credentials.pin}
                      </span>
                      <button
                        onClick={() => handleCopy(credentials.pin, 'pin')}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-[#ffd700] transition flex items-center gap-1 text-xs cursor-pointer"
                      >
                        {copiedField === 'pin' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span className="text-[10px] font-bold">{copiedField === 'pin' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons: Launch Game & Load Credits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <a
                    href={gameUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold text-xs sm:text-sm py-3 px-4 font-black flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Launch Web Game</span>
                  </a>

                  <button
                    onClick={() => setLoadModalOpen(true)}
                    className="btn-surface text-xs sm:text-sm py-3 px-4 font-bold flex items-center justify-center gap-2 border border-[#ffd700]/40 hover:border-[#ffd700] text-[#ffd700] cursor-pointer"
                  >
                    <Coins className="w-4 h-4 text-[#ffd700]" />
                    <span>Load Game Credits</span>
                  </button>
                </div>
              </div>
            ) : isPending ? (
              /* CASE 2: PENDING REQUEST IN PROGRESS */
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/15 border-2 border-amber-400/50 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] animate-pulse">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-lg font-black text-white font-serif">
                    Account Request in Progress
                  </h4>
                  <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                    Your request for <strong className="text-[#ffd700]">{game.title}</strong> has been received by our Coin Operations desk. Your login credentials will unlock right here as soon as approved!
                  </p>
                </div>

                {/* Progress bar animation */}
                <div className="w-full bg-black/50 border border-white/10 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-[#ffd700] h-full transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(10, stepTimer)}%` }}
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#141824] border border-white/5 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>Live Polling:</span>
                  <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Awaiting Credentials
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="w-full btn-gold text-xs py-3 font-bold mt-2 cursor-pointer"
                >
                  Got It, Thanks!
                </button>
              </div>
            ) : isRejected ? (
              /* CASE 3: REJECTED NOTICE WITH RETRY OPTION */
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border-2 border-red-400/50 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.25)]">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-white font-serif">
                    Request Declined
                  </h4>
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 max-w-sm mx-auto text-left">
                    <p className="text-[10px] uppercase font-black text-red-400 mb-1 tracking-wider">Note from Staff Desk:</p>
                    <p className="leading-relaxed text-gray-200">
                      {rejectionReason || 'Staff desk could not process this request. The game may be temporarily unavailable or in maintenance.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRequest}
                  disabled={requesting}
                  className="w-full btn-gold text-xs py-3 font-black flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Re-Submit Account Request</span>
                </button>
              </div>
            ) : (
              /* CASE 4: NO ACCOUNT YET - 1-CLICK INSTANT REQUEST */
              <div className="py-4 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#d4af37]/15 border-2 border-[#ffd700]/50 flex items-center justify-center mx-auto text-[#ffd700] shadow-[0_0_25px_rgba(212,175,55,0.3)]">
                  <Key className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-lg font-black text-white font-serif">
                    Create Your {game.title} Account
                  </h4>
                  <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                    Click below to request your personal gaming account. Our 24/7 coin operations desk will automatically generate and deliver your game username and password to your vault.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#141824] border border-white/5 text-[11px] text-gray-400 space-y-1.5 text-left">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Instant Setup • Zero Additional Cost</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Direct Loading from your $ USD Wallet with Escrow Protection</span>
                  </div>
                </div>

                <button
                  onClick={handleRequest}
                  disabled={requesting}
                  className="w-full btn-gold text-sm py-3.5 font-black flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] disabled:opacity-50 cursor-pointer"
                >
                  {requesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Request...</span>
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
        </div>
      </div>

      {/* Load Coins Modal */}
      <LoadCoinsModal
        isOpen={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        game={game}
        user={user}
        onSuccess={() => {
          pollGameAccount();
          if (onLoadCredits) onLoadCredits();
        }}
      />
    </>
  );
}
