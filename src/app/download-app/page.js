'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Download,
  Smartphone,
  Apple,
  Share2,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import MobileBottomNav from '@/components/common/MobileBottomNav';

export default function DownloadAppPage() {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: 'Is the Zorra Royals Android APK completely safe to install?',
      a: 'Yes, 100%. Our Android APK is cryptographically signed, scanned for security, and contains zero bloatware or third-party tracking. It connects directly to our secure encryption servers.',
    },
    {
      q: 'Why is Zorra Royals not on Google Play Store or Apple App Store?',
      a: 'US Sweepstakes platforms operate under federal sweepstakes laws. Direct APK and Safari Progressive Web Apps (PWA) avoid app store commission delays, allowing instant game loading, zero restrictions, and direct 1-tap banking.',
    },
    {
      q: 'How do I enable Unknown Sources on Android?',
      a: 'When you tap Download APK, your browser (such as Chrome or Samsung Internet) may ask for permission to "Install unknown apps". Tap "Settings" in the prompt, toggle "Allow from this source", and return to complete the installation.',
    },
    {
      q: 'Do I get push notifications for deposits and withdrawals on mobile?',
      a: 'Yes! Both the Android APK and the iOS Home Screen Web App support real-time push notifications for game credentials, coin loads, and finance cashout approvals.',
    },
    {
      q: 'Can I play Fire Kirin, Ultra Panda, and Orion Stars inside the app?',
      a: 'Yes! The mobile app includes our full Game Vault where you can launch, view your registered platform credentials, deposit coins, and request cashouts with 1 tap.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] flex flex-col justify-between pb-24 md:pb-8">
      {/* Top Header */}
      <header className="p-4 sm:p-6 border-b border-[#d4af37]/20 bg-[#090b10] sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-[#ffd700]" />
            <span>Back to Royal Palace</span>
          </Link>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full" />
            <span className="font-serif font-black text-white text-sm tracking-wider">
              ZORRA ROYALS
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* Title & Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffd700]/15 border border-[#ffd700]/35 text-[#ffd700] text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>OFFICIAL MOBILE EDITION 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-serif tracking-tight">
            DOWNLOAD <span className="text-gold-gradient">ZORRA ROYALS</span> APP
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Experience ultra-smooth 120 FPS gameplay, full-screen gaming, instant push notifications for deposits, cashouts, and VIP game platforms.
          </p>
        </div>

        {/* Dual Cards: Android APK & iOS Web App */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* ANDROID CARD */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0c0e17] border-2 border-[#d4af37]/50 shadow-[0_0_35px_rgba(212,175,55,0.2)] flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black flex items-center justify-center font-black shadow-[0_0_20px_rgba(212,175,55,0.5)]">
                  <Smartphone size={32} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                  V1.0 STABLE
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
                  Android Direct APK
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Direct high-performance installation for Samsung, Google Pixel, Motorola, and all Android devices.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-gray-300 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Instant full-screen gameplay (Ultra Panda, Fire Kirin, Orion)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Real-time push notifications for deposits & credentials</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>Zero bloatware • Cryptographically signed package</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="/api/download/apk"
                download="zorra-royals.apk"
                className="w-full btn-gold py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <Download size={18} />
                <span>DOWNLOAD ANDROID APK</span>
              </a>
              <p className="text-[11px] text-center text-gray-500 font-mono">
                APK Size: ~5.8 MB • Android 8.0+ • Optimized Ultra-Fast
              </p>
            </div>
          </div>

          {/* IOS CARD */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0c0e17] border-2 border-[#d4af37]/30 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black border border-white/20">
                  <Apple size={32} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/35">
                  SAFARI PWA
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
                  Apple iOS Web App
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Add directly to Home Screen on your iPhone & iPad with zero App Store restrictions.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-gray-300 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                  <span>Runs standalone with no browser address bar</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                  <span>Smooth 120Hz ProMotion fluid animations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
                  <span>Instant 1-tap launch from your iPhone home screen</span>
                </div>
              </div>
            </div>

            {/* iOS Step instructions */}
            <div className="p-4 rounded-2xl bg-[#121522] border border-white/10 text-xs space-y-2">
              <div className="font-bold text-white text-[11px] flex items-center gap-1.5 text-[#ffd700]">
                <Share2 size={14} />
                <span>HOW TO INSTALL ON IPHONE:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-gray-300 text-[11px]">
                <li>Open <strong>Safari</strong> and visit <strong>zoraaroyal.com</strong></li>
                <li>Tap the <strong>Share icon</strong> at the bottom of the screen</li>
                <li>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></li>
                <li>Tap <strong>&quot;Add&quot;</strong> at the top right</li>
              </ol>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xl sm:text-2xl font-black text-white font-serif text-center">
            FREQUENTLY ASKED QUESTIONS
          </h3>
          <div className="space-y-3 max-w-2xl mx-auto">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-[#0c0e17]/80 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-gray-200 hover:text-white transition cursor-pointer"
                >
                  <span>{f.q}</span>
                  {activeFaq === i ? <ChevronUp size={16} className="text-[#ffd700]" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {activeFaq === i && (
                  <div className="px-4 pb-4 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
