export const CHAT_LABEL_PRESETS = [
  { id: 'vip', name: 'VIP', color: '#ffd700' },
  { id: 'deposit', name: 'Deposit', color: '#34d399' },
  { id: 'cashout', name: 'Cashout', color: '#c084fc' },
  { id: 'game_id', name: 'Game ID', color: '#22d3ee' },
  { id: 'urgent', name: 'Urgent', color: '#f87171' },
  { id: 'follow_up', name: 'Follow-up', color: '#fbbf24' },
  { id: 'resolved', name: 'Resolved', color: '#9ca3af' },
  { id: 'spam', name: 'Spam', color: '#6b7280' },
];

export function sanitizeChatLabels(labels) {
  if (!Array.isArray(labels)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of labels) {
    const name = String(raw || '').trim().slice(0, 32);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= 12) break;
  }
  return out;
}

export function sanitizeStaffNotes(notes) {
  return String(notes || '').trim().slice(0, 4000);
}

export function labelChipStyle(labelName) {
  const preset = CHAT_LABEL_PRESETS.find(
    (p) => p.name.toLowerCase() === String(labelName || '').toLowerCase()
  );
  const color = preset?.color || '#94a3b8';
  return {
    borderColor: `${color}66`,
    backgroundColor: `${color}22`,
    color,
  };
}