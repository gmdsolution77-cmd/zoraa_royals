'use client';

import { useEffect } from 'react';
import { registerSupportChatGlobals } from '@/lib/supportChatFlow';

export default function SupportChatInit() {
  useEffect(() => {
    registerSupportChatGlobals();
  }, []);
  return null;
}