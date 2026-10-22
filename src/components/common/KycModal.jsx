'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function KycModal({
  isOpen,
  onClose,
  user,
}) {
  const [fullName, setFullName] = useState('');
  const [idType, setIdType] = useState('Drivers License');
  const [idNumber, setIdNumber] = useState('');
  const [state, setState] = useState('');
  const [status, setStatus] = useState('not_submitted');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      fetch('/api/kyc')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStatus(data.status);
            if (data.kycData) {
              setFullName(data.kycData.fullName || '');
              setIdType(data.kycData.idType || 'Drivers License');
              setState(data.kycData.state || '');
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, idType, idNumber, state }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to submit KYC');

      setStatus('pending_review');
      setMessage({ type: 'success', text: 'Identity documents submitted for review!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto scrollbar-none rounded-3xl bg-[#090b12] border border-[#d4af37]/35 shadow-[0_20px_60px_rgba(0,0,0,0.9)] p-5 sm:p-8 animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-[#1e3a8a] to-[#3b82f6] text-white shadow-lg mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-gold-gradient font-serif tracking-wider">
            VIP IDENTITY VERIFICATION
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Quick KYC check required for large cashouts and unlimited instant redemptions.
          </p>
        </div>

        {status === 'approved' ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="font-black text-sm text-white">Your Account is 100% Verified!</h4>
            <p className="text-xs text-gray-300">
              You have full unlimited cashout privileges and priority instant processing.
            </p>
          </div>
        ) : status === 'pending_review' ? (
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
            <Shield className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
            <h4 className="font-black text-sm text-white">Verification in Progress</h4>
            <p className="text-xs text-gray-300">
              Our compliance team is reviewing your details. This usually takes under 1 hour.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{message.text}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Legal Full Name
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#131622] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  ID Document Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full bg-[#131622] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option>Drivers License</option>
                  <option>Passport</option>
                  <option>State ID</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  State / Jurisdiction
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TX, CA, FL"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-[#131622] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Document Number (Optional)
              </label>
              <input
                type="text"
                placeholder="ID or Passport Number"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="w-full bg-[#131622] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3 text-sm font-black flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <span>Submitting...</span> : <span>Submit for VIP Verification</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
