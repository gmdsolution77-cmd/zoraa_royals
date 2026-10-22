'use client';

import React, { useState } from 'react';
import {
  Search,
  Key,
  Check,
  X,
  Copy,
  CheckCheck,
  Gamepad2,
  Clock,
  Coins,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function AccountRequestsView({
  requests = [],
  filter = 'PENDING',
  onFilterChange,
  onOpenApproveModal,
  onCancelRequest,
  onRefresh,
  isRefreshing = false,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = requests.filter((r) => {
    const matchesFilter =
      filter === 'ALL' ? true : (r.status || '').toUpperCase() === filter.toUpperCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.userName?.toLowerCase().includes(q) ||
      r.userEmail?.toLowerCase().includes(q) ||
      r.gameTitle?.toLowerCase().includes(q) ||
      r.gameAccountUsername?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter((r) => (r.status || '').toUpperCase() === 'PENDING').length;
  const readyCount = requests.filter((r) => (r.status || '').toUpperCase() === 'READY').length;

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Bar */}
      <div className="bg-[#0b0e1e]/90 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto">
          {['PENDING', 'READY', 'ALL'].map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                filter === f
                  ? f === 'PENDING'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                    : f === 'READY'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                    : 'bg-white/15 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {f === 'PENDING' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              {f} ({f === 'PENDING' ? pendingCount : f === 'READY' ? readyCount : requests.length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2.5 px-3 py-2 bg-black/50 border border-white/10 rounded-xl w-full md:w-64 focus-within:border-[#ffd700] transition">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search player, game..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none p-0 border-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white shrink-0">
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-2 transition shrink-0"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#ffd700]' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-[#0a0d1d] border border-white/10 rounded-2xl">
          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3 text-gray-400">
            <Gamepad2 size={26} />
          </div>
          <h4 className="text-sm font-bold text-white">No game account requests found</h4>
          <p className="text-xs text-gray-500 mt-1">Incoming game account requests will ring and appear instantly.</p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE */}
          <div className="hidden lg:block bg-[#0a0d1d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#050711] text-gray-400 uppercase font-black text-[10.5px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Player</th>
                  <th className="p-4">Requested Game</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Issued Credentials</th>
                  <th className="p-4">Time</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((req) => {
                  const isPending = (req.status || '').toUpperCase() === 'PENDING';
                  return (
                    <tr
                      key={req.id}
                      className={`transition-colors ${
                        isPending ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.07]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-white text-xs uppercase shadow">
                            {req.userName ? req.userName.charAt(0) : 'P'}
                          </div>
                          <div>
                            <p className="font-black text-white text-sm">{req.userName}</p>
                            <p className="text-[11px] text-gray-400 font-mono">{req.userEmail}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="font-heading font-black text-amber-400 text-sm">{req.gameTitle}</span>
                          {req.source === 'auto_from_approved_deposit' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded-lg w-fit">
                              ✨ Auto: From Approved Deposit {req.initialDepositAmount ? `($${req.initialDepositAmount})` : ''}
                            </span>
                          )}
                          {Boolean(req.transferAmount && req.transferAmount > 0) && (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg w-fit">
                              Load: ${Number(req.transferAmount).toFixed(2)} SC
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            PENDING
                          </span>
                        ) : req.status === 'READY' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            <Check size={11} strokeWidth={3} />
                            READY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                            {req.status}
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono">
                        {req.gameAccountUsername ? (
                          <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[#ffd700] font-black text-xs">U: {req.gameAccountUsername}</span>
                              <button
                                onClick={() => handleCopy(`${req.gameAccountUsername} / ${req.gameAccountPassword}`, req.id)}
                                className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                                title="Copy credentials"
                              >
                                {copiedId === req.id ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                            </div>
                            <p className="text-gray-400 text-xs">P: {req.gameAccountPassword}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500 italic text-xs">Not issued yet</span>
                        )}
                      </td>

                      <td className="p-4 whitespace-nowrap text-gray-400 text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-white flex items-center gap-1">
                            <Clock size={11} />
                            {formatRelativeTime(req.createdAt)}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onOpenApproveModal(req)}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
                            >
                              <Key size={13} />
                              <span>Issue Credentials</span>
                            </button>
                            <button
                              onClick={() => onCancelRequest(req.id)}
                              className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold transition active:scale-95"
                              title="Cancel Request"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenApproveModal(req)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-bold transition"
                          >
                            Edit Credentials
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE & TABLET CARDS */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filtered.map((req) => {
              const isPending = (req.status || '').toUpperCase() === 'PENDING';
              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border flex flex-col gap-3.5 transition shadow-xl ${
                    isPending
                      ? 'bg-gradient-to-b from-[#161a33] to-[#0b0e1e] border-amber-500/40 shadow-amber-500/10'
                      : 'bg-[#0b0e1e] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow">
                        {req.userName ? req.userName.charAt(0) : 'P'}
                      </div>
                      <div>
                        <h4 className="font-black text-white text-sm leading-tight">{req.userName}</h4>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{req.userEmail}</p>
                      </div>
                    </div>

                    {isPending ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        PENDING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {req.status}
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 font-bold">Game Requested:</span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-heading font-black text-amber-400 text-sm">{req.gameTitle}</span>
                        {req.source === 'auto_from_approved_deposit' && (
                          <span className="text-[9.5px] font-black text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                            ✨ Auto: From Approved Deposit {req.initialDepositAmount ? `($${req.initialDepositAmount})` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {Boolean(req.transferAmount && req.transferAmount > 0) && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-bold">Initial Load SC:</span>
                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
                          ${Number(req.transferAmount).toFixed(2)} SC
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/5">
                      <span>Time:</span>
                      <span>{formatRelativeTime(req.createdAt)}</span>
                    </div>
                  </div>

                  {req.gameAccountUsername && (
                    <div className="p-3 bg-amber-500/[0.06] rounded-xl border border-[#d4af37]/20 flex items-center justify-between">
                      <div className="font-mono text-xs">
                        <p className="text-[#ffd700] font-bold">User: {req.gameAccountUsername}</p>
                        <p className="text-gray-400">Pass: {req.gameAccountPassword}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(`${req.gameAccountUsername} / ${req.gameAccountPassword}`, req.id)}
                        className="p-2 rounded-lg bg-white/10 text-gray-300 hover:text-white"
                      >
                        {copiedId === req.id ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}

                  {isPending ? (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => onOpenApproveModal(req)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
                      >
                        <Key size={13} />
                        <span>Issue Login</span>
                      </button>
                      <button
                        onClick={() => onCancelRequest(req.id)}
                        className="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-black text-xs flex items-center justify-center gap-1 active:scale-95"
                      >
                        <X size={13} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onOpenApproveModal(req)}
                      className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-bold transition"
                    >
                      Edit Credentials
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
