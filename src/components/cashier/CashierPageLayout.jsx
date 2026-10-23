'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import RoyalFooter from '@/components/common/RoyalFooter';
import LiveChatModal from '@/components/support/LiveChatModal';
import AuthModal from '@/components/common/AuthModal';
import CashierModal from '@/components/cashier/CashierModal';
import RoyalFreeplayModal from '@/components/freeplay/RoyalFreeplayModal';
import NotificationsModal from '@/components/common/NotificationsModal';
import KycModal from '@/components/common/KycModal';
import CashierHub from '@/components/cashier/CashierHub';

export default function CashierPageLayout({ initialTab = 'deposit' }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' });
  const [cashierModal, setCashierModal] = useState({ open: false, tab: 'deposit' });
  const [chatOpen, setChatOpen] = useState(false);
  const [freeplayOpen, setFreeplayOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [kycOpen, setKycOpen] = useState(false);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if ((data.authenticated || data.success) && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col justify-between selection:bg-[#ffd700] selection:text-black font-sans">
      {/* 1. Global Collapsible Royal Sidebar */}
      <RoyalSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        user={user}
        onSelectCategory={() => router.push('/')}
        onOpenCashier={(tab) => setActiveTab(tab || 'deposit')}
        onOpenGameVault={() => router.push('/accounts')}
        onOpenFreeplay={() => setFreeplayOpen(true)}
        onOpenLedger={() => setActiveTab('history')}
        onOpenKyc={() => setKycOpen(true)}
        onOpenChat={() => setChatOpen(true)}
      />

      {/* 2. Main Content Layout with dynamic left padding on desktop */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <RoyalNavbar
          user={user}
          onOpenAuth={(tab) => setAuthModal({ open: true, tab: tab || 'login' })}
          onOpenCashier={(tab) => {
            if (tab) setActiveTab(tab);
            else setActiveTab('deposit');
          }}
          onOpenFreeplay={() => setFreeplayOpen(true)}
          onOpenGameVault={() => router.push('/accounts')}
          onOpenNotifications={() => setNotifsOpen(true)}
          onOpenKyc={() => setKycOpen(true)}
          onLogout={handleLogout}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Main Cashier Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full pb-24 md:pb-12 min-w-0">
          {/* Breadcrumb to lobby */}
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ffd700] hover:text-[#fff0a8] transition"
            >
              <ArrowLeft size={14} />
              <span>Back to Casino Lobby</span>
            </Link>
          </div>

          {/* Cashier Hub with Active Tab */}
          <CashierHub
            activeTab={activeTab}
            onTabChange={(t) => setActiveTab(t)}
            user={user}
            onOpenAuth={(tab) => setAuthModal({ open: true, tab: tab || 'login' })}
            onBackToLobby={() => router.push('/')}
          />
        </main>

        {/* Royal Footer */}
        <RoyalFooter />
      </div>

      {/* 5. Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab === 'deposit' ? 'deposit' : 'lobby'}
        onSelectTab={() => {}}
        onOpenCashier={(tab) => setActiveTab(tab || 'deposit')}
        onOpenFreeplay={() => setFreeplayOpen(true)}
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModal.open}
        initialTab={authModal.tab}
        onClose={() => setAuthModal({ open: false, tab: 'login' })}
        onAuthSuccess={refreshUser}
      />

      <CashierModal
        isOpen={cashierModal.open}
        initialTab={cashierModal.tab}
        onClose={() => setCashierModal({ open: false, tab: 'deposit' })}
        user={user}
        onBalanceChange={refreshUser}
      />

      <LiveChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        user={user}
      />

      <RoyalFreeplayModal
        isOpen={freeplayOpen}
        onClose={() => setFreeplayOpen(false)}
        user={user}
        onClaimSuccess={refreshUser}
        onOpenAuth={(tab) => setAuthModal({ open: true, tab: tab || 'login' })}
      />

      <NotificationsModal
        isOpen={notifsOpen}
        onClose={() => setNotifsOpen(false)}
        user={user}
      />

      <KycModal
        isOpen={kycOpen}
        onClose={() => setKycOpen(false)}
        user={user}
        onSuccess={refreshUser}
      />
    </div>
  );
}
