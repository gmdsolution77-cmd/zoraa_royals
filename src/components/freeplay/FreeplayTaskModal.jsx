'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Gift,
  Mail,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Gamepad2,
  ArrowRight,
  ExternalLink,
  Crown,
} from 'lucide-react';
import { diffSet, sanitizeGameTitle } from '@/lib/fastDiff';
import { resolveFreeplayAmountSC, formatFreeplayUSD } from '@/lib/freeplaySettings';

export default function FreeplayTaskModal({
  isOpen,
  onClose,
  user,
  freeplayAmount,
  onSuccess,
}) {
  const [configuredAmount, setConfiguredAmount] = useState(null);
  const [availableGames, setAvailableGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [taskId, setTaskId] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [statusMsg, setStatusMsg] = useState(null);
  const [liveWalletBal, setLiveWalletBal] = useState(null);
  const [deskGate, setDeskGate] = useState('loading');
  const fileInputRef = useRef(null);
  const initialEmailSentRef = useRef(false);

  const targetEmail = user?.email || '';
  const freeplaySC =
    configuredAmount ??
    (freeplayAmount !== undefined && freeplayAmount !== null
      ? Number(freeplayAmount)
      : null) ??
    resolveFreeplayAmountSC(null);
  const freeplayLabel = formatFreeplayUSD(freeplaySC);

  useEffect(() => {
    if (!isOpen) return;
    setConfiguredAmount(null);
    fetch('/api/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.settings) {
          setConfiguredAmount(resolveFreeplayAmountSC(d.settings));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setLiveWalletBal(Number(d.user.balance ?? d.user.balanceSC ?? 0));
          window.dispatchEvent(new CustomEvent('royal-user-sync', { detail: d.user }));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Fetch dynamic active games from database
  useEffect(() => {
    if (isOpen) {
      fetch('/api/games')
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.games)) {
            const byTitle = new Map();
            for (const g of d.games) {
              if (g.status !== 'active' && g.isActive === false) continue;
              const title = sanitizeGameTitle(g.title || g.name);
              if (!title || byTitle.has(title)) continue;
              byTitle.set(title, { ...g, title });
            }
            const active = Array.from(byTitle.values());
            diffSet(setAvailableGames, active);
            if (active.length > 0) {
              setSelectedGame((prev) => prev || active[0].title);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      initialEmailSentRef.current = false;
      setDeskGate('loading');
      return;
    }
    fetch('/api/freeplay', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success) {
          setDeskGate('open');
          return;
        }
        if (d.claimed) setDeskGate('claimed');
        else if (d.pending) setDeskGate('pending');
        else setDeskGate('open');
      })
      .catch(() => setDeskGate('open'));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || deskGate !== 'open' || !targetEmail || initialEmailSentRef.current) return;
    initialEmailSentRef.current = true;
    let cancelled = false;

    (async () => {
      setEmailSending(true);
      setStatusMsg(null);
      try {
        const res = await fetch('/api/freeplay/send-task-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            name: user?.username || '',
            gameTitle: selectedGame || '',
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.success) {
          setEmailSent(true);
          if (data.taskId) setTaskId(data.taskId);
          setResendCooldown(45);
          setStatusMsg({
            type: 'success',
            text: 'Verification task email sent! Follow the instructions below.',
          });
        } else {
          setStatusMsg({ type: 'error', text: data.message || 'Could not send verification email.' });
          initialEmailSentRef.current = false;
        }
      } catch {
        if (!cancelled) {
          setStatusMsg({ type: 'error', text: 'Network error sending verification email.' });
          initialEmailSentRef.current = false;
        }
      } finally {
        if (!cancelled) setEmailSending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, deskGate, targetEmail, selectedGame, user?.username]);

  if (!isOpen) return null;

  const handleSendEmail = async (isManual = false) => {
    if (!targetEmail) {
      setStatusMsg({ type: 'error', text: 'Please sign in or provide a valid email address.' });
      return;
    }
    if (isManual && resendCooldown > 0) return;
    if (deskGate !== 'open') {
      setStatusMsg({
        type: 'error',
        text:
          deskGate === 'pending'
            ? 'A freeplay request is already under review. Please wait for staff to approve or reject it.'
            : 'You have already used your one-time signup freeplay.',
      });
      return;
    }

    setEmailSending(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/freeplay/send-task-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: user?.username || '',
          gameTitle: selectedGame,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEmailSent(true);
        if (data.taskId) setTaskId(data.taskId);
        setResendCooldown(45);
        setStatusMsg({
          type: 'success',
          text: isManual
            ? 'New verification email dispatched! Check your Spam / Inbox.'
            : 'Verification task email sent! Follow the instructions below.',
        });
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Could not send verification email.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Network error sending verification email.' });
    } finally {
      setEmailSending(false);
    }
  };

  // Compress uploaded screenshot
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMsg({ type: 'error', text: 'Please upload a valid image (PNG, JPG, or WebP).' });
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setScreenshot(compressed);
        setUploading(false);
        setStatusMsg({ type: 'success', text: 'Inbox screenshot attached and ready!' });
      };
      img.onerror = () => {
        setScreenshot(event.target.result);
        setUploading(false);
      };
      img.src = event.target.result;
    };
    reader.onerror = () => {
      setUploading(false);
      setStatusMsg({ type: 'error', text: 'Error reading file.' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (deskGate === 'pending') {
      setStatusMsg({
        type: 'info',
        text: 'Your freeplay is already submitted and waiting for staff review. You cannot send another request yet.',
      });
      return;
    }
    if (deskGate === 'claimed') {
      setStatusMsg({
        type: 'error',
        text: 'You have already received your one-time signup freeplay.',
      });
      return;
    }
    if (!selectedGame) {
      setStatusMsg({ type: 'error', text: 'Please select a casino game platform.' });
      return;
    }
    if (!screenshot) {
      setStatusMsg({ type: 'error', text: 'Please upload your Inbox screenshot proof.' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/freeplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameTitle: selectedGame,
          taskId,
          screenshot,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffd700', '#d4af37', '#ffffff', '#10b981'],
          });
        } catch {}

        if (onSuccess) onSuccess(data);
        setDeskGate('pending');
        window.dispatchEvent(new CustomEvent('royal-freeplay-submitted'));
        setStatusMsg({
          type: 'success',
          text: data.message || 'Freeplay task submitted successfully! Staff is reviewing your proof.',
        });

        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to submit task proof.' });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Network error submitting task proof.' });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(
    deskGate === 'open' && selectedGame && screenshot && !uploading && !submitting
  );

  const walletBal =
    liveWalletBal !== null
      ? liveWalletBal
      : Number(user?.balance ?? user?.balanceSC ?? 0);

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-y-contain bg-black/85 backdrop-blur-md"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <div className="flex min-h-full items-start justify-center p-4 py-6 sm:py-10">
      <div className="relative w-full max-w-xl rounded-3xl border border-[#d4af37]/40 bg-[#0c0e18] p-5 sm:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(212,175,55,0.2)] text-white space-y-5">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#ffd700]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer z-20"
        >
          <X size={18} />
        </button>

        {user && (
          <div className="flex justify-end -mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-[11px] font-mono font-bold text-emerald-300">
              Wallet: ${walletBal.toFixed(2)}
            </span>
          </div>
        )}

        {deskGate === 'pending' && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 flex items-start gap-2">
            <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
            <span>
              Your freeplay request is with our team. You cannot submit again until it is <strong>approved</strong> or{' '}
              <strong>rejected</strong>.
            </span>
          </div>
        )}

        {deskGate === 'claimed' && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-300" />
            <span>You have already claimed your one-time signup freeplay.</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#997b24] via-[#ffd700] to-[#fff0a8] flex items-center justify-center text-black font-black shadow-[0_0_20px_rgba(212,175,55,0.4)] shrink-0">
            <Gift size={24} className="text-black" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffd700]/15 border border-[#ffd700]/40 text-[#ffd700] text-[10px] font-mono font-black uppercase tracking-wider mb-1">
              <Sparkles size={11} />
              <span>{freeplayLabel} Freeplay Task</span>
              {taskId && <span className="text-white">#{taskId}</span>}
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-black text-white m-0 tracking-wide">
              FREEPLAY VERIFICATION TASK
            </h2>
            <p className="text-xs text-slate-300 m-0 leading-relaxed">
              Complete this 30-second verification task to claim your {freeplayLabel} freeplay credits!
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-bold ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-red-950/70 border-red-500/50 text-red-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-400 shrink-0" />
            )}
            <span className="leading-relaxed">{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Select Game Platform */}
          <div className="space-y-2">
            <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#ffd700] text-black flex items-center justify-center text-[10px] font-black">
                1
              </span>
              <span>Select Casino Game Platform:</span>
            </label>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-[#ffd700] text-sm font-bold text-white outline-none cursor-pointer"
            >
              {availableGames.length === 0 ? (
                <option value="">Loading platforms…</option>
              ) : (
                availableGames.map((g) => {
                  const game = g.title || g.name;
                  return (
                    <option key={game} value={game} className="bg-slate-900 text-white">
                      {game}
                    </option>
                  );
                })
              )}
            </select>
            <p className="text-[10px] text-slate-400 m-0">
              Pick the sweepstakes platform where you want your freeplay loaded.
            </p>
          </div>

          {/* Step 2: Verification Task Email Dispatch Info */}
          <div className="p-4 rounded-2xl bg-[#07080b] border border-[#d4af37]/30 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#ffd700] text-black flex items-center justify-center text-[10px] font-black">
                  2
                </span>
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Verification Email Sent
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSendEmail(true)}
                disabled={emailSending || resendCooldown > 0}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={12} className={emailSending ? 'animate-spin' : ''} />
                <span>
                  {emailSending
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend (${resendCooldown}s)`
                    : 'Resend Email'}
                </span>
              </button>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed space-y-1.5 font-mono">
              <p className="m-0">
                Dispatched to: <strong className="text-amber-300">{targetEmail}</strong>
              </p>
              {taskId && (
                <p className="m-0">
                  Task Reference ID: <strong className="text-[#ffd700]">{taskId}</strong>
                </p>
              )}
            </div>

            {/* Instruction Checklist */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-200 space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#ffd700] text-black flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  ✓
                </span>
                <span>
                  Check your <strong>Spam / Junk folder</strong>. If there, click <strong className="text-emerald-400">&quot;Report Not Spam&quot;</strong> or <strong>&quot;Move to Inbox&quot;</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#ffd700] text-black flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  ✓
                </span>
                <span>
                  Open your <strong>Primary Inbox</strong> and take a screenshot showing the Zorra Royals verification email inside your Inbox.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-[#ffd700] text-black flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                  ✓
                </span>
                <span>
                  Upload the screenshot proof below and hit submit!
                </span>
              </div>
            </div>

            <p className="text-[10.5px] text-amber-300/80 m-0 leading-relaxed italic">
              🔒 Privacy Tip: You can blur out or draw lines over any other personal emails in your screenshot.
            </p>
          </div>

          {/* Step 3: Screenshot Upload Proof Dropzone */}
          <div className="space-y-2">
            <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#ffd700] text-black flex items-center justify-center text-[10px] font-black">
                  3
                </span>
                <span>Upload Inbox Screenshot Proof:</span>
              </span>
              <span className="text-[10.5px] text-slate-400 lowercase font-normal">PNG, JPG, or WebP</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {!screenshot ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 rounded-2xl border-2 border-dashed border-amber-500/35 hover:border-amber-400 bg-slate-900/50 hover:bg-slate-900/80 transition flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  {uploading ? <RefreshCw size={22} className="animate-spin" /> : <Upload size={22} />}
                </div>
                <div>
                  <span className="text-xs font-black text-white block">
                    {uploading ? 'Processing Image...' : 'Click to Upload Inbox Screenshot Proof'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Supports PNG, JPG, JPEG, or WebP
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-500/50 bg-[#07080b] space-y-2 p-2">
                <img
                  src={screenshot}
                  alt="Inbox proof"
                  className="w-full max-h-48 object-contain rounded-xl bg-black"
                />
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>Proof Attached &amp; Ready</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold cursor-pointer transition"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshot('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-2.5 py-1 rounded-lg bg-red-950/80 border border-red-500/40 text-red-300 hover:bg-red-900 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <Trash2 size={12} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-3.5 px-6 rounded-2xl font-serif font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
              canSubmit
                ? 'btn-gold shadow-[0_0_25px_rgba(212,175,55,0.5)] hover:scale-[1.01] active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>SUBMITTING TASK PROOF...</span>
              </>
            ) : !screenshot ? (
              <>
                <Upload size={16} />
                <span>ATTACH INBOX SCREENSHOT TO SUBMIT</span>
              </>
            ) : (
              <>
                <Gift size={16} />
                <span>SUBMIT TASK &amp; CLAIM {freeplayLabel.toUpperCase()} FREEPLAY &rarr;</span>
              </>
            )}
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
