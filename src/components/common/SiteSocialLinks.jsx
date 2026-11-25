'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

function FacebookMark({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export default function SiteSocialLinks({ variant = 'footer', className = '' }) {
  const [fb, setFb] = useState({ url: '', label: '', visible: false });

  useEffect(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success || !d.settings) return;
        const s = d.settings;
        if (s.facebookPageVisible && s.facebookPageUrl) {
          setFb({
            url: s.facebookPageUrl,
            label: s.facebookPageLabel || 'Official Facebook Page',
            visible: true,
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!fb.visible || !fb.url) return null;

  const isCompact = variant === 'compact';

  return (
  <div className={className}>
    <a
      href={fb.url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        isCompact
          ? 'inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1877F2]/15 border border-[#1877F2]/40 text-[#6ea8fe] hover:bg-[#1877F2]/25 hover:text-white text-[11px] font-bold transition'
          : 'inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#1877F2]/10 border border-[#1877F2]/35 text-white hover:bg-[#1877F2]/20 hover:border-[#1877F2]/60 transition group w-full sm:w-auto'
      }
    >
      <span
        className={
          isCompact
            ? 'p-1.5 rounded-lg bg-[#1877F2] text-white'
            : 'p-2 rounded-xl bg-[#1877F2] text-white shadow-[0_0_16px_rgba(24,119,242,0.45)] group-hover:scale-105 transition'
        }
      >
        <FacebookMark className="w-4 h-4" />
      </span>
      <span className="flex flex-col items-start min-w-0">
        <span className={`font-black uppercase tracking-wider ${isCompact ? 'text-[10px]' : 'text-xs text-[#6ea8fe] group-hover:text-white'}`}>
          Facebook
        </span>
        <span className={`truncate max-w-[220px] ${isCompact ? 'text-[11px] text-gray-300' : 'text-[11px] text-gray-400 group-hover:text-gray-200'}`}>
          {fb.label}
        </span>
      </span>
      {!isCompact && <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-white ml-1 shrink-0" />}
    </a>
  </div>
  );
}

export { FacebookMark };