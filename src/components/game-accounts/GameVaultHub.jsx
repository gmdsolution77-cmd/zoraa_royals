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
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  PlusCircle,
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';

export default function GameVaultHub({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onOpenCashier,
}) {
  const [activeAccounts, setActiveAccounts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [requestingGameId, setRequestingGameId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // External platforms catalog
  const platforms = [
    {
      gameId: 'orion-stars',
      title: 'Orion Stars VIP',
      thumbnail: '/images/orion-stars.webp',
      url: 'https://orionstars.vip',
      category: 'Fish & Slots',
    },
    {
      gameId: 'fire-kirin',
      title: 'Fire Kirin Ultimate',
      thumbnail: '/images/fire-kirin.webp',
      url: 'https://firekirin.xyz',
      category: 'Fish Hunter & Arcade',
    },
    {
      gameId: 'milky-way',
      title: 'Milky Way Galaxy',
      thumbnail: '/images/milky-way.webp',
      url: 'https://milkywayapp.com',
      category: 'Fish & Keno',
    },
    {
      gameId: 'game-vault',
      title: 'Game Vault 999 VIP',
      thumbnail: '/images/game-vault.webp',
      url: 'https://download.gamevault999.com',
      category: 'Classic Slots',
    },
    {
      gameId: 'juwa-777',
      title: 'Juwa 777 Palace',
      thumbnail: '/images/juwa-777.webp',
      url: 'https://juwa777.com',
      category: '777 Reel Slots',
    },
    {
      gameId: 'ultra-panda',
      title: 'Ultra Panda Golden',
      thumbnail: '/images/ultra-panda.webp',
      url: 'https://ultrapanda.mobi',
      category: 'Arcade & Slots',
    },
  ];

  const fetchVault = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [accRes, reqRes] = await Promise.all([
        fetch('/api/game-accounts'),
        fetch('/api/account-requests'),
      ]);

      const accData = await accRes.json();
      const reqData = await reqRes.json();

      if (accData.success) setActiveAccounts(accData.accounts || []);
      if (reqData.success) setPendingRequests(reqData.requests || []);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchVault();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleCopy = (text, fieldKey) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const togglePasswordVisibility = (gameId) => {
    setRevealedPasswords(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
  };

  const handleRequestAccount = async (platform) => {
    if (!user) {
      onOpenAuth('register');
      return;
    }

    setRequestingGameId(platform.gameId);
    setFeedback(null);

    try {
      const res = await fetch('/api/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: platform.gameId,
          gameTitle: platform.title,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to submit request');

      setFeedback({
        type: 'success',
        msg: `Requested ${platform.title} account! Our operations desk is preparing your credentials now.`,
      });

      fetchVault();
    } catch (err) {
      setFeedback({
        type: 'error',
        msg: err.message,
      });
    } finally {
      setRequestingGameId(null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0b0d14] border border-[#d4af37]/35 shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-5 sm:p-7 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-[#d4af37] to-[#131622] p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <div className="w-full h-full bg-[#0b0d14] rounded-2xl flex items-center justify-center">
                <Key className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-gold-gradient font-serif tracking-wider">
                  PLATFORM GAME VAULT
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Credentials Hub
                </span>
              </div>
              <p className="text-xs text-gray-400">
                1-Click Access & Account Requests for Orion Stars, Fire Kirin, Juwa & More
              </p>
            </div>
          </div>

          <button
            onClick={fetchVault}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition"
            title="Refresh Vault"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`mb-5 p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}>
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Platform Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platforms.map((platform) => {
            const activeAcc = activeAccounts.find(a => a.gameId === platform.gameId);
            const pendingReq = pendingRequests.find(r => r.gameId === platform.gameId && r.status === 'pending');
            const isRevealed = revealedPasswords[platform.gameId];

            return (
              <div
                key={platform.gameId}
                className="p-4 rounded-2xl bg-[#131622] border border-[#d4af37]/20 hover:border-[#d4af37]/45 transition shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Image & Status */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0">
                      <Image
                        src={platform.thumbnail}
                        alt={platform.title}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white truncate">{platform.title}</h4>
                      </div>
                      <p className="text-[10px] text-gray-400">{platform.category}</p>
                      
                      {activeAcc ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Vault Active
                        </span>
                      ) : pendingReq ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-amber-400 mt-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          Assigning Credentials
                        </span>
                      ) : (
                        <span className="text-[9px] text-gray-400 mt-1 block">
                          No credentials yet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: Credentials or Request Prompt */}
                  {activeAcc ? (
                    <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-2 mb-3">
                      {/* Username */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">Username:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{activeAcc.username}</span>
                          <button
                            onClick={() => handleCopy(activeAcc.username, `${platform.gameId}_u`)}
                            className="p-1 text-gray-400 hover:text-white transition"
                            title="Copy Username"
                          >
                            {copiedField === `${platform.gameId}_u` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Password */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">Password:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#ffd700]">
                            {isRevealed ? activeAcc.password : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(platform.gameId)}
                            className="p-1 text-gray-400 hover:text-white transition"
                            title={isRevealed ? 'Hide Password' : 'Show Password'}
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCopy(activeAcc.password, `${platform.gameId}_p`)}
                            className="p-1 text-gray-400 hover:text-white transition"
                            title="Copy Password"
                          >
                            {copiedField === `${platform.gameId}_p` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : pendingReq ? (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 mb-3 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-400" />
                        Credentials Being Created
                      </p>
                      <p className="text-[11px] text-gray-300">
                        Our 24/7 coin manager is issuing your private credentials. They will appear here automatically.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-gray-400 mb-3">
                      Click below to request your instant login credentials for {platform.title}.
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div>
                  {activeAcc ? (
                    <a
                      href={activeAcc.gameUrl || platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full btn-gold py-2 text-xs font-black flex items-center justify-center gap-1.5"
                    >
                      <span>Launch {platform.title}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : pendingReq ? (
                    <button
                      disabled
                      className="w-full py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 opacity-80"
                    >
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Request Queued</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRequestAccount(platform)}
                      disabled={requestingGameId === platform.gameId}
                      className="w-full btn-gold-outline py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      {requestingGameId === platform.gameId ? (
                        <span>Submitting Request...</span>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5 text-[#ffd700]" />
                          <span>Request Account Credentials</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
