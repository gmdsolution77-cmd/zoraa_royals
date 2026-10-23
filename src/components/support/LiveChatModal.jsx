'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Paperclip,
  CheckCheck,
  ShieldCheck,
  ArrowLeft,
  Headphones,
  Download,
  ExternalLink,
  Eye,
} from 'lucide-react';

export default function LiveChatModal({
  isOpen,
  onClose,
  user,
  onOpenAuth,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [attachedImage, setAttachedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  const fetchChat = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch {}
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchChat();
      const interval = setInterval(fetchChat, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Handle mobile visualViewport resize when virtual keyboard opens
  useEffect(() => {
    if (!isOpen) return;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const diff = windowHeight - currentHeight;
        setKeyboardHeight(diff > 120 ? diff : 0);
        setTimeout(() => {
          endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, [isOpen]);

  // Listen to native back button event to close chat modal
  useEffect(() => {
    if (!isOpen) return;
    const handleNativeBack = (e) => {
      e.preventDefault();
      onClose();
    };
    window.addEventListener('royalBackPress', handleNativeBack);
    return () => window.removeEventListener('royalBackPress', handleNativeBack);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handle client-side image compression
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image (PNG, JPG, WEBP).');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        setAttachedImage(compressed);
        setUploadingImage(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    // Reset file input value so user can pick the same file again if desired
    e.target.value = '';
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !attachedImage) return;

    if (!user) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }

    const outgoing = text.trim();
    const imagePayload = attachedImage;
    setText('');
    setAttachedImage(null);
    setLoading(true);

    // Optimistic UI append
    const optimisticMsg = {
      sender: 'player',
      text: outgoing,
      imageUrl: imagePayload,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: outgoing,
          imageUrl: imagePayload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchChat();
      }
    } catch {
    } finally {
      setLoading(false);
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const handleFocus = () => {
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 250);
  };

  return (
    <>
      {/* Mobile Backdrop Only */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 sm:hidden backdrop-blur-[2px] animate-fade-in"
      />

      {/* Floating Bottom-Right Chat Drawer Widget */}
      <div
        ref={containerRef}
        data-royal-modal="true"
        className="fixed z-50 bottom-0 sm:bottom-6 right-0 sm:right-6 w-full sm:w-[410px] h-[85vh] sm:h-[600px] max-h-[100dvh] bg-[#090b12] border-t-2 sm:border-2 border-[#d4af37]/40 rounded-t-3xl sm:rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden animate-slide-up"
        style={{
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.95), 0 0 35px rgba(212, 175, 55, 0.2)',
          ...(keyboardHeight > 0 ? { bottom: `${keyboardHeight + 8}px` } : {}),
        }}
      >
        {/* WhatsApp-Style Royal Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#141828] via-[#101320] to-[#0d0f19] border-b border-[#d4af37]/25 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              data-modal-close="true"
              className="p-1.5 -ml-1 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 sm:hidden transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-[#ffd700]" />
            </button>

            <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[#d4af37] via-[#ffd700] to-[#997b24] p-0.5 shadow-md">
              <div className="w-full h-full bg-[#0a0c14] rounded-full flex items-center justify-center">
                <Headphones className="w-5 h-5 text-[#ffd700]" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#090b12] animate-pulse" />
            </div>

            <div>
              <h3 className="text-sm font-black text-white font-serif tracking-wide flex items-center gap-1.5">
                <span>ZORRA ROYALS CONCIERGE</span>
              </h3>
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Online • 24/7 VIP Support Desk</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            data-modal-close="true"
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition hidden sm:block"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Wallpaper Texture / Chat Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#06070b] relative text-xs">
          {/* Subtle watermark */}
          <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

          {/* Intro Notice */}
          <div className="mx-auto max-w-[280px] p-2.5 rounded-2xl bg-[#121624]/90 border border-[#d4af37]/25 text-center text-[11px] text-gray-300 shadow-sm space-y-1 my-2">
            <div className="flex items-center justify-center gap-1 text-[#ffd700] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official 24/7 VIP Live Concierge</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              Instant assistance with Cash App/Zelle deposits, screenshots, game load transfers, credentials, and withdrawals.
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-gray-400">
              <Sparkles className="w-8 h-8 text-[#ffd700] mx-auto animate-pulse" />
              <p className="font-bold text-white text-sm">Welcome to Zorra Royals VIP Desk</p>
              <p className="text-[11px] text-gray-400 max-w-[240px] mx-auto">
                Type your message or attach a receipt screenshot below. A support officer is ready to assist you right now.
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isUser = msg.sender === 'player' || msg.senderRole === 'player';
              return (
                <div
                  key={i}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs ${
                      isUser
                        ? 'bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#b38f26] text-black font-semibold rounded-br-xs shadow-md'
                        : 'bg-[#151928] border border-[#d4af37]/25 text-gray-100 rounded-bl-xs shadow-md'
                    }`}
                  >
                    {!isUser && (
                      <span className="text-[10px] font-black uppercase text-[#ffd700] block mb-0.5 tracking-wider">
                        {msg.agentName || 'VIP Concierge'}
                      </span>
                    )}

                    {/* Image Attachment (if present) */}
                    {msg.imageUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-black/20 relative group">
                        <img
                          src={msg.imageUrl}
                          alt="Attachment"
                          className="w-full max-h-56 object-cover rounded-xl cursor-pointer hover:opacity-95 transition"
                          onClick={() => setSelectedPreviewImage(msg.imageUrl)}
                        />
                        <div
                          onClick={() => setSelectedPreviewImage(msg.imageUrl)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span className="px-2 py-1 rounded bg-black/80 text-white text-[10px] font-bold flex items-center gap-1">
                            <Eye size={12} /> View Full Size
                          </span>
                        </div>
                      </div>
                    )}

                    {msg.text && (
                      <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                    )}

                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[9px] font-mono ${
                        isUser ? 'text-black/70 font-bold' : 'text-gray-400'
                      }`}
                    >
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isUser && <CheckCheck className="w-3 h-3 text-black/80" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Pending Attachment Preview Bar */}
        {attachedImage && (
          <div className="px-4 py-2 bg-[#121626] border-t border-[#d4af37]/30 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={attachedImage}
                alt="Upload preview"
                className="w-10 h-10 rounded-lg object-cover border border-[#ffd700] shrink-0"
              />
              <span className="text-xs text-[#ffd700] font-bold truncate">
                📷 Screenshot attached (ready to send)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition"
              title="Remove screenshot"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Hidden File Input for Image Attachments */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Sticky Mobile-Optimized Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-[#0d0f19] border-t border-[#d4af37]/25 flex items-center gap-2 shrink-0 shadow-lg"
        >
          {/* Attachment Paperclip Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!user || uploadingImage || loading}
            className="p-2.5 rounded-xl text-gray-400 hover:text-[#ffd700] bg-white/5 hover:bg-white/10 transition shrink-0 cursor-pointer disabled:opacity-40"
            title="Attach screenshot or proof"
          >
            {uploadingImage ? (
              <span className="w-4 h-4 rounded-full border-2 border-t-[#ffd700] border-gray-600 animate-spin inline-block" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder={
              user
                ? attachedImage
                  ? 'Add message caption (optional)...'
                  : 'Type your message or attach screenshot...'
                : 'Please log in to chat...'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={handleFocus}
            disabled={!user || loading}
            className="flex-1 bg-[#151825] border border-white/10 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37] transition shadow-inner"
          />

          <button
            type="submit"
            disabled={!user || loading || (!text.trim() && !attachedImage)}
            className="p-3 rounded-2xl bg-gradient-to-r from-[#ffd700] to-[#d4af37] text-black hover:brightness-110 disabled:opacity-40 transition shadow-md shrink-0 flex items-center justify-center cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>

      {/* Full-Screen Image Lightbox Modal */}
      {selectedPreviewImage && (
        <div
          onClick={() => setSelectedPreviewImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
        >
          <div className="relative max-w-3xl max-h-[85vh] flex flex-col items-center">
            <button
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X size={24} />
            </button>
            <img
              src={selectedPreviewImage}
              alt="Enlarged attachment"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={selectedPreviewImage}
                download="zorra-chat-attachment.jpg"
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-2 rounded-xl btn-gold text-xs font-black flex items-center gap-1.5 shadow-lg"
              >
                <Download size={14} />
                <span>Download Attachment</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedPreviewImage(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
