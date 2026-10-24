'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  RefreshCw,
  Coins,
  Send,
  Upload,
  QrCode,
  Gamepad2,
  X,
  Eye,
  Headphones,
} from 'lucide-react';
import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import RoyalMobileBottomNav from '@/components/common/MobileBottomNav';
import RoyalFooter from '@/components/common/RoyalFooter';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/userSession';

export default function CashoutPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => getCachedUser());
  const [loadingUser, setLoadingUser] = useState(() => !getCachedUser());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Withdrawal Form State
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [method, setMethod] = useState('Cash App');
  const [recipientTag, setRecipientTag] = useState('');
  const [selectedGame, setSelectedGame] = useState('Orion Stars');
  const [userGameAccounts, setUserGameAccounts] = useState([]);

  // Proof uploads (Required by rules)
  const [gameScreenshot, setGameScreenshot] = useState('');
  const [gameScreenshotName, setGameScreenshotName] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [qrCodeImageName, setQrCodeImageName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Preview Proof Modal
  const [previewImage, setPreviewImage] = useState(null);

  // History State
  const [withdrawHistory, setWithdrawHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // 1. Fetch current user
  const fetchUser = async (isSilent = false) => {
    if (!isSilent) setLoadingUser(true);
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        saveCachedUser(data.user);
      } else if (!isSilent) {
        clearCachedUser();
        router.push('/login?redirect=/cashout');
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoadingUser(false);
    }
  };

  // 2. Fetch withdrawal history
  const fetchHistory = async (isSilent = false) => {
    if (!isSilent) setLoadingHistory(true);
    try {
      const res = await fetch('/api/payments/withdraw', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.withdrawals) {
        setWithdrawHistory(data.withdrawals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoadingHistory(false);
    }
  };

  // 3. Fetch user active game accounts
  const fetchGameAccounts = async () => {
    try {
      const res = await fetch('/api/game-accounts', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.gameAccounts)) {
        setUserGameAccounts(data.gameAccounts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchHistory();
    fetchGameAccounts();

    // 4-second live polling loop for instant approval/rejection updates
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        fetchHistory(true);
        fetchUser(true);
        fetchGameAccounts();
      }
    }, 4000);

    const handleFocus = () => {
      fetchHistory(true);
      fetchUser(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const compressImage = (file, maxDim = 1200, quality = 0.82) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleGameScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return alert('Screenshot file must be under 15MB');
    setGameScreenshotName(file.name);
    try {
      const compressed = await compressImage(file, 1200, 0.82);
      setGameScreenshot(compressed || null);
    } catch {
      const reader = new FileReader();
      reader.onload = () => setGameScreenshot(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleQrUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return alert('QR Code file must be under 15MB');
    setQrCodeImageName(file.name);
    try {
      const compressed = await compressImage(file, 800, 0.85);
      setQrCodeImage(compressed || null);
    } catch {
      const reader = new FileReader();
      reader.onload = () => setQrCodeImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleSubmitWithdraw = async (e) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 20) {
      setStatusMessage({ type: 'error', text: 'Minimum withdrawal amount is $20.00' });
      return;
    }

    if (!recipientTag.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your Payout Tag Name / Cashtag.' });
      return;
    }

    if (!gameScreenshot) {
      setStatusMessage({
        type: 'error',
        text: 'Game winning balance screenshot is required to verify your payout.',
      });
      return;
    }

    if (!qrCodeImage) {
      setStatusMessage({
        type: 'error',
        text: 'Your payout QR Code screenshot is required for fast dispatch.',
      });
      return;
    }

    const linkedAccount = userGameAccounts.find(
      (a) => (a.gameTitle || '').toLowerCase().trim() === selectedGame.toLowerCase().trim()
    );

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        amount: finalAmount,
        payoutMethod: method,
        method: method,
        recipientAddress: recipientTag.trim(),
        destinationAddress: recipientTag.trim(),
        gameTitle: selectedGame,
        gameAccountUsername: linkedAccount ? linkedAccount.username : '',
        gameScreenshot,
        qrCodeImage,
      };

      const res = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Redemption request of $${finalAmount.toFixed(2)} USD submitted! Our finance desk will dispatch funds in 5-15 minutes.`,
        });
        setRecipientTag('');
        setGameScreenshot('');
        setGameScreenshotName('');
        setQrCodeImage('');
        setQrCodeImageName('');
        fetchHistory(true);
        fetchUser(true);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to submit cashout request.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network connection error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const presetAmounts = [50, 100, 250, 500, 1000];
  const payoutMethods = ['Cash App', 'Bitcoin (BTC)', 'Zelle', 'Chime', 'PayPal'];

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col font-sans">
      {/* 1. Global Collapsible Royal Sidebar */}
      <RoyalSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        user={user}
        onOpenCashier={(tab) => {
          if (tab === 'deposit') router.push('/deposit');
          else router.push('/cashout');
        }}
        onOpenChat={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('open-live-chat'));
          }
        }}
      />

      {/* 2. Main Content Layout with dynamic left padding on desktop */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <RoyalNavbar
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          user={user}
          onOpenAuth={() => router.push('/login')}
          onOpenCashier={(tab) => {
            if (tab === 'deposit') router.push('/deposit');
            else router.push('/cashout');
          }}
        />

        {/* Center Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/35 bg-gradient-to-r from-[#181408] via-[#0d0f17] to-[#1a1405] p-6 sm:p-8 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <ArrowUpRight size={14} />
                  <span>Fast VIP Payout Terminal</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-serif font-black text-white tracking-tight">
                  REDEEM CASHOUT &amp; <span className="text-gold-gradient">WINNINGS</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl leading-relaxed">
                  Cash out your game platform winnings directly to Cash App, Bitcoin, Zelle, or Chime. Fast dispatch in 5-15 minutes guaranteed.
                </p>
              </div>

              {/* Balance Widget Card */}
              <div className="p-4 rounded-2xl bg-black/80 border border-[#d4af37]/40 flex flex-col items-end min-w-[170px] shadow-lg">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-mono">
                  AVAILABLE CASHOUT
                </span>
                <span className="font-mono font-black text-2xl sm:text-3xl text-emerald-400 mt-0.5">
                  ${Number(user?.availableBalance !== undefined ? user.availableBalance : (user?.balance ?? 0)).toFixed(2)} USD
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 font-mono">
                  <ShieldCheck size={11} className="text-emerald-400" /> Min Redemption: $20.00
                </span>
              </div>
            </div>
          </div>

          {/* Alert Message */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm font-bold shadow-lg transition-all animate-fade-in ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/70 border-red-500/50 text-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Form & Guarantee Split Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Form Inputs */}
            <form onSubmit={handleSubmitWithdraw} className="lg:col-span-7 space-y-6">
              {/* Step 1: Select Amount */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ffd700] to-[#b38f26] text-black flex items-center justify-center text-xs font-black shadow-md">
                      1
                    </span>
                    Select Cashout Amount ($ USD)
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">Min $20.00</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {presetAmounts.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setAmount(p);
                        setCustomAmount('');
                      }}
                      className={`py-3 rounded-xl font-mono font-black text-sm transition-all cursor-pointer ${
                        !customAmount && amount === p
                          ? 'bg-gradient-to-tr from-[#ffd700] via-[#d4af37] to-[#b38f26] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                          : 'bg-slate-900 border border-slate-800 text-gray-200 hover:border-[#d4af37]/30'
                      }`}
                    >
                      ${p}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase font-mono">
                    Or Enter Custom Amount:
                  </label>
                  <div className="relative">
                    <DollarSign
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="number"
                      min="20"
                      step="1"
                      placeholder="e.g. 150"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/60 border border-slate-700 focus:border-[#ffd700] text-sm font-mono font-bold text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Select Payout Method */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-4 shadow-xl">
                <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ffd700] to-[#b38f26] text-black flex items-center justify-center text-xs font-black shadow-md">
                    2
                  </span>
                  Select Payout Method
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {payoutMethods.map((m) => {
                    const isSelected = method === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#d4af37]/20 border-[#ffd700] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                            : 'bg-slate-900/80 border-slate-800 hover:border-[#d4af37]/40'
                        }`}
                      >
                        <span className="text-xs font-serif font-bold text-white truncate">{m}</span>
                        {isSelected && <CheckCircle2 size={14} className="text-[#ffd700] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                    Recipient {method} Address / Cashtag *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      method === 'Cash App'
                        ? 'e.g. $MyCashtag'
                        : method === 'Bitcoin (BTC)'
                        ? 'e.g. bc1q...'
                        : 'e.g. your payment email or phone'
                    }
                    value={recipientTag}
                    onChange={(e) => setRecipientTag(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-slate-700 focus:border-[#ffd700] text-xs text-white placeholder-gray-500 outline-none"
                  />
                </div>
              </div>

              {/* Step 3: Platform & Proof Uploads */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-5 shadow-xl">
                <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ffd700] to-[#b38f26] text-black flex items-center justify-center text-xs font-black shadow-md">
                    3
                  </span>
                  Platform &amp; Verification Uploads
                </h3>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase font-mono">
                    Deduct winnings from platform:
                  </label>
                  <select
                    value={selectedGame}
                    onChange={(e) => setSelectedGame(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-slate-700 focus:border-[#ffd700] text-xs font-bold text-white outline-none cursor-pointer"
                  >
                    {userGameAccounts.length > 0 ? (
                      userGameAccounts.map((acc, i) => (
                        <option key={i} value={acc.gameTitle || acc.title} className="bg-slate-900 text-white">
                          {acc.gameTitle || acc.title} (ID: {acc.username})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Orion Stars" className="bg-slate-900 text-white">Orion Stars</option>
                        <option value="Ultra Panda" className="bg-slate-900 text-white">Ultra Panda</option>
                        <option value="Fire Kirin" className="bg-slate-900 text-white">Fire Kirin</option>
                        <option value="Game Vault" className="bg-slate-900 text-white">Game Vault</option>
                        <option value="Juwa" className="bg-slate-900 text-white">Juwa 777</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Upload Game Screenshot */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2 uppercase font-mono">
                      Game Winning Screenshot *
                    </label>
                    <div className="relative border-2 border-dashed border-[#d4af37]/40 hover:border-[#ffd700] rounded-2xl p-4 text-center bg-black/40 transition group cursor-pointer">
                      <input
                        type="file"
                        required
                        accept="image/*"
                        onChange={handleGameScreenshotUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {gameScreenshot ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <img
                            src={gameScreenshot}
                            alt="Game Screenshot"
                            className="w-16 h-16 object-cover rounded-xl border border-[#ffd700]/50 shadow-md"
                          />
                          <span className="text-[11px] text-emerald-400 font-bold truncate max-w-[150px]">
                            {gameScreenshotName || 'GameScreenshot.png'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 py-2">
                          <Gamepad2 size={24} className="text-[#ffd700]" />
                          <span className="text-xs font-bold text-white">Game Balance Proof</span>
                          <span className="text-[10px] text-gray-500 font-mono">Screenshot inside game</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Payout QR Code */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-2 uppercase font-mono">
                      Your Payout QR Code *
                    </label>
                    <div className="relative border-2 border-dashed border-[#d4af37]/40 hover:border-[#ffd700] rounded-2xl p-4 text-center bg-black/40 transition group cursor-pointer">
                      <input
                        type="file"
                        required
                        accept="image/*"
                        onChange={handleQrUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {qrCodeImage ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <img
                            src={qrCodeImage}
                            alt="Payout QR"
                            className="w-16 h-16 object-cover rounded-xl border border-[#ffd700]/50 shadow-md"
                          />
                          <span className="text-[11px] text-emerald-400 font-bold truncate max-w-[150px]">
                            {qrCodeImageName || 'PayoutQR.png'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 py-2">
                          <QrCode size={24} className="text-emerald-400" />
                          <span className="text-xs font-bold text-white">Cashtag / Payout QR</span>
                          <span className="text-[10px] text-gray-500 font-mono">From Cash App or Wallet</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-gold py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Verifying &amp; Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>REQUEST CASHOUT OF ${finalAmount.toFixed(2)} USD</span>
                    </>
                  )}
                </button>
              </form>

            {/* Right 5 Columns: Payout Guarantee Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-[#0d0f17]/95 border border-[#d4af37]/35 space-y-5 shadow-2xl sticky top-24">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                    CASHOUT PROTOCOL
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold flex items-center gap-1">
                    <ShieldCheck size={12} />
                    INSTANT DISPATCH
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif font-black text-xl text-white">5-15 Minute Payout Guarantee</h3>
                  <p className="text-xs text-gray-400">
                    Our financial desk processes redemptions 24/7/365 with zero delays and no hidden deductions.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-black/80 border border-white/5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Clock size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Speed Dispatch</span>
                      <span className="text-[11px] text-gray-400">Typically delivered in 5 to 15 minutes</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/80 border border-white/5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#ffd700]/20 text-[#ffd700] flex items-center justify-center shrink-0">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">1:1 Cash Ratio</span>
                      <span className="text-[11px] text-gray-400">Every 1 SC or Credit = $1.00 USD</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/80 border border-white/5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Zero Processing Fees</span>
                      <span className="text-[11px] text-gray-400">100% of your redeemed cash is sent to you</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('open-live-chat'));
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#ffd700] text-gray-300 hover:text-[#ffd700] text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Headphones size={15} />
                  <span>Questions? Contact 24/7 VIP Concierge</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Section: Real-Time Cashout History */}
          <div className="p-6 rounded-3xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-black text-lg text-white">Your Cashout History</h3>
                <p className="text-xs text-gray-400">Live 4-second synchronization with payout desk</p>
              </div>
              <button
                type="button"
                onClick={() => fetchHistory(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white transition"
                title="Refresh history"
              >
                <RefreshCw size={14} className={loadingHistory ? 'animate-spin' : ''} />
              </button>
            </div>

            {withdrawHistory.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs font-mono">
                No cashout requests recorded yet. Start spinning and redeem your winnings above!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 font-mono text-[10px] uppercase">
                      <th className="py-2.5 px-3">Date / Time</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Platform</th>
                      <th className="py-2.5 px-3">Recipient Tag</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Proof</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {withdrawHistory.map((w, i) => (
                      <tr key={i} className="hover:bg-white/5 transition">
                        <td className="py-3 px-3 text-gray-400">
                          {new Date(w.createdAt || Date.now()).toLocaleDateString()}{' '}
                          {new Date(w.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">{w.payoutMethod || w.method || 'Cash App'}</td>
                        <td className="py-3 px-3 font-black text-emerald-400">
                          ${Number(w.amount || 0).toFixed(2)} USD
                        </td>
                        <td className="py-3 px-3 text-gray-300">{w.gameTitle || 'Casino Vault'}</td>
                        <td className="py-3 px-3 text-gray-400 truncate max-w-[120px]">{w.recipientAddress || w.destinationAddress || '-'}</td>
                        <td className="py-3 px-3">
                          {w.status === 'approved' || w.status === 'completed' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              PAID OUT
                            </span>
                          ) : w.status === 'rejected' || w.status === 'failed' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                              REJECTED
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {w.gameScreenshot || w.qrCodeImage ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage(w.gameScreenshot || w.qrCodeImage)}
                              className="text-xs text-[#ffd700] hover:underline inline-flex items-center gap-1 font-bold"
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        <RoyalFooter />
      </div>

      <RoyalMobileBottomNav />

      {/* Proof Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] bg-slate-950 border border-[#d4af37]/40 rounded-2xl overflow-hidden p-2 shadow-2xl"
          >
            <div className="flex items-center justify-between p-2 border-b border-white/10 mb-2">
              <span className="text-xs font-mono text-gray-300">Cashout Verification Proof</span>
              <button onClick={() => setPreviewImage(null)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <img src={previewImage} alt="Proof" className="max-h-[70vh] w-auto max-w-full object-contain mx-auto rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
