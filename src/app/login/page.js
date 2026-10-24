'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ShieldCheck,
  User,
} from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, email: identifier, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      const username = data.user?.username || identifier;
      setSuccessMsg(`Welcome to the Palace, ${username}! Redirecting...`);

      const destination =
        data.user?.role && data.user.role !== 'player'
          ? '/admin'
          : redirectTarget || '/';

      setTimeout(() => {
        window.location.href = destination;
      }, 700);
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
          SIGN IN TO <span className="text-gold-gradient">ROYAL PALACE</span>
        </h1>
        <p className="text-xs text-gray-400">
          Access your royal vault balances, game accounts, or staff portal
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-1.5">
            Email or Username
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              required
              disabled={loading || Boolean(successMsg)}
              placeholder="player@example.com or username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-[#131622] border border-[#d4af37]/30 rounded-xl pl-10 pr-3 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wider">
              Secret Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-[#ffd700] hover:underline font-bold"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              disabled={loading || Boolean(successMsg)}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#131622] border border-[#d4af37]/30 rounded-xl pl-10 pr-10 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || Boolean(successMsg)}
          className="w-full btn-gold py-3.5 text-sm font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.4)] transition"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AUTHENTICATING...</span>
            </>
          ) : successMsg ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-black" />
              <span>LOGGED IN!</span>
            </>
          ) : (
            <>
              <span>ENTER ROYAL PALACE</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Navigation */}

      {/* Footer Navigation */}
      <div className="pt-2 text-center text-xs text-gray-400 border-t border-white/10 space-y-2">
        <div>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#ffd700] font-bold hover:underline">
            Create VIP account free
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

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#07080b] text-[#f8fafc] flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-gray-400 text-xs">Loading Royal Vault...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
