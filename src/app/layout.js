import './globals.css';
import NativeAppBackHandler from '@/components/common/NativeAppBackHandler';
import PushNotificationManager from '@/components/common/PushNotificationManager';

export const metadata = {
  title: 'Zorra Royals | VIP Palace & Social Sweepstakes Casino',
  description: 'Experience high stakes luxury gaming at Zorra Royals. Instant deposits via Cash App & Zelle, fast payouts, daily freeplay bonuses, and VIP game platforms.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#d4af37" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#07080b] text-[#f8fafc] antialiased selection:bg-[#d4af37] selection:text-black min-h-screen">
        <NativeAppBackHandler />
        <PushNotificationManager />
        {children}
      </body>
    </html>
  );
}

