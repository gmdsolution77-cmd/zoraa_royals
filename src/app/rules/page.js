import Link from 'next/link';
import { ArrowLeft, Award } from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-[#07080b] text-gray-300 p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#ffd700] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Palace Lobby
        </Link>
        <h1 className="text-3xl font-black text-white font-serif">OFFICIAL SWEEPSTAKES RULES</h1>
        <div className="p-6 rounded-2xl bg-[#0f121d] border border-white/5 space-y-4 text-xs leading-relaxed">
          <p className="font-bold text-amber-300">NO PURCHASE NECESSARY TO ENTER OR WIN.</p>
          <p>
            1. Sweepstakes entries are granted through daily freeplay claims, promotional bonuses, and complimentary Sweeps Coins with qualifying Gold Coin package purchases.
          </p>
          <p>
            2. Sweeps Coins won through gameplay are redeemable for prizes valued at $1.00 USD per Sweeps Coin.
          </p>
        </div>
      </div>
    </div>
  );
}
