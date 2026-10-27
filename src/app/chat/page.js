'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Headphones,
  Send,
  Shield,
  Sparkles,
  Paperclip,
  CheckCheck,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  X,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Download
} from 'lucide-react';
import RoyalNavbar from '@/components/common/RoyalNavbar';
import RoyalSidebar from '@/components/common/RoyalSidebar';
import RoyalFooter from '@/components/common/RoyalFooter';
import MobileBottomNav from '@/components/common/MobileBottomNav';
import AuthModal from '@/components/common/AuthModal';
import { getCachedUser, saveCachedUser, clearCachedUser } from '@/lib/userSession';

export default function ChatPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => getCachedUser());
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' });
  const [guestId, setGuestId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (chatScrollRef.current) {
      try {
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight + 1000,
          behavior: smooth ? 'smooth' : 'auto',
        });
      } catch {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const safeSetSortedMessages = (incoming) => {
    if (!Array.isArray(incoming)) return;
    setMessages((prev) => {
      const map = new Map();
      for (const m of incoming) {
        const key = m._id || `${m.createdAt || m.timestamp}_${m.text || m.message}_${m.sender}`;
        map.set(key, m);
      }
      for (const p of prev) {
        if (p.optimistic) {
          const key = p._id || `${p.createdAt || p.timestamp}_${p.text || p.message}_${p.sender}`;
          if (!map.has(key)) map.set(key, p);
        }
      }
      return Array.from(map.values()).sort((a, b) => {
        const tA = (a.createdAt || a.timestamp) ? new Date(a.createdAt || a.timestamp).getTime() : 0;
        const tB = (b.createdAt || b.timestamp) ? new Date(b.createdAt || b.timestamp).getTime() : 0;
        return tA - tB;
      });
    });
  };

  // Load user & guest ID
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && (d.authenticated || d.success) && d.user) {
          setUser(d.user);
          saveCachedUser(d.user);
        } else {
          clearCachedUser();
        }
      })
      .catch(() => {});

    let gid = localStorage.getItem('zorra_guest_id');
    if (!gid) {
      gid = 'guest_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('zorra_guest_id', gid);
    }
    setGuestId(gid);
  }, []);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const gid = guestId || (typeof window !== 'undefined' ? localStorage.getItem('zorra_guest_id') : '');
      const url = user
        ? `/api/chat?userId=${user.userId || user.id || user._id}`
        : `/api/chat?guestId=${gid}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        safeSetSortedMessages(data.messages);
      }
    } catch (e) {
      console.error('Failed to load chat:', e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [user, guestId]);

  useEffect(() => {
    scrollToBottom(false);
    const timer = setTimeout(() => scrollToBottom(true), 120);
    return () => clearTimeout(timer);
  }, [messages.length, attachedImage]);

  // Compress & attach image
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Image file size must be under 15MB.');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
        setAttachedImage(compressedBase64);
        setUploadingImage(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !attachedImage) || sending) return;

    const textToSend = inputMessage.trim();
    const imageToSend = attachedImage;

    setInputMessage('');
    setAttachedImage(null);
    setSending(true);
    setSendError(null);

    // Optimistic append at bottom
    const optimisticMsg = {
      _id: 'temp_' + Date.now(),
      sender: 'player',
      senderRole: 'player',
      text: textToSend,
      message: textToSend,
      imageUrl: imageToSend,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    safeSetSortedMessages([...messages, optimisticMsg]);
    setTimeout(() => scrollToBottom(false), 20);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          message: textToSend,
          imageUrl: imageToSend,
          guestId: user ? undefined : guestId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchMessages();
      } else {
        setSendError(data.error || 'Failed to send message.');
        if (textToSend) setInputMessage(textToSend);
        if (imageToSend) setAttachedImage(imageToSend);
      }
    } catch {
      setSendError('Network error sending message.');
      if (textToSend) setInputMessage(textToSend);
      if (imageToSend) setAttachedImage(imageToSend);
    } finally {
      setSending(false);
      setTimeout(() => scrollToBottom(true), 80);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-white flex flex-col font-sans">
      {/* 1. Global Collapsible Royal Sidebar */}
      <RoyalSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        user={user}
        onOpenCashier={(tab) => router.push(tab === 'withdraw' ? '/cashout' : '/deposit')}
      />

      {/* 2. Main Content Layout with dynamic left padding on desktop */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <RoyalNavbar
          user={user}
          onOpenAuth={(tab) => setAuthModal({ open: true, tab })}
          onOpenCashier={() => router.push('/deposit')}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col min-h-[calc(100vh-140px)]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0d0f17]/90 border border-[#d4af37]/25 shadow-lg mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ffd700] via-[#d4af37] to-[#b38f26] text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(212,175,55,0.4)]">
                <Headphones size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif font-black text-sm sm:text-base text-white">24/7 VIP LIVE CONCIERGE</h1>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Instant banking verification, coin loading &amp; game account support
                </p>
              </div>
            </div>

            <button
              onClick={fetchMessages}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-gray-300 hover:text-white transition"
              title="Refresh chat"
            >
              <RefreshCw size={15} />
            </button>
          </div>

          {/* Messages Stream Container */}
          <div
            ref={chatScrollRef}
            className="flex-1 rounded-2xl bg-[#0d0f17]/90 border border-[#d4af37]/20 p-4 overflow-y-auto space-y-4 shadow-inner min-h-[420px] max-h-[60vh] scrollbar-thin"
          >
            {messages.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#d4af37]/15 text-[#ffd700] mx-auto flex items-center justify-center border border-[#d4af37]/30">
                  <Sparkles size={22} />
                </div>
                <h3 className="font-serif font-bold text-white text-base">Welcome to Zorra Royals VIP Concierge</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Send a message or screenshot below. Our staff typically responds within 30-60 seconds.
                </p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.sender === 'user' || m.sender === 'player' || m.senderRole === 'player' || m.senderRole === 'user';
                return (
                  <div
                    key={m._id || idx}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 px-1">
                      <span>{isUser ? (user?.username || 'You') : 'VIP Support Agent'}</span>
                      <span>•</span>
                      <span>{new Date(m.timestamp || m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 shadow-md ${
                        isUser
                          ? 'bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#b38f26] text-black font-semibold rounded-tr-sm shadow-[0_2px_12px_rgba(212,175,55,0.25)]'
                          : 'bg-slate-900/90 text-gray-100 border border-slate-700/80 rounded-tl-sm'
                      }`}
                    >
                      {/* Attached Image if present */}
                      {m.imageUrl && (
                        <div
                          onClick={() => setSelectedPreviewImage(m.imageUrl)}
                          className="relative rounded-xl overflow-hidden border border-black/20 cursor-pointer group bg-black/40 max-w-xs"
                        >
                          <img
                            src={m.imageUrl}
                            alt="Attached screenshot"
                            className="w-full max-h-60 object-contain rounded-lg group-hover:scale-102 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                            Click to expand
                          </div>
                        </div>
                      )}

                      {(m.text || m.message) && (
                        <div className="whitespace-pre-wrap">{m.text || m.message}</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {sendError && (
            <div className="mt-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{sendError}</span>
            </div>
          )}

          {/* Attached Image Upload Preview Bar */}
          {attachedImage && (
            <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-[#d4af37]/40 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <img
                  src={attachedImage}
                  alt="Attachment preview"
                  className="w-12 h-12 object-cover rounded-lg border border-[#d4af37]/50"
                />
                <span className="text-[11px] text-[#ffd700] font-bold">Screenshot attached (Ready to send)</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#ffd700] text-gray-300 hover:text-[#ffd700] transition disabled:opacity-50"
              title="Attach screenshot or receipt"
            >
              <Paperclip size={18} />
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message or attach payment screenshot..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-[#ffd700] text-xs text-white placeholder-gray-500 outline-none transition"
            />

            <button
              type="submit"
              disabled={(!inputMessage.trim() && !attachedImage) || sending}
              className="btn-gold py-3 px-5 text-xs font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.4)] disabled:opacity-40"
            >
              <span>{sending ? 'Sending...' : 'Send'}</span>
              <Send size={14} />
            </button>
          </form>
        </main>

        <RoyalFooter />
      </div>

      <MobileBottomNav />

      {/* Fullscreen Image Lightbox Modal */}
      {selectedPreviewImage && (
        <div
          onClick={() => setSelectedPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-950 border border-[#d4af37]/40 rounded-2xl overflow-hidden p-2 shadow-2xl"
          >
            <div className="flex items-center justify-between p-2 border-b border-white/10 mb-2">
              <span className="text-xs font-mono text-gray-300">Screenshot Preview</span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedPreviewImage}
                  download="zorra_chat_attachment.jpg"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1"
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setSelectedPreviewImage(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <img
              src={selectedPreviewImage}
              alt="Expanded preview"
              className="max-h-[75vh] w-auto max-w-full object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.open}
        initialTab={authModal.tab}
        onClose={() => setAuthModal({ open: false, tab: 'login' })}
        onSuccess={(u) => {
          setUser(u);
          setAuthModal({ open: false, tab: 'login' });
        }}
      />
    </div>
  );
}
