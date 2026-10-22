'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Coins,
  RefreshCw,
  Crown,
  Volume2,
  VolumeX,
  Flame,
  Award
} from 'lucide-react';

export default function RoyalSlotModal({
  isOpen,
  onClose,
  user,
  currency = 'SC',
  onBalanceUpdated,
}) {
  const [reels, setReels] = useState(['👑', '7️⃣', '💎']);
  const [betAmount, setBetAmount] = useState(1.0);
  const [spinning, setSpinning] = useState(false);
  const [winData, setWinData] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  if (!isOpen) return null;

  const symbols = ['👑', '💎', '7️⃣', '🔔', '🍒', '⭐'];

  const handleSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setWinData(null);

    // Audio click effect simulation
    const spinInterval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
    }, 100);

    try {
      const res = await fetch('/api/games/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'royal-777',
          betAmount,
          currency,
        }),
      });

      const data = await res.json();
      setTimeout(() => {
        clearInterval(spinInterval);
        setSpinning(false);

        if (data.success) {
          setReels(data.resultDetails.reels);
          if (data.winAmount > 0) {
            setWinData(data);
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ffd700', '#d4af37', '#ffffff'],
              });
            } catch {}
          }
          if (onBalanceUpdated) onBalanceUpdated();
        }
      }, 1200);
    } catch {
      clearInterval(spinInterval);
      setSpinning(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#090b12] border-2 border-[#d4af37]/40 shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-6 sm:p-8 animate-slide-up">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-[#ffd700]" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 px-2 py-0.5 rounded">
              RTP: 97.5%
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-gold-gradient font-serif tracking-widest">
            ZORRA ROYAL 777
          </h3>
          <p className="text-[11px] text-gray-400">Match 3 Royal Icons to trigger the Palace Jackpot</p>
        </div>

        {/* Slot Frame & Reels */}
        <div className="p-4 rounded-3xl bg-gradient-to-b from-[#161a29] to-[#0c0e17] border-2 border-[#d4af37]/50 shadow-[inset_0_0_25px_rgba(0,0,0,0.8)] mb-6">
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-black/80 border border-[#d4af37]/30">
            {reels.map((symbol, idx) => (
              <div
                key={idx}
                className={`h-28 rounded-xl bg-gradient-to-b from-[#181d2c] to-[#0d0f17] border border-white/10 flex items-center justify-center text-5xl shadow-inner select-none transition-all ${
                  spinning ? 'animate-pulse scale-95 blur-[1px]' : 'scale-100'
                }`}
              >
                <span>{symbol}</span>
              </div>
            ))}
          </div>

          {/* Win Announcement */}
          <div className="mt-3 text-center min-h-[30px] flex items-center justify-center">
            {winData ? (
              <div className="flex items-center gap-2 text-sm font-black text-[#ffd700] animate-bounce">
                <Sparkles className="w-4 h-4" />
                <span>BIG WIN! +${winData.winAmount.toFixed(2)} {currency}!</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">Spin the Crown Reels</span>
            )}
          </div>
        </div>

        {/* Bet Selector & Spin Button */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#131622] border border-white/5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bet Amount:</span>
            <div className="flex items-center gap-2">
              {[0.5, 1.0, 2.5, 5.0, 10.0].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    betAmount === amt
                      ? 'bg-[#d4af37] text-black font-extrabold shadow-md'
                      : 'bg-white/5 text-gray-300 hover:text-white'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning}
            className="w-full btn-gold py-4 text-base font-black flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.5)] active:scale-95"
          >
            {spinning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Spinning Reels...</span>
              </>
            ) : (
              <>
                <Crown className="w-5 h-5" />
                <span>SPIN (${betAmount.toFixed(2)} {currency})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
