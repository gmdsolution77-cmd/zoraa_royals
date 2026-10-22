'use client';

import React, { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function CashierRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tab = searchParams.get('tab') || 'deposit';
    router.replace(`/?tab=${tab}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#07080b] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#ffd700] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs uppercase font-mono tracking-widest text-[#ffd700]">
          Loading Royal Cashier...
        </p>
      </div>
    </div>
  );
}

export default function CashierPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07080b]" />}>
      <CashierRedirect />
    </Suspense>
  );
}
