'use client';

import React, { useState } from 'react';
import {
  Check,
  X,
  Coins,
  Gamepad2,
  DollarSign,
  Eye,
  Copy,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  Key,
  ShieldCheck,
} from 'lucide-react';

function generateCredentials(rawIdentifier) {
  const cleanUser =
    String(rawIdentifier || 'royal')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 10) || 'royal';
  const randSuf = Math.floor(100 + Math.random() * 900);
  const passPrefixes = ['Zr', 'Rz', 'Vip', 'Roy', 'Zor', 'Kng'];
  const prefix = passPrefixes[Math.floor(Math.random() * passPrefixes.length)];
  const randAlpha = Math.random().toString(36).substring(2, 5);
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return {
    username: `${cleanUser}${randSuf}`,
    password: `${prefix}@${randAlpha}${randNum}`,
  };
}

export default function AdminChatRequestCard({
  message,
  onActionComplete,
  onPreviewImage,
}) {
  const kind = message?.requestKind || 'account_request';
  const requestId = message?.requestId || '';
  const meta = message?.requestMeta || {};
  const status = String(meta.status || 'pending').toLowerCase();
  const isPending = status === 'pending';
  const isApproved = status === 'approved' || status === 'ready';
  const isRejected = status === 'rejected' || status === 'cancelled';

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // Deposit editable SC
  const defaultTotalSC =
    meta.totalSC !== undefined
      ? Number(meta.totalSC).toFixed(2)
      : Number(Number(meta.amount || 0) + Number(meta.bonusSC || 0)).toFixed(2);
  const [customSC, setCustomSC] = useState(defaultTotalSC);

  // Account Request / Coin Load editable fields (lazy init avoids extra effect render)
  const [initialCreds] = useState(() =>
    (kind === 'account_request' || (kind === 'coin_load' && !meta.gameUsername)) && isPending
      ? generateCredentials(message?.username || message?.userEmail?.split('@')[0])
      : { username: '', password: '' }
  );
  const [issuedUsername, setIssuedUsername] = useState(() =>
    meta.gameUsername || initialCreds.username || ''
  );
  const [issuedPassword, setIssuedPassword] = useState(() =>
    kind === 'account_request' ? initialCreds.password : ''
  );
  const [transferAmount, setTransferAmount] = useState(
    meta.transferAmount !== undefined ? String(Number(meta.transferAmount)) : '0'
  );

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(String(text));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleRegenerate = () => {
    const gen = generateCredentials(message?.username || message?.userEmail?.split('@')[0]);
    setIssuedUsername(gen.username);
    setIssuedPassword(gen.password);
  };

  const handleApprove = async () => {
    if (submitting || !requestId) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      let res;
      if (kind === 'deposit') {
        res = await fetch('/api/payments/deposit', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            depositId: requestId,
            action: 'approve',
            customSC: customSC !== '' ? Number(customSC) : undefined,
          }),
        });
      } else if (kind === 'cashout') {
        res = await fetch('/api/payments/withdraw', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            redemptionId: requestId,
            action: 'approve',
          }),
        });
      } else if (kind === 'game_load') {
        res = await fetch('/api/admin/game-loads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            action: 'approve',
          }),
        });
      } else {
        // account_request or coin_load
        if (kind === 'account_request' && (!issuedUsername.trim() || !issuedPassword.trim())) {
          setErrorMsg('Username and password are required to issue credentials.');
          setSubmitting(false);
          return;
        }
        res = await fetch('/api/account-requests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: requestId,
            action: 'approve',
            username: issuedUsername.trim() || meta.gameUsername || message?.username,
            password: issuedPassword.trim() || undefined,
            ...(kind === 'coin_load' ? { transferAmount: Number(transferAmount || 0) } : {}),
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || data.message || 'Failed to approve request.');
      } else {
        setShowRejectBox(false);
        onActionComplete?.();
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Network error while approving.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (submitting || !requestId) return;
    setErrorMsg('');
    const reason =
      rejectReason.trim() ||
      (kind === 'deposit'
        ? 'Payment receipt could not be verified.'
        : 'Request declined by staff desk.');
    setSubmitting(true);

    try {
      let res;
      if (kind === 'deposit') {
        res = await fetch('/api/payments/deposit', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            depositId: requestId,
            action: 'reject',
            rejectReason: reason,
          }),
        });
      } else if (kind === 'cashout') {
        res = await fetch('/api/payments/withdraw', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            redemptionId: requestId,
            action: 'reject',
            rejectReason: reason,
          }),
        });
      } else if (kind === 'game_load') {
        res = await fetch('/api/admin/game-loads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            action: 'reject',
            rejectionReason: reason,
          }),
        });
      } else {
        res = await fetch('/api/account-requests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: requestId,
            action: 'reject',
            reason,
            rejectionReason: reason,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || data.message || 'Failed to reject request.');
      } else {
        setShowRejectBox(false);
        setRejectReason('');
        onActionComplete?.();
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Network error while rejecting.');
    } finally {
      setSubmitting(false);
    }
  };

  // Visual theme per request kind
  const theme =
    kind === 'deposit'
      ? {
          border: isPending
            ? 'border-emerald-400/50 shadow-[0_0_24px_rgba(16,185,129,0.18)]'
            : 'border-white/15',
          headerBg: 'bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent',
          badgeText: 'text-emerald-300',
          icon: <DollarSign size={14} className="text-emerald-400" />,
          label: 'DEPOSIT REQUEST',
        }
      : kind === 'cashout'
      ? {
          border: isPending
            ? 'border-purple-400/55 shadow-[0_0_24px_rgba(168,85,247,0.2)]'
            : 'border-white/15',
          headerBg: 'bg-gradient-to-r from-purple-500/25 via-pink-500/10 to-transparent',
          badgeText: 'text-purple-300',
          icon: <DollarSign size={14} className="text-purple-400" />,
          label: 'CASHOUT / PAYOUT REQUEST',
        }
      : kind === 'coin_load' || kind === 'game_load'
      ? {
          border: isPending
            ? 'border-[#ffd700]/55 shadow-[0_0_24px_rgba(255,215,0,0.18)]'
            : 'border-white/15',
          headerBg: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent',
          badgeText: 'text-[#ffd700]',
          icon: <Coins size={14} className="text-[#ffd700]" />,
          label: 'LOAD COINS REQUEST',
        }
      : {
          border: isPending
            ? 'border-cyan-400/50 shadow-[0_0_24px_rgba(34,211,238,0.18)]'
            : 'border-white/15',
          headerBg: 'bg-gradient-to-r from-cyan-500/20 via-purple-500/10 to-transparent',
          badgeText: 'text-cyan-300',
          icon: <Gamepad2 size={14} className="text-cyan-400" />,
          label: 'GAME ACCOUNT REQUEST',
        };

  return (
    <div
      className={`w-full max-w-md rounded-2xl bg-[#0e1320] border ${theme.border} overflow-hidden text-xs text-gray-100`}
    >
      {/* Card Header */}
      <div className={`px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between gap-2 ${theme.headerBg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
            {theme.icon}
          </div>
          <span className={`text-[11px] font-black tracking-wider uppercase truncate ${theme.badgeText}`}>
            {theme.label}
          </span>
        </div>

        {isPending ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase shrink-0 animate-pulse">
            <Clock size={10} />
            Pending
          </span>
        ) : isApproved ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase shrink-0">
            <Check size={10} strokeWidth={3} />
            Approved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-[10px] font-black uppercase shrink-0">
            <X size={10} strokeWidth={3} />
            Rejected
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3.5 space-y-2.5">
        {/* DEPOSIT DETAILS */}
        {kind === 'deposit' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                <p className="text-[10px] uppercase font-bold text-gray-400">Deposit USD</p>
                <p className="text-base font-black text-emerald-400 font-mono">
                  ${Number(meta.amount || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                <p className="text-[10px] uppercase font-bold text-gray-400">Method</p>
                <p className="text-xs font-black text-white truncate mt-0.5">
                  {meta.methodName || 'Direct'}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1 text-[11px]">
              <div className="flex justify-between gap-2">
                <span className="text-gray-400">Bonus ({meta.bonusType === 'regular' ? 'Regular' : 'Welcome'} {meta.bonusPercent ?? 0}%):</span>
                <span className="font-bold text-[#ffd700]">+${Number(meta.bonusSC || 0).toFixed(2)} SC</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-400">Total to Credit:</span>
                <span className="font-black text-emerald-300 font-mono">${defaultTotalSC} SC</span>
              </div>
              {meta.senderTag && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400">Sender Tag/Note:</span>
                  <span className="font-mono text-white truncate max-w-[180px]">{meta.senderTag}</span>
                </div>
              )}
              {meta.senderEmail && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400">Sender Email:</span>
                  <span className="font-mono text-gray-200 truncate max-w-[180px]">{meta.senderEmail}</span>
                </div>
              )}
              {meta.txHash && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400">TX Hash:</span>
                  <span className="font-mono text-cyan-300 truncate max-w-[180px]">{meta.txHash}</span>
                </div>
              )}
              {meta.gameTitle && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400">Target Game:</span>
                  <span className="font-bold text-amber-300">{meta.gameTitle}</span>
                </div>
              )}
            </div>

            {meta.proofImage && (
              <div className="relative rounded-xl overflow-hidden border border-white/15 group">
                <img
                  src={meta.proofImage}
                  alt="Deposit proof"
                  className="w-full max-h-40 object-cover cursor-pointer"
                  onClick={() => onPreviewImage?.(meta.proofImage)}
                />
                <button
                  type="button"
                  onClick={() => onPreviewImage?.(meta.proofImage)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                >
                  <span className="px-2.5 py-1 rounded-lg bg-black/80 text-white text-[10px] font-bold flex items-center gap-1">
                    <Eye size={12} /> View Receipt Full Size
                  </span>
                </button>
              </div>
            )}

            {isPending && (
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Credit Amount ($ SC) — editable
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customSC}
                  onChange={(e) => setCustomSC(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/15 text-emerald-300 font-mono font-bold text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>
            )}
          </>
        )}

        {/* CASHOUT / REDEMPTION DETAILS */}
        {kind === 'cashout' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                <p className="text-[10px] uppercase font-bold text-gray-400">Cashout USD</p>
                <p className="text-base font-black text-purple-300 font-mono">
                  ${Number(meta.amount || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                <p className="text-[10px] uppercase font-bold text-gray-400">Payout Method</p>
                <p className="text-xs font-black text-white truncate mt-0.5">
                  {meta.payoutMethod || 'Direct'}
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1.5 text-[11px]">
              {meta.destinationAddress && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-400">Recipient Tag:</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-bold text-purple-200 truncate max-w-[165px]">
                      {meta.destinationAddress}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(meta.destinationAddress, 'tag')}
                      className="text-gray-400 hover:text-white shrink-0 cursor-pointer"
                      title="Copy Tag"
                    >
                      {copiedKey === 'tag' ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              )}
              {meta.gameTitle && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400">Game Platform:</span>
                  <span className="font-bold text-amber-300">{meta.gameTitle}</span>
                </div>
              )}
              {meta.gameUsername && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400">Game ID:</span>
                  <span className="font-mono text-cyan-300">{meta.gameUsername}</span>
                </div>
              )}
              {meta.notes && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400">Note:</span>
                  <span className="text-gray-200 truncate max-w-[180px]">{meta.notes}</span>
                </div>
              )}
            </div>

            {(meta.gameScreenshot || meta.qrCodeImage) && (
              <div className="grid grid-cols-2 gap-2">
                {meta.gameScreenshot && (
                  <div className="relative rounded-xl overflow-hidden border border-purple-500/30 group">
                    <img
                      src={meta.gameScreenshot}
                      alt="Game winning proof"
                      className="w-full h-28 object-cover cursor-pointer"
                      onClick={() => onPreviewImage?.(meta.gameScreenshot)}
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/75 px-2 py-1 text-[9px] font-black text-amber-300 uppercase text-center">
                      Game Proof
                    </div>
                    <button
                      type="button"
                      onClick={() => onPreviewImage?.(meta.gameScreenshot)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                    >
                      <span className="px-2 py-1 rounded bg-black/85 text-white text-[10px] font-bold flex items-center gap-1">
                        <Eye size={11} /> Zoom
                      </span>
                    </button>
                  </div>
                )}
                {meta.qrCodeImage && (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 group">
                    <img
                      src={meta.qrCodeImage}
                      alt="Recipient QR Code"
                      className="w-full h-28 object-cover cursor-pointer"
                      onClick={() => onPreviewImage?.(meta.qrCodeImage)}
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/75 px-2 py-1 text-[9px] font-black text-emerald-300 uppercase text-center">
                      Recipient QR
                    </div>
                    <button
                      type="button"
                      onClick={() => onPreviewImage?.(meta.qrCodeImage)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                    >
                      <span className="px-2 py-1 rounded bg-black/85 text-white text-[10px] font-bold flex items-center gap-1">
                        <Eye size={11} /> Zoom
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* COIN LOAD DETAILS */}
        {(kind === 'coin_load' || kind === 'game_load') && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                <p className="text-[10px] uppercase font-bold text-gray-400">Load Amount</p>
                <p className="text-base font-black text-[#ffd700] font-mono">
                  ${Number(meta.transferAmount ?? meta.amount ?? 0).toFixed(2)} SC
                </p>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                <p className="text-[10px] uppercase font-bold text-gray-400">Game Platform</p>
                <p className="text-xs font-black text-white truncate mt-0.5">
                  {meta.gameTitle || meta.gameName || 'Game'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px]">
              <span className="text-gray-400">Player Game ID:</span>
              {meta.gameUsername ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-cyan-300">{meta.gameUsername}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(meta.gameUsername, 'gu')}
                    className="text-gray-400 hover:text-white cursor-pointer"
                    title="Copy Game ID"
                  >
                    {copiedKey === 'gu' ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-amber-300">
                  No existing ID yet (auto-assigned below)
                </span>
              )}
            </div>

            {isPending && kind === 'coin_load' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    Load Amount ($ SC)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-[#ffd700] font-mono font-bold text-xs focus:outline-none focus:border-[#ffd700]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                    Game Username
                  </label>
                  <input
                    type="text"
                    value={issuedUsername}
                    onChange={(e) => setIssuedUsername(e.target.value)}
                    placeholder={meta.gameUsername || 'Player game ID'}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-[#ffd700]"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* ACCOUNT REQUEST DETAILS */}
        {kind === 'account_request' && (
          <>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Requested Platform</p>
                <p className="text-sm font-black text-cyan-300 mt-0.5">
                  {meta.gameTitle || 'Game Platform'}
                </p>
              </div>
              {meta.source === 'auto_from_approved_deposit' && (
                <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                  Auto from Deposit
                </span>
              )}
            </div>

            {meta.freeplayPending && (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Sparkles size={12} /> Freeplay Bonus: ${Number(meta.freeplayAmount || 3).toFixed(2)} SC
                </span>
                {meta.freeplayScreenshot && (
                  <button
                    type="button"
                    onClick={() => onPreviewImage?.(meta.freeplayScreenshot)}
                    className="text-cyan-300 underline font-bold cursor-pointer"
                  >
                    View Proof
                  </button>
                )}
              </div>
            )}

            {isPending && (
              <div className="space-y-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black text-cyan-300 flex items-center gap-1">
                    <Key size={11} /> Issue Credentials
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    className="text-[10px] text-gray-400 hover:text-[#ffd700] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={10} /> Regenerate
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Username</label>
                    <input
                      type="text"
                      value={issuedUsername}
                      onChange={(e) => setIssuedUsername(e.target.value)}
                      placeholder="Game username"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Password</label>
                    <input
                      type="text"
                      value={issuedPassword}
                      onChange={(e) => setIssuedPassword(e.target.value)}
                      placeholder="Game password"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-[#ffd700] font-mono text-xs focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Error feedback */}
        {errorMsg && (
          <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-[11px] flex items-center gap-1.5">
            <AlertCircle size={13} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ACTION BUTTONS (when pending) */}
        {isPending && (
          <div className="space-y-2 pt-1">
            {showRejectBox ? (
              <div className="space-y-2 p-2.5 rounded-xl bg-red-950/30 border border-red-500/30">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason (optional)..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-red-500/30 text-white text-xs focus:outline-none focus:border-red-400"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleReject}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? <RefreshCw size={12} className="animate-spin" /> : <X size={12} />}
                    Confirm Reject
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setShowRejectBox(false)}
                    className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleApprove}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} strokeWidth={3} />
                  )}
                  <span>
                    {kind === 'deposit'
                      ? 'Approve & Credit'
                      : kind === 'cashout'
                      ? 'Approve & Dispatch'
                      : kind === 'coin_load' || kind === 'game_load'
                      ? 'Approve & Load'
                      : 'Approve & Issue ID'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowRejectBox(true)}
                  className="py-2 px-3.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 font-black text-xs flex items-center justify-center gap-1 transition disabled:opacity-50 cursor-pointer"
                >
                  <X size={13} strokeWidth={2.5} />
                  <span>Reject</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* APPROVED SUMMARY */}
        {isApproved && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-200 space-y-1">
            <div className="flex items-center gap-1.5 font-black text-emerald-300">
              <ShieldCheck size={13} />
              <span>
                Approved{meta.processedBy ? ` by ${meta.processedBy}` : ''}
              </span>
            </div>
            {kind === 'deposit' && meta.creditedSC !== undefined && (
              <p className="text-emerald-200/90 font-mono">
                Credited: +${Number(meta.creditedSC).toFixed(2)} SC
              </p>
            )}
            {kind === 'coin_load' && (
              <p className="text-emerald-200/90 font-mono">
                Loaded: ${Number(meta.finalTransferAmount ?? meta.transferAmount ?? 0).toFixed(2)} SC
              </p>
            )}
            {kind === 'account_request' && meta.issuedUsername && (
              <div className="flex items-center gap-3 font-mono text-[11px] pt-0.5">
                <span>ID: <strong className="text-white">{meta.issuedUsername}</strong></span>
                {meta.issuedPassword && (
                  <span>PW: <strong className="text-[#ffd700]">{meta.issuedPassword}</strong></span>
                )}
              </div>
            )}
          </div>
        )}

        {/* REJECTED SUMMARY */}
        {isRejected && (
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] text-red-200 space-y-1">
            <p className="font-black text-red-300">
              Rejected{meta.processedBy ? ` by ${meta.processedBy}` : ''}
            </p>
            {meta.rejectReason && (
              <p className="text-red-200/85">Reason: {meta.rejectReason}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

