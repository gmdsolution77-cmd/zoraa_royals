'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Gift,
  Sparkles,
  Check,
  Crown,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function RoyalFreeplayModal({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onBalanceUpdated,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchFreeplay = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/freeplay');
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchFreeplay();
      setMessage(null);
      setErrorMsg('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleClaim = async () => {
    if (!user) {
      onOpenAuth('register');
      return;
    }

    setClaimLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/freeplay', { method: 'POST' });
      const resData = await res.json();
      if (resData.success) {
        setMessage(resData.message || 'Claimed $3.00 signup freeplay!');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#d4af37', '#ffffff', '#10b981'],
        });
        if (onBalanceUpdated) onBalanceUpdated();
        fetchFreeplay();
      } else {
        setErrorMsg(resData.error || 'Failed to claim');
      }
    } catch {
      setErrorMsg('Network error claiming freeplay');
    } finally {
      setClaimLoading(false);
    }
  };

  const isAlreadyClaimed = data?.signupBonusClaimed || user?.signupBonusClaimed;

  return (
    <div className="modal-overlay">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto scrollbar-none rounded-3xl bg-gradient-to-b from-[#141824] to-[#0c0e16] border border-[#d4af37]/40 shadow-2xl p-5 sm:p-8 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.5)]">
            <Gift className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ffd700] bg-[#d4af37]/15 px-3 py-0.5 rounded-full border border-[#d4af37]/30">
              ONE-TIME SIGNUP BONUS
            </span>
            <h2 className="text-2xl font-black font-serif text-white tracking-wide">
              $3 Freeplay Welcome Bonus
            </h2>
            <p className="text-xs text-gray-300 max-w-xs">
              Complimentary starting credit added directly to your US Dollar wallet for all sweepstakes platforms.
            </p>
          </div>
        </div>

        {/* Main Content Box */}
        <div className="mt-6 space-y-4">
          <div className="p-5 rounded-2xl bg-[#080a10] border border-[#d4af37]/30 text-center space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Freeplay Value
            </span>
            <strong className="text-4xl font-black font-mono text-gold-gradient block">
              $3.00 USD
            </strong>
            <span className="text-[11px] text-emerald-400 font-bold block">
              ✓ Ready for instant transfer to Orion Stars, Fire Kirin & more!
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Action */}
          {!user ? (
            <button
              onClick={() => {
                onClose();
                onOpenAuth('register');
              }}
              className="w-full btn-gold py-3.5 text-sm font-black shadow-lg"
            >
              Register & Claim $3 Freeplay
            </button>
          ) : isAlreadyClaimed ? (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-gray-400">
                You have already claimed your one-time $3.00 signup freeplay.
              </div>
              <Link
                href="/cashier?tab=deposit"
                onClick={onClose}
                className="w-full btn-gold py-3.5 text-sm font-black shadow-lg flex items-center justify-center gap-2"
              >
                <span>Deposit & Get +100% Match Bonus</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claimLoading}
              className="w-full btn-gold py-3.5 text-sm font-black shadow-[0_0_25px_rgba(212,175,55,0.4)] disabled:opacity-50"
            >
              {claimLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <span>Claim $3 Freeplay Credit Now</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
