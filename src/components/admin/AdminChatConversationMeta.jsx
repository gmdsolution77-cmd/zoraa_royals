'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Tag, StickyNote, Save, Plus, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { CHAT_LABEL_PRESETS, labelChipStyle } from '@/lib/chatConversationMeta';

export default function AdminChatConversationMeta({ conversationId, initialLabels = [], initialNotes = '', onSaved }) {
  const [labels, setLabels] = useState(initialLabels);
  const [staffNotes, setStaffNotes] = useState(initialNotes);
  const [customLabel, setCustomLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveHint, setSaveHint] = useState('');
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    setLabels(Array.isArray(initialLabels) ? initialLabels : []);
    setStaffNotes(initialNotes || '');
    setOpen(false);
    setSaveHint('');
  }, [conversationId, initialLabels, initialNotes]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener('click', onDoc, true), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', onDoc, true);
    };
  }, [open]);

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
      setTimeout(() => {
        setSaveHint('');
        setOpen(false);
      }, 1200);
    } catch (e) {
      setSaveHint(e?.message || 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (!conversationId) return null;

  const notesPreview = staffNotes.trim().slice(0, 48);
  const hasNotes = Boolean(staffNotes.trim());

  return (
    <div className="relative shrink-0 border-b border-white/10 bg-[#0a0e16]/90 z-30" ref={panelRef}>
      {/* Slim toolbar — chat ko zyada jagah */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-full px-3 py-2 sm:px-3.5 sm:py-2 flex items-center gap-2 text-left hover:bg-white/[0.03] transition min-h-[40px]"
        aria-expanded={open}
      >
        <Tag size={14} className="text-[#ffd700] shrink-0" />
        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400 shrink-0">
            Tags &amp; notes
          </span>
          {labels.length > 0 ? (
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              {labels.slice(0, 3).map((l) => (
                <span
                  key={l}
                  className="px-1.5 py-0.5 rounded text-[9px] font-bold border truncate max-w-[72px] sm:max-w-[100px]"
                  style={labelChipStyle(l)}
                >
                  {l}
                </span>
              ))}
              {labels.length > 3 && (
                <span className="text-[9px] text-gray-500 font-bold">+{labels.length - 3}</span>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-gray-600 truncate hidden sm:inline">Tap to add labels</span>
          )}
          {hasNotes && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-cyan-500/90 truncate max-w-[120px] sm:max-w-[200px]">
              <StickyNote size={10} className="shrink-0" />
              {notesPreview}
              {staffNotes.length > 48 ? '…' : ''}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>

      {/* Expanded panel: mobile bottom sheet, desktop dropdown */}
      {open && (
        <>
          <motionBackdrop onClick={() => setOpen(false)} />
          <motionPanel
            customLabel={customLabel}
            setCustomLabel={setCustomLabel}
            labels={labels}
            staffNotes={staffNotes}
            setStaffNotes={setStaffNotes}
            toggleLabel={toggleLabel}
            addCustomLabel={addCustomLabel}
            handleSave={handleSave}
            saving={saving}
            saveHint={saveHint}
          />
        </>
      )}
    </div>
  );
}

function motionBackdrop({ onClick }) {
  return (
    <button
      type="button"
      aria-label="Close tags panel"
      className="fixed inset-0 bg-black/50 z-[60] md:hidden"
      onClick={onClick}
    />
  );
}

function motionPanel({
  customLabel,
  setCustomLabel,
  labels,
  staffNotes,
  setStaffNotes,
  toggleLabel,
  addCustomLabel,
  handleSave,
  saving,
  saveHint,
}) {
  return (
    <div
      className="
        fixed inset-x-0 bottom-0 z-[70] max-h-[min(78vh,520px)] overflow-y-auto
        rounded-t-2xl border-t border-[#ffd700]/30 bg-[#0e1320] shadow-[0_-12px_40px_rgba(0,0,0,0.65)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]
        md:static md:z-auto md:max-h-[min(42vh,380px)] md:overflow-y-auto
        md:rounded-none md:border-t md:border-white/10 md:shadow-none md:p-3.5
        space-y-3
      "
    >
      <div className="flex items-center justify-between gap-2 md:hidden pb-1 border-b border-white/10">
        <span className="text-xs font-black text-white uppercase tracking-wider">Staff tags &amp; notes</span>
        <span className="text-[10px] text-gray-500">Player cannot see this</span>
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
              className="px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold border transition"
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
          className="flex-1 min-w-0 rounded-lg px-2.5 py-2 text-[11px] bg-[#10141e] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700]/50"
        />
        <button
          type="button"
          onClick={addCustomLabel}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/15 text-gray-300 hover:text-white shrink-0"
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
        <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">
          <StickyNote size={12} className="text-cyan-400" />
          Internal notes
        </label>
        <textarea
          value={staffNotes}
          onChange={(e) => setStaffNotes(e.target.value)}
          rows={3}
          maxLength={4000}
          placeholder="VIP handling, payment prefs, follow-up…"
          className="w-full rounded-xl px-3 py-2 text-[11px] leading-relaxed bg-[#10141e] border border-white/10 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500/40 resize-none min-h-[72px] max-h-[140px]"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 sticky bottom-0 bg-[#0e1320] md:static md:bg-transparent pb-1">
        {saveHint ? (
          <p className={`text-[10px] font-bold ${saveHint === 'Saved' ? 'text-emerald-400' : 'text-red-300'}`}>
            {saveHint}
          </p>
        ) : (
          <span className="text-[10px] text-gray-600">Synced with Player 360° profile</span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="ml-auto px-4 py-2 rounded-xl bg-[#ffd700]/20 border border-[#ffd700]/45 text-[#ffd700] hover:bg-[#ffd700]/30 text-[10px] font-black uppercase flex items-center gap-1.5 disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Save
        </button>
      </div>
    </div>
  );
}