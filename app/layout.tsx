import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
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

  title: "Mediora - AI Powered Pharmacy & Health Assistant",
  description:
    "Order medicines online and get AI-based health suggestions instantly with Mediora.",
  keywords: [
    "Mediora",
    "online pharmacy",
    "AI healthcare",
    "medicine delivery",
    "health assistant",
  ],

  authors: [{ name: "Mediora" }],

  icons: {
    icon: "/favicon.ico",        // ✅ correct
    shortcut: "/favicon.ico",
    apple: "/logo.png",          // ✅ optional but good
  },

  openGraph: {
    title: "Mediora - AI Pharmacy",
    description: "AI-powered pharmacy & health assistant platform",
    url: "https://mediora.fit",
    siteName: "Mediora",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
      },
    ],
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
        <body className="min-h-full flex flex-col">
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}