'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Gamepad2,
  History,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Crown,
  Upload,
  Download,
  ExternalLink,
  Eye,
  Maximize2,
  Check,
  X,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalFooter from '@/components/common/RoyalFooter';
import AuthModal from '@/components/common/AuthModal';

export default function CashierHub({
  activeTab: propActiveTab = 'deposit',
  onTabChange,
  user: propUser,
  onOpenAuth,
  onBackToLobby,
}) {
  const [activeTab, setActiveTab] = useState(propActiveTab);
  const [user, setUser] = useState(propUser || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(propActiveTab);
    }
  }, [propActiveTab]);

  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    }
  }, [propUser]);

  // Settings & bonuses
  const [settings, setSettings] = useState({
    welcomeBonusPercentage: 100,
    regularBonusPercentage: 20,
    signupBonusAmount: 3.0,
    minDeposit: 10,
    minWithdrawal: 50,
  });

  // Data states
  const [methods, setMethods] = useState([]);
  const [games, setGames] = useState([]);
  const [gameAccounts, setGameAccounts] = useState([]);
  const [history, setHistory] = useState({ deposits: [], withdrawals: [], gameLoads: [], timeline: [] });
  const [historyFilter, setHistoryFilter] = useState('all');

  // Form states - Deposit
  const [depositAmount, setDepositAmount] = useState('50');
  const [depositGameTitle, setDepositGameTitle] = useState('Orion Stars');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [senderNote, setSenderNote] = useState('');
  const [senderTag, setSenderTag] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [proofImage, setProofImage] = useState('');
  const [proofImageName, setProofImageName] = useState('');
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(null);

  // Form states - Withdraw
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [withdrawMethod, setWithdrawMethod] = useState('Cash App');
  const [withdrawGameTitle, setWithdrawGameTitle] = useState('Orion Stars');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [gameScreenshot, setGameScreenshot] = useState('');
  const [gameScreenshotName, setGameScreenshotName] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [qrCodeImageName, setQrCodeImageName] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(null);

  // Form states - Game Load
  const [selectedGameId, setSelectedGameId] = useState('');
  const [gameUsername, setGameUsername] = useState('');
  const [loadAmount, setLoadAmount] = useState('25');
  const [loadSubmitting, setLoadSubmitting] = useState(false);
  const [loadSuccess, setLoadSuccess] = useState(null);

  // Lightbox modal for previewing any image/QR
  const [previewImage, setPreviewImage] = useState(null); // { url, title }

  // UI helpers
  const [copiedText, setCopiedText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Client-side image compressor using HTML5 canvas
  const handleCompressAndSetImage = (file, setter, nameSetter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', 0.85);
        setter(dataUrl);
        if (nameSetter) nameSetter(file.name);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadQr = (qrDataUrl, fileName = 'qr-code.png') => {
    if (!qrDataUrl) return;
    try {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(qrDataUrl, '_blank');
    }
  };

  // Sync tab with URL if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['deposit', 'withdraw', 'load', 'history'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, [propActiveTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
    setErrorMsg('');
    setDepositSuccess(null);
    setWithdrawSuccess(null);
    setLoadSuccess(null);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2500);
  };

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Me
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData.success && meData.user) {
        setUser(meData.user);
      } else {
        setUser(null);
      }

      // 2. Settings
      const setRes = await fetch('/api/settings');
      const setData = await setRes.json();
      if (setData.success && setData.settings) {
        setSettings({
          welcomeBonusPercentage: Number(setData.settings.welcomeBonusPercent ?? setData.settings.welcomeBonusPercentage ?? 300),
          regularBonusPercentage: Number(setData.settings.regularBonusPercent ?? setData.settings.regularBonusPercentage ?? 50),
          signupBonusAmount: Number(setData.settings.signupBonusAmount ?? 3.0),
          minDeposit: Number(setData.settings.minDeposit ?? 10),
          minWithdrawal: Number(setData.settings.minWithdrawal ?? 10),
        });
      }

      // 3. Methods
      const methRes = await fetch('/api/payments/methods');
      const methData = await methRes.json();
      if (methData.success && methData.methods) {
        setMethods(methData.methods);
        if (methData.methods.length > 0 && !selectedMethod) {
          setSelectedMethod(methData.methods[0]);
        }
      }

      // 4. Games (Sweepstakes only)
      const gamesRes = await fetch('/api/games');
      const gamesData = await gamesRes.json();
      if (gamesData.success && gamesData.games) {
        setGames(gamesData.games);
        if (gamesData.games.length > 0) {
          if (!selectedGameId) setSelectedGameId(gamesData.games[0].gameId);
          if (!withdrawGameTitle) setWithdrawGameTitle(gamesData.games[0].title);
        }
      }

      // 4b. Game Accounts (Player's registered platforms)
      const accsRes = await fetch('/api/game-accounts');
      const accsData = await accsRes.json();
      if (accsData.success) {
        const list = accsData.gameAccounts || accsData.accounts || [];
        setGameAccounts(list);
        if (list.length > 0) {
          setWithdrawGameTitle(list[0].gameTitle);
        }
      }

      // 5. History
      if (meData.success && meData.user) {
        const histRes = await fetch('/api/payments/history');
        const histData = await histRes.json();
        if (histData.success) {
          setHistory(histData);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-fill Game Load username if player has an active account for selected game
  useEffect(() => {
    if (selectedGameId && games.length > 0 && gameAccounts.length > 0) {
      const selectedGame = games.find(g => g.gameId === selectedGameId);
      const title = selectedGame?.title;
      if (title) {
        const matched = gameAccounts.find(a => a.gameTitle?.toLowerCase() === title.toLowerCase());
        if (matched?.username) {
          setGameUsername(matched.username);
        }
      }
    }
  }, [selectedGameId, games, gameAccounts]);

  // Calculate balances & dynamic bonus
  const totalBalance = user?.balance !== undefined ? parseFloat(user.balance) : 0;
  const frozenBalance = user?.frozenBalance !== undefined ? parseFloat(user.frozenBalance) : 0;
  const availableBalance = user?.availableBalance !== undefined
    ? parseFloat(user.availableBalance)
    : Math.max(0, +(totalBalance - frozenBalance).toFixed(2));
  const userBalance = availableBalance;

  const isFirstDeposit = !user?.firstDepositMade && (!user?.totalDeposited || user.totalDeposited === 0);
  const currentBonusPct = isFirstDeposit
    ? settings.welcomeBonusPercentage
    : settings.regularBonusPercentage;
  const bonusTypeLabel = isFirstDeposit ? 'Welcome Match Bonus' : 'VIP Regular Reload Bonus';

  const numDeposit = parseFloat(depositAmount) || 0;
  const calcBonusAmount = +(numDeposit * (currentBonusPct / 100)).toFixed(2);
  const calcTotalCredited = +(numDeposit + calcBonusAmount).toFixed(2);

  // Submit Deposit
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    if (!selectedMethod) {
      setErrorMsg('Please select a payment gateway');
      return;
    }
    if (numDeposit < (selectedMethod.minDeposit || 5)) {
      setErrorMsg(`Minimum deposit for ${selectedMethod.name} is $${selectedMethod.minDeposit || 5}`);
      return;
    }
    if (!senderTag.trim()) {
      setErrorMsg('Please enter your Sender Tag Name / Cashtag.');
      return;
    }
    if (!senderEmail.trim()) {
      setErrorMsg('Please enter your Sender Email associated with your tag.');
      return;
    }
    if (!proofImage) {
      setErrorMsg('Payment receipt screenshot is required. Please upload your payment screenshot.');
      return;
    }

    const matchedDepositAccount = gameAccounts.find(
      (a) => a.gameTitle?.toLowerCase() === depositGameTitle.toLowerCase()
    );

    setDepositSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numDeposit,
          methodId: selectedMethod.id || selectedMethod._id || selectedMethod.methodId,
          methodName: selectedMethod.name,
          senderTag: senderTag.trim(),
          senderEmail: senderEmail.trim(),
          senderNote: senderTag.trim(),
          proofImage,
          txHash,
          gameTitle: depositGameTitle,
          gameUsername: matchedDepositAccount ? matchedDepositAccount.username : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDepositSuccess({
          amount: numDeposit,
          bonusSC: data.calculatedCoins?.bonusSC !== undefined ? data.calculatedCoins.bonusSC : calcBonusAmount,
          totalCredited: data.calculatedCoins?.totalSC !== undefined ? data.calculatedCoins.totalSC : calcTotalCredited,
        });
        setTxHash('');
        setSenderTag('');
        setSenderEmail('');
        setProofImage('');
        setProofImageName('');
        loadData();
      } else {
        setErrorMsg(data.error || 'Failed to submit deposit');
      }
    } catch {
      setErrorMsg('Network error submitting deposit');
    } finally {
      setDepositSubmitting(false);
    }
  };

  // Submit Withdraw (Winnings verified from game screenshot; does NOT deduct website wallet balance)
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    // Enforce Active Game Account Check
    if (gameAccounts.length === 0) {
      setErrorMsg('⚠️ Active Game Account Required: You must create and register a game account on a sweepstakes platform before requesting a cashout/withdrawal.');
      return;
    }

    const numWithdraw = parseFloat(withdrawAmount) || 0;
    if (numWithdraw < 10) {
      setErrorMsg('Minimum cashout amount is $10.00');
      return;
    }
    if (!destinationAddress.trim()) {
      setErrorMsg('Please provide your recipient Tag Name / Cashtag');
      return;
    }
    if (!gameScreenshot) {
      setErrorMsg('Mandatory: Please upload your Game Winning / Score Screenshot.');
      return;
    }
    if (!qrCodeImage) {
      setErrorMsg('Mandatory: Please upload your Recipient QR Code image / screenshot.');
      return;
    }

    const matchedWithdrawAcc = gameAccounts.find(
      (a) => a.gameTitle?.toLowerCase() === withdrawGameTitle?.toLowerCase()
    ) || gameAccounts[0];

    setWithdrawSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numWithdraw,
          payoutMethod: withdrawMethod,
          destinationAddress: destinationAddress.trim(),
          gameTitle: withdrawGameTitle || matchedWithdrawAcc?.gameTitle || 'Sweepstakes Platform',
          gameUsername: matchedWithdrawAcc?.username || null,
          gameScreenshot,
          qrCodeImage,
          notes: withdrawNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawSuccess({
          amount: numWithdraw,
          method: withdrawMethod,
          address: destinationAddress.trim(),
          gameTitle: withdrawGameTitle,
        });
        setDestinationAddress('');
        setGameScreenshot('');
        setGameScreenshotName('');
        setQrCodeImage('');
        setQrCodeImageName('');
        setWithdrawNotes('');
        loadData();
      } else {
        setErrorMsg(data.error || 'Withdrawal failed');
      }
    } catch {
      setErrorMsg('Network error submitting withdrawal');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  // Submit Game Load Request (Deducts from wallet balance only on approval)
  const handleGameLoadSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    const numLoad = parseFloat(loadAmount) || 0;
    if (numLoad <= 0) {
      setErrorMsg('Please enter a valid load amount');
      return;
    }
    if (numLoad > availableBalance) {
      setErrorMsg(`Insufficient wallet balance. You have $${availableBalance.toFixed(2)} available. You cannot request more than your wallet balance.`);
      return;
    }
    if (!gameUsername.trim()) {
      setErrorMsg('Please provide your game username or account ID');
      return;
    }

    const selectedGame = games.find(g => g.gameId === selectedGameId);
    const gameName = selectedGame?.title || selectedGameId;

    setLoadSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/game-loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: selectedGameId,
          gameUsername: gameUsername.trim(),
          amount: numLoad,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLoadSuccess({
          amount: numLoad,
          gameName,
          username: gameUsername.trim(),
        });
        loadData();
      } else {
        setErrorMsg(data.error || 'Failed to submit load request');
      }
    } catch {
      setErrorMsg('Network error submitting load request');
    } finally {
      setLoadSubmitting(false);
    }
  };

  // Filtered timeline
  const filteredTimeline = (history.timeline || []).filter(item => {
    if (historyFilter === 'all') return true;
    return item.kind === historyFilter;
  });

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Dedicated Section Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#181408] via-[#10131e] to-[#090b12] border border-[#d4af37]/35 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {onBackToLobby && (
                <button
                  onClick={onBackToLobby}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-gray-200 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  ← Back to Games Lobby
                </button>
              )}
              <span className="px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#ffd700] text-[11px] font-black uppercase tracking-wider">
                {activeTab === 'deposit' && '👑 VIP DEPOSIT DESK'}
                {activeTab === 'withdraw' && '💸 CASHOUT & REDEMPTIONS'}
                {activeTab === 'load' && '🎮 GAME CREDITS TRANSFER'}
                {activeTab === 'history' && '📜 TRANSACTION AUDIT LEDGER'}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold">
                Automated 24/7 Processing
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black font-serif text-white tracking-wide">
              {activeTab === 'deposit' && 'Deposit & Match Bonus'}
              {activeTab === 'withdraw' && 'Cashout & Withdrawals'}
              {activeTab === 'load' && 'Load Game Credits'}
              {activeTab === 'history' && 'Transaction History & Records'}
            </h1>
            <p className="text-sm text-gray-400 mt-1 max-w-xl">
              {activeTab === 'deposit' && `Instant deposits via Cash App, Zelle & Crypto with +${currentBonusPct}% ${bonusTypeLabel}.`}
              {activeTab === 'withdraw' && 'Request fast, compliant cashouts directly to your preferred Cashtag, account, or wallet.'}
              {activeTab === 'load' && 'Transfer dollars from your main wallet into Orion Stars, Fire Kirin, Juwa and other sweepstakes platforms.'}
              {activeTab === 'history' && 'Review complete records of your deposits, cashouts, game loads, and cashier reviews.'}
            </p>
          </div>

          {/* User Balance Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#090b12]/90 border border-[#d4af37]/40 shadow-xl flex items-center gap-4 shrink-0">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-[#997b24] to-[#ffd700] text-black shadow-md">
              <Wallet className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Available to Play & Cashout
              </span>
              <strong className="text-2xl sm:text-3xl font-black text-gold-gradient font-mono">
                ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
              <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                <span className="text-gray-400">Total Balance: ${totalBalance.toFixed(2)}</span>
                {frozenBalance > 0 && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-bold">
                    ❄️ ${frozenBalance.toFixed(2)} In Review
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: DEPOSIT */}
        {/* ============================================================== */}
        {activeTab === 'deposit' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Deposit Form */}
            <div className="lg:col-span-7 space-y-6">
              {/* Dynamic Bonus Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-400/40 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#ffd700] text-black font-black">
                  <Sparkles className="w-5 h-5 fill-black" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#ffd700] uppercase tracking-wide">
                    {bonusTypeLabel} (+{currentBonusPct}%) Active!
                  </h4>
                  <p className="text-xs text-gray-300 mt-0.5">
                    {isFirstDeposit
                      ? `First time depositor? Deposit any amount and get +${settings.welcomeBonusPercentage}% extra dollars added to your balance!`
                      : `VIP Perk: Enjoy +${settings.regularBonusPercentage}% regular reload bonus on every recurring deposit!`}
                  </p>
                </div>
              </div>

              {/* Step 1: Choose Target Game Platform */}
              <div className="p-6 rounded-3xl bg-[#0e111a] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#ffd700] flex items-center justify-center text-xs">1</span>
                    <span>Choose Target Game Platform</span>
                  </h3>
                  <span className="text-[11px] text-gray-400">Where you want to play</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(games.length > 0 ? games.map(g => g.title) : ['Orion Stars', 'Fire Kirin', 'Game Vault', 'Milky Way', 'Juwa', 'Panda Master']).map((gameTitle) => {
                    const isSelected = depositGameTitle === gameTitle;
                    const hasAcc = gameAccounts.some((a) => a.gameTitle?.toLowerCase() === gameTitle.toLowerCase());
                    return (
                      <button
                        key={gameTitle}
                        type="button"
                        onClick={() => setDepositGameTitle(gameTitle)}
                        className={`p-3 rounded-2xl text-left border transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#241c09] to-[#121522] border-[#ffd700] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                            : 'bg-[#121520] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{gameTitle}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {hasAcc ? '✅ Has Account' : '✨ Auto-creates account'}
                          </p>
                        </div>
                        <Gamepad2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#ffd700]' : 'text-gray-500'}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Account Linked vs Auto-create banner */}
                {(() => {
                  const matched = gameAccounts.find(
                    (a) => a.gameTitle?.toLowerCase() === depositGameTitle.toLowerCase()
                  );
                  if (matched) {
                    return (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Existing Game Account Linked:</span>
                        </div>
                        <span className="font-mono font-black text-[#ffd700] bg-black/60 px-2.5 py-1 rounded-xl border border-[#ffd700]/30">
                          @{matched.username}
                        </span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#ffd700] shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          <strong>✨ No {depositGameTitle} Account Yet?</strong> You can deposit freely without an account! Once Finance approves your deposit, our desk will <strong>automatically create your game account</strong> and send your login credentials.
                        </p>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Step 2: Select Method */}
              <div className="p-6 rounded-3xl bg-[#0e111a] border border-white/5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#ffd700] flex items-center justify-center text-xs">2</span>
                  <span>Select Payment Method</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {methods.map((m) => {
                    const isSelected = selectedMethod?.methodId === m.methodId;
                    return (
                      <button
                        key={m.methodId}
                        type="button"
                        onClick={() => setSelectedMethod(m)}
                        className={`p-3.5 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#241c09] to-[#121522] border-[#ffd700] shadow-[0_0_20px_rgba(212,175,55,0.3)]'
                            : 'bg-[#121520] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] uppercase font-bold text-gray-400">{m.tag || 'Instant'}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#ffd700]" />}
                        </div>
                        <h4 className="font-extrabold text-sm text-white">{m.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Min: ${m.minDeposit || 10}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Choose Amount & Calculate Bonus */}
              <div className="p-6 rounded-3xl bg-[#0e111a] border border-white/5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#ffd700] flex items-center justify-center text-xs">3</span>
                  <span>Enter Deposit Amount</span>
                </h3>

                {/* Quick Pills */}
                <div className="grid grid-cols-5 gap-2">
                  {['20', '50', '100', '200', '500'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition ${
                        depositAmount === amt
                          ? 'bg-[#ffd700] text-black font-black'
                          : 'bg-[#151926] text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-lg font-bold">$</span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    min={selectedMethod?.minDeposit || 10}
                    className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-[#131724] border border-white/10 text-white font-mono text-lg font-bold focus:border-[#ffd700] focus:outline-none"
                  />
                </div>

                {/* Real-time Dynamic Bonus Calculation Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1a1506] to-[#0c0e16] border border-[#d4af37]/40 space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span>Base Deposit:</span>
                    <strong className="font-mono text-white">${numDeposit.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#ffd700]">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{bonusTypeLabel} (+{currentBonusPct}%):</span>
                    </span>
                    <strong className="font-mono">+${calcBonusAmount.toFixed(2)}</strong>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-sm">
                    <span className="font-black text-white">Total Credited to Wallet:</span>
                    <strong className="text-xl font-black font-mono text-gold-gradient">
                      ${calcTotalCredited.toFixed(2)} USD
                    </strong>
                  </div>
                </div>
              </div>

              {/* Step 4: Transaction Details & Proof Upload */}
              <div className="p-6 rounded-3xl bg-[#0e111a] border border-white/5 space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#ffd700] flex items-center justify-center text-xs">4</span>
                  <span>Payment Verification &amp; Proof Submission</span>
                </h3>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-300 font-bold block mb-1">
                        Your Sender Tag Name / Cashtag <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={senderTag}
                        onChange={(e) => setSenderTag(e.target.value)}
                        placeholder="e.g. $JohnDoe or JohnZelle"
                        className="w-full px-4 py-3 rounded-xl bg-[#131724] border border-white/10 text-white text-sm focus:border-[#ffd700] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-300 font-bold block mb-1">
                        Your Sender Email (Account Email) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        placeholder="e.g. your-tag-email@domain.com"
                        className="w-full px-4 py-3 rounded-xl bg-[#131724] border border-white/10 text-white text-sm focus:border-[#ffd700] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Screenshot Proof Upload (Mandatory) */}
                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-1">
                      Payment Screenshot Proof <span className="text-red-400">* (Mandatory)</span>
                    </label>

                    {proofImage ? (
                      <div className="p-3 rounded-2xl bg-black/50 border border-emerald-500/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0">
                            <img src={proofImage} alt="Payment Proof" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-xs">
                              {proofImageName || 'payment_proof.png'}
                            </p>
                            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Image Ready for Verification
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: proofImage, title: 'Payment Confirmation Screenshot' })}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-bold flex items-center gap-1 transition"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProofImage('');
                              setProofImageName('');
                            }}
                            className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 transition"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-white/15 hover:border-[#ffd700]/60 bg-[#111422]/60 hover:bg-[#151928] cursor-pointer transition text-center group">
                        <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-[#ffd700]/20 flex items-center justify-center text-gray-400 group-hover:text-[#ffd700] transition mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-gray-300 group-hover:text-white">
                          Click to upload payment screenshot
                        </span>
                        <span className="text-[10px] text-gray-500 mt-0.5">
                          PNG, JPG, or WEBP confirmation receipt from your payment app
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleCompressAndSetImage(file, setProofImage, setProofImageName);
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Transaction Ref / TXID / Confirmation # (Optional)
                    </label>
                    <input
                      type="text"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder="Optional confirmation number or blockchain hash"
                      className="w-full px-4 py-3 rounded-xl bg-[#131724] border border-white/10 text-white text-sm focus:border-[#ffd700] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDepositSubmit}
                  disabled={depositSubmitting}
                  className="w-full btn-gold text-base py-4 font-black shadow-[0_0_30px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
                >
                  {depositSubmitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Submit Deposit Request (${calcTotalCredited.toFixed(2)} Total)</span>
                  )}
                </button>
              </div>

              {/* Success Notification */}
              {depositSuccess && (
                <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm space-y-2">
                  <div className="flex items-center gap-2 font-black text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Deposit Request Successfully Submitted!</span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-300">
                    Your request for <strong>${depositSuccess.amount?.toFixed(2)}</strong> with <strong>+${depositSuccess.bonusSC?.toFixed(2)}</strong> bonus (Total: <strong>${depositSuccess.totalCredited?.toFixed(2)} USD</strong>) has been queued. Our 24/7 cashier desk will verify your screenshot and credit your balance within minutes.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Payment Instructions Box */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-b from-[#141824] to-[#0c0e16] border border-[#d4af37]/30 shadow-xl space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#ffd700]">
                    Official Payment Instructions
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    ACTIVE DESK
                  </span>
                </div>

                {selectedMethod ? (
                  <div className="space-y-4">
                    {/* Tag / Account Details with 1-Click Copy */}
                    <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-400 font-bold uppercase">
                          {selectedMethod.name} Tag / Account:
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#ffd700] font-bold">
                          {selectedMethod.tag || 'Instant'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#141826] border border-[#d4af37]/30">
                        <span className="font-mono text-sm sm:text-base text-[#ffd700] font-black break-all select-all">
                          {selectedMethod.accountDetails}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(selectedMethod.accountDetails, 'address')}
                          className="px-3 py-1.5 rounded-lg bg-[#ffd700] hover:bg-yellow-400 text-black font-black text-xs flex items-center gap-1.5 transition shrink-0 shadow"
                          title="Copy Tag Name"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedText === 'address' ? 'Copied!' : 'Copy Tag'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Direct Payment Link Button (if configured) */}
                    {selectedMethod.paymentUrl && (
                      <a
                        href={selectedMethod.paymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition active:scale-95"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Pay via {selectedMethod.name} Direct Link</span>
                      </a>
                    )}

                    {/* QR Code Scanner / Display & Download */}
                    {selectedMethod.qrCode && (
                      <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col items-center text-center space-y-3">
                        <span className="text-xs font-black uppercase tracking-wider text-gray-300">
                          Scan QR Code to Pay
                        </span>

                        <div
                          onClick={() => setPreviewImage({ url: selectedMethod.qrCode, title: `${selectedMethod.name} Official QR Code` })}
                          className="relative w-40 h-40 rounded-2xl overflow-hidden bg-white p-2 border-2 border-[#d4af37]/50 shadow-2xl cursor-pointer hover:scale-105 transition group"
                          title="Click to view full size"
                        >
                          <img
                            src={selectedMethod.qrCode}
                            alt={`${selectedMethod.name} QR Code`}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                            <Maximize2 className="w-5 h-5 mr-1" /> Zoom
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: selectedMethod.qrCode, title: `${selectedMethod.name} Official QR Code` })}
                            className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View QR</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadQr(selectedMethod.qrCode, `${selectedMethod.name}-QR.png`)}
                            className="flex-1 py-2 px-3 rounded-xl bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#ffd700] border border-[#d4af37]/40 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download QR</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-300 leading-relaxed space-y-2">
                      <p className="font-bold text-white">How to complete your deposit:</p>
                      <ol className="list-decimal list-inside space-y-1.5 text-gray-400 text-[11px]">
                        <li>Copy the Tag Name or scan the QR Code in your {selectedMethod.name} app.</li>
                        <li>Send exactly <strong>${numDeposit.toFixed(2)}</strong>.</li>
                        <li>Take a screenshot of the completed payment receipt.</li>
                        <li>Fill in your sender tag, email, upload the screenshot, and submit.</li>
                      </ol>
                    </div>

                    {selectedMethod.instructions && (
                      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-[11px] text-blue-300">
                        {selectedMethod.instructions}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Select a payment gateway to view cashier details.</p>
                )}
              </div>

              {/* VIP Security Guarantee */}
              <div className="p-5 rounded-3xl bg-[#0e111a] border border-white/5 flex items-start gap-3 text-xs text-gray-400">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  All transactions are protected by 256-bit SSL encryption. 100% compliant social sweepstakes cashouts guaranteed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: WITHDRAW */}
        {/* ============================================================== */}
        {activeTab === 'withdraw' && (
          <div className="w-full space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0e111a] border border-[#d4af37]/35 shadow-2xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Form: lg:col-span-7 */}
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black font-serif text-white tracking-wide">
                      Redeem &amp; Cashout Game Winnings
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Cashout your game platform winnings directly to your Cash App, Zelle, Venmo, or Crypto wallet. Minimum cashout: <strong>$10.00</strong>.
                    </p>
                  </div>

                  {/* Active Account Warning if player has none */}
                  {gameAccounts.length === 0 && (
                    <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3">
                      <div className="flex items-center gap-2 font-black text-sm text-amber-400">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>⚠️ Active Game Account Required for Cashout</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed text-xs">
                        You must have an active registered game account on a sweepstakes platform before requesting a cashout.
                        If you have not created an account yet, you can make a deposit first — our cashier desk will <strong>automatically create your game account</strong> upon deposit approval!
                      </p>
                      <button
                        type="button"
                        onClick={() => handleTabChange('deposit')}
                        className="btn-gold text-xs px-4 py-2.5 font-black flex items-center gap-2 w-fit shadow-md"
                      >
                        <Wallet className="w-4 h-4" />
                        <span>Make a Deposit (Auto-Creates Game Account)</span>
                      </button>
                    </div>
                  )}

                  {/* Sweepstakes Platform Selection */}
                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-2">
                      Select Sweepstakes Game Platform <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {gameAccounts.length > 0 ? (
                        gameAccounts.map((acc) => {
                          const isSel = (withdrawGameTitle || gameAccounts[0]?.gameTitle)?.toLowerCase() === acc.gameTitle?.toLowerCase();
                          return (
                            <button
                              key={acc.id || acc._id}
                              type="button"
                              onClick={() => setWithdrawGameTitle(acc.gameTitle)}
                              className={`p-3 rounded-xl text-left border transition ${
                                isSel
                                  ? 'bg-purple-600 text-white font-black border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                  : 'bg-[#131724] border-white/10 text-gray-300 hover:border-white/20'
                              }`}
                            >
                              <div className="text-xs font-black truncate">{acc.gameTitle}</div>
                              <div className="text-[10px] text-[#ffd700] font-mono mt-0.5">@{acc.username}</div>
                            </button>
                          );
                        })
                      ) : (
                        ['Orion Stars', 'Fire Kirin', 'Juwa', 'Game Vault', 'Milky Way', 'Panda Master'].map((title) => (
                          <div
                            key={title}
                            className="p-2.5 rounded-xl text-xs font-bold border border-white/5 bg-[#131724]/40 text-gray-500 opacity-60 text-center"
                          >
                            {title} (No Account)
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Payout Method Selection */}
                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-2">
                      Select Payout Method
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {['Cash App', 'Zelle', 'Venmo', 'USDT (TRC-20)'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setWithdrawMethod(method)}
                          className={`p-3 rounded-xl text-xs font-bold border transition ${
                            withdrawMethod === method
                              ? 'bg-[#ffd700] text-black font-black border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.3)]'
                              : 'bg-[#131724] border-white/10 text-gray-300 hover:border-white/20'
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-1.5">
                      Cashout Amount ($ USD) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-lg font-bold">$</span>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="10"
                        placeholder="Enter cashout amount (min $10)"
                        className="w-full pl-9 pr-4 py-3.5 rounded-xl bg-[#131724] border border-white/10 text-white font-mono text-lg font-bold focus:border-[#ffd700] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Destination Tag Name */}
                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-1.5">
                      Your {withdrawMethod} Tag Name / Cashtag <span className="text-red-400">* (Mandatory)</span>
                    </label>
                    <input
                      type="text"
                      value={destinationAddress}
                      onChange={(e) => setDestinationAddress(e.target.value)}
                      placeholder={
                        withdrawMethod === 'Cash App'
                          ? 'e.g. $YourCashtag'
                          : withdrawMethod === 'Zelle'
                          ? 'e.g. your-tag-name / phone'
                          : 'e.g. @VenmoTag or USDT TRC-20 Address'
                      }
                      className="w-full px-4 py-3.5 rounded-xl bg-[#131724] border border-white/10 text-white text-sm focus:border-[#ffd700] focus:outline-none font-mono"
                    />
                  </div>

                  {/* 2 Mandatory Uploads: (1) Game Winning Screenshot, (2) User's Recipient QR Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Mandatory 1: Game Winning Screenshot */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-300 font-bold block">
                        1. Game Score Screenshot <span className="text-red-400">*</span>
                      </label>
                      {gameScreenshot ? (
                        <div className="p-3 rounded-2xl bg-black/50 border border-purple-500/40 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0">
                              <img src={gameScreenshot} alt="Game Score" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[11px] font-bold text-purple-300 truncate max-w-[110px]">
                              {gameScreenshotName || 'game_score.png'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ url: gameScreenshot, title: 'Game Winning Score Screenshot' })}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setGameScreenshot('');
                                setGameScreenshotName('');
                              }}
                              className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-400/60 bg-[#111422]/60 hover:bg-[#151928] cursor-pointer transition text-center group min-h-[110px]">
                          <Upload className="w-4 h-4 text-gray-400 group-hover:text-purple-400 mb-1" />
                          <span className="text-[11px] font-bold text-gray-300 group-hover:text-white">
                            Upload Game Screenshot
                          </span>
                          <span className="text-[9px] text-gray-500 mt-0.5">Winning score proof</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCompressAndSetImage(file, setGameScreenshot, setGameScreenshotName);
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* Mandatory 2: User Recipient QR Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-300 font-bold block">
                        2. Your Tag QR Code <span className="text-red-400">*</span>
                      </label>
                      {qrCodeImage ? (
                        <div className="p-3 rounded-2xl bg-black/50 border border-[#ffd700]/40 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0">
                              <img src={qrCodeImage} alt="User QR" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[11px] font-bold text-[#ffd700] truncate max-w-[110px]">
                              {qrCodeImageName || 'my_qr.png'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ url: qrCodeImage, title: 'Your Recipient QR Code' })}
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQrCodeImage('');
                                setQrCodeImageName('');
                              }}
                              className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400"
                              title="Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-white/15 hover:border-[#ffd700]/60 bg-[#111422]/60 hover:bg-[#151928] cursor-pointer transition text-center group min-h-[110px]">
                          <Upload className="w-4 h-4 text-gray-400 group-hover:text-[#ffd700] mb-1" />
                          <span className="text-[11px] font-bold text-gray-300 group-hover:text-white">
                            Upload Your QR Code
                          </span>
                          <span className="text-[9px] text-gray-500 mt-0.5">Cash App / Wallet QR</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCompressAndSetImage(file, setQrCodeImage, setQrCodeImageName);
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Additional Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={withdrawNotes}
                      onChange={(e) => setWithdrawNotes(e.target.value)}
                      placeholder="Optional note for the cashier"
                      className="w-full px-4 py-3 rounded-xl bg-[#131724] border border-white/10 text-white text-sm focus:border-[#ffd700] focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleWithdrawSubmit}
                    disabled={withdrawSubmitting || gameAccounts.length === 0}
                    className="w-full btn-gold text-base py-4 font-black shadow-[0_0_30px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {gameAccounts.length === 0 ? (
                      <span>⚠️ Active Game Account Required to Cashout</span>
                    ) : withdrawSubmitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <span>Submit Cashout Request (${parseFloat(withdrawAmount || 0).toFixed(2)})</span>
                    )}
                  </button>

                  {withdrawSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm space-y-1">
                      <div className="flex items-center gap-2 font-black text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Cashout Request Received!</span>
                      </div>
                      <p className="text-xs text-gray-300">
                        Your request for <strong>${withdrawSuccess.amount.toFixed(2)}</strong> from <strong>{withdrawSuccess.gameTitle}</strong> via {withdrawSuccess.method} to <code>{withdrawSuccess.address}</code> has been submitted. Our finance desk is verifying your game screenshot and will dispatch your funds shortly.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Info: lg:col-span-5 */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-5 rounded-2xl bg-[#121624] border border-[#d4af37]/30 space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#ffd700]" />
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">
                        Game Winnings Cashout Protocol
                      </h4>
                    </div>

                    <div className="space-y-3 text-xs divide-y divide-white/5">
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-gray-400">Minimum Cashout:</span>
                        <span className="text-white font-mono font-bold">$10.00</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-gray-400">Processing Fee:</span>
                        <span className="text-emerald-400 font-mono font-bold">$0.00 (Zero Fee)</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-gray-400">Website Wallet Balance:</span>
                        <span className="text-emerald-400 font-bold">Untouched (No Deductions)</span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-gray-400">Payout Speed:</span>
                        <span className="text-[#ffd700] font-bold">1 - 2 Hours Expedited</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#090b11] border border-white/5 text-[11px] text-gray-300 leading-relaxed space-y-1.5">
                      <p className="font-bold text-[#ffd700]">💡 How Game Cashouts Work:</p>
                      <p>
                        Your cashout comes directly from your verified winnings inside the sweepstakes game. Our financial desk inspects your winning screenshot and dispatches payment directly to your recipient QR Code and Cashtag.
                      </p>
                      <p className="text-gray-400">
                        If a cashout cannot be verified, the cashier will reject with an explanatory note sent directly to your notifications and history.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-200">
                      Fast, reliable payouts directly to your Cash App, Zelle, Venmo, or Crypto.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: LOAD GAME CREDITS */}
        {/* ============================================================== */}
        {activeTab === 'load' && (
          <div className="w-full space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0e111a] border border-[#d4af37]/35 shadow-2xl space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase">
                    CREDENTIALS & GAME VAULT
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-serif text-white tracking-wide">
                  Transfer Credits to Sweepstakes Game
                </h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Choose your sweepstakes platform, enter your game username, and specify the dollar amount to transfer from your main wallet balance.
                </p>
              </div>

              {/* Step 1: Select Game */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-300 font-bold block">
                    1. Select Sweepstakes Platform
                  </label>
                  <span className="text-[11px] text-gray-400">
                    {games.length} Platforms Available
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-72 overflow-y-auto p-1 scrollbar-thin">
                  {games.map((g) => {
                    const isSelected = selectedGameId === g.gameId;
                    return (
                      <button
                        key={g.gameId}
                        type="button"
                        onClick={() => setSelectedGameId(g.gameId)}
                        className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'bg-gradient-to-b from-[#251733] to-[#0f111a] border-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.35)] ring-2 ring-purple-400/50'
                            : 'bg-[#121520] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-2 bg-black">
                          <Image
                            src={g.thumbnail || '/images/games/orion-stars.jpg'}
                            alt={g.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <h4 className="font-extrabold text-xs text-white truncate">{g.title}</h4>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">{g.provider}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Game Username & Client Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1.5">
                    Your Client Name (Account Name)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user?.username || 'Client'}
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-gray-400 font-mono text-sm cursor-not-allowed"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    Automatically matched to your Zorra Royals profile
                  </span>
                </div>

                <div>
                  <label className="text-xs text-gray-300 font-bold block mb-1.5">
                    Game Account Username / ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={gameUsername}
                    onChange={(e) => setGameUsername(e.target.value)}
                    placeholder="e.g. OrionUser_888 or Kirin_99"
                    className="w-full px-4 py-3 rounded-xl bg-[#131724] border border-white/10 text-white text-sm font-mono focus:border-purple-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    The username given to you for this specific game
                  </span>
                </div>
              </div>

              {/* Step 3: Transfer Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-300 font-bold">
                    Amount to Load ($ USD)
                  </label>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Available Wallet Balance: <strong className="text-[#ffd700]">${userBalance.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
                  {['10', '25', '50', '100', '250'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setLoadAmount(amt)}
                      className={`py-2.5 rounded-xl text-xs font-mono font-bold transition ${
                        loadAmount === amt
                          ? 'bg-purple-500 text-white font-black shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                          : 'bg-[#151926] text-gray-300 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setLoadAmount(userBalance.toString())}
                    className="py-2.5 rounded-xl text-xs font-mono font-bold bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#ffd700] border border-[#d4af37]/30 transition"
                  >
                    MAX (${userBalance.toFixed(0)})
                  </button>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-lg font-bold">$</span>
                  <input
                    type="number"
                    value={loadAmount}
                    onChange={(e) => setLoadAmount(e.target.value)}
                    min="1"
                    max={userBalance}
                    placeholder="Enter amount"
                    className="w-full pl-9 pr-20 py-3.5 rounded-xl bg-[#131724] border border-white/10 text-white font-mono text-lg font-bold focus:border-purple-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setLoadAmount(userBalance.toString())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 text-xs font-bold font-mono"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Notice */}
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-200 leading-relaxed">
                <p className="font-bold text-white mb-1">How Load Requests Work:</p>
                <p>
                  When you submit this request, the backend creates a game credit task for the cashier team with your <strong>Client Name</strong>, <strong>Game Platform</strong>, and <strong>Game Username</strong>.
                  Upon approval, the credits are loaded directly into your game and deducted from your balance. If declined, the rejection reason will be displayed in your Transaction History.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGameLoadSubmit}
                disabled={loadSubmitting || userBalance < 1}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-black text-sm tracking-wide shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:brightness-110 transition disabled:opacity-50"
              >
                {loadSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <span>Submit Game Load Request (${parseFloat(loadAmount || 0).toFixed(2)})</span>
                )}
              </button>

              {loadSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm space-y-1">
                  <div className="flex items-center gap-2 font-black text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Load Request Queued!</span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Your request to load <strong>${loadSuccess.amount.toFixed(2)}</strong> into <strong>{loadSuccess.gameName}</strong> (Username: <code>{loadSuccess.username}</code>) has been submitted. Check the Transaction History tab for real-time status!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: TRANSACTION HISTORY */}
        {/* ============================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0e111a] border border-white/5">
              <div>
                <h3 className="text-lg font-black font-serif text-white tracking-wide">
                  Account Activity & Audit Ledger
                </h3>
                <p className="text-xs text-gray-400">
                  Track all deposits, withdrawals, and platform game load requests with real-time approval status and rejection reasons.
                </p>
              </div>

              {/* Sub-filters */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141824] border border-white/5">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'deposit', label: 'Deposits' },
                  { id: 'withdrawal', label: 'Withdrawals' },
                  { id: 'game_load', label: 'Game Loads' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setHistoryFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      historyFilter === f.id
                        ? 'bg-[#ffd700] text-black font-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTimeline.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-[#0e111a] border border-white/5 space-y-3">
                <History className="w-12 h-12 text-gray-600 mx-auto" />
                <h4 className="text-base font-bold text-gray-300">No Transactions Found</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  You haven't made any deposits, cashouts, or game transfers matching this filter yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTimeline.map((item, idx) => {
                  const isDeposit = item.kind === 'deposit';
                  const isWithdrawal = item.kind === 'withdrawal';
                  const isGameLoad = item.kind === 'game_load';

                  const isPending = item.status === 'pending';
                  const isApproved = item.status === 'approved';
                  const isRejected = item.status === 'rejected';

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isRejected
                          ? 'bg-[#180f12] border-red-500/30'
                          : isApproved
                          ? 'bg-[#0f151c] border-emerald-500/20'
                          : 'bg-[#10131e] border-white/5'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 ${
                              isDeposit
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : isWithdrawal
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-purple-500/15 text-purple-400'
                            }`}
                          >
                            {isDeposit && <ArrowDownLeft className="w-5 h-5" />}
                            {isWithdrawal && <ArrowUpRight className="w-5 h-5" />}
                            {isGameLoad && <Gamepad2 className="w-5 h-5" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-white">
                                {item.title}
                              </h4>
                              {/* Status Badge */}
                              {isPending && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                                  <Clock className="w-2.5 h-2.5" /> PENDING
                                </span>
                              )}
                              {isApproved && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> APPROVED
                                </span>
                              )}
                              {isRejected && (
                                <span className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                                  <XCircle className="w-2.5 h-2.5" /> REJECTED
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
                              <span>{new Date(item.createdAt).toLocaleString()}</span>
                              {item.gameUsername && (
                                <span className="font-mono text-purple-300">
                                  • Game Account: {item.gameUsername}
                                </span>
                              )}
                              {item.destinationAddress && (
                                <span className="font-mono text-gray-300">
                                  • To: {item.destinationAddress}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Amount & Bonus */}
                        <div className="text-right sm:shrink-0">
                          <span
                            className={`text-base font-black font-mono block ${
                              isDeposit ? 'text-emerald-400' : 'text-white'
                            }`}
                          >
                            {isDeposit ? '+' : '-'}${parseFloat(item.amount || 0).toFixed(2)} USD
                          </span>
                          {isDeposit && item.bonusAmount > 0 && (
                            <span className="text-[10px] text-[#ffd700] font-mono block">
                              +${item.bonusAmount.toFixed(2)} Bonus (Total: ${item.totalCredited?.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prominent Rejection Reason Display */}
                      {isRejected && (item.rejectionReason || item.rejectReason || item.adminNote) && (
                        <div className="mt-3 pt-3 border-t border-red-500/20 flex items-start gap-2.5 text-xs text-rose-200 bg-rose-950/40 p-3 rounded-xl border border-rose-500/30">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold text-rose-300 block mb-0.5">Staff Note / Rejection Reason:</strong>
                            <span className="leading-relaxed">{item.rejectionReason || item.rejectReason || item.adminNote}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      {/* Lightbox / Zoom Modal for QR code & Proof Screenshots */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-[#10141e] border border-[#d4af37]/40 rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white truncate pr-2">
                {previewImage.title || 'Image Preview'}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full aspect-square max-h-[70vh] rounded-2xl overflow-hidden bg-white p-2 border border-white/10 flex items-center justify-center">
              <img
                src={previewImage.url}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDownloadQr(previewImage.url, 'image_view.png')}
                className="px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-yellow-400 text-black font-black text-xs flex items-center gap-1.5 transition shadow"
              >
                <Download className="w-4 h-4" />
                <span>Download Image</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
