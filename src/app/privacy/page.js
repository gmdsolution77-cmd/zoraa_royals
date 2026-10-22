import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07080b] text-gray-300 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#ffd700] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Palace Lobby
        </Link>
        <h1 className="text-3xl font-black text-white font-serif">PRIVACY POLICY</h1>
        <div className="p-6 rounded-2xl bg-[#0f121d] border border-white/5 space-y-4 text-xs leading-relaxed">
          <p>
            At Zorra Royals, we respect your privacy and protect personal data using industry-standard 256-bit SSL encryption.
          </p>
          <h2 className="text-sm font-bold text-white">Information We Collect</h2>
          <p>
            We collect account credentials, transaction logs, and KYC verification records strictly for account security and legal compliance. We do not sell or rent your personal information to third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
