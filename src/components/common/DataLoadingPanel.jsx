'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DataLoadingPanel({
  label = 'Loading data...',
  variant = 'inline',
  className = '',
  rows = 4,
}) {
  if (variant === 'overlay') {
    return (
      <div
        className={`absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#07080b]/75 backdrop-blur-sm ${className}`}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin mb-3" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#d4af37]/90">{label}</p>
      </div>
    );
  }

  if (variant === 'skeleton-table') {
    return (
      <div className={`space-y-2 ${className}`} role="status" aria-live="polite">
        <div className="flex items-center gap-2 text-[#d4af37] text-xs font-bold uppercase tracking-wider mb-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{label}</span>
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-14 rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center gap-2 py-8 text-[#d4af37] ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-5 h-5 animate-spin shrink-0" />
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}
