'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

function ForgotPasswordContent() {
  const router = useRouter();
  const [step, setStep] = useState('email'); // 'email' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // STEP 1: Request 6-digit OTP code to email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          email: cleanEmail,
          purpose: 'Password Reset',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to dispatch security code');
      }

      setStep('reset');
      setResendCooldown(40);
      setSuccessMsg(data.message || 'Security code has been dispatched to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 1.5: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          email: cleanEmail,
          purpose: 'Password Reset',
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to resend code');
      }

      setResendCooldown(40);
      setSuccessMsg('A fresh 6-digit security code has been sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP and update password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (otp.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please retype carefully.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccessMsg(data.message || 'Password updated successfully! Redirecting...');
      setTimeout(() => {
        router.push('/?auth=login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-[#0c0e17]/95 border border-[#d4af37]/35 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl space-y-6">
      {/* Header & Logo */}
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
          {step === 'email' ? (
            <>RESET <span className="text-gold-gradient">PASSWORD</span></>
          ) : (
            <>ROYAL <span className="text-gold-gradient">CREDENTIALS</span></>
          )}
        </h1>
        <p className="text-xs text-gray-400">
          {step === 'email'
            ? 'Enter your registered email to receive a 6-digit security code'
            : `Enter the 6-digit verification code dispatched to ${email}`}
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

      {/* STEP 1: Enter Email */}
      {step === 'email' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Account Registered Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                disabled={loading}
                placeholder="player@zorraroyals.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#131622] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full btn-gold py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>DISPATCHING CODE...</span>
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>SEND 6-DIGIT RESET CODE</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Enter OTP & New Password */}
      {step === 'reset' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
            <span className="text-gray-400">Target Account:</span>
            <span className="font-mono text-[#ffd700] font-bold">{email}</span>
          </div>

          {/* 6-Digit OTP */}
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              6-Digit Security Code (OTP)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                disabled={loading}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-[#131622] border border-[#d4af37]/40 rounded-xl py-3 text-center text-lg font-mono font-black tracking-[0.35em] text-[#ffd700] placeholder-gray-600 focus:outline-none focus:border-[#ffd700] transition"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              New Password (Min 6 Characters)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#131622] border border-[#d4af37]/30 rounded-xl pl-3.5 pr-10 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                disabled={loading}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#131622] border border-[#d4af37]/30 rounded-xl pl-3.5 pr-10 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Resend Cooldown & Switch Email */}
          <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError('');
                setOtp('');
              }}
              className="text-gray-400 hover:text-white flex items-center gap-1 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Email</span>
            </button>

            <button
              type="button"
              disabled={resendCooldown > 0 || loading}
              onClick={handleResendOtp}
              className={`font-bold transition ${
                resendCooldown > 0
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-[#ffd700] hover:underline cursor-pointer'
              }`}
            >
              {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6 || newPassword.length < 6}
            className="w-full btn-gold py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>UPDATING PASSWORD...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>SET NEW ROYAL PASSWORD</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Footer Return Links */}
      <div className="pt-2 text-center text-xs text-gray-400 border-t border-white/10 space-y-2">
        <div>
          Remembered your password?{' '}
          <Link href="/?auth=login" className="text-[#ffd700] font-bold hover:underline">
            Back to Sign In
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

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-gray-400 text-xs">Loading Royal Vault...</div>}>
        <ForgotPasswordContent />
      </Suspense>
    </div>
  );
}
