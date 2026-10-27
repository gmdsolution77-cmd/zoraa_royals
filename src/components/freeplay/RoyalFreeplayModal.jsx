'use client';

import React from 'react';
import FreeplayTaskModal from './FreeplayTaskModal';

export default function RoyalFreeplayModal({
  isOpen,
  onClose,
  user,
  freeplayAmount = 5,
  onOpenAuth,
  onBalanceUpdated,
  onSuccess,
}) {
  return (
    <FreeplayTaskModal
      isOpen={isOpen}
      onClose={onClose}
      user={user}
      freeplayAmount={freeplayAmount}
      onSuccess={(data) => {
        if (onBalanceUpdated) onBalanceUpdated();
        if (onSuccess) onSuccess(data);
      }}
    />
  );
}

export { FreeplayTaskModal };
