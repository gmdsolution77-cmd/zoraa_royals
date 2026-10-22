'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Download,
  Smartphone,
  Apple,
  Share2,
  PlusSquare,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Zap
} from 'lucide-react';

export default function DownloadAppPage() {
  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] flex flex-col justify-between">
      {/* Top Bar */}
      <header className="p-4 sm:p-6 border-b border-[#d4af37]/20 bg-[#090b10]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white transition">
            <ArrowLeft className="w-4 h-4 text-[#ffd700]" />
            <span>Back to Royal Palace</span>
          </Link>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full" />
            <span className="font-serif font-black text-white text-sm">ZORRA ROYALS</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Title & Crest */}
        <div className="text-center space-y-3">
          <div className="inline-block p-1 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#fff0a8] to-[#997b24] shadow-[0_0_25px_rgba(212,175,55,0.4)] mb-2">
            <Image
              src="/logo.png"
              alt="Zorra Royals"
              width={80}
              height={80}
              className="rounded-full bg-black"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white font-serif tracking-tight">
            DOWNLOAD THE <span className="text-gold-gradient">ROYAL APP</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto">
            Experience ultra-smooth gameplay, instant push notifications, and fast 1-tap banking on both Android and Apple iOS devices.
          </p>
        </div>

        {/* Two Options: Android & iOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Android Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0f121d] border border-[#d4af37]/30 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <Smartphone className="w-8 h-8" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Android APK
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Android Direct Install</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Download our official native APK for all Android devices. High performance 120 FPS rendering.
                </p>
              </div>

              <div className="space-y-2 text-xs text-gray-300 pt-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Tap "Download Android APK" below.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Allow installation from "Unknown Sources" if prompted by your browser.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Tap Install and launch Zorra Royals from your home screen.</span>
                </div>
              </div>
            </div>

            <a
              href="/api/download/apk"
              download="zorra-royals.apk"
              className="w-full btn-gold py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] transition hover:brightness-110 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Android APK (v1.0 Stable)</span>
            </a>
          </div>

          {/* iOS Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0f121d] border border-[#d4af37]/30 shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                  <Apple className="w-8 h-8" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Apple iOS
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">iPhone & iPad Web App</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Install Zorra Royals on your iPhone without App Store restrictions using Safari PWA.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-gray-300 pt-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 text-[#ffd700] text-[10px] font-bold flex items-center justify-center shrink-0">1</div>
                  <span>Open <strong>Safari</strong> on your iPhone and visit <strong>zoraaroyal.com</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 text-[#ffd700] text-[10px] font-bold flex items-center justify-center shrink-0">2</div>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 text-blue-400 inline" /> at the bottom menu.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-white/10 text-[#ffd700] text-[10px] font-bold flex items-center justify-center shrink-0">3</div>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Scroll down and select <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" />.
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="w-full btn-gold-outline py-3.5 text-sm font-black flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#ffd700]" />
              <span>Launch Safari Web App</span>
            </Link>
          </div>
        </div>

        {/* Security Guarantee */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs text-gray-300">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <p>
            Official Zorra Royals digital release. Verified checksum & 100% free of adware or telemetry tracking.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-gray-500 border-t border-white/5">
        &copy; {new Date().getFullYear()} Zorra Royals. All rights reserved.
      </footer>
    </div>
  );
}
