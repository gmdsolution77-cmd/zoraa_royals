'use client';

import React, { useEffect, useState } from 'react';
import { Tag, StickyNote, Save, Plus, X, Loader2 } from 'lucide-react';
import { CHAT_LABEL_PRESETS, labelChipStyle } from '@/lib/chatConversationMeta';

/** Staff-only labels & notes on Player 360 profile (synced with live chat meta). */
export default function AdminPlayerStaffMeta({ userId, initialLabels = [], initialNotes = '', onSaved, variant = 'dark' }) {
  const [labels, setLabels] = useState(initialLabels);
  const [staffNotes, setStaffNotes] = useState(initialNotes);
  const [customLabel, setCustomLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveHint, setSaveHint] = useState('');

  const isDark = variant === 'dark';

  useEffect(() => {
    setLabels(Array.isArray(initialLabels) ? initialLabels : []);
    setStaffNotes(initialNotes || '');
  }, [userId, initialLabels, initialNotes]);

  const toggleLabel = (name) => {
    setLabels((prev) => {
      const lower = name.toLowerCase();
      if (prev.some((l) => l.toLowerCase() === lower)) {
        return prev.filter((l) => l.toLowerCase() !== lower);
      }
      if (prev.length >= 12) return prev;
      return [...prev, name];
    });
  };

  const addCustomLabel = () => {
    const name = customLabel.trim().slice(0, 32);
    if (!name) return;
    setLabels((prev) => {
      if (prev.some((l) => l.toLowerCase() === name.toLowerCase())) return prev;
      if (prev.length >= 12) return prev;
      return [...prev, name];
    });
    setCustomLabel('');
  };

  const handleSave = async () => {
    if (!userId || saving) return;
    setSaving(true);
    setSaveHint('');
    try {
      const res = await fetch('/api/admin/players/meta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, labels, staffNotes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveHint(data.error || 'Save failed');
        return;
      }
      setSaveHint('Saved — synced to Live Chat desk');
      onSaved?.(data.meta);
      setTimeout(() => setSaveHint(''), 3000);
    } catch (e) {
      setSaveHint(e?.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (!userId) return null;

  const cardStyle = isDark
    ? {
        padding: '18px 20px',
        borderRadius: '18px',
        backgroundColor: '#130E2E',
        border: '1px solid rgba(255, 215, 0, 0.25)',
      }
    : {};

  return (
    <div style={cardStyle} className={!isDark ? 'rounded-2xl border border-[#ffd700]/30 bg-[#10141e] p-5' : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#ffd700]">
          <Tag size={14} />
          <span>Player labels</span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 rounded-lg bg-[#ffd700]/20 border border-[#ffd700]/40 text-[#ffd700] hover:bg-[#ffd700]/30 text-[10px] font-black uppercase flex items-center gap-1.5 disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Save
        </button>
      </div>

      <p className="text-[10px] text-gray-500 mb-2">Staff only — not visible to the player. Also appears on Live Chat for this user.</p>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {CHAT_LABEL_PRESETS.map((p) => {
          const active = labels.some((l) => l.toLowerCase() === p.name.toLowerCase());
          const style = labelChipStyle(p.name);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggleLabel(p.name)}
              className="px-2 py-1 rounded-lg text-[10px] font-bold border transition"
              style={
                active
                  ? style
                  : { borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.04)', color: '#9ca3af' }
              }
            >
              {p.name}
            </button>
          );
        })}
      </div>

      <div className="flex gap-1.5 mb-2">
        <input
          type="text"
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustomLabel()}
          placeholder="Custom label (e.g. High Roller)"
          maxLength={32}
          className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-[11px] bg-[#07080b] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700]/50"
        />
        <button
          type="button"
          onClick={addCustomLabel}
          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-gray-300 hover:text-white"
        >
          <Plus size={14} />
        </button>
      </div>

      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {labels.map((l) => (
            <span
              key={l}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border"
              style={labelChipStyle(l)}
            >
              {l}
              <button type="button" onClick={() => toggleLabel(l)} className="opacity-70 hover:opacity-100">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-cyan-300 mb-1.5">
        <StickyNote size={13} />
        Internal staff notes
      </label>
      <textarea
        value={staffNotes}
        onChange={(e) => setStaffNotes(e.target.value)}
        rows={4}
        maxLength={4000}
        placeholder="Risk flags, VIP handling, payment preferences, follow-up reminders..."
        className="w-full rounded-xl px-3 py-2 text-[11px] leading-relaxed bg-[#07080b] border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500/40 resize-y min-h-[88px]"
      />

      {saveHint && (
        <p className={`text-[10px] font-bold mt-2 ${saveHint.startsWith('Saved') ? 'text-emerald-400' : 'text-red-300'}`}>
          {saveHint}
        </p>
      )}
    </div>
  );
}