'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Gamepad2,
  Sparkles,
  Wallet,
  TrendingUp,
  Key,
  Gift,
  Download,
  Coins,
  MessageSquare,
  Shield,
  Layers,
  Crown,
  X,
  Flame,
  Fish,
  Home,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function RoyalSidebar({
  isOpen,
  onClose,
  activeCategory,
  onSelectCategory,
  currentView = 'lobby',
  onSelectCashierTab,
  user,
  onOpenCashier,
  onOpenGameVault,
  onOpenFreeplay,
  onOpenLedger,
  onOpenKyc,
  onOpenChat,
  onOpenReferral,
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const navCategories = [
    { id: 'all', label: 'All Sweepstakes', icon: Home, path: '/' },
    { id: 'games', label: 'Sweepstakes Catalog', icon: Gamepad2, path: '/games' },
    { id: 'accounts', label: 'My Game Accounts', icon: Key, path: '/accounts' },
    { id: 'promotions', label: 'Promotions & Drops', icon: Gift, path: '/promotions' },
  ];

  const quickServices = [
    { id: 'deposit', label: 'Deposit & Bonus', icon: Wallet, color: 'text-[#ffd700]', tab: 'deposit', path: '/deposit' },
    { id: 'withdraw', label: 'Redeem / Cashout', icon: TrendingUp, color: 'text-emerald-400', tab: 'withdraw', path: '/cashout' },
    { id: 'referral', label: 'Invite Friends & Earn', icon: Gift, color: 'text-emerald-400', action: onOpenReferral },
    { id: 'load', label: 'Load Game Credits', icon: Key, color: 'text-purple-400', tab: 'load', path: '/accounts' },
    { id: 'history', label: 'Transaction History', icon: Coins, color: 'text-yellow-500', tab: 'history', path: '/history' },
    { id: 'chat', label: 'VIP Concierge 24/7', icon: MessageSquare, color: 'text-blue-400', action: onOpenChat },
    { id: 'kyc', label: 'Identity KYC', icon: Shield, color: 'text-emerald-300', action: onOpenKyc },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container - Permanently Static Left Rail */}
      <aside
        className={`fixed md:relative top-0 left-0 bottom-0 z-50 md:z-20 bg-[#07090e]/95 border-r border-[#d4af37]/20 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 shadow-2xl shrink-0 ${
          // Desktop Width
          collapsed ? 'md:w-20' : 'md:w-64'
        } ${
          // Mobile Visibility
          isOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'
        } h-screen md:h-full`}
      >
        {/* Mobile Top Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#ffd700] to-[#b38f26]">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full bg-black" />
            </div>
            <span className="font-serif font-black text-sm text-gold-gradient">ZORRA ROYALS</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden md:flex items-center justify-end p-2.5 border-b border-white/5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#ffd700] hover:bg-white/5 transition"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
          {/* Group 1: Game Categories */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-2 text-[10px] uppercase font-black tracking-widest text-gray-500 font-mono">
                Game Categories
              </p>
            )}
            <div className="space-y-1">
              {navCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = currentView === 'lobby' && activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (cat.path) {
                        router.push(cat.path);
                      } else if (onSelectCategory) {
                        onSelectCategory(cat.id);
                      }
                      if (window.innerWidth < 768) onClose();
                    }}
                    title={collapsed ? cat.label : undefined}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                      isActive
                        ? 'bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#b38f26] text-black shadow-[0_4px_16px_rgba(212,175,55,0.4)] font-black'
                        : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black stroke-[2.5]' : 'text-gray-400'}`} />
                    {!collapsed && <span className="truncate">{cat.label}</span>}
                    {isActive && !collapsed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-black ml-auto shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Services & Actions */}
          <div>
            {!collapsed && (
              <p className="px-3 pb-2 text-[10px] uppercase font-black tracking-widest text-[#d4af37]/70 font-mono">
                Cashier & Vault
              </p>
            )}
            <div className="space-y-1">
              {quickServices.map((svc, i) => {
                const Icon = svc.icon;
                const isTabActive = svc.tab && currentView === svc.tab;

                if (svc.tab) {
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (svc.path) {
                          router.push(svc.path);
                        } else if (onSelectCashierTab) {
                          onSelectCashierTab(svc.tab);
                        }
                        if (window.innerWidth < 768) onClose();
                      }}
                      title={collapsed ? svc.label : undefined}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isTabActive
                          ? 'bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#b38f26] text-black shadow-[0_4px_16px_rgba(212,175,55,0.4)] font-black'
                          : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <div className={`p-1 rounded-md shrink-0 ${isTabActive ? 'bg-black/15' : 'bg-white/5'}`}>
                        <Icon className={`w-3.5 h-3.5 ${isTabActive ? 'text-black stroke-[2.5]' : svc.color}`} />
                      </div>
                      {!collapsed && <span className="truncate">{svc.label}</span>}
                      {isTabActive && !collapsed && (
                        <span className="w-1.5 h-1.5 rounded-full bg-black ml-auto shrink-0" />
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (svc.action) svc.action();
                      if (window.innerWidth < 768) onClose();
                    }}
                    title={collapsed ? svc.label : undefined}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all ${
                      collapsed ? 'justify-center px-0' : ''
                    }`}
                  >
                    <div className="p-1 rounded-md bg-white/5 shrink-0">
                      <Icon className={`w-3.5 h-3.5 ${svc.color}`} />
                    </div>
                    {!collapsed && <span className="truncate">{svc.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom VIP Pill (Desktop & Mobile) */}
        {!collapsed && (
          <div className="p-3 border-t border-white/5">
            <div className="p-3 rounded-2xl bg-gradient-to-b from-[#141824] to-[#0c0e16] border border-[#d4af37]/30 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-[#ffd700]" />
                  <span className="text-xs font-black text-gold-gradient uppercase tracking-wider">
                    {user?.vipTier || 'Bronze VIP'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">Level {user?.streakDay || 1}</span>
              </div>
              <div className="w-full bg-black/60 rounded-full h-1.5 mt-2 overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-[#ffd700] to-[#d4af37] rounded-full"
                  style={{ width: `${Math.min(100, (user?.streakDay || 1) * 15)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
