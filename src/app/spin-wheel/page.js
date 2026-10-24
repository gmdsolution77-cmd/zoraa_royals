'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Gift,
  Award,
  AlertCircle,
  Wallet,
  Coins,
  ShieldCheck,
  RefreshCw,
  Crown
} from 'lucide-react';
import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import RoyalFooter from '@/components/common/RoyalFooter';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import { WHEEL_SLICES } from '@/lib/wheelConstants';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/userSession';

export default function SpinWheelPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => getCachedUser());
  const [canSpin, setCanSpin] = useState(false);
  const [availableSpins, setAvailableSpins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [winResult, setWinResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Load user profile
  const loadUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const d = await res.json();
        if (d.user) {
          setUser(d.user);
          saveCachedUser(d.user);
        } else {
          clearCachedUser();
          router.push('/login?redirect=/spin-wheel');
        }
      } else {
        clearCachedUser();
        router.push('/login?redirect=/spin-wheel');
      }
    } catch {
      clearCachedUser();
      router.push('/login?redirect=/spin-wheel');
    }
  };

  // Check spin eligibility
  const checkStatus = async () => {
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
  };

  useEffect(() => {
    loadUser();
    checkStatus();
  }, []);

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

      setTimeout(() => {
        setSpinning(false);
        setCanSpin(Boolean(data.canSpin));
        setAvailableSpins(data.availableSpins || 0);
        setWinResult({ amount: data.winAmount, isBadLuck: data.isBadLuck });
        loadUser();

        if (!data.isBadLuck && data.winAmount > 0) {
          confetti({
            particleCount: 110,
            spread: 80,
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
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col font-sans">
      <RoyalNavbar
        user={user}
        onOpenAuth={(tab) => router.push(tab === 'register' ? '/register' : '/login')}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />

      <div className="flex-1 flex w-full relative">
        <RoyalSidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
          user={user}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6 pb-28 md:pb-12">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#121624] via-[#0d101a] to-[#121624] border border-[#d4af37]/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#ffd700] text-xs font-mono font-bold tracking-wider">
                <Crown size={13} className="text-[#ffd700]" />
                <span>VIP DEPOSITOR REWARD</span>
              </div>
              <h1 className="font-serif font-black text-2xl sm:text-3xl text-white">
                Lucky <span className="text-gold-gradient">Spin Wheel</span>
              </h1>
              <p className="text-xs text-gray-400">
                Win up to $3.00 SC cash prizes instantly credited to your wallet balance.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-black/50 border border-white/10 rounded-2xl p-3.5 px-5">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase font-mono block">WALLET BALANCE</span>
                <span className="font-mono font-black text-xl text-gold-gradient">
                  ${Number(user?.balanceSC ?? user?.balance ?? 0).toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center justify-end gap-1 mt-0.5 font-mono">
                  <Sparkles size={11} /> {availableSpins} Free Spins Ready
                </span>
              </div>
            </div>
          </div>

          {/* Main Wheel Card */}
          <div className="p-6 sm:p-10 rounded-3xl bg-[#0d0f17] border border-[#d4af37]/25 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            {/* Wheel */}
            <div className="relative flex flex-col items-center justify-center my-4">
              <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
                {/* Pointer */}
                <div className="absolute -top-4 z-20 flex flex-col items-center pointer-events-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                  <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[30px] border-t-[#ffd700]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#fff0a8] -mt-8 shadow-sm" />
                </div>

                {/* Rotating SVG */}
                <div
                  className="w-full h-full rounded-full border-4 border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.45)] overflow-hidden"
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
                <div className="absolute z-10 w-20 h-20 rounded-full bg-slate-950 border-4 border-[#ffd700] flex flex-col items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.9)] pointer-events-none">
                  <Gift size={24} className="text-[#ffd700]" />
                </div>
              </div>
            </div>

            {/* Win announcement */}
            {winResult !== null && (
              <div
                className={`my-4 p-4 rounded-2xl border text-center animate-bounce max-w-md w-full ${
                  winResult.isBadLuck
                    ? 'bg-slate-900/90 border-slate-700 text-gray-300'
                    : 'bg-emerald-950/80 border-emerald-500/70 text-emerald-200'
                }`}
              >
                <div
                  className={`flex items-center justify-center gap-2 font-serif font-black text-xl ${
                    winResult.isBadLuck ? 'text-[#ffd700]' : 'text-emerald-300'
                  }`}
                >
                  <Award size={24} className={winResult.isBadLuck ? 'text-gray-400' : 'text-[#ffd700]'} />
                  <span>
                    {winResult.isBadLuck
                      ? 'BAD LUCK! TRY AGAIN'
                      : `CONGRATULATIONS! YOU WON $${Number(winResult.amount).toFixed(2)} SC!`}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  {winResult.isBadLuck
                    ? 'Better luck on your next spin! Keep playing.'
                    : 'Added directly to your balance. Ready to play!'}
                </p>
              </div>
            )}

            {/* Error banner */}
            {errorMessage && (
              <div className="my-3 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-200 text-center flex items-center justify-center gap-2 max-w-md w-full">
                <AlertCircle size={15} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Spin CTA Button */}
            <div className="w-full max-w-md mt-4">
              {canSpin ? (
                <button
                  onClick={handleSpin}
                  disabled={spinning || loading}
                  className="w-full btn-gold py-4 text-base sm:text-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_35px_rgba(212,175,55,0.5)] cursor-pointer disabled:opacity-50"
                >
                  {spinning
                    ? 'SPINNING THE WHEEL...'
                    : loading
                    ? 'CHECKING...'
                    : `SPIN NOW (${availableSpins} SPINS AVAILABLE)`}
                </button>
              ) : (
                <div className="p-5 rounded-2xl bg-black/60 border border-[#d4af37]/30 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-[#ffd700] text-xs font-bold uppercase tracking-wider font-mono">
                    <Sparkles size={16} />
                    <span>DEPOSITOR FREE SPINS</span>
                  </div>
                  <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                    Free spins are awarded exclusively to depositors! You receive <strong className="text-emerald-400">2 Free Spins</strong> on every deposit approved by admin.
                  </p>
                  <button
                    onClick={() => router.push('/deposit')}
                    className="btn-gold py-3.5 px-6 text-xs font-black uppercase tracking-wider w-full flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                  >
                    <Wallet size={16} />
                    <span>MAKE A DEPOSIT FOR 2 FREE SPINS</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <RoyalFooter />
      <MobileBottomNav
        user={user}
        onOpenAuth={(mode) => router.push(`/${mode}`)}
        onOpenWallet={(tab) => {
          if (tab === 'withdraw' || tab === 'cashout' || tab === 'redeem') router.push('/cashout');
          else router.push('/deposit');
        }}
      />
    </div>
  );
}
