import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mediora.fit"),
  title: {
    default: "Mediora - AI Powered Pharmacy & Health Assistant",
    template: "%s | Mediora",
  },
  description:
    "Order medicines online and get AI-based health suggestions instantly with Mediora. Your trusted online pharmacy with AI-powered health recommendations.",
  keywords: [
    "Mediora",
    "online pharmacy",
    "AI healthcare",
    "medicine delivery",
    "health assistant",
    "pharmacy India",
    "order medicines online",
    "health tips",
    "daily health tips",
  ],
  authors: [{ name: "Mediora", url: "https://mediora.fit" }],
  creator: "Mediora",
  publisher: "Mediora",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Mediora - AI Powered Pharmacy & Health Assistant",
    description:
      "Order medicines online and get AI-based health suggestions instantly with Mediora.",
    url: "https://mediora.fit",
    siteName: "Mediora",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Mediora Logo",
      },
    ],
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mediora - AI Powered Pharmacy & Health Assistant",
    description:
      "Order medicines online and get AI-based health suggestions instantly with Mediora.",
    images: ["/logo.png"],
    creator: "@mediora",
  },
  verification: {
    google: "your-google-verification-code", // Add your Google Search Console verification code
  },
  category: "healthcare",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0fa381" },
    { media: "(prefers-color-scheme: dark)", color: "#0a7860" },
  ],
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <head>
          {/* Preconnect to external domains for better performance */}
          <link rel="preconnect" href="https://cdn.onesignal.com" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* Manifest for PWA support */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* Apple touch icon */}
          <link rel="apple-touch-icon" href="/logo.png" />
        </head>
        <body className="min-h-full flex flex-col">
          {/* 🔔 OneSignal Push Notifications */}
          <Script
            src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
            strategy="lazyOnload"
          />
          <Script id="onesignal-init" strategy="lazyOnload">
            {`
              window.OneSignalDeferred = window.OneSignalDeferred || [];
              window.OneSignalDeferred.push(async function(OneSignal) {
                await OneSignal.init({
                  appId: "b3081559-d01e-4285-ba29-6131f71951cf",
                  safari_web_id: "",
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
                    title: "Welcome to Mediora!",
                    message: "💚 Thanks for subscribing! You'll receive daily health tips.",
                  },
                });
              });
              
              // Register service worker
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/OneSignalSDKWorker.js');
              }
            `}
          </Script>

          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}