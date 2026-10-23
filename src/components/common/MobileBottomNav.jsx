'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Gamepad2,
  Trophy,
  KeyRound,
  Wallet,
  Sparkles,
} from 'lucide-react';

export default function MobileBottomNav({
  user,
  activeTab,
  onOpenCashier,
  onOpenFreeplay,
  onOpenSpinWheel,
  onOpenAuth,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    {
      id: 'lobby',
      label: 'Lobby',
      icon: Gamepad2,
      action: () => router.push('/'),
      isActive: pathname === '/' || activeTab === 'lobby' || activeTab === 'main',
    },
    {
      id: 'games',
      label: 'Games',
      icon: Trophy,
      action: () => router.push('/games'),
      isActive: pathname === '/games' || activeTab === 'games',
    },
    {
      id: 'ids',
      label: 'Game IDs',
      icon: KeyRound,
      action: () => router.push('/accounts'),
      highlight: true,
      isActive: pathname === '/accounts' || activeTab === 'accounts',
    },
    {
      id: 'deposit',
      label: 'Deposit',
      icon: Wallet,
      action: () => {
        if (onOpenCashier) onOpenCashier('deposit');
        else router.push('/deposit');
      },
      isActive: pathname === '/deposit' || pathname === '/cashier' || activeTab === 'deposit',
    },
    {
      id: 'spin',
      label: 'Lucky Spin',
      icon: Sparkles,
      action: () => {
        if (onOpenSpinWheel) onOpenSpinWheel();
        else router.push('/spin-wheel');
      },
      isActive: pathname === '/spin-wheel' || activeTab === 'spin',
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07080b]/95 backdrop-blur-xl border-t border-[#d4af37]/30 px-2 pt-1.5 flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.85)]"
      style={{ paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom, 0px) + 8px))' }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive;

        if (tab.highlight) {
          return (
            <button
              key={tab.id}
              onClick={tab.action}
              className="relative -top-3 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] p-[2px] shadow-[0_0_20px_rgba(212,175,55,0.6)] animate-bounce">
                <div className="w-full h-full bg-[#0a0c14] rounded-[14px] flex items-center justify-center text-[#ffd700]">
                  <Icon size={22} className="stroke-[2.5]" />
                </div>
              </div>
              <span className="text-[10px] font-black text-[#ffd700] mt-0.5 tracking-tight font-sans">
                {tab.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={tab.action}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
              active
                ? 'text-[#ffd700] font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="relative">
              <Icon size={20} className={active ? 'stroke-[2.2]' : ''} />
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ffd700] shadow-[0_0_8px_#ffd700]" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight font-semibold">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
