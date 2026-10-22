'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Clock,
  Play,
  ArrowDownCircle,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Coins,
  Lock,
  Wallet
} from 'lucide-react';
import LoadCoinsModal from '@/components/player/LoadCoinsModal';

export default function PlayerGameAccountsHub({
  user,
  games = [],
  onOpenAuth,
  onPlayGame,
  onDeposit,
}) {
  const [activeAccounts, setActiveAccounts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [loadCoinsModal, setLoadCoinsModal] = useState({ open: false, game: null });
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [requestingGameId, setRequestingGameId] = useState(null);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchAccountsAndRequests = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const [credRes, reqRes] = await Promise.all([
        fetch(`/api/game-accounts?email=${encodeURIComponent(user.email)}`),
        fetch(`/api/account-requests?email=${encodeURIComponent(user.email)}`),
      ]);

      const credData = await credRes.json();
      const reqData = await reqRes.json();

      const readyList = [];
      const pendingList = [];
      const rejectedList = [];

      // Add verified ready credentials
      const creds = credData.gameAccounts || credData.accounts || [];
      readyList.push(...creds);

      // Check account requests
      const reqs = reqData.accountRequests || reqData.requests || [];
      reqs.forEach((req) => {
        if (req.status === 'READY') {
          const alreadyExists = readyList.some(
            (a) => (a.gameTitle || a.gameId)?.toLowerCase() === (req.gameTitle || req.gameId)?.toLowerCase()
          );
          if (!alreadyExists) {
            readyList.push({
              gameTitle: req.gameTitle,
              gameId: req.gameId,
              username: req.gameAccountUsername || req.username,
              password: req.gameAccountPassword || req.password,
              status: 'READY',
            });
          }
        } else if (req.status === 'PENDING') {
          pendingList.push(req);
        } else if (req.status === 'REJECTED' || req.status === 'CANCELLED') {
          rejectedList.push(req);
        }
      });

      setActiveAccounts(readyList);
      setPendingRequests(pendingList);
      setRejectedRequests(rejectedList);
    } catch (err) {
      console.error('Error fetching game accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchAccountsAndRequests();
      const interval = setInterval(fetchAccountsAndRequests, 4000);
      return () => clearInterval(interval);
    } else {
      setActiveAccounts([]);
      setPendingRequests([]);
      setRejectedRequests([]);
    }
  }, [user?.email]);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePasswordVisibility = (key) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleRequestAccount = async (game) => {
    if (!user) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    const gameTitle = game.title || game.name;
    const gameId = game.gameId || game.id || game._id;

    setRequestingGameId(gameId);
    setErrorMsg(null);
    setRequestSuccessMsg(null);

    try {
      const res = await fetch('/api/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameTitle,
          gameId,
          userEmail: user.email,
          userName: user.username,
        }),
      });

      const data = await res.json();
      setRequestingGameId(null);

      if (data.success) {
        setRequestSuccessMsg(`🎉 Account request for "${gameTitle}" submitted! Our palace coin manager is issuing your private credentials.`);
        fetchAccountsAndRequests();
        setTimeout(() => setRequestSuccessMsg(null), 6000);
      } else {
        setErrorMsg(data.message || data.error || 'Failed to submit request.');
      }
    } catch {
      setRequestingGameId(null);
      setErrorMsg('Network error. Could not request game account.');
    }
  };

  // Find games not yet requested or owned
  const availableGamesToRequest = games.filter((g) => {
    const title = (g.title || g.name || '').toLowerCase();
    const gid = (g.gameId || g.id || g._id || '').toString().toLowerCase();

    const hasActive = activeAccounts.some(
      (a) => (a.gameTitle || '').toLowerCase() === title || (a.gameId || '').toString().toLowerCase() === gid
    );
    const hasPending = pendingRequests.some(
      (p) => (p.gameTitle || '').toLowerCase() === title || (p.gameId || '').toString().toLowerCase() === gid
    );

    return !hasActive && !hasPending;
  });

  return (
    <section id="my-game-accounts-section" className="mb-12">
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#ffd700] uppercase tracking-wider mb-1.5">
            <Key size={14} />
            <span>ROYAL VAULT STATION</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white m-0 tracking-tight font-serif">
            My Game Accounts &amp; Platform IDs
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 m-0">
            Access your private credentials, launch verified platforms, and load credits instantly.
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={fetchAccountsAndRequests}
            disabled={loading}
            className="px-4 py-2 rounded-full bg-[#10141e] border border-[rgba(212,175,55,0.35)] text-[#ffd700] text-xs font-black flex items-center gap-2 hover:bg-[#1a1f2e] transition shadow-[0_0_15px_rgba(212,175,55,0.15)] cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync Credentials</span>
          </button>
        )}
      </div>

      {/* Success Notification Alert */}
      {requestSuccessMsg && (
        <div className="p-3.5 mb-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{requestSuccessMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 mb-5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#10141e] to-[#07080b] border border-[rgba(212,175,55,0.25)] flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Ready Vaults</p>
            <h3 className="text-xl font-black text-white m-0 mt-0.5">{activeAccounts.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#10141e] to-[#07080b] border border-[rgba(212,175,55,0.25)] flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Pending Assignment</p>
            <h3 className="text-xl font-black text-amber-400 m-0 mt-0.5">{pendingRequests.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#10141e] to-[#07080b] border border-[rgba(212,175,55,0.25)] flex items-center justify-between">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Available Wallet</p>
            <h3 className="text-xl font-black text-[#ffd700] m-0 mt-0.5">
              ${Number(user?.availableBalance !== undefined ? user.availableBalance : (user?.balanceSC || user?.balance || 0)).toFixed(2)}
            </h3>
          </div>
          <button
            onClick={onDeposit}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black text-[11px] font-black hover:scale-105 transition"
          >
            Deposit
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. MY ACTIVE GAME ACCOUNTS (Approved & Ready)             */}
      {/* ======================================================== */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
          <h3 className="text-lg font-black text-white m-0 uppercase tracking-wide">
            Verified Active Game Accounts ({activeAccounts.length})
          </h3>
        </div>

        {activeAccounts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0e111a]/80 border border-dashed border-[rgba(212,175,55,0.25)] text-center">
            <Key className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-300 font-bold text-sm">No Active Game Accounts Yet</p>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-1 mb-4">
              Select any sweepstakes platform below to request your instant login credentials. Our coin managers issue them within seconds.
            </p>
            <a
              href="#available-platforms-section"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black text-xs font-black shadow-lg hover:scale-105 transition"
            >
              <span>Explore Available Platforms</span>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeAccounts.map((acc, idx) => {
              const matchedGame = games.find(
                (g) =>
                  (g.title || g.name || '').toLowerCase() === (acc.gameTitle || '').toLowerCase() ||
                  (g.gameId || g.id || '').toString().toLowerCase() === (acc.gameId || '').toString().toLowerCase()
              );

              const pwRevealed = showPasswordMap[`acc_${idx}`];
              const gameUrl = acc.gameUrl || matchedGame?.loginUrl || matchedGame?.url || 'https://www.orionstars.org:8580/index.html';
              const thumb = matchedGame?.thumbnail || matchedGame?.image || '/games/orion-stars.jpg';

              return (
                <div
                  key={`ready_${idx}`}
                  className="p-5 rounded-2xl bg-[#10141e] border border-[rgba(212,175,55,0.35)] shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex flex-col justify-between hover:border-[#ffd700] transition"
                >
                  <div>
                    {/* Header: Platform info & status */}
                    <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/10">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0 relative">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={acc.gameTitle}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&q=80';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-amber-400">
                            <Gamepad2 size={24} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white truncate m-0 font-serif">
                            {acc.gameTitle || 'Royal Platform'}
                          </h4>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-400 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Ready To Play
                        </span>
                      </div>
                    </div>

                    {/* Credentials Box */}
                    <div className="p-3 rounded-xl bg-[#07080b]/90 border border-white/5 space-y-2 mb-4">
                      {/* Username Row */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] uppercase font-black text-gray-400">Player ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white tracking-wide">
                            {acc.username || 'Assigned'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.username, `u_${idx}`)}
                            className="p-1 rounded text-gray-400 hover:text-white transition"
                            title="Copy Username"
                          >
                            {copiedKey === `u_${idx}` ? (
                              <Check size={14} className="text-emerald-400" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Password Row */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] uppercase font-black text-gray-400">Password:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[#ffd700] tracking-wider">
                            {pwRevealed ? (acc.password || 'RoyalWin777!') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(`acc_${idx}`)}
                            className="p-1 rounded text-gray-400 hover:text-white transition"
                            title={pwRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {pwRevealed ? <EyeOff size={14} className="text-amber-400" /> : <Eye size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.password || 'RoyalWin777!', `p_${idx}`)}
                            className="p-1 rounded text-gray-400 hover:text-white transition"
                            title="Copy Password"
                          >
                            {copiedKey === `p_${idx}` ? (
                              <Check size={14} className="text-emerald-400" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Load Credits & Launch */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setLoadCoinsModal({ open: true, game: { title: acc.gameTitle, gameId: acc.gameId } })}
                      className="py-2.5 px-3 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-200 text-xs font-black flex items-center justify-center gap-1.5 hover:bg-purple-500/25 transition cursor-pointer"
                    >
                      <Coins size={14} className="text-purple-400" />
                      <span>Load Credits</span>
                    </button>

                    <a
                      href={gameUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black text-xs font-black flex items-center justify-center gap-1.5 shadow-md hover:scale-102 transition"
                    >
                      <span>Launch</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. PENDING REQUESTS (Under Operator Review)               */}
      {/* ======================================================== */}
      {pendingRequests.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#f59e0b]" />
            <h3 className="text-lg font-black text-white m-0 uppercase tracking-wide">
              Credentials Under Review ({pendingRequests.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map((req, idx) => (
              <div
                key={`pending_${idx}`}
                className="p-5 rounded-2xl bg-[#10141e]/90 border border-amber-500/30 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-black text-white m-0 font-serif">{req.gameTitle}</h4>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase flex items-center gap-1">
                      <Clock size={11} className="animate-spin" />
                      <span>Assigning</span>
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 mb-3">
                    Your request was received. Our 24/7 coin manager is creating your game credentials now.
                  </p>

                  {/* Animated Progress Bar */}
                  <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden mb-2">
                    <div className="bg-gradient-to-r from-amber-500 to-[#ffd700] h-full w-2/3 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-gray-400">Estimated turnaround: &lt; 2 minutes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. REJECTED REQUESTS (Feedback & Retry)                  */}
      {/* ======================================================== */}
      {rejectedRequests.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-rose-400" />
            <h3 className="text-base font-black text-rose-300 m-0 uppercase tracking-wide">
              Rejected Requests ({rejectedRequests.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rejectedRequests.map((req, idx) => (
              <div
                key={`rejected_${idx}`}
                className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-white mb-1">{req.gameTitle}</h4>
                  <p className="text-[11px] text-gray-300 mb-2">
                    Reason: {req.rejectionReason || req.notes || 'Operator declined request.'}
                  </p>
                </div>
                <button
                  onClick={() => handleRequestAccount({ title: req.gameTitle, gameId: req.gameId })}
                  className="mt-2 py-1.5 px-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-white font-black text-[11px] hover:bg-rose-500/30 transition"
                >
                  Request Again
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. AVAILABLE PLATFORMS (Request New Credentials)         */}
      {/* ======================================================== */}
      <div id="available-platforms-section">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-[#ffd700]" />
          <h3 className="text-lg font-black text-white m-0 uppercase tracking-wide">
            Available Sweepstakes Platforms ({availableGamesToRequest.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableGamesToRequest.map((game, idx) => {
            const title = game.title || game.name || 'Game Platform';
            const gid = game.gameId || game.id || game._id;
            const thumb = game.thumbnail || game.image || '/games/orion-stars.jpg';
            const isRequesting = requestingGameId === gid;

            return (
              <div
                key={`avail_${idx}`}
                className="p-4 rounded-2xl bg-[#0e111a] border border-white/10 hover:border-[rgba(212,175,55,0.4)] transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0">
                      <img
                        src={thumb}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200&q=80';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate m-0 font-serif">{title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{game.category || 'Sweepstakes'}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2 mb-3">
                    {game.description || `Play ${title} with high RTP slots, fish games, and daily jackpot pools.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRequestAccount(game)}
                  disabled={isRequesting}
                  className="w-full py-2.5 px-3 rounded-xl bg-white/5 border border-[rgba(212,175,55,0.3)] text-[#ffd700] hover:bg-[#ffd700]/10 text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {isRequesting ? (
                    <>
                      <Clock size={13} className="animate-spin" />
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={13} />
                      <span>Request Account</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Load Coins Modal */}
      <LoadCoinsModal
        isOpen={loadCoinsModal.open}
        onClose={() => setLoadCoinsModal({ open: false, game: null })}
        user={user}
        game={loadCoinsModal.game}
        onSuccess={() => {
          fetchAccountsAndRequests();
        }}
      />
    </section>
  );
}
