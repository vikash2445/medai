import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from './context/CartContext';
import CartDrawer from '../components/cartdrawer';

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
  manifest: "/manifest.json",
  title: {
    default: "Mediora - AI Powered Pharmacy & Health Assistant",
    template: "%s | Mediora",
  },
  description:
    "Order products online and get AI-based health suggestions instantly with Mediora.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d9e75",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <CartProvider>
        <html lang="en">
          <head>
            <link rel="manifest" href="/manifest.json" />
            <link rel="apple-touch-icon" href="/icons/icon-192.png" />
          </head>
          <body className={`${geistSans.variable} ${geistMono.variable}`}>
            {/* OneSignal */}
            <Script
              src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
              strategy="lazyOnload"
            />
            <Script id="onesignal-init" strategy="lazyOnload">
              {`
                window.OneSignalDeferred = window.OneSignalDeferred || [];
                OneSignalDeferred.push(async function(OneSignal) {
                  await OneSignal.init({
                    appId: "b3081559-d01e-4285-ba29-6131f71951cf",
                    notifyButton: { enable: true },
                  });
                });
              `}
            </Script>

            {children}

            {/* Global cart drawer */}
            <CartDrawer />

            <Analytics />
          </body>
        </html>
      </CartProvider>
    </ClerkProvider>
  );
}