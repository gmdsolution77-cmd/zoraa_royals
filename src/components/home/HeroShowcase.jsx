'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Crown,
  Sparkles,
  Wallet,
  Gift,
  Key,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import HeroBannerCard from './HeroBannerCard';

export default function HeroShowcase({
  user,
  onOpenAuth,
  onOpenCashier,
  onOpenFreeplay,
  onOpenVault,
  onOpenReferral,
  onOpenSpinWheel,
  onBalanceUpdated,
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [jackpot, setJackpot] = useState(1842954.29);
  const [claimingFreeplay, setClaimingFreeplay] = useState(false);
  const [freeplayFeedback, setFreeplayFeedback] = useState(null);
  const [gamesCount, setGamesCount] = useState(11);
  const [settings, setSettings] = useState({
    welcomeBonusPercentage: 300,
    regularBonusPercentage: 50,
    referralBonusPercentage: 50,
    freeplayAmountSC: 5.0,
    signupBonusAmount: 5.0,
  });

  const handleGetFreeplay = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth('register');
      return;
    }

    setClaimingFreeplay(true);
    setFreeplayFeedback(null);

    try {
      const res = await fetch('/api/freeplay', { method: 'POST' });
      const data = await res.json();
      setClaimingFreeplay(false);

      if (data.success) {
        setFreeplayFeedback({
          type: 'success',
          message: data.message || `🎉 Successfully claimed $${data.amount || settings.freeplayAmountSC || 5} Freeplay bonus!`,
        });
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#d4af37', '#10b981', '#ffffff'],
        });
        if (onBalanceUpdated) onBalanceUpdated();
      } else {
        setFreeplayFeedback({
          type: data.alreadyClaimed ? 'info' : 'error',
          message: data.error || data.message || 'Unable to claim Freeplay.',
        });
        setTimeout(() => setFreeplayFeedback(null), 5000);
      }
    } catch (err) {
      setClaimingFreeplay(false);
      setFreeplayFeedback({ type: 'error', message: err.message || 'Error claiming Freeplay.' });
      setTimeout(() => setFreeplayFeedback(null), 4000);
    }
  };

  // Fetch dynamic settings and active games count
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.settings) {
          setSettings(d.settings);
        }
      })
      .catch(() => {});

    fetch('/api/games')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : (d.games || []);
        if (list.length > 0) {
          setGamesCount(list.length);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-increment jackpot
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpot(prev => +(prev + 0.15).toFixed(2));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const welcomePct = settings.welcomeBonusPercentage ?? 300;
  const regularPct = settings.regularBonusPercentage ?? 50;
  const refPct = settings.referralBonusPercentage ?? 50;
  const freeplaySC = settings.freeplayAmountSC ?? settings.signupBonusAmount ?? 5.0;
  const hasDeposited = Boolean(user?.firstDepositMade);

  const slides = [
    hasDeposited ? {
      id: 0,
      badge: '🔥 VIP REGULAR RELOAD BONUS',
      title: `+${regularPct}% ON EVERY DEPOSIT`,
      subtitle: `UNLIMITED RELOAD BONUS • 24/7 INSTANT CREDITING`,
      desc: `Enjoy an extra +${regularPct}% bonus coins automatically added on every deposit. Fast processing via Cash App, Zelle & Crypto.`,
      ctaText: `Deposit & Get +${regularPct}%`,
      ctaHref: '/deposit',
      secondaryText: 'Lucky Spin Wheel',
      secondaryAction: onOpenSpinWheel,
      imageBadge: `+${regularPct}% RELOAD`,
      glowColor: '#ffd700',
    } : {
      id: 0,
      badge: '👑 1ST DEPOSIT WELCOME BONUS',
      title: `${welcomePct}% FIRST DEPOSIT BONUS`,
      subtitle: `${welcomePct}% MATCH + $${freeplaySC} COMPLIMENTARY SIGNUP FREEPLAY`,
      desc: `Deposit via Cash App, Zelle or Crypto and get an instant +${welcomePct}% match bonus added directly to your dollar balance!`,
      ctaText: user ? 'Deposit & Triple Balance' : `Claim $${freeplaySC} Freeplay & Join`,
      ctaHref: user ? '/deposit' : null,
      ctaAction: user ? () => {} : () => onOpenAuth('register'),
      secondaryText: 'Lucky Spin Wheel',
      secondaryAction: onOpenSpinWheel,
      imageBadge: `+${welcomePct}% WELCOME`,
      glowColor: '#d4af37',
    },
    {
      id: 1,
      badge: `🎁 $${freeplaySC} SIGNUP FREEPLAY`,
      title: `$${freeplaySC} FREEPLAY BONUS`,
      subtitle: 'COMPLIMENTARY CREDIT FOR NEW PLAYERS • NO DEPOSIT',
      desc: `Test any of our ${gamesCount} sweepstakes platforms completely free! Claim your $${Number(freeplaySC).toFixed(2)} instant starter credit and start playing.`,
      ctaText: (user?.freeplayClaimed || user?.signupBonusClaimed) ? 'Play Sweepstakes' : `Claim $${freeplaySC} Freeplay`,
      ctaAction: handleGetFreeplay,
      secondaryText: 'Deposit & Get Bonus',
      secondaryHref: '/deposit',
      imageBadge: `$${freeplaySC} COMPLIMENTARY`,
      glowColor: '#10b981',
    },
    {
      id: 2,
      badge: '🔑 24/7 GAME CREDENTIALS',
      title: `${gamesCount} SWEEPSTAKES PLATFORMS`,
      subtitle: 'ORION STARS • FIRE KIRIN • JUWA • GAME VAULT • ULTRA PANDA',
      desc: 'One single wallet for all platforms. Fast credentials generation and direct credit loading with 24/7 VIP assistance.',
      ctaText: 'View My Game IDs',
      ctaHref: '/accounts',
      secondaryText: 'Lucky Spin Wheel',
      secondaryAction: onOpenSpinWheel,
      imageBadge: 'INSTANT TRANSFER',
      glowColor: '#a855f7',
    },
    {
      id: 3,
      badge: `🤝 ${refPct}% FRIEND REFERRAL BONUS`,
      title: `${refPct}% REFERRAL BONUS`,
      subtitle: 'INVITE FRIENDS • INSTANT BONUS CREDITED DIRECTLY TO WALLET',
      desc: `Share your personal invite link. When friends make their first deposit, you instantly receive ${refPct}% bonus credited directly to your playable balance!`,
      ctaText: 'Invite Friends Now',
      ctaAction: user ? onOpenReferral : () => onOpenAuth('register'),
      secondaryText: 'Deposit Funds',
      secondaryHref: '/deposit',
      imageBadge: `${refPct}% COMMISSION`,
      glowColor: '#3b82f6',
    },
  ];

  // Auto-slide every 7s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#d4af37]/35 bg-gradient-to-r from-[#111422] via-[#0d0f17] to-[#08090d] shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-6 sm:p-10 transition-all duration-500">
      {/* Background ambient lighting */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
        style={{ backgroundColor: slide.glowColor }}
      />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#d4af37]/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Content */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#ffd700] text-[11px] font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{slide.badge}</span>
            </span>

            {/* Live Jackpot Tag */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-gray-300 text-[11px] font-mono">
              <span className="text-gray-400">Grand Jackpot:</span>
              <strong className="text-gold-gradient font-black">
                ${jackpot.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </strong>
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif tracking-tight leading-tight bg-gradient-to-r from-white via-[#ffd700] to-[#e5c058] bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(212,175,55,0.4)]">
            {slide.title}
          </h2>

          <p className="text-xs sm:text-sm font-bold text-gold-gradient tracking-wide uppercase">
            {slide.subtitle}
          </p>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl">
            {slide.desc}
          </p>

          {/* Freeplay Feedback Banner */}
          {freeplayFeedback && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                freeplayFeedback.type === 'success'
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : freeplayFeedback.type === 'info'
                  ? 'bg-[#d4af37]/20 border-[#ffd700] text-[#ffd700]'
                  : 'bg-red-950/80 border-red-500 text-red-200'
              }`}
            >
              {freeplayFeedback.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-[#ffd700] shrink-0" />
              )}
              <span>{freeplayFeedback.message}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {(!user || (!user.freeplayClaimed && !user.signupBonusClaimed)) && (
              <button
                onClick={handleGetFreeplay}
                disabled={claimingFreeplay}
                className="btn-gold text-sm px-6 py-3.5 font-black flex items-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.5)] cursor-pointer"
              >
                {claimingFreeplay ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>CLAIMING...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>GET ${Number(freeplaySC).toFixed(2)} FREEPLAY</span>
                  </>
                )}
              </button>
            )}

            {slide.ctaHref ? (
              <Link
                href={slide.ctaHref}
                className="btn-gold text-sm px-6 py-3.5 font-black flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
              >
                <Crown className="w-4 h-4 stroke-[2.5]" />
                <span>{slide.ctaText}</span>
              </Link>
            ) : (
              <button
                onClick={slide.ctaAction}
                className="btn-gold text-sm px-6 py-3.5 font-black flex items-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
              >
                <Crown className="w-4 h-4 stroke-[2.5]" />
                <span>{slide.ctaText}</span>
              </button>
            )}

            {slide.secondaryHref ? (
              <Link
                href={slide.secondaryHref}
                className="btn-surface text-sm px-5 py-3.5 font-bold flex items-center gap-1.5"
              >
                <span>{slide.secondaryText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                onClick={slide.secondaryAction}
                className="btn-surface text-sm px-5 py-3.5 font-bold"
              >
                {slide.secondaryText}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic 3D Casino Showcase Visual */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <HeroBannerCard
            currentSlide={currentSlide}
            welcomePct={welcomePct}
            regularPct={regularPct}
            hasDeposited={hasDeposited}
            freeplayAmountSC={freeplaySC}
            gamesCount={gamesCount}
          />
        </div>
      </div>

      {/* Slide Navigation Dots */}
      <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
        <div className="flex items-center gap-2">
          {slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-8 bg-[#ffd700]' : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
