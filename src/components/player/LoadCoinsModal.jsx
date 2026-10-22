'use client';

import React, { useState, useEffect } from 'react';
import {
  Coins,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  Gamepad2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function LoadCoinsModal({
  isOpen,
  onClose,
  game,
  user,
  onSuccess,
}) {
  const [loadAmount, setLoadAmount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const availableBalance = user
    ? Math.max(0, Number((user.availableBalance !== undefined ? user.availableBalance : (user.balanceSC || user.balance || 0)) - (user.frozenBalance || 0)))
    : 0;

  const frozenBalance = user ? Math.max(0, Number(user.frozenBalance || 0)) : 0;

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      if (availableBalance > 0) {
        setLoadAmount(Math.min(20, availableBalance));
      } else {
        setLoadAmount(0);
      }
    }
  }, [isOpen, availableBalance]);

  if (!isOpen || !game) return null;

  const gameTitle = game.title || game.name || 'Game Platform';
  const gameId = game.gameId || game.id || game._id;
  const presetAmounts = [10, 20, 50, 100];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const amt = Number(loadAmount);
    if (!amt || amt <= 0) {
      setErrorMsg('Please enter a valid amount greater than $0.');
      return;
    }

    if (amt > availableBalance) {
      setErrorMsg(`Cannot load $${amt.toFixed(2)}. Your available balance is only $${availableBalance.toFixed(2)} ($${frozenBalance.toFixed(2)} in escrow).`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameTitle,
          gameId,
          transferAmount: amt,
          userEmail: user.email,
          userName: user.username,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setSuccessMsg(`🎉 $${amt.toFixed(2)} USD frozen in escrow and submitted to Coin Desk for ${gameTitle}!`);
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        if (onSuccess) onSuccess(data);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg(data.message || 'Failed to submit load request.');
      }
    } catch {
      setLoading(false);
      setErrorMsg('Network error. Could not submit load request.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto scrollbar-none rounded-3xl bg-[#0b0e17] border border-[#d4af37]/40 p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(212,175,55,0.15)]"
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#ffd700]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] flex items-center justify-center text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]">
              <Coins className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white font-serif tracking-wide m-0">
                Load Credits to Game
              </h3>
              <p className="text-[11px] text-[#d4af37] font-semibold m-0 truncate max-w-[220px]">
                {gameTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Balance Status Card */}
        <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-[#121622] border border-white/5 mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Available Balance
            </span>
            <div className="text-base font-black text-emerald-400 mt-0.5 font-mono">
              ${availableBalance.toFixed(2)} <span className="text-[10px] text-gray-400">USD</span>
            </div>
          </div>
          {frozenBalance > 0 && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider inline-flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> In Escrow
              </span>
              <div className="text-base font-black text-amber-300 mt-0.5 font-mono">
                ${frozenBalance.toFixed(2)} <span className="text-[10px] text-gray-400">USD</span>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {availableBalance <= 0 ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-gray-300 leading-relaxed">
              Your available balance is $0.00. Please make a deposit or wait for pending transactions to complete before loading credits into games.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.href = '/cashier?tab=deposit';
              }}
              className="w-full btn-gold text-xs py-3 font-black shadow-lg"
            >
              Deposit Funds Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                  Amount to Load ($ USD)
                </label>
                <button
                  type="button"
                  onClick={() => setLoadAmount(availableBalance)}
                  className="text-[11px] font-black text-[#ffd700] hover:underline cursor-pointer"
                >
                  LOAD MAX (${availableBalance.toFixed(2)})
                </button>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {presetAmounts.map((amt) => {
                  const disabled = amt > availableBalance;
                  const isSel = loadAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      disabled={disabled}
                      onClick={() => setLoadAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-black transition ${
                        isSel
                          ? 'bg-[#ffd700] text-black shadow-[0_0_12px_rgba(212,175,55,0.5)] border border-[#ffd700]'
                          : 'bg-[#141824] text-white border border-white/10 hover:border-[#ffd700]/40'
                      } ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      ${amt}
                    </button>
                  );
                })}
              </div>

              {/* Exact Input */}
              <div className="relative">
                <span className="absolute top-2.5 left-3.5 text-[#ffd700] font-black text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={availableBalance}
                  value={loadAmount}
                  onChange={(e) => setLoadAmount(Math.min(availableBalance, Number(e.target.value)))}
                  required
                  className="w-full bg-[#141824] border border-[#d4af37]/30 focus:border-[#ffd700] rounded-xl py-2.5 pl-8 pr-4 text-white text-sm font-black font-mono outline-none transition"
                />
              </div>
            </div>

            {/* Escrow Rule Note */}
            <div className="p-3 rounded-xl bg-[#ffd700]/5 border border-[#ffd700]/20 flex items-start gap-2.5 text-[11px] text-gray-300 leading-relaxed">
              <Lock className="w-3.5 h-3.5 text-[#ffd700] shrink-0 mt-0.5" />
              <span>
                <strong className="text-[#ffd700]">Escrow Protection:</strong> When you submit, ${Number(loadAmount || 0).toFixed(2)} will be temporarily frozen until the Coin Operations desk loads it into your {gameTitle} account. If rejected, funds are immediately restored to your available wallet.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || loadAmount <= 0 || loadAmount > availableBalance}
              className="w-full btn-gold text-xs py-3.5 font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Freezing Escrow & Submitting...</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 stroke-[2.5]" />
                  <span>Load ${Number(loadAmount || 0).toFixed(2)} into {gameTitle}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
