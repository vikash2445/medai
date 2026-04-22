'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function PrivacyPage() {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-IN', opts));
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* Banner */}
      <div className="relative bg-gradient-to-r from-mint-dark via-mint to-mint-mid pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-repeat" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M0 60L60 0H30L0 30M60 60V30L30 60'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-cream" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition">
            ← Back to Mediora
          </Link>
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-white/90 text-xs font-semibold mb-4">
            🔒 Legal Document
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-2">Privacy Policy</h1>
          <p className="text-white/70">Last updated: {currentDate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Intro Card */}
        <div className="bg-white rounded-2xl border border-mint/20 p-6 flex gap-4 shadow-sm mb-8">
          <div className="w-12 h-12 bg-mint-light rounded-xl flex items-center justify-center text-xl flex-shrink-0">🛡️</div>
          <p className="text-ink-soft leading-relaxed">
            At <strong className="text-mint-dark">Mediora</strong>, your privacy is a core part of how we operate — not an afterthought.
            This policy explains clearly what personal data we collect, why we collect it, how we store it securely,
            and the rights you have over your information.
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-stone rounded-2xl p-6 mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">📋 Contents — jump to any section</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { num: 1, title: "Information We Collect", id: "s1" },
              { num: 2, title: "How We Use Your Information", id: "s2" },
              { num: 3, title: "Data Storage & Security", id: "s3" },
              { num: 4, title: "Sharing Your Information", id: "s4" },
              { num: 5, title: "Your Rights", id: "s5" },
              { num: 6, title: "Cookies & Tracking", id: "s6" },
              { num: 7, title: "Children's Privacy", id: "s7" },
              { num: 8, title: "Changes to This Policy", id: "s8" },
              { num: 9, title: "Contact Us", id: "s9" },
            ].map((item) => (
              <a
                key={item.num}
                href={`#${item.id}`}
                className="flex items-center gap-3 text-mint-dark hover:text-mint p-2 rounded-lg hover:bg-mint-light transition group"
              >
                <span className="w-6 h-6 rounded-full bg-mint-light text-mint-dark text-xs font-bold flex items-center justify-center group-hover:bg-mint group-hover:text-white transition">
                  {item.num}
                </span>
                <span className="text-sm font-medium">{item.title}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        {[
          { id: "s1", title: "Information We Collect", content: "We collect only the information necessary to provide you with a safe, personalised pharmacy experience. This includes: Personal Information (name, email, phone, delivery address), Medical Information (symptoms, prescription images, medicine preferences), Payment Information (processed securely by Razorpay - we never store card details), and Usage Data (search queries, order history)." },
          { id: "s2", title: "How We Use Your Information", content: "We use your data exclusively to provide, improve, and communicate about our services: AI-powered medicine recommendations, order processing and delivery, improving our algorithms, sending order confirmations and updates, and complying with legal requirements." },
          { id: "s3", title: "Data Storage & Security", content: "Your data is stored securely on Supabase infrastructure with encryption at rest and in transit. We implement: SSL/TLS encrypted connections, Clerk authentication, regular security audits, and limited employee access to user data." },
          { id: "s4", title: "Sharing Your Information", content: "We do not sell, rent, or trade your personal information. Limited data is shared only where necessary: Delivery Partners (address, phone), Payment Processors (Razorpay - PCI-DSS compliant), AI Providers (anonymised queries only), and Legal Authorities (when required by law)." },
          { id: "s5", title: "Your Rights", content: "You have the right to: access your personal data, correct inaccurate information, request account deletion, opt out of marketing, download your data, and object to processing of your data. Contact us at privacy@mediora.fit to exercise these rights." },
          { id: "s6", title: "Cookies & Tracking", content: "We use only essential cookies required for authentication, session management, and cart functionality. We do not use advertising cookies, third-party trackers, or behavioural profiling tools." },
          { id: "s7", title: "Children's Privacy", content: "Our services are intended for individuals aged 18 and above. We do not knowingly collect, process, or store personal information from anyone under the age of 18." },
          { id: "s8", title: "Changes to This Policy", content: "We may update this Privacy Policy periodically. When we make material changes, we will notify you via email and/or a prominent notice on our website at least 7 days before the changes take effect." },
          { id: "s9", title: "Contact Us", content: "For privacy-related questions, contact us at privacy@mediora.fit or call +91-9649418425 (Mon-Sat, 10 AM - 7 PM IST)." },
        ].map((section) => (
          <div key={section.id} id={section.id} className="bg-white rounded-2xl border border-stone mb-4 scroll-mt-24 hover:shadow-sm transition">
            <div className="flex items-center gap-3 p-5 border-b border-stone bg-gradient-to-r from-stone/30 to-white">
              <span className="w-8 h-8 rounded-lg bg-mint text-white font-display text-sm flex items-center justify-center">{section.id.slice(1)}</span>
              <h2 className="font-display text-xl text-ink">{section.title}</h2>
            </div>
            <div className="p-6">
              <p className="text-ink-soft">{section.content}</p>
            </div>
          </div>
        ))}

        {/* Footer */}
        <footer className="border-t border-stone mt-12 pt-8 text-center">
          <div className="font-display text-mint text-lg mb-2">✚ Mediora</div>
          <p className="text-ink-muted text-sm">© {new Date().getFullYear()} Mediora. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/terms" className="text-ink-muted text-sm hover:text-mint transition">Terms of Service</Link>
            <Link href="/refund" className="text-ink-muted text-sm hover:text-mint transition">Refund Policy</Link>
            <Link href="/" className="text-ink-muted text-sm hover:text-mint transition">Home</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}