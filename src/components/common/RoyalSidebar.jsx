'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Gamepad2,
  Trophy,
  KeyRound,
  Wallet,
  Receipt,
  Gift,
  Download,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  Users,
  Headphones,
  Sparkles,
  X
} from 'lucide-react';

export default function RoyalSidebar({
  collapsed: controlledCollapsed,
  setCollapsed: controlledSetCollapsed,
  mobileOpen: controlledMobileOpen,
  setMobileOpen: controlledSetMobileOpen,
  isOpen, // backwards compatibility
  onClose, // backwards compatibility
  user,
  onOpenWallet,
  onOpenCashier,
  onOpenGameRequest,
  onOpenChat,
  onOpenDailyBonus,
  onOpenFreeplay,
  onOpenSpinWheel,
  onOpenReferral,
  currentView,
  activeCategory,
  onSelectCategory,
  onSelectCashierTab,
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Internal state fallback if not controlled by parent
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setCollapsed = controlledSetCollapsed || setInternalCollapsed;

  // Mobile open state: support mobileOpen or isOpen
  const mobileOpen = controlledMobileOpen !== undefined ? controlledMobileOpen : Boolean(isOpen);
  const setMobileOpen = (open) => {
    if (controlledSetMobileOpen) controlledSetMobileOpen(open);
    if (!open && onClose) onClose();
  };

  const navItems = [
    { label: 'Game Lobby', path: '/', icon: Gamepad2, badge: 'HOT' },
    { label: 'All Games', path: '/games', icon: Trophy },
    { label: 'My Game IDs', path: '/accounts', icon: KeyRound, highlight: true },
    {
      label: 'Deposit Funds',
      path: '/deposit',
      icon: Wallet,
      action: onOpenCashier ? () => onOpenCashier('deposit') : (onOpenWallet ? () => onOpenWallet('deposit') : undefined)
    },
    {
      label: 'Redeem Cashout',
      path: '/cashout',
      icon: Receipt,
      action: onOpenCashier ? () => onOpenCashier('withdraw') : (onOpenWallet ? () => onOpenWallet('withdraw') : undefined)
    },
    {
      label: 'Lucky Spin Wheel',
      path: '/spin-wheel',
      icon: Sparkles,
      glow: true,
      action: onOpenSpinWheel || (() => router.push('/spin-wheel'))
    },
    {
      label: 'Refer & Earn',
      path: '/referral',
      icon: Users,
      badge: 'REWARDS',
      glow: true,
      action: onOpenReferral
    },
    { label: 'Promotions & VIP', path: '/promotions', icon: Crown },
    { label: 'Download App', path: '/download-app', icon: Download, badge: 'APK / iOS' },
    { label: 'How To Play', path: '/how-to-play', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out border-r border-[#d4af37]/25 bg-[#07080b]/98 backdrop-blur-xl shadow-2xl ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        }}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#d4af37]/20">
          <div
            onClick={() => {
              router.push('/');
              setMobileOpen(false);
            }}
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            <div
              className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden border-2 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.45)] p-0.5 bg-gradient-to-tr from-[#d4af37] via-[#fff0a8] to-[#997b24]"
              style={{ position: 'relative', width: '44px', height: '44px', minWidth: '44px', flexShrink: 0 }}
            >
              <Image
                src="/logo.png"
                alt="Zorra Royals VIP Palace"
                fill
                className="object-cover rounded-lg bg-black"
                priority
              />
            </div>
            {(!collapsed || mobileOpen) && (
              <div className="flex flex-col">
                <span className="font-serif font-black text-sm tracking-wider leading-tight text-white">
                  ZORRA <span className="text-[#ffd700]">ROYALS</span>
                </span>
                <span className="text-[10px] tracking-widest text-[#d4af37]/80 font-mono font-semibold uppercase">
                  VIP PALACE
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-[#ffd700] hover:border-[#ffd700] transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-gray-400 hover:text-white rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Online Status Pill */}
        {(!collapsed || mobileOpen) && (
          <div className="px-4 py-2">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/80 border border-[#d4af37]/20 text-xs shadow-inner">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-300 font-mono text-[11px] font-bold">1,842 PLAYERS</span>
              </div>
              <span className="text-[10px] font-black text-[#ffd700] tracking-wider font-mono">ONLINE</span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.path ? pathname === item.path : false;

            const content = (
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#ffd700]/25 via-[#d4af37]/20 to-transparent text-white border border-[#ffd700] shadow-[0_0_15px_rgba(212,175,55,0.3)] font-black'
                    : item.highlight
                    ? 'bg-[#d4af37]/15 text-[#ffd700] border border-[#d4af37]/40 hover:bg-[#d4af37]/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-[#d4af37]/20'
                } ${collapsed && !mobileOpen ? 'justify-center px-0' : ''}`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-gradient-to-tr from-[#ffd700] to-[#b38f26] text-black shadow-md'
                      : item.highlight
                      ? 'bg-[#d4af37]/25 text-[#ffd700]'
                      : 'bg-slate-900/80 text-slate-400 group-hover:text-[#ffd700]'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'stroke-[2.5]' : ''} />
                </div>

                {(!collapsed || mobileOpen) && (
                  <div className="flex items-center justify-between flex-1 overflow-hidden min-w-0">
                    <span className="truncate text-xs font-bold">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ml-1 shrink-0 ${
                        item.badge === 'ONLINE'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-[#d4af37]/20 text-[#ffd700] border-[#d4af37]/40'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {item.glow && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse ml-1 shrink-0">
                        FREE
                      </span>
                    )}
                  </div>
                )}
              </div>
            );

            if (item.action) {
              return (
                <div
                  key={idx}
                  onClick={() => {
                    item.action();
                    setMobileOpen(false);
                  }}
                >
                  {content}
                </div>
              );
            }

            return (
              <div
                key={idx}
                onClick={() => {
                  router.push(item.path);
                  setMobileOpen(false);
                }}
              >
                {content}
              </div>
            );
          })}
        </div>

        {/* Footer Quick Action */}
        {(!collapsed || mobileOpen) ? (
          <div className="p-3 border-t border-[#d4af37]/20 bg-black/40 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenCashier) onOpenCashier('deposit');
                  else if (onOpenWallet) onOpenWallet('deposit');
                  else router.push('/deposit');
                  setMobileOpen(false);
                }}
                className="btn-gold text-[11px] py-2 font-black flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(212,175,55,0.3)]"
              >
                <Wallet size={13} />
                <span>DEPOSIT</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenCashier) onOpenCashier('withdraw');
                  else if (onOpenWallet) onOpenWallet('withdraw');
                  else router.push('/cashout');
                  setMobileOpen(false);
                }}
                className="rounded-xl bg-slate-900 border border-slate-700 hover:border-[#ffd700]/50 text-slate-200 text-[11px] py-2 font-bold flex items-center justify-center gap-1 transition-all"
              >
                <span>REDEEM</span>
              </button>
            </div>
            <div className="text-[10px] text-center text-slate-500 font-mono">
              ZORRA ROYALS v1.0 • 2026
            </div>
          </div>
        ) : (
          <div className="p-2 border-t border-[#d4af37]/20 flex justify-center">
            <button
              onClick={() => {
                if (onOpenCashier) onOpenCashier('deposit');
                else if (onOpenWallet) onOpenWallet('deposit');
                else router.push('/deposit');
              }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ffd700] via-[#d4af37] to-[#b38f26] text-black flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:scale-105 transition-transform"
              title="Deposit Credits"
            >
              <Wallet size={18} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
