'use client';

import React, { useEffect, useState } from 'react';
import { Bell, ArrowRight, X, DollarSign, Wallet, Gamepad2, MessageSquare } from 'lucide-react';

export default function IncomingRequestToast({ alert, onDismiss, onViewRequest }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!alert) return;

    setProgress(100);
    const duration = 8000; // 8 seconds auto-dismiss
    const interval = 100;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          if (onDismiss) onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const getIcon = () => {
    if (alert.type === 'chat') return <MessageSquare size={18} className="text-cyan-400" />;
    if (alert.type === 'deposit') return <DollarSign size={18} className="text-amber-400" />;
    if (alert.type === 'redemption') return <Wallet size={18} className="text-purple-400" />;
    return <Gamepad2 size={18} className="text-[#ffd700]" />;
  };

  const getBorderColor = () => {
    if (alert.type === 'chat') return 'border-cyan-500/60 shadow-cyan-500/25 ring-1 ring-cyan-400/30';
    if (alert.type === 'deposit') return 'border-amber-500/50 shadow-amber-500/20';
    if (alert.type === 'redemption') return 'border-purple-500/50 shadow-purple-500/20';
    return 'border-[#d4af37]/50 shadow-cyan-500/20';
  };

  return (
    <div className="fixed top-20 right-2 sm:right-4 left-2 sm:left-auto z-[90] max-w-sm sm:w-full animate-slideInRight">
      <div
        className={`p-4 rounded-2xl bg-[#0e1224]/95 backdrop-blur-xl border ${getBorderColor()} shadow-2xl flex flex-col gap-3 transition-all relative overflow-hidden`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  {alert.title || 'New Request Received'}
                </h4>
              </div>
              <p className="text-sm font-bold text-amber-300 mt-0.5">{alert.message}</p>
              {alert.subtext && <p className="text-[11px] text-gray-400 mt-0.5">{alert.subtext}</p>}
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => {
              if (onViewRequest) onViewRequest(alert);
              onDismiss();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-black flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <span>{alert.type === 'chat' ? 'Open Chat Desk' : 'Review Request'}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Auto dismiss countdown bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-[#ffd700] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

