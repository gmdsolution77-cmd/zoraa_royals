'use client';

import React, { useEffect, useState } from 'react';
import { Tag, StickyNote, Save, Plus, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { CHAT_LABEL_PRESETS, labelChipStyle } from '@/lib/chatConversationMeta';

export default function AdminChatConversationMeta({ conversationId, initialLabels = [], initialNotes = '', onSaved }) {
  const [labels, setLabels] = useState(initialLabels);
  const [staffNotes, setStaffNotes] = useState(initialNotes);
  const [customLabel, setCustomLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveHint, setSaveHint] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLabels(Array.isArray(initialLabels) ? initialLabels : []);
    setStaffNotes(initialNotes || '');
    setSaveHint('');
    const hasMeta =
      (Array.isArray(initialLabels) && initialLabels.length > 0) ||
      Boolean(String(initialNotes || '').trim());
    setOpen(hasMeta);
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

  const notesPreview = staffNotes.trim().slice(0, 56);
  const hasNotes = Boolean(staffNotes.trim());

  return (
    <div
      className="shrink-0 border-b border-white/10 bg-[#0a0e16]/95"
      role="region"
      aria-label="Staff labels and notes"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3.5 py-2.5 flex items-center gap-2 text-left hover:bg-white/[0.03] transition-colors"
        aria-expanded={open}
      >
        <Tag size={14} className="text-[#ffd700] shrink-0" />
        <span className="text-[11px] font-black uppercase tracking-wider text-gray-300 shrink-0">
          Labels &amp; notes
        </span>
        <span className="text-[10px] text-gray-600 font-normal normal-case hidden sm:inline shrink-0">
          (staff only)
        </span>

        <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap justify-end">
          {!open && labels.length > 0 && (
            <div className="flex items-center gap-1 max-w-[min(100%,280px)] overflow-hidden">
              {labels.slice(0, 4).map((l) => (
                <span
                  key={l}
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold border truncate max-w-[72px]"
                  style={labelChipStyle(l)}
                >
                  {l}
                </span>
              ))}
              {labels.length > 4 && (
                <span className="text-[9px] text-gray-500 font-bold">+{labels.length - 4}</span>
              )}
            </div>
          )}
          {!open && hasNotes && (
            <span className="text-[10px] text-cyan-500/80 truncate max-w-[140px] hidden md:inline" title={staffNotes}>
              <StickyNote size={10} className="inline mr-0.5 align-text-bottom" />
              {notesPreview}
              {staffNotes.length > 56 ? '…' : ''}
            </span>
          )}
          {!open && labels.length === 0 && !hasNotes && (
            <span className="text-[10px] text-gray-500">Tap to open</span>
          )}
        </div>

        {open ? (
          <ChevronUp size={18} className="text-gray-400 shrink-0" aria-hidden />
        ) : (
          <ChevronDown size={18} className="text-gray-400 shrink-0" aria-hidden />
        )}
      </button>

      {open && (
        <div className="px-3.5 pb-3 pt-1 space-y-3 border-t border-white/10 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-gray-500">Player cannot see this section</span>
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
                      : {
                          borderColor: 'rgba(255,255,255,0.12)',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          color: '#9ca3af',
                        }
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
              className="w-full rounded-xl px-3 py-2 text-[11px] leading-relaxed bg-[#10141e] border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500/40 resize-y min-h-[72px] max-h-[160px]"
            />
          </div>

          {saveHint && (
            <p className={`text-[10px] font-bold ${saveHint === 'Saved' ? 'text-emerald-400' : 'text-red-300'}`}>
              {saveHint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}