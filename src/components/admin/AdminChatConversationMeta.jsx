'use client';

import React, { useEffect, useState } from 'react';
import { Tag, StickyNote, Save, Plus, X, Loader2 } from 'lucide-react';
import { CHAT_LABEL_PRESETS, labelChipStyle } from '@/lib/chatConversationMeta';

export default function AdminChatConversationMeta({ conversationId, initialLabels = [], initialNotes = '', onSaved }) {
  const [labels, setLabels] = useState(initialLabels);
  const [staffNotes, setStaffNotes] = useState(initialNotes);
  const [customLabel, setCustomLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveHint, setSaveHint] = useState('');

  useEffect(() => {
    setLabels(Array.isArray(initialLabels) ? initialLabels : []);
    setStaffNotes(initialNotes || '');
  }, [conversationId, initialLabels, initialNotes]);

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
    if (!conversationId || saving) return;
    setSaving(true);
    setSaveHint('');
    try {
      const res = await fetch('/api/admin/chat/meta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          conversationId: String(conversationId),
          labels,
          staffNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSaveHint(data.error || 'Save failed');
        return;
      }
      setSaveHint('Saved');
      onSaved?.(data.meta);
      setTimeout(() => setSaveHint(''), 2500);
    } catch (e) {
      setSaveHint(e?.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (!conversationId) return null;

  return (
    <div className="px-3.5 py-3 bg-[#0a0e16]/95 border-b border-white/10 space-y-3 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-300">
          <Tag size={13} className="text-[#ffd700]" />
          <span>Labels</span>
          <span className="text-gray-600 font-normal normal-case">(staff only — not visible to player)</span>
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

      <div className="flex flex-wrap gap-1.5">
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

      <div className="flex gap-1.5">
        <input
          type="text"
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCustomLabel()}
          placeholder="Custom label..."
          maxLength={32}
          className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-[11px] bg-[#10141e] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700]/50"
        />
        <button
          type="button"
          onClick={addCustomLabel}
          className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-gray-300 hover:text-white"
          title="Add label"
        >
          <Plus size={14} />
        </button>
      </div>

      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
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

      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-gray-300 mb-1.5">
          <StickyNote size={13} className="text-cyan-400" />
          Internal staff notes
        </label>
        <textarea
          value={staffNotes}
          onChange={(e) => setStaffNotes(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="e.g. Player prefers Zelle. Waiting on deposit screenshot. VIP referrer @john..."
          className="w-full rounded-xl px-3 py-2 text-[11px] leading-relaxed bg-[#10141e] border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500/40 resize-y min-h-[72px]"
        />
      </div>

      {saveHint && (
        <p className={`text-[10px] font-bold ${saveHint === 'Saved' ? 'text-emerald-400' : 'text-red-300'}`}>{saveHint}</p>
      )}
    </div>
  );
}