'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Gift,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [ageVerified, setAgeVerified] = useState(true);
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check URL referral code or stored code
  useEffect(() => {
    const urlRef = searchParams.get('ref') || searchParams.get('referral') || searchParams.get('referrer');
    if (urlRef) {
      const clean = urlRef.trim().toUpperCase();
      setReferralCode(clean);
      try {
        localStorage.setItem('zorra_ref_code', clean);
      } catch {}
    } else {
      try {
        const stored = localStorage.getItem('zorra_ref_code');
        if (stored) setReferralCode(stored.trim().toUpperCase());
      } catch {}
    }
  }, [searchParams]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // STEP 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!ageVerified) {
      setError('You must certify that you are 18+ years of age to register.');
      return;
    }

    const cleanUser = username.trim();
    const cleanMail = email.trim().toLowerCase();

    if (cleanUser.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanMail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          email: cleanMail,
          username: cleanUser,
          purpose: 'Registration',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to dispatch verification code');
      }

      setStep('otp');
      setResendCooldown(45);
      setSuccessMsg(data.message || `A 6-digit security code has been dispatched to ${cleanMail}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          email: email.trim().toLowerCase(),
          username: username.trim(),
          purpose: 'Registration',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setResendCooldown(45);
      setSuccessMsg(`Fresh verification code dispatched to ${email.trim().toLowerCase()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify & Register
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          otp: otp.trim(),
          referralCode: referralCode.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccessMsg(`Account verified! Welcome to Zorra Royals Palace, ${data.user?.username || username}!`);
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0c0e17]/95 border border-[#d4af37]/35 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-block transition-transform hover:scale-105 mb-1">
          <div className="inline-block p-1 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#fff0a8] to-[#997b24] shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <Image
              src="/logo.png"
              alt="Zorra Royals"
              width={56}
              height={56}
              className="rounded-full bg-black"
            />
          </div>
        </Link>
        <h1 className="text-2xl font-black font-serif text-white tracking-wide">
          CREATE <span className="text-gold-gradient">VIP ACCOUNT</span>
        </h1>
        <p className="text-xs text-gray-400">
          {step === 'details'
            ? 'Sign up for instant $10 VIP welcome bonus & freeplay'
            : `Enter the 6-digit security code dispatched to ${email}`}
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-2.5 text-xs text-emerald-200 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: Details */}
      {step === 'details' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Player Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                minLength={3}
                placeholder="RoyalMaster99"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#131622] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Email Address (Verification Code will be sent)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="player@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#131622] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Password (Min 6 Characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#131622] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                VIP Referral / Friend Code <span className="text-gray-500 font-normal lowercase">(optional)</span>
              </label>
              {referralCode && (
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                  ✓ Code Applied
                </span>
              )}
            </div>
            <div className="relative">
              <Gift className="absolute left-3.5 top-3.5 w-4 h-4 text-[#ffd700]" />
              <input
                type="text"
                placeholder="ROYAL-VIP"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full bg-[#131622] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-3 text-xs text-[#ffd700] uppercase font-mono tracking-wider placeholder-gray-500 focus:outline-none focus:border-[#ffd700] transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="ageCheck"
              checked={ageVerified}
              onChange={(e) => setAgeVerified(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-[#ffd700] accent-[#d4af37] cursor-pointer"
            />
            <label htmlFor="ageCheck" className="text-[11px] text-gray-300 cursor-pointer select-none">
              I certify I am 18+ years old and accept the Terms of Service.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gold py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>DISPATCHING SECURITY OTP...</span>
              </>
            ) : (
              <>
                <span>CONTINUE & SEND EMAIL OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* STEP 2: OTP Verification */
        <form onSubmit={handleVerifyAndRegister} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[#131622] border border-[#d4af37]/30 flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-400 text-[11px] block">Security code dispatched to:</span>
              <span className="font-mono text-[#ffd700] font-bold">{email}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setError('');
              }}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5 text-center">
              Enter 6-Digit Email Code (OTP)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="••••••"
              autoFocus
              required
              className="w-full bg-[#131622] border border-[#d4af37]/50 rounded-xl py-3.5 text-center text-2xl font-mono font-black tracking-[0.35em] text-[#ffd700] placeholder-gray-600 focus:outline-none focus:border-[#ffd700] transition"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <span>Didn&apos;t receive it?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || loading}
              className={`font-bold transition flex items-center gap-1 ${
                resendCooldown > 0
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-[#ffd700] hover:underline cursor-pointer'
              }`}
            >
              <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6 || Boolean(successMsg)}
            className="w-full btn-gold py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>VERIFYING CODE...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>VERIFY & COMPLETE REGISTRATION</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Footer Navigation */}
      <div className="pt-2 text-center text-xs text-gray-400 border-t border-white/10 space-y-2">
        <div>
          Already have an account?{' '}
          <Link href="/login" className="text-[#ffd700] font-bold hover:underline">
            Sign in here
          </Link>
        </div>
        <div>
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-[11px] transition">
            ← Return to Zorra Royals Palace
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-gray-400 text-xs">Loading Royal Vault...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
