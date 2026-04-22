'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any[];
  }
}

export default function OneSignalInitializer() {
  useEffect(() => {
    // Check if OneSignal is already initialized
    if (typeof window === 'undefined') return;
    
    // Initialize OneSignal if not already done
    if (!window.OneSignal) {
      window.OneSignal = window.OneSignal || [];
      
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: true,
            size: 'medium',
            theme: 'default',
            position: 'bottom-right',
            offset: {
              bottom: '20px',
              right: '20px',
            },
            prenotify: true,
            showCredit: false,
            text: {
              'tip.state.unsubscribed': 'Subscribe to health tips',
              'tip.state.subscribed': 'You are subscribed to health tips',
              'tip.state.blocked': 'Blocked notifications',
              'message.prenotify': 'Click to subscribe to daily health tips',
            },
          },
          welcomeNotification: {
            title: 'Welcome to Mediora!',
            message: '💚 Thanks for subscribing! You\'ll receive daily health tips.',
          },
        });
      });
    }
  }, []);

  return null;
}