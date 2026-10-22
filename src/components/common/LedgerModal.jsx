'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export default function LedgerModal({
  isOpen,
  onClose,
  user,
}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      fetch('/api/ledger')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.entries) {
            setEntries(data.entries);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#090b12] border border-[#d4af37]/35 shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-6 sm:p-7 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d4af37]/15 text-[#ffd700]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Player Coin Ledger</h3>
              <p className="text-[10px] text-gray-400">Complete Audit Trail of All Coin Adjustments</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ledger Entries */}
        <div className="space-y-2">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No ledger transactions recorded yet.
            </div>
          ) : (
            entries.map((entry, idx) => {
              const isPositive = (entry.amountSC || 0) >= 0;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-[#121522] border border-white/5 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{entry.description || entry.type}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    {entry.amountSC !== undefined && (
                      <p className={`font-mono font-black ${isPositive ? 'text-[#ffd700]' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}${entry.amountSC.toFixed(2)} SC
                      </p>
                    )}
                    {entry.amountGC ? (
                      <p className="text-[10px] text-gray-400 font-mono">
                        +{entry.amountGC.toLocaleString()} GC
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
