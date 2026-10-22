'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  Sparkles,
  Shield,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  Gift,
  KeyRound,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  RotateCw,
} from 'lucide-react';

export default function AuthModal({
  isOpen,
  initialTab = 'login',
  onClose,
  onSuccess,
}) {
  const [tab, setTab] = useState(initialTab); // 'login' | 'register'
  const [regStep, setRegStep] = useState('details'); // 'details' | 'otp'
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [autoReferred, setAutoReferred] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('referral');
      if (ref) {
        setReferralCode(ref.trim());
        setAutoReferred(true);
        setTab('register');
      }
    }
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Handle Send / Resend OTP for Registration
  const handleRequestOtp = async () => {
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          email: cleanEmail,
          username: cleanUsername,
          purpose: 'Registration',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to dispatch security code');
      }

      setRegStep('otp');
      setResendCooldown(40);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // If in register tab and still on details step -> trigger OTP send
    if (tab === 'register' && regStep === 'details') {
      await handleRequestOtp();
      return;
    }

    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Authentication failed');
        }

        onSuccess(data.user);
        onClose();
      } else {
        // Register step 2: Verify OTP and finalize
        if (!otp || otp.trim().length !== 6) {
          throw new Error('Please enter the 6-digit security code sent to your email.');
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
            referralCode,
            otp: otp.trim(),
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Registration failed');
        }

        onSuccess(data.user);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (role) => {
    setError(null);
    setTab('login');
    setRegStep('details');
    if (role === 'admin') {
      setEmail('admin@zorraroyals.com');
      setPassword('RoyalAdmin2026!');
    } else {
      setEmail('player@zorraroyals.com');
      setPassword('Player123!');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto scrollbar-none rounded-2xl bg-[#0d0f17] border border-[#d4af37]/35 shadow-[0_15px_50px_rgba(0,0,0,0.85)] p-5 sm:p-8 animate-slide-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-block p-1 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#fff0a8] to-[#997b24] shadow-[0_0_15px_rgba(212,175,55,0.4)] mb-3">
            <Image
              src="/logo.png"
              alt="Zorra Royals"
              width={54}
              height={54}
              className="rounded-full bg-black"
            />
          </div>
          <h3 className="text-xl font-black text-gold-gradient font-serif tracking-wider">
            ZORRA ROYALS VIP
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {tab === 'login'
              ? 'Sign in to access your royal vault & balances'
              : regStep === 'otp'
              ? `Enter the 6-digit code sent to ${email}`
              : 'Create VIP account & claim $10.00 SC Welcome Bonus'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-black/50 border border-white/5 mb-5">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setRegStep('details');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              tab === 'login'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38f26] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setRegStep('details');
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              tab === 'register'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b38f26] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create VIP Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* LOGIN VIEW */}
          {tab === 'login' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="vip@zorraroyals.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#131622] border border-[#d4af37]/25 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                    Secret Password
                  </label>
                  <Link
                    href="/forgot-password"
                    onClick={onClose}
                    className="text-[11px] text-[#ffd700] hover:underline font-bold"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#131622] border border-[#d4af37]/25 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
                  />
                </div>
              </div>
            </>
          )}

          {/* REGISTER STEP 1: Details */}
          {tab === 'register' && regStep === 'details' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Player Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    placeholder="RoyalKing99"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#131622] border border-[#d4af37]/25 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Email Address (Verification Code will be sent)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    placeholder="vip@zorraroyals.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#131622] border border-[#d4af37]/25 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1">
                  Secret Password (Min 6 Characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#131622] border border-[#d4af37]/25 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                    Referral / Friend Code <span className="text-gray-500 font-normal lowercase">(optional)</span>
                  </label>
                  {autoReferred && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ✓ Friend Code Linked
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Gift className="absolute left-3 top-3 w-4 h-4 text-[#d4af37]" />
                  <input
                    type="text"
                    placeholder="Enter friend's code or username"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full bg-[#131622] border border-[#d4af37]/35 focus:border-[#ffd700] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-gray-500 font-mono tracking-wider transition"
                  />
                </div>
              </div>
            </>
          )}

          {/* REGISTER STEP 2: OTP Verification */}
          {tab === 'register' && regStep === 'otp' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#131622] border border-[#d4af37]/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400 text-[11px] block">Sending code to:</span>
                  <span className="font-mono text-[#ffd700] font-bold">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRegStep('details');
                    setError(null);
                  }}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5 text-center">
                  Enter 6-Digit Email Code (OTP)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-[#131622] border border-[#d4af37]/40 rounded-xl py-3 text-center text-xl font-mono font-black tracking-[0.35em] text-[#ffd700] placeholder-gray-600 focus:outline-none focus:border-[#ffd700] transition"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>Didn&apos;t receive code?</span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loading}
                  onClick={handleRequestOtp}
                  className={`font-bold transition flex items-center gap-1 ${
                    resendCooldown > 0
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-[#ffd700] hover:underline cursor-pointer'
                  }`}
                >
                  <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (tab === 'register' && regStep === 'otp' && otp.length !== 6)}
            className="w-full btn-gold py-3 text-sm font-black flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Royal Request...</span>
              </>
            ) : tab === 'login' ? (
              <>
                <span>Enter Royal Palace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : regStep === 'details' ? (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Send Security Code (OTP)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Verify & Claim $10 Bonus</span>
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Accounts */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-[10px] text-center text-gray-400 uppercase tracking-wider font-semibold mb-2.5">
            Quick 1-Click Demo Logins
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('player')}
              className="py-1.5 px-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#d4af37]/50 text-[11px] text-gray-300 hover:text-white transition"
            >
              👑 Demo VIP Player
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('admin')}
              className="py-1.5 px-2 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 text-[11px] text-amber-300 transition"
            >
              🛡️ Super Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
