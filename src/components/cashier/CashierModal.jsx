'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * CashierModal (Drop-in replacement matching Player Paradise WalletModal)
 * Replaced legacy modal dialog with direct navigation to the dedicated /deposit or /cashout form pages.
 */
export default function CashierModal({
  isOpen,
  initialTab = 'deposit',
  user,
  onClose,
  onBalanceUpdated,
}) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      if (typeof onClose === 'function') {
        onClose();
      }
      const target =
        initialTab === 'redeem' || initialTab === 'cashout' || initialTab === 'withdraw'
          ? '/cashout'
          : '/deposit';
      router.push(target);
    }
  }, [isOpen, initialTab, onClose, router]);

  return null;
}
