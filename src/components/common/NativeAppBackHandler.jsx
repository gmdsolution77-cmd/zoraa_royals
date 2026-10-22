'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NativeAppBackHandler() {
  const router = useRouter();

  useEffect(() => {
    let cleanup = null;

    const setupCapacitorBack = async () => {
      try {
        const { App } = await import('@capacitor/app');

        const listener = await App.addListener('backButton', ({ canGoBack }) => {
          // 1. Check if any modal is currently open by checking active modal elements or custom event
          const openModals = document.querySelectorAll(
            '[data-royal-modal="true"], .animate-slide-up, .animate-fade-in[role="dialog"]'
          );

          // If there's an open close button inside a modal, click it to dismiss modal
          const modalCloseBtn = document.querySelector(
            '[data-modal-close="true"], button[aria-label="Close modal"], button[aria-label="Close"]'
          );

          if (modalCloseBtn) {
            modalCloseBtn.click();
            return;
          }

          // 2. Dispatch custom event for React components that listen to back button
          const event = new CustomEvent('royalBackPress', { cancelable: true });
          const handled = !window.dispatchEvent(event);
          if (handled) return;

          // 3. Otherwise navigate back if possible or if not on root
          if (window.location.pathname !== '/') {
            if (canGoBack) {
              window.history.back();
            } else {
              router.push('/');
            }
          } else {
            // On home screen with no modals open, minimize or exit
            App.exitApp();
          }
        });

        cleanup = () => {
          listener.remove();
        };
      } catch (err) {
        // Not running inside Capacitor Native App (browser environment)
      }
    };

    setupCapacitorBack();

    return () => {
      if (cleanup) cleanup();
    };
  }, [router]);

  return null;
}
