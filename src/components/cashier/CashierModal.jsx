'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  Wallet,
  TrendingUp,
  CreditCard,
  Copy,
  Check,
  QrCode,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  HelpCircle,
  Coins,
  History,
  Gamepad2,
  Upload,
  Eye,
} from 'lucide-react';

export default function CashierModal({
  isOpen,
  initialTab = 'deposit',
  user,
  onClose,
  onBalanceUpdated,
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'deposit' | 'withdraw' | 'history'
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  
  // Game accounts state
  const [gameAccounts, setGameAccounts] = useState([]);
  const [depositGameTitle, setDepositGameTitle] = useState('Orion Stars');
  const [withdrawGameTitle, setWithdrawGameTitle] = useState('');

  // Deposit state
  const [depositAmount, setDepositAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [bonusCode, setBonusCode] = useState('ROYAL150');
  const [bonusApplied, setBonusApplied] = useState(true);
  const [senderNote, setSenderNote] = useState('');
  const [txHash, setTxHash] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  // Cashout state
  const [withdrawAmount, setWithdrawAmount] = useState(50);
  const [payoutMethod, setPayoutMethod] = useState('Cash App');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');
  const [gameScreenshot, setGameScreenshot] = useState('');
  const [qrCodeImage, setQrCodeImage] = useState('');

  // History state
  const [historyDeposits, setHistoryDeposits] = useState([]);
  const [historyWithdrawals, setHistoryWithdrawals] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const availableGames = ['Orion Stars', 'Fire Kirin', 'Game Vault', 'Milky Way', 'Juwa', 'Panda Master'];

  // Image compressor helper
  const handleCompressAndSetImage = (file, setter) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
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
        setter(canvas.toDataURL('image/webp', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Quick Deposit Presets
  const depositPresets = [
    { amount: 25, bonusSC: 5, tag: 'Starter' },
    { amount: 50, bonusSC: 15, tag: 'Popular', highlight: true },
    { amount: 100, bonusSC: 35, tag: 'High Roller' },
    { amount: 250, bonusSC: 90, tag: 'VIP Pack' },
    { amount: 500, bonusSC: 200, tag: 'King Crown' },
    { amount: 1000, bonusSC: 450, tag: 'Emperor Club' },
  ];

  // Fetch payment gateways & game accounts
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setStatusMessage(null);
      setErrorMessage(null);

      fetch('/api/payments/methods')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.methods) {
            setMethods(data.methods);
            if (data.methods.length > 0 && !selectedMethod) {
              setSelectedMethod(data.methods[0]);
            }
          }
        })
        .catch(() => {});

      // Fetch game accounts
      fetch('/api/game-accounts')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const accs = data.gameAccounts || data.accounts || [];
            setGameAccounts(accs);
            if (accs.length > 0) {
              setWithdrawGameTitle(accs[0].gameTitle);
            }
          }
        })
        .catch(() => {});

      // Fetch history
      fetch('/api/payments/history')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setHistoryDeposits(data.deposits || []);
            setHistoryWithdrawals(data.withdrawals || []);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const currentAmount = customAmount ? parseFloat(customAmount) || 0 : depositAmount;
  const calculatedBonus = bonusApplied ? (currentAmount >= 20 ? +(currentAmount * 0.15).toFixed(2) : 0) : 0;
  const totalCreditedSC = +(currentAmount + calculatedBonus).toFixed(2);
  const totalCreditedGC = Math.round(currentAmount * 1000 + (calculatedBonus * 5000));

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const matchedDepositAccount = gameAccounts.find(
    (a) => a.gameTitle?.toLowerCase() === depositGameTitle.toLowerCase()
  );

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMethod) return;

    if (currentAmount < (selectedMethod.minDeposit || 10)) {
      setErrorMessage(`Minimum deposit for ${selectedMethod.name} is $${selectedMethod.minDeposit}`);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmount,
          methodId: selectedMethod.methodId,
          methodName: selectedMethod.name,
          bonusCode: bonusApplied ? bonusCode : '',
          senderNote,
          senderTag: senderNote,
          senderEmail: user?.email || '',
          txHash,
          gameTitle: depositGameTitle,
          gameUsername: matchedDepositAccount ? matchedDepositAccount.username : null,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to submit deposit');

      const notice = matchedDepositAccount
        ? `Deposit queued for existing game account @${matchedDepositAccount.username}.`
        : `Deposit queued! Because you don't have a ${depositGameTitle} account yet, our desk will auto-create your account upon Finance approval!`;

      setStatusMessage({
        type: 'success',
        title: '💎 Deposit Request Queued!',
        desc: `Your request for $${currentAmount.toFixed(2)} via ${selectedMethod.name} is received. ${notice}`,
      });

      if (onBalanceUpdated) onBalanceUpdated();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();

    // Enforce Active Game Account Check
    if (gameAccounts.length === 0) {
      setErrorMessage('⚠️ Active Game Account Required: You must create and register a game account on a sweepstakes platform before requesting a cashout.');
      return;
    }

    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount < 50) {
      setErrorMessage('Minimum redemption is $50.00 SC');
      return;
    }

    if (!destinationAddress || !destinationAddress.trim()) {
      setErrorMessage('Please provide your payout account tag or wallet address');
      return;
    }

    if (!gameScreenshot) {
      setErrorMessage('Mandatory: Please upload your Game Winning / Score Screenshot.');
      return;
    }

    if (!qrCodeImage) {
      setErrorMessage('Mandatory: Please upload your recipient QR Code image / screenshot.');
      return;
    }

    if ((user?.balanceSC || 0) < amount) {
      setErrorMessage('Insufficient Sweeps Coins balance');
      return;
    }

    const matchedWithdrawAcc = gameAccounts.find(
      (a) => a.gameTitle?.toLowerCase() === withdrawGameTitle.toLowerCase()
    ) || gameAccounts[0];

    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          payoutMethod,
          destinationAddress: destinationAddress.trim(),
          gameTitle: withdrawGameTitle || matchedWithdrawAcc?.gameTitle || 'Sweepstakes Platform',
          gameUsername: matchedWithdrawAcc?.username || null,
          gameScreenshot,
          qrCodeImage,
          notes: withdrawNote,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Redemption request failed');

      setStatusMessage({
        type: 'success',
        title: '💸 Cashout Request Submitted!',
        desc: `Your payout of $${amount.toFixed(2)} USD via ${payoutMethod} from ${matchedWithdrawAcc?.gameTitle} (@${matchedWithdrawAcc?.username}) has been sent to our finance desk. Expected processing time: 1-2 hours.`,
      });

      if (onBalanceUpdated) onBalanceUpdated();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0b0d14] border border-[#d4af37]/35 shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-5 sm:p-7 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#d4af37] to-[#131622] p-0.5 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <div className="w-full h-full bg-[#0b0d14] rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-[#ffd700]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-gold-gradient font-serif tracking-wider">
                ROYAL CASHIER DESK
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#ffd700] border border-[#d4af37]/30">
                24/7 Active
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Instant Deposit Verification & Guaranteed Fast VIP Cashouts
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#131622] border border-[#d4af37]/20 mb-6">
          <button
            onClick={() => { setActiveTab('deposit'); setErrorMessage(null); setStatusMessage(null); }}
            className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              activeTab === 'deposit'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38f26] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => { setActiveTab('withdraw'); setErrorMessage(null); setStatusMessage(null); }}
            className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              activeTab === 'withdraw'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38f26] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Redeem / Cashout</span>
          </button>
          <button
            onClick={() => { setActiveTab('history'); setErrorMessage(null); setStatusMessage(null); }}
            className={`py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38f26] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>

        {/* Status / Error alerts */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs space-y-1">
            <div className="flex items-center gap-2 font-black text-sm text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{statusMessage.title}</span>
            </div>
            <p className="text-gray-300 leading-relaxed">{statusMessage.desc}</p>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: DEPOSIT */}
        {/* ======================================================== */}
        {activeTab === 'deposit' && (
          <form onSubmit={handleDepositSubmit} className="space-y-6">
            {/* Step 1: Game Platform Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#d4af37]/20 text-[#ffd700] text-[10px] flex items-center justify-center font-mono">1</span>
                Choose Target Game Platform
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {availableGames.map((game) => {
                  const isSelected = depositGameTitle === game;
                  const hasAcc = gameAccounts.some((a) => a.gameTitle?.toLowerCase() === game.toLowerCase());
                  return (
                    <button
                      key={game}
                      type="button"
                      onClick={() => setDepositGameTitle(game)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#241c09] to-[#121522] border-[#ffd700] shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                          : 'bg-[#131622] border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{game}</p>
                        <p className="text-[10px] text-gray-400">
                          {hasAcc ? '✅ Has Account' : '✨ Auto-create'}
                        </p>
                      </div>
                      <Gamepad2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#ffd700]' : 'text-gray-500'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Game Account Linked status vs Auto-creation notice */}
              {matchedDepositAccount ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Existing Game Account Linked:</span>
                  </div>
                  <span className="font-mono font-black text-[#ffd700] bg-black/60 px-2.5 py-1 rounded-lg border border-[#ffd700]/30">
                    @{matchedDepositAccount.username}
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#ffd700] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>✨ No {depositGameTitle} Account Yet?</strong> You can deposit freely without an account! Once Finance approves your deposit, our desk will <strong>automatically queue your game account creation</strong> and send you credentials.
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Amount Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#d4af37]/20 text-[#ffd700] text-[10px] flex items-center justify-center font-mono">2</span>
                  Select Deposit Amount
                </label>
                <span className="text-[11px] text-gray-400">Rate: 1 USD = 1 Sweeps Coin (SC)</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                {depositPresets.map((preset) => {
                  const isSelected = depositAmount === preset.amount && !customAmount;
                  return (
                    <button
                      key={preset.amount}
                      type="button"
                      onClick={() => { setDepositAmount(preset.amount); setCustomAmount(''); }}
                      className={`p-2.5 rounded-xl text-center border transition relative ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#d4af37]/25 to-[#131622] border-[#d4af37] text-white shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                          : 'bg-[#131622] border-white/5 text-gray-300 hover:border-white/20'
                      }`}
                    >
                      {preset.highlight && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500 text-black font-extrabold">
                          Hot
                        </span>
                      )}
                      <p className="text-sm font-black">${preset.amount}</p>
                      <p className="text-[9px] text-[#ffd700] font-mono">+{preset.bonusSC} SC</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Or enter custom amount (e.g. 75)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="flex-1 bg-[#131622] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {/* Step 3: Payment Method */}
            <div>
              <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#d4af37]/20 text-[#ffd700] text-[10px] flex items-center justify-center font-mono">3</span>
                Choose Payment Gateway
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {methods.map((method) => {
                  const isSelected = selectedMethod?.methodId === method.methodId;
                  return (
                    <button
                      key={method.methodId}
                      type="button"
                      onClick={() => setSelectedMethod(method)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#1a1f30] to-[#121520] border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.3)]'
                          : 'bg-[#131622] border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{method.name}</p>
                        <p className="text-[10px] text-gray-400">{method.tag || 'Instant'}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[#d4af37] bg-[#d4af37]' : 'border-gray-600'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Payment Instructions Voucher */}
            {selectedMethod && (
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#121624] to-[#0c0e16] border border-[#d4af37]/30 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#ffd700] tracking-wider">
                      Send Payment To:
                    </span>
                    <p className="text-base font-black text-white font-mono flex items-center gap-2">
                      {selectedMethod.accountDetails}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedMethod.accountDetails, 'account')}
                    className="btn-gold-outline text-xs px-3 py-1.5 font-bold"
                  >
                    {copiedField === 'account' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Tag</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-gray-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                  <p className="font-semibold text-amber-300 mb-1">Important Instructions:</p>
                  <p>{selectedMethod.instructions}</p>
                </div>

                {/* Additional inputs for verification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Payment Note / Sender Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. My username on Cash App"
                      value={senderNote}
                      onChange={(e) => setSenderNote(e.target.value)}
                      className="w-full bg-[#0a0c12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Transaction ID / Hash (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. #98124 or blockchain txid"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="w-full bg-[#0a0c12] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Summary & Submit */}
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-gray-400">Total Credits Upon Verification:</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-gold-gradient font-mono">
                    ${totalCreditedSC.toFixed(2)} SC
                  </span>
                  <span className="text-xs text-amber-400 font-mono">
                    + {totalCreditedGC.toLocaleString()} GC
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto btn-gold px-8 py-3 text-sm font-black flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Submitting to Cashier...</span>
                ) : (
                  <>
                    <span>I Have Sent ${currentAmount} - Submit Deposit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 2: REDEEM / CASHOUT */}
        {/* ======================================================== */}
        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdrawSubmit} className="space-y-6">
            {/* Balance Overview */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#121624] to-[#161a29] border border-[#d4af37]/25">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Available Sweeps Coins (SC)
                </p>
                <p className="text-xl font-black text-white font-mono">
                  ${(user?.balanceSC || 0).toFixed(2)} SC
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Real Cash Value (1 SC = $1 USD)
                </p>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  ${(user?.balanceSC || 0).toFixed(2)} USD
                </p>
              </div>
            </div>

            {/* Check if user has active game accounts */}
            {gameAccounts.length === 0 ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-3">
                <div className="flex items-center gap-2 font-black text-sm text-amber-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>⚠️ Active Game Account Required for Cashout</span>
                </div>
                <p className="text-gray-300 leading-relaxed text-xs">
                  You must have an active registered game account before requesting a cashout.
                  If you have not created an account yet, you can make a deposit first — our cashier desk will <strong>automatically create your game account</strong> upon deposit approval!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('deposit')}
                  className="btn-gold text-xs px-4 py-2 font-black flex items-center gap-2 w-fit shadow-md"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Make a Deposit (Auto-Creates Game Account)</span>
                </button>
              </div>
            ) : (
              <>
                {/* Game Account Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2">
                    Select Game Account to Cashout From <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {gameAccounts.map((acc) => {
                      const isSel = (withdrawGameTitle || gameAccounts[0]?.gameTitle)?.toLowerCase() === acc.gameTitle?.toLowerCase();
                      return (
                        <button
                          key={acc.id || acc._id}
                          type="button"
                          onClick={() => setWithdrawGameTitle(acc.gameTitle)}
                          className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                            isSel
                              ? 'bg-purple-900/30 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                              : 'bg-[#131622] border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-black text-white">{acc.gameTitle}</p>
                            <p className="text-[11px] text-[#ffd700] font-mono">@{acc.username}</p>
                          </div>
                          {isSel && <Check className="w-4 h-4 text-purple-400 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                      Cashout Amount (Min $50.00 SC)
                    </label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(Math.max(50, Math.floor(user?.balanceSC || 50)))}
                      className="text-[11px] text-[#ffd700] hover:underline font-bold"
                    >
                      Max Available
                    </button>
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                    <input
                      type="number"
                      min="50"
                      step="1"
                      required
                      placeholder="50"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-[#131622] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Payout Gateway */}
                <div>
                  <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-2">
                    Select Payout Method
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Cash App', 'Zelle', 'Venmo', 'Crypto (USDT/BTC)'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPayoutMethod(method)}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          payoutMethod === method
                            ? 'bg-gradient-to-b from-[#d4af37]/25 to-[#131622] border-[#d4af37] text-white shadow-md'
                            : 'bg-[#131622] border-white/5 text-gray-300 hover:border-white/20'
                        }`}
                      >
                        <p className="text-xs font-bold">{method}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Destination Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">
                    Your {payoutMethod} Tag / Address / Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={payoutMethod === 'Cash App' ? '$YourCashtag' : 'Enter payout destination details'}
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    className="w-full bg-[#131622] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                {/* Verification Uploads: Screenshot & QR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                      1. Game Score Screenshot <span className="text-red-400">*</span>
                    </label>
                    {gameScreenshot ? (
                      <div className="p-2.5 rounded-xl bg-black/60 border border-purple-500/40 flex items-center justify-between text-xs">
                        <span className="text-purple-300 font-mono truncate max-w-[120px]">Score Ready</span>
                        <button
                          type="button"
                          onClick={() => setGameScreenshot('')}
                          className="text-red-400 hover:text-red-300 text-[10px] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-white/20 hover:border-purple-400 bg-white/5 cursor-pointer text-xs text-gray-300 hover:text-white transition">
                        <Upload className="w-3.5 h-3.5 text-purple-400" />
                        <span>Upload Score Proof</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCompressAndSetImage(e.target.files?.[0], setGameScreenshot)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                      2. Your Cashtag QR Code <span className="text-red-400">*</span>
                    </label>
                    {qrCodeImage ? (
                      <div className="p-2.5 rounded-xl bg-black/60 border border-[#ffd700]/40 flex items-center justify-between text-xs">
                        <span className="text-[#ffd700] font-mono truncate max-w-[120px]">QR Ready</span>
                        <button
                          type="button"
                          onClick={() => setQrCodeImage('')}
                          className="text-red-400 hover:text-red-300 text-[10px] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-white/20 hover:border-[#ffd700] bg-white/5 cursor-pointer text-xs text-gray-300 hover:text-white transition">
                        <Upload className="w-3.5 h-3.5 text-[#ffd700]" />
                        <span>Upload QR Code</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCompressAndSetImage(e.target.files?.[0], setQrCodeImage)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Security Guarantee Note */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p>
                    Zorra Royals pays out 100% of verified redemptions within 1-2 business hours. No hidden fees or surprise deductions.
                  </p>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || gameAccounts.length === 0}
              className="w-full btn-gold py-3 text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gameAccounts.length === 0 ? (
                <span>⚠️ Active Game Account Required to Cashout</span>
              ) : loading ? (
                <span>Processing Cashout Request...</span>
              ) : (
                <>
                  <span>Request ${withdrawAmount} Cashout Payout</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TRANSACTION HISTORY */}
        {/* ======================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Recent Cashier Transactions
            </h4>

            {historyDeposits.length === 0 && historyWithdrawals.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                No transactions found yet. Make your first deposit to get started!
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {historyDeposits.map((dep, idx) => (
                  <div
                    key={'dep_' + idx}
                    className="p-3 rounded-xl bg-[#131622] border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Deposit via {dep.methodName}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          dep.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : dep.status === 'rejected'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {dep.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {new Date(dep.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm font-black text-gold-gradient font-mono">
                      +${(dep.amount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}

                {historyWithdrawals.map((w, idx) => (
                  <div
                    key={'w_' + idx}
                    className="p-3 rounded-xl bg-[#131622] border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Cashout via {w.payoutMethod}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          w.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : w.status === 'rejected'
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {w.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {new Date(w.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      -${(w.amount || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
