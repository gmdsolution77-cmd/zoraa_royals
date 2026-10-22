'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Sparkles,
  CheckCircle2,
  Wallet,
  Key,
  Shield,
  CheckCheck
} from 'lucide-react';

export default function NotificationsModal({
  isOpen,
  onClose,
  user,
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifs();
    }
  }, [isOpen, user]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: 'all' }),
      });
      fetchNotifs();
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl bg-[#090b12] border border-[#d4af37]/35 shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d4af37]/15 text-[#ffd700]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Notifications</h3>
              <p className="text-[10px] text-gray-400">Account & Reward Updates</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleMarkAllRead}
              className="p-1.5 text-xs text-[#ffd700] hover:underline flex items-center gap-1 font-bold"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="text-[10px]">Read all</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              No notifications yet. You're completely up to date!
            </div>
          ) : (
            notifications.map((notif, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border transition ${
                  notif.read
                    ? 'bg-[#10131d] border-white/5 text-gray-300'
                    : 'bg-[#151928] border-[#d4af37]/30 text-white shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-xs text-[#ffd700]">{notif.title}</h4>
                  <span className="text-[9px] text-gray-500 font-mono">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">{notif.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
