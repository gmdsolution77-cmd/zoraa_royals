'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Crown, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function RoyalBlackjackModal({
  isOpen,
  onClose,
  user,
  currency = 'SC',
  onBalanceUpdated,
}) {
  const [betAmount, setBetAmount] = useState(5.0);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleDeal = async () => {
    if (playing) return;
    setPlaying(true);
    setResult(null);

    try {
      const res = await fetch('/api/games/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'royal-blackjack',
          betAmount,
          currency,
        }),
      });

      const data = await res.json();
      setTimeout(() => {
        setPlaying(false);
        if (data.success) {
          setResult(data);
          if (data.winAmount > 0) {
            try {
              confetti({
                particleCount: 90,
                spread: 60,
                origin: { y: 0.6 },
                colors: ['#ffd700', '#ffffff', '#22c55e'],
              });
            } catch {}
          }
          if (onBalanceUpdated) onBalanceUpdated();
        }
      }, 1000);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#090b12] border-2 border-[#d4af37]/40 shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-6 sm:p-8 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded">
            RTP: 99.6% • VIP Table
          </span>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-gold-gradient font-serif tracking-widest">
            HIGH STAKES BLACKJACK
          </h3>
          <p className="text-[11px] text-gray-400">Beat the Dealer to 21 without going over</p>
        </div>

        {/* Blackjack Table Felt */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#0a2318] to-[#04120c] border-2 border-[#d4af37]/40 shadow-inner text-center mb-6 space-y-6">
          {/* Dealer hand */}
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider mb-2">Dealer Hand</p>
            <div className="flex items-center justify-center gap-2">
              {result ? (
                result.resultDetails.dealerCards.map((c, i) => (
                  <div key={i} className="w-12 h-16 rounded-lg bg-white text-black font-black flex items-center justify-center text-lg shadow-md">
                    {c}
                  </div>
                ))
              ) : (
                <>
                  <div className="w-12 h-16 rounded-lg bg-white text-black font-black flex items-center justify-center text-lg shadow-md">K</div>
                  <div className="w-12 h-16 rounded-lg bg-red-800 border-2 border-white/20 shadow-md" />
                </>
              )}
            </div>
            {result && <p className="text-xs text-white font-mono mt-1">Total: {result.resultDetails.dealerTotal}</p>}
          </div>

          {/* Player hand */}
          <div>
            <p className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider mb-2">Your Hand</p>
            <div className="flex items-center justify-center gap-2">
              {result ? (
                result.resultDetails.playerCards.map((c, i) => (
                  <div key={i} className="w-12 h-16 rounded-lg bg-white text-black font-black flex items-center justify-center text-lg shadow-md">
                    {c}
                  </div>
                ))
              ) : (
                <>
                  <div className="w-12 h-16 rounded-lg bg-white text-black font-black flex items-center justify-center text-lg shadow-md">A</div>
                  <div className="w-12 h-16 rounded-lg bg-white text-black font-black flex items-center justify-center text-lg shadow-md">10</div>
                </>
              )}
            </div>
            {result && <p className="text-xs text-white font-mono mt-1">Total: {result.resultDetails.playerTotal}</p>}
          </div>

          {result && (
            <div className="pt-2 border-t border-white/10 text-sm font-black">
              {result.resultDetails.isWin ? (
                <span className="text-[#ffd700] animate-bounce">
                  PLAYER WINS! +${result.winAmount.toFixed(2)} {currency}
                </span>
              ) : (
                <span className="text-red-400">DEALER WINS</span>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#131622] border border-white/5">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chip Size:</span>
            <div className="flex items-center gap-2">
              {[2.0, 5.0, 10.0, 25.0, 50.0].map((amt) => (
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
            onClick={handleDeal}
            disabled={playing}
            className="w-full btn-gold py-4 text-base font-black flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-95"
          >
            {playing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Dealing Cards...</span>
              </>
            ) : (
              <>
                <Crown className="w-5 h-5" />
                <span>DEAL HAND (${betAmount.toFixed(2)} {currency})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
