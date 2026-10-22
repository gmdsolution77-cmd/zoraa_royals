'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  Gamepad2,
  Wallet,
  Gift,
  Key
} from 'lucide-react';

export default function MobileBottomNav({
  activeTab = 'lobby',
  onSelectTab,
  onOpenCashier,
  onOpenFreeplay,
}) {
  return (
    <nav
      style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 8px) + 8px)' }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07080b]/95 border-t border-[rgba(212,175,55,0.25)] backdrop-blur-lg px-2 pt-1.5 flex items-center justify-around shadow-[0_-5px_20px_rgba(0,0,0,0.7)]"
    >
      {/* 1. Lobby */}
      <Link
        href="/"
        className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
          activeTab === 'lobby' || activeTab === 'main' ? 'text-[#ffd700]' : 'text-gray-400 hover:text-white'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-1">Lobby</span>
      </Link>

      {/* 2. Games */}
      <Link
        href="/games"
        className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
          activeTab === 'games' ? 'text-[#ffd700]' : 'text-gray-400 hover:text-white'
        }`}
      >
        <Gamepad2 className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-1">Games</span>
      </Link>

      {/* 3. Central Floating Cashier Button */}
      <button
        type="button"
        onClick={() => {
          if (onOpenCashier) onOpenCashier('deposit');
          else if (typeof window !== 'undefined') window.location.href = '/deposit';
        }}
        className="-mt-5 p-3 rounded-full bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] text-black shadow-[0_0_15px_rgba(212,175,55,0.6)] active:scale-95 transition flex items-center justify-center cursor-pointer"
        aria-label="Open Cashier"
      >
        <Wallet className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* 4. Promos */}
      <Link
        href="/promotions"
        className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
          activeTab === 'promos' || activeTab === 'promotions' ? 'text-[#ffd700]' : 'text-gray-400 hover:text-white'
        }`}
      >
        <Gift className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-1">Promos</span>
      </Link>

      {/* 5. Accounts / Vault */}
      <Link
        href="/accounts"
        className={`flex flex-col items-center py-1.5 px-3 rounded-xl transition ${
          activeTab === 'accounts' ? 'text-[#ffd700]' : 'text-gray-400 hover:text-white'
        }`}
      >
        <Key className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-1">Vault</span>
      </Link>
    </nav>
  );
}
