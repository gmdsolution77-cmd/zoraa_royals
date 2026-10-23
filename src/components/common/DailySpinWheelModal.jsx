'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Gift, Award, AlertCircle, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { WHEEL_SLICES } from '@/lib/wheelConstants';

export default function DailySpinWheelModal({ isOpen, onClose, user, onBalanceUpdated }) {
  const router = useRouter();
  const [canSpin, setCanSpin] = useState(false);
  const [availableSpins, setAvailableSpins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [winResult, setWinResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Check eligibility on mount or when opened
  useEffect(() => {
    if (!isOpen) return;
    setWinResult(null);
    setErrorMessage('');

    async function checkStatus() {
      try {
        const res = await fetch('/api/daily-spin');
        const d = await res.json();
        if (d.success) {
          setCanSpin(Boolean(d.canSpin));
          setAvailableSpins(d.availableSpins || 0);
        }
      } catch (e) {
        console.error('Failed to check daily spin:', e);
      }
    }

    checkStatus();
  }, [isOpen]);

  if (!isOpen) return null;

  const slices = WHEEL_SLICES || [
    { label: '$1', value: 1, color: '#d4af37' },
    { label: 'Bad Luck', value: 0, color: '#334155' },
    { label: '$2', value: 2, color: '#10b981' },
    { label: '$3', value: 3, color: '#a855f7' },
    { label: '$1', value: 1, color: '#06b6d4' },
    { label: 'Try Again', value: 0, color: '#475569' },
    { label: '$2', value: 2, color: '#f59e0b' },
    { label: '$1', value: 1, color: '#ec4899' },
  ];

  const sliceAngle = 360 / slices.length;

  const handleSpin = async () => {
    if (!canSpin || spinning || loading) return;
    setLoading(true);
    setErrorMessage('');
    setWinResult(null);

    try {
      const res = await fetch('/api/daily-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || 'Spin failed.');
        setLoading(false);
        setCanSpin(Boolean(data.canSpin));
        setAvailableSpins(data.availableSpins || 0);
        return;
      }

      setSpinning(true);
      setLoading(false);

      const targetIndex = data.sliceIndex;
      const targetSliceCenter = targetIndex * sliceAngle + sliceAngle / 2;
      const baseRevolutions = 5 * 360; // 5 full rotations for drama
      const finalDegree = rotationDegree + baseRevolutions + (360 - (targetSliceCenter % 360));

      setRotationDegree(finalDegree);

      // Wait for spin animation (4.5s)
      setTimeout(() => {
        setSpinning(false);
        setCanSpin(Boolean(data.canSpin));
        setAvailableSpins(data.availableSpins || 0);
        setWinResult({ amount: data.winAmount, isBadLuck: data.isBadLuck });
        if (onBalanceUpdated) onBalanceUpdated();

        // Fire celebration confetti if prize won
        if (!data.isBadLuck && data.winAmount > 0) {
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffd700', '#d4af37', '#10b981', '#ffffff'],
          });
        }
      }, 4500);
    } catch (err) {
      setLoading(false);
      setSpinning(false);
      setErrorMessage(err.message || 'Network error occurred.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-[#d4af37]/60 bg-[#07080b] p-5 sm:p-7 shadow-[0_0_50px_rgba(212,175,55,0.35)] max-h-[94vh] overflow-y-auto scrollbar-none animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors z-30 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#ffd700] text-xs font-bold tracking-wider uppercase font-mono">
            <Sparkles size={13} className="text-[#ffd700]" />
            <span>DEPOSITOR FREE SPINS • WIN UP TO $3.00</span>
          </div>
          <h2 className="font-serif font-black text-2xl sm:text-3xl text-white">
            ROYAL <span className="text-gold-gradient">SPIN WHEEL</span>
          </h2>
          <p className="text-xs text-gray-400">
            {availableSpins > 0
              ? `You have ${availableSpins} free ${availableSpins === 1 ? 'spin' : 'spins'} ready to use!`
              : 'Every approved deposit unlocks 2 free spins! Instant wallet credit.'}
          </p>
        </div>

        {/* Wheel Container */}
        <div className="relative flex flex-col items-center justify-center py-2">
          {/* Outer Ring Glow */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Top Indicator Pointer */}
            <div className="absolute -top-3 z-20 flex flex-col items-center pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-[#ffd700]" />
              <div className="w-3.5 h-3.5 rounded-full bg-[#fff0a8] -mt-7 shadow-sm" />
            </div>

            {/* Rotating SVG Wheel */}
            <div
              className="w-full h-full rounded-full border-4 border-[#d4af37] shadow-[0_0_35px_rgba(212,175,55,0.45)] overflow-hidden"
              style={{
                transform: `rotate(${rotationDegree}deg)`,
                transition: spinning ? 'transform 4.5s cubic-bezier(0.15, 0.95, 0.35, 1)' : 'none',
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {slices.map((slice, index) => {
                  const angle = sliceAngle;
                  const startAngle = index * angle;
                  const endAngle = startAngle + angle;

                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);

                  const x1 = 50 + 50 * Math.cos(startRad);
                  const y1 = 50 + 50 * Math.sin(startRad);
                  const x2 = 50 + 50 * Math.cos(endRad);
                  const y2 = 50 + 50 * Math.sin(endRad);

                  const textAngle = startAngle + angle / 2;
                  const textRad = (textAngle - 90) * (Math.PI / 180);
                  const tx = 50 + 34 * Math.cos(textRad);
                  const ty = 50 + 34 * Math.sin(textRad);

                  return (
                    <g key={index}>
                      <path
                        d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                        fill={slice.color}
                        stroke="#07080b"
                        strokeWidth="1"
                      />
                      <text
                        x={tx}
                        y={ty}
                        fill="#FFFFFF"
                        fontSize="6"
                        fontWeight="900"
                        fontFamily="sans-serif"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                      >
                        {slice.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Center Hub */}
            <div className="absolute z-10 w-16 h-16 rounded-full bg-slate-950 border-4 border-[#ffd700] flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.9)] pointer-events-none">
              <Gift size={22} className="text-[#ffd700]" />
            </div>
          </div>
        </div>

        {/* Win Announcement */}
        {winResult !== null && (
          <div
            className={`my-3 p-3.5 rounded-2xl border text-center animate-bounce ${
              winResult.isBadLuck
                ? 'bg-slate-900/90 border-slate-700 text-gray-300'
                : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-200'
            }`}
          >
            <div
              className={`flex items-center justify-center gap-2 font-serif font-black text-lg sm:text-xl ${
                winResult.isBadLuck ? 'text-[#ffd700]' : 'text-emerald-300'
              }`}
            >
              <Award size={22} className={winResult.isBadLuck ? 'text-gray-400' : 'text-[#ffd700]'} />
              <span>
                {winResult.isBadLuck
                  ? 'BAD LUCK! TRY AGAIN'
                  : `YOU WON $${Number(winResult.amount).toFixed(2)} FREE CASH!`}
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1">
              {winResult.isBadLuck
                ? 'Better luck on your next spin! Keep playing.'
                : 'Credited directly to your wallet balance. Ready to play!'}
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="my-3 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 text-center flex items-center justify-center gap-2">
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button & Deposit CTA */}
        <div className="mt-3 space-y-3">
          {canSpin ? (
            <button
              onClick={handleSpin}
              disabled={spinning || loading}
              className="w-full btn-gold py-4 text-base sm:text-lg font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(212,175,55,0.5)] cursor-pointer disabled:opacity-50"
            >
              {spinning
                ? 'SPINNING THE WHEEL...'
                : loading
                ? 'CHECKING...'
                : `SPIN NOW (${availableSpins} SPINS AVAILABLE)`}
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-[#0d0f17] border border-[#d4af37]/30 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-[#ffd700] text-xs font-bold uppercase tracking-wider font-mono">
                <Sparkles size={14} />
                <span>Depositor Free Spins</span>
              </div>
              <p className="text-xs text-gray-300">
                You receive <strong className="text-emerald-400">2 Free Spins</strong> on every approved deposit!
              </p>
              <button
                onClick={() => {
                  onClose();
                  router.push('/deposit');
                }}
                className="w-full btn-gold py-3 text-xs font-black uppercase tracking-wider mt-1 cursor-pointer flex items-center justify-center gap-2"
              >
                <Wallet size={15} />
                <span>Deposit Now to Unlock 2 Spins</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
