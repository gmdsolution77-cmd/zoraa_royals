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
  PlusCircle,
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function VaultStation({
  user,
  onOpenAuth,
  onOpenCashier,
  onOpenVaultModal,
}) {
  const [activeAccounts, setActiveAccounts] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);
  const [revealed, setRevealed] = useState({});

  const platforms = [
    { id: 'orion-stars', title: 'Orion Stars VIP', tag: 'Fish & Slots', thumb: '/images/games/orion-stars.jpg', url: 'https://orionstars.vip' },
    { id: 'fire-kirin', title: 'Fire Kirin Ultimate', tag: 'Fish Hunter', thumb: '/images/games/fire-kirin.jpg', url: 'https://firekirin.xyz' },
    { id: 'milky-way', title: 'Milky Way Galaxy', tag: 'Fish & Keno', thumb: '/images/games/milky-way.jpg', url: 'https://milkywayapp.com' },
    { id: 'game-vault', title: 'Game Vault 999', tag: 'Classic Slots', thumb: '/images/games/game-vault.jpg', url: 'https://download.gamevault999.com' },
    { id: 'juwa-777', title: 'Juwa 777 Palace', tag: 'Reel Slots', thumb: '/images/games/juwa.jpg', url: 'https://juwa777.com' },
    { id: 'ultra-panda', title: 'Ultra Panda Golden', tag: 'Arcade Sweeps', thumb: '/images/games/ultra-panda.jpg', url: 'https://ultrapanda.mobi' },
  ];

  const fetchVault = async () => {
    if (!user) return;
    try {
      const [accRes, reqRes] = await Promise.all([
        fetch('/api/game-accounts'),
        fetch('/api/account-requests'),
      ]);
      const acc = await accRes.json();
      const req = await reqRes.json();
      if (acc.success) setActiveAccounts(acc.accounts || []);
      if (req.success) setPendingRequests(req.requests || []);
    } catch {}
  };

  useEffect(() => {
    if (user) fetchVault();
  }, [user]);

  const handleCopy = (val, key) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRequest = async (platform) => {
    if (!user) {
      onOpenAuth('register');
      return;
    }
    try {
      await fetch('/api/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: platform.id, gameTitle: platform.title }),
      });
      fetchVault();
    } catch {}
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#121626] via-[#161a2c] to-[#101322] border border-purple-500/30 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/15 text-purple-400">
            <Key className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-white font-serif tracking-wider">
                PLATFORM GAME VAULT
              </h3>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Credentials & Accounts
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Instant login credentials for top external gaming apps. Request accounts & copy credentials in 1 click.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenVaultModal}
          className="btn-gold-outline text-xs px-4 py-2.5 font-bold flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-[#ffd700]" />
          <span>Full Vault Manager</span>
        </button>
      </div>

      {/* Platform Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((p) => {
          const acc = activeAccounts.find(a => a.gameId === p.id);
          const req = pendingRequests.find(r => r.gameId === p.id && r.status === 'pending');
          const isShowPass = revealed[p.id];

          return (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-[#0b0d14] border border-white/10 hover:border-purple-400/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                    <Image src={p.thumb} alt={p.title} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-xs text-white truncate">{p.title}</h4>
                    <p className="text-[10px] text-gray-400">{p.tag}</p>
                    {acc ? (
                      <span className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Account Ready
                      </span>
                    ) : req ? (
                      <span className="text-[9px] font-black uppercase text-amber-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Desk Assigning
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-500 mt-0.5 block">No account yet</span>
                    )}
                  </div>
                </div>

                {acc ? (
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1.5 text-xs mb-3 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-sans">User:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{acc.username}</span>
                        <button onClick={() => handleCopy(acc.username, `${p.id}_u`)} className="text-gray-400 hover:text-white">
                          {copiedKey === `${p.id}_u` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-sans">Pass:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#ffd700]">{isShowPass ? acc.password : '••••••'}</span>
                        <button onClick={() => setRevealed(prev => ({ ...prev, [p.id]: !prev[p.id] }))} className="text-gray-400 hover:text-white">
                          {isShowPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button onClick={() => handleCopy(acc.password, `${p.id}_p`)} className="text-gray-400 hover:text-white">
                          {copiedKey === `${p.id}_p` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : req ? (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 mb-3">
                    Operations desk is provisioning your account credentials now.
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-white/5 text-[11px] text-gray-400 mb-3">
                    Click below to request instant credentials.
                  </div>
                )}
              </div>

              <div>
                {acc ? (
                  <a
                    href={acc.gameUrl || p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-gold py-2 text-xs font-black flex items-center justify-center gap-1.5"
                  >
                    <span>Launch {p.title}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : req ? (
                  <button disabled className="w-full py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold opacity-80 flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>In VIP Queue</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleRequest(p)}
                    className="w-full btn-gold-outline py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-[#ffd700]" />
                    <span>Request Account</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
