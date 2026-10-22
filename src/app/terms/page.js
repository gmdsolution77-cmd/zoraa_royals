import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#07080b] text-gray-300 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#ffd700] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Palace Lobby
        </Link>
        <h1 className="text-3xl font-black text-white font-serif">TERMS OF SERVICE</h1>
        <p className="text-xs text-gray-400">Effective Date: October 2026</p>
        <div className="p-6 rounded-2xl bg-[#0f121d] border border-white/5 space-y-4 text-xs leading-relaxed">
          <h2 className="text-sm font-bold text-white">1. Eligibility</h2>
          <p>
            Zorra Royals is open solely to legal residents who are at least 21 years of age. Participation is void where prohibited by applicable law.
          </p>
          <h2 className="text-sm font-bold text-white">2. Sweeps Coins and Gold Coins</h2>
          <p>
            Gold Coins are social entertainment coins with no monetary redemption value. Sweeps Coins (SC) can be redeemed for real USD currency at the fixed rate of 1 SC = $1 USD upon completing standard 1x gameplay rollover.
          </p>
          <h2 className="text-sm font-bold text-white">3. Redemption Policy</h2>
          <p>
            Minimum cashout threshold is $50.00 SC. All cashouts are verified by our compliance team and paid out via Cash App, Zelle, or approved crypto networks.
          </p>
        </div>
      </div>
    </div>
  );
}
