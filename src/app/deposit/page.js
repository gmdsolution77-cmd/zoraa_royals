'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  AlertCircle,
  Clock,
  Sparkles,
  QrCode,
  DollarSign,
  RefreshCw,
  ExternalLink,
  Download,
  Eye,
  X,
  FileText,
  Gamepad2,
  Headphones,
} from 'lucide-react';
import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import RoyalMobileBottomNav from '@/components/common/MobileBottomNav';
import RoyalFooter from '@/components/common/RoyalFooter';

import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/userSession';

export default function DepositPage() {
  const router = useRouter();
  const [user, setUser] = useState(() => getCachedUser());
  const [loadingUser, setLoadingUser] = useState(() => !getCachedUser());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Settings for Bonus System
  const [settings, setSettings] = useState({
    welcomeBonusPercent: 300,
    regularBonusPercent: 50,
  });

  // Deposit Form State
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [senderAccount, setSenderAccount] = useState('');
  const [playerPaymentEmail, setPlayerPaymentEmail] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [proofFileName, setProofFileName] = useState('');
  const [selectedGame, setSelectedGame] = useState('Orion Stars');
  const [userGameAccounts, setUserGameAccounts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // QR Preview Modal & Proof Preview Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [previewProofModal, setPreviewProofModal] = useState(null);

  // History State
  const [depositHistory, setDepositHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // 1. Fetch current user & settings
  const fetchUserAndSettings = async (isSilent = false) => {
    if (!isSilent) setLoadingUser(true);
    try {
      const [uRes, sRes] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/admin/settings', { cache: 'no-store' }),
      ]);
      const [uData, sData] = await Promise.all([uRes.json(), sRes.json()]);

      if (uData.authenticated && uData.user) {
        setUser(uData.user);
        saveCachedUser(uData.user);
        if (uData.user.email) {
          setPlayerPaymentEmail((prev) => prev || uData.user.email);
        }
      } else if (!isSilent) {
        clearCachedUser();
        router.push('/login?redirect=/deposit');
      }

      if (sData.success && sData.settings) {
        setSettings({
          welcomeBonusPercent: Number(sData.settings.welcomeBonusPercent ?? 300),
          regularBonusPercent: Number(sData.settings.regularBonusPercent ?? 50),
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoadingUser(false);
    }
  };

  // 2. Fetch gateways
  const fetchGateways = async () => {
    try {
      const res = await fetch('/api/payments/methods');
      const data = await res.json();
      if (data.success && data.methods && data.methods.length > 0) {
        setGateways(data.methods);
        setSelectedGateway(data.methods[0]);
      } else {
        const defaults = [
          {
            id: 'cashapp',
            name: 'Cash App',
            type: 'cashapp',
            tagName: '$ZorraRoyalsVIP',
            accountDetails: '$ZorraRoyalsVIP',
            paymentUrl: 'https://cash.app/$ZorraRoyalsVIP',
            qrCode: '',
            minDeposit: 10,
            instructions: 'Send exact amount via Cash App to our VIP handle. Upload receipt screenshot below.',
          },
          {
            id: 'crypto-btc',
            name: 'Bitcoin (BTC)',
            type: 'crypto',
            tagName: 'bc1qzorraroyalsvippalace777depositaddress',
            accountDetails: 'bc1qzorraroyalsvippalace777depositaddress',
            paymentUrl: '',
            qrCode: '',
            minDeposit: 20,
            instructions: 'Send BTC to the address. 1 network confirmation required for automated balance credit.',
          },
          {
            id: 'zelle',
            name: 'Zelle Pay',
            type: 'zelle',
            tagName: 'vip@zorraroyals.com',
            accountDetails: 'vip@zorraroyals.com',
            paymentUrl: '',
            qrCode: '',
            minDeposit: 25,
            instructions: 'Send via Zelle from your banking app. Use your username in memo and upload receipt.',
          },
        ];
        setGateways(defaults);
        setSelectedGateway(defaults[0]);
      }
    } catch {
      // fallback
    }
  };

  // 3. Fetch deposit history
  const fetchHistory = async (isSilent = false) => {
    if (!isSilent) setLoadingHistory(true);
    try {
      const res = await fetch('/api/payments/deposit', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.deposits) {
        setDepositHistory(data.deposits);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setLoadingHistory(false);
    }
  };

  // 4. Fetch player active game accounts
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
    fetchUserAndSettings();
    fetchGateways();
    fetchHistory();
    fetchGameAccounts();

    // Zero-refresh live polling: updates pending deposits as soon as staff approves
    const pollInterval = setInterval(() => {
      if (!document.hidden) {
        fetchHistory(true);
        fetchUserAndSettings(true);
        fetchGameAccounts();
      }
    }, 4000);

    const handleFocus = () => {
      fetchHistory(true);
      fetchUserAndSettings(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const handleCopy = (text, fieldName) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit.');
      return;
    }

    setProofFileName(file.name);
    try {
      const compressed = await compressImage(file, 1200, 0.82);
      setProofImage(compressed || null);
    } catch {
      const reader = new FileReader();
      reader.onload = () => setProofImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  // Bonus Calculation Logic
  const hasApprovedDeposit =
    depositHistory.some((d) => d.status === 'approved' || d.status === 'completed') ||
    Boolean(user?.totalDeposited && user.totalDeposited > 0);

  const bonusPercent = hasApprovedDeposit
    ? settings.regularBonusPercent
    : settings.welcomeBonusPercent;
  const isWelcome = !hasApprovedDeposit;

  const bonusSC = Number(((finalAmount * bonusPercent) / 100).toFixed(2));
  const totalSC = Number((finalAmount + bonusSC).toFixed(2));

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 5) {
      setStatusMessage({ type: 'error', text: 'Minimum deposit is $5.00' });
      return;
    }

    if (!senderAccount.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your sending Tag Name / Cashtag.' });
      return;
    }

    if (!playerPaymentEmail.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your payment email address.' });
      return;
    }

    if (!proofImage) {
      setStatusMessage({ type: 'error', text: 'Please upload your payment receipt screenshot.' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const activeGateway = selectedGateway || (gateways && gateways.length > 0 ? gateways[0] : null);
      const chosenMethodName = activeGateway?.name || 'Cash App';
      const chosenMethodId = activeGateway?.id || 'cashapp';

      const linkedAccount = userGameAccounts.find(
        (a) => (a.gameTitle || '').toLowerCase().trim() === selectedGame.toLowerCase().trim()
      );

      const payload = {
        amount: finalAmount,
        method: chosenMethodName,
        methodName: chosenMethodName,
        methodId: chosenMethodId,
        playerTagName: senderAccount.trim(),
        playerPaymentEmail: playerPaymentEmail.trim(),
        senderNote: senderAccount.trim(),
        transactionId: transactionId.trim(),
        txHash: transactionId.trim(),
        proofImage,
        gameTitle: selectedGame,
        gameAccountUsername: linkedAccount ? linkedAccount.username : '',
      };

      const res = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Deposit request of $${finalAmount.toFixed(2)} submitted successfully! Staff will verify and load your credits in 2-5 minutes.`,
        });
        setSenderAccount('');
        setTransactionId('');
        setProofImage('');
        setProofFileName('');
        fetchHistory(true);
        fetchUserAndSettings(true);
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to submit deposit request.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network connection error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const presetAmounts = [20, 50, 100, 200, 500];

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
          if (tab === 'withdraw') router.push('/cashout');
          else router.push('/deposit');
        }}
        onOpenGameRequest={() => router.push('/games')}
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
            if (tab === 'withdraw') router.push('/cashout');
            else router.push('/deposit');
          }}
        />

        {/* Center Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/35 bg-gradient-to-r from-[#181408] via-[#0d0f17] to-[#1a1405] p-6 sm:p-8 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ffd700]/15 border border-[#ffd700]/35 text-[#ffd700] text-xs font-bold uppercase tracking-wider mb-2">
                  <ArrowDownLeft size={14} />
                  <span>Instant VIP Deposit Gateway</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-serif font-black text-white tracking-tight">
                  LOAD YOUR <span className="text-gold-gradient">PLAYING BALANCE</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl leading-relaxed">
                  Fund your account instantly with 0% fees. Direct crediting for Ultra Panda, Fire Kirin, Orion Stars, Game Vault, and Juwa.
                </p>
              </div>

              {/* Balance Widget Card */}
              <div className="p-4 rounded-2xl bg-black/80 border border-[#d4af37]/40 flex flex-col items-end min-w-[170px] shadow-lg">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase font-mono">
                  WALLET BALANCE
                </span>
                <span className="font-mono font-black text-2xl sm:text-3xl text-gold-gradient mt-0.5">
                  ${Number(user?.balance ?? 0).toFixed(2)} USD
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                  <CheckCircle2 size={11} /> 1:1 USD Redeemable
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

          {/* Form & Gateway Split Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Step 1, 2, 3, 4 Inputs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Select Payment Gateway */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ffd700] to-[#b38f26] text-black flex items-center justify-center text-xs font-black shadow-md">
                      1
                    </span>
                    Select Payment Gateway
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">0% Fee</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {gateways.map((gw) => {
                    const isSelected = selectedGateway?.id === gw.id;
                    return (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setSelectedGateway(gw)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#d4af37]/20 border-[#ffd700] shadow-[0_0_15px_rgba(212,175,55,0.35)]'
                            : 'bg-slate-900/80 border-slate-800 hover:border-[#d4af37]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-serif font-bold text-white truncate">
                            {gw.name}
                          </span>
                          {isSelected && (
                            <CheckCircle2 size={14} className="text-[#ffd700] flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 uppercase font-mono">
                          Min ${gw.minDeposit || 10}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Choose Deposit Amount & Live Bonus Preview */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ffd700] to-[#b38f26] text-black flex items-center justify-center text-xs font-black shadow-md">
                      2
                    </span>
                    Select Amount ($ USD)
                  </h3>
                  <span className="text-xs text-[#ffd700] font-bold flex items-center gap-1 font-mono">
                    <Sparkles size={13} className="text-amber-400" />
                    +{bonusPercent}% {isWelcome ? 'First Deposit Match' : 'Reload Bonus'}
                  </span>
                </div>

                {/* Amount presets */}
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

                {/* Custom Amount input */}
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
                      min="5"
                      step="1"
                      placeholder="e.g. 75"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/60 border border-slate-700 focus:border-[#ffd700] text-sm font-mono font-bold text-white outline-none"
                    />
                  </div>
                </div>

                {/* Live Bonus Reward Calculation Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#0d0f17] to-amber-500/10 border border-[#ffd700]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                  <div>
                    <span className="text-[10px] font-bold text-[#ffd700] uppercase tracking-wider block font-mono">
                      VIP BONUS SUMMARY
                    </span>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Deposit <strong className="text-white font-mono">${finalAmount.toFixed(2)}</strong> +{' '}
                      <strong className="text-[#ffd700] font-mono">${bonusSC.toFixed(2)} VIP Free Bonus</strong>
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-gray-400 font-mono block">TOTAL CREDITS RECEIVED</span>
                    <span className="font-mono font-black text-xl text-gold-gradient">
                      ${totalSC.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3: Destination Game Platform */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ffd700] to-[#b38f26] text-black flex items-center justify-center text-xs font-black shadow-md">
                      3
                    </span>
                    Select Game Platform
                  </h3>
                  <span className="text-xs text-gray-400">Direct ID Loading</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase font-mono">
                    Which game platform should we credit?
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
              </div>

              {/* Step 4: Sender Info & Proof Upload */}
              <form onSubmit={handleSubmitDeposit} className="p-5 sm:p-6 rounded-3xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-5 shadow-xl">
                <h3 className="text-sm font-serif font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#ffd700] to-[#b38f26] text-black flex items-center justify-center text-xs font-black shadow-md">
                    4
                  </span>
                  Your Payment Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                      Your Cashtag / Sender Handle *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. $JohnDoe777"
                      value={senderAccount}
                      onChange={(e) => setSenderAccount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-slate-700 focus:border-[#ffd700] text-xs text-white placeholder-gray-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                      Payment Account Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={playerPaymentEmail}
                      onChange={(e) => setPlayerPaymentEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-slate-700 focus:border-[#ffd700] text-xs text-white placeholder-gray-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                    Transaction ID / Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. #9812480 or Web3 TxHash"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-slate-700 focus:border-[#ffd700] text-xs text-white placeholder-gray-500 outline-none"
                  />
                </div>

                {/* Upload Payment Proof Screenshot */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-2 uppercase font-mono">
                    Upload Proof of Payment (Screenshot) *
                  </label>
                  <div className="relative border-2 border-dashed border-[#d4af37]/40 hover:border-[#ffd700] rounded-2xl p-6 text-center bg-black/40 transition group cursor-pointer">
                    <input
                      type="file"
                      required
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {proofImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <img
                          src={proofImage}
                          alt="Uploaded receipt"
                          className="w-24 h-24 object-cover rounded-xl border border-[#ffd700]/50 shadow-md"
                        />
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 font-mono">
                          <CheckCircle2 size={14} /> Receipt Attached ({proofFileName || 'Screenshot.png'})
                        </span>
                        <span className="text-[10px] text-gray-400">Click or drag another image to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-[#d4af37]/15 text-[#ffd700] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Upload size={22} />
                        </div>
                        <span className="text-xs font-bold text-white">Click or Drag &amp; Drop Receipt Screenshot</span>
                        <span className="text-[10px] text-gray-400 font-mono">PNG, JPG, WEBP up to 15MB</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
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
                      <Wallet size={16} />
                      <span>SUBMIT DEPOSIT OF ${finalAmount.toFixed(2)} USD</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right 5 Columns: Official Gateway Payment Details Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-[#0d0f17]/95 border border-[#d4af37]/35 space-y-5 shadow-2xl sticky top-24">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                    OFFICIAL RECIPIENT
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    VERIFIED CASINO GATEWAY
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif font-black text-xl text-white">
                    {selectedGateway?.name || 'Cash App'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Send funds directly to our official casino banking address:
                  </p>
                </div>

                {/* Recipient Address / Tag with 1-click Copy */}
                <div className="p-3.5 rounded-2xl bg-black/80 border border-[#d4af37]/30 space-y-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">
                      OFFICIAL TAG / ADDRESS
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedGateway?.accountDetails || selectedGateway?.tagName || '$ZorraRoyalsVIP', 'tag')}
                      className="text-xs text-[#ffd700] hover:text-white flex items-center gap-1 font-bold transition"
                    >
                      {copiedField === 'tag' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedField === 'tag' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="font-mono font-black text-sm text-[#ffd700] break-all select-all">
                    {selectedGateway?.accountDetails || selectedGateway?.tagName || '$ZorraRoyalsVIP'}
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="text-center p-4 rounded-2xl bg-black/60 border border-white/5 space-y-3">
                  <div className="relative w-44 h-44 mx-auto rounded-xl overflow-hidden border border-[#d4af37]/40 p-2 bg-white flex items-center justify-center shadow-lg">
                    {selectedGateway?.qrCode ? (
                      <img
                        src={selectedGateway.qrCode}
                        alt="QR Code"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => setQrModalOpen(true)}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-800 gap-1">
                        <QrCode size={90} className="text-black" />
                        <span className="text-[9px] font-mono font-bold text-slate-600">Scan In Cash App</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQrModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Eye size={13} />
                      <span>Enlarge QR</span>
                    </button>
                    {selectedGateway?.qrCode && (
                      <a
                        href={selectedGateway.qrCode}
                        download={`zorra_${selectedGateway.name}_qr.png`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Download size={13} />
                        <span>Save QR</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="space-y-2 text-xs text-gray-300 leading-relaxed border-t border-white/10 pt-4">
                  <h4 className="font-serif font-bold text-white text-xs uppercase tracking-wider">
                    How To Complete Your Transfer:
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-gray-400 text-[11px]">
                    <li>Open your payment app (Cash App, Banking, or Crypto Wallet).</li>
                    <li>Send exact amount (${finalAmount.toFixed(2)}) to the address above.</li>
                    <li>Take a screenshot of the completed confirmation screen.</li>
                    <li>Upload screenshot in Step 4 and tap Submit.</li>
                  </ol>
                </div>

                {/* Live Chat Support Help Link */}
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
                  <span>Need Help? Contact 24/7 VIP Concierge</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Section: Real-Time Deposit History */}
          <div className="p-6 rounded-3xl bg-[#0d0f17]/90 border border-[#d4af37]/25 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-black text-lg text-white">Your Recent Deposit History</h3>
                <p className="text-xs text-gray-400">Live 4-second synchronization with casino banking core</p>
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

            {depositHistory.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-xs font-mono">
                No deposit transactions recorded yet. Submit your first deposit above to start playing!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 font-mono text-[10px] uppercase">
                      <th className="py-2.5 px-3">Date / Time</th>
                      <th className="py-2.5 px-3">Gateway</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Destination Game</th>
                      <th className="py-2.5 px-3">Sender Tag</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Proof</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {depositHistory.map((d, i) => (
                      <tr key={i} className="hover:bg-white/5 transition">
                        <td className="py-3 px-3 text-gray-400">
                          {new Date(d.createdAt || Date.now()).toLocaleDateString()}{' '}
                          {new Date(d.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">{d.methodName || d.method || 'Cash App'}</td>
                        <td className="py-3 px-3 font-black text-[#ffd700]">
                          ${Number(d.amount || 0).toFixed(2)} USD
                        </td>
                        <td className="py-3 px-3 text-gray-300">{d.gameTitle || 'Casino Vault'}</td>
                        <td className="py-3 px-3 text-gray-400 truncate max-w-[120px]">{d.senderTag || d.senderNote || '-'}</td>
                        <td className="py-3 px-3">
                          {d.status === 'approved' || d.status === 'completed' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              APPROVED
                            </span>
                          ) : d.status === 'rejected' || d.status === 'failed' ? (
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
                          {d.proofImage ? (
                            <button
                              type="button"
                              onClick={() => setPreviewProofModal(d.proofImage)}
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

      {/* QR Enlarge Modal */}
      {qrModalOpen && (
        <div
          onClick={() => setQrModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-6 rounded-3xl bg-slate-950 border border-[#d4af37]/40 max-w-sm w-full text-center space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono text-gray-300 font-bold">{selectedGateway?.name} QR Code</span>
              <button onClick={() => setQrModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-3 bg-white rounded-2xl mx-auto inline-block">
              {selectedGateway?.qrCode ? (
                <img src={selectedGateway.qrCode} alt="QR Code" className="w-56 h-56 object-contain" />
              ) : (
                <QrCode size={180} className="text-black" />
              )}
            </div>
            <p className="font-mono text-xs text-[#ffd700] font-bold select-all">
              {selectedGateway?.accountDetails || selectedGateway?.tagName}
            </p>
          </div>
        </div>
      )}

      {/* Proof Preview Modal */}
      {previewProofModal && (
        <div
          onClick={() => setPreviewProofModal(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl max-h-[85vh] bg-slate-950 border border-[#d4af37]/40 rounded-2xl overflow-hidden p-2 shadow-2xl"
          >
            <div className="flex items-center justify-between p-2 border-b border-white/10 mb-2">
              <span className="text-xs font-mono text-gray-300">Payment Receipt Screenshot</span>
              <button onClick={() => setPreviewProofModal(null)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <img src={previewProofModal} alt="Proof" className="max-h-[70vh] w-auto max-w-full object-contain mx-auto rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
