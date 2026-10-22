'use client';

import React from 'react';
import { Crown, MessageSquare, ShieldCheck, Zap, Award } from 'lucide-react';

export default function CrownClubSection({ onOpenChat }) {
  const tiers = [
    { name: 'Bronze VIP', limit: '$1,000 / Day', perk: '5% Weekly Boost', req: 'Entry Level', active: false },
    { name: 'Silver VIP', limit: '$2,500 / Day', perk: '10% Daily Cashback', req: '$500 Played', active: false },
    { name: 'Gold VIP', limit: '$5,000 / Day', perk: '15% Daily Cashback + Priority Queue', req: '$2,500 Played', active: true },
    { name: 'Royal Emperor', limit: 'Unlimited Cashout', perk: '25% Lossback + Personal Host', req: 'Invite Only', active: false },
  ];

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#121624] via-[#161b2c] to-[#121624] border border-[#d4af37]/35 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4af37]/15 text-[#ffd700] text-xs font-black uppercase tracking-wider mb-2 border border-[#d4af37]/35">
            <Crown className="w-4 h-4" />
            <span>Crown Club VIP Status</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white font-serif">
            UNLOCK EMPEROR PRIVILEGES
          </h3>
          <p className="text-xs text-gray-400 max-w-lg mt-1">
            Climb royal tiers to unlock higher daily redemptions, zero-fee processing, priority 1-hour payouts, and a dedicated 24/7 personal concierge host.
          </p>
        </div>

        <button
          onClick={onOpenChat}
          className="btn-gold text-xs px-5 py-3 font-bold flex items-center gap-2 shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.3)]"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Talk to VIP Host</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
        {tiers.map((t, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border text-center transition flex flex-col justify-between min-h-[140px] ${
              t.active
                ? 'bg-gradient-to-b from-[#d4af37]/25 to-[#151928] border-[#ffd700] shadow-[0_0_20px_rgba(212,175,55,0.35)] scale-102'
                : 'bg-black/40 border-white/5'
            }`}
          >
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">{t.name}</p>
              <p className="text-base font-black text-gold-gradient font-mono my-1.5">{t.limit}</p>
              <p className="text-[11px] text-gray-300 leading-snug">{t.perk}</p>
            </div>
            <p className="text-[10px] text-gray-500 font-mono mt-2 pt-2 border-t border-white/5">{t.req}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
