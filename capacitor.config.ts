import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zorraroyal.app',
  appName: 'Zorra Royals',
  webDir: 'mobile-dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    url: process.env.CAPACITOR_SERVER_URL || 'https://zoraaroyal.com',
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2200,
      launchAutoHide: true,
      backgroundColor: '#08090C',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#08090C',
    },
  },
};

export default config;
