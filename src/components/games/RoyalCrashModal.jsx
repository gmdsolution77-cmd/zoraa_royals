'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Rocket,
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function RoyalCrashModal({
  isOpen,
  onClose,
  user,
  currency = 'SC',
  onBalanceUpdated,
}) {
  const [betAmount, setBetAmount] = useState(2.0);
  const [targetCashout, setTargetCashout] = useState(2.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [gameResult, setGameResult] = useState(null);

  if (!isOpen) return null;

  const handleLaunch = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setCurrentMultiplier(1.0);
    setGameResult(null);

    // Rocket animation ticker
    let multi = 1.0;
    const ticker = setInterval(() => {
      multi += 0.05;
      setCurrentMultiplier(+multi.toFixed(2));
    }, 70);

    try {
      const res = await fetch('/api/games/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'royal-crash',
          betAmount,
          currency,
          customData: { cashoutAt: targetCashout },
        }),
      });

      const data = await res.json();
      setTimeout(() => {
        clearInterval(ticker);
        setIsPlaying(false);

        if (data.success) {
          setCurrentMultiplier(data.resultDetails.crashedAt);
          setGameResult(data);
          if (data.winAmount > 0) {
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#38bdf8', '#ffd700', '#ffffff'],
              });
            } catch {}
          }
          if (onBalanceUpdated) onBalanceUpdated();
        }
      }, 1500);
    } catch {
      clearInterval(ticker);
      setIsPlaying(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#080911] border-2 border-[#d4af37]/40 shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-6 sm:p-8 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-0.5 rounded">
              Crown Rocket Crash
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              RTP: 98.2%
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Flight Display */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#141829] to-[#0a0d18] border border-[#d4af37]/30 shadow-inner text-center mb-6 relative overflow-hidden">
          <div className="py-8">
            <div className={`text-6xl font-black font-mono tracking-tight transition ${
              gameResult && !gameResult.resultDetails.isWin
                ? 'text-red-400'
                : 'text-gold-gradient'
            }`}>
              {currentMultiplier.toFixed(2)}x
            </div>
            <p className="text-xs uppercase font-bold text-gray-400 mt-2">
              {isPlaying ? 'Rocket Climbing...' : gameResult?.resultDetails.isWin ? 'Cashed Out!' : 'Target Cashout'}
            </p>
          </div>

          {gameResult && (
            <div className="mt-2 text-xs font-bold">
              {gameResult.resultDetails.isWin ? (
                <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Won +${gameResult.winAmount.toFixed(2)} {currency}!
                </span>
              ) : (
                <span className="text-red-400">
                  Crashed at {gameResult.resultDetails.crashedAt}x! Try again!
                </span>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Bet Amount
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 1)}
                className="w-full bg-[#131622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Auto Cashout At (x)
              </label>
              <input
                type="number"
                min="1.1"
                step="0.1"
                value={targetCashout}
                onChange={(e) => setTargetCashout(parseFloat(e.target.value) || 2)}
                className="w-full bg-[#131622] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          <button
            onClick={handleLaunch}
            disabled={isPlaying}
            className="w-full btn-gold py-4 text-base font-black flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-95"
          >
            {isPlaying ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Rocket in Flight...</span>
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                <span>Launch Rocket (${betAmount.toFixed(2)} {currency})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
