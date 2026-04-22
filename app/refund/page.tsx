'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function RefundPage() {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-IN', opts));
  }, []);

  return (
    <div className="min-h-screen bg-cream">
      {/* Banner */}
      <div className="relative bg-gradient-to-r from-mint-dark via-mint to-mint-mid pt-16 pb-24 overflow-hidden">
        <div
  className={`absolute inset-0 opacity-10 bg-[url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M0 60L60 0H30L0 30M60 60V30L30 60'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] bg-repeat`}
/>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-cream" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition">
            ← Back to Mediora
          </Link>
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-white/90 text-xs font-semibold mb-4">
            💰 Legal Document
          </div>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-2">Refund & Cancellation Policy</h1>
          <p className="text-white/70">Last updated: {currentDate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {[
          { 
            title: "Order Cancellation", 
            items: [
              "Before Dispatch: You can cancel your order within 30 minutes of placement for a full refund",
              "After Dispatch: Orders cannot be canceled once dispatched from our pharmacy",
              "How to Cancel: Contact us at support@mediora.fit or call our helpline"
            ]
          },
          { 
            title: "Return Eligibility", 
            items: [
              "✅ Damaged Product: Received in damaged condition",
              "✅ Wrong Product: Received incorrect medicine",
              "✅ Expired Product: Received expired medication",
              "❌ Change of Mind: Not accepted due to safety regulations",
              "❌ Opened Packaging: Cannot return opened or used medicines"
            ]
          },
          { 
            title: "Return Process", 
            items: [
              "Contact us within 48 hours of delivery",
              "Provide your order ID and photo/video evidence of the issue",
              "Our team will review and approve your return request",
              "We will arrange pickup of the product",
              "Refund will be processed within 7-10 business days"
            ]
          },
        ].map((section, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-stone mb-4 hover:shadow-sm transition">
            <div className="flex items-center gap-3 p-5 border-b border-stone bg-gradient-to-r from-stone/30 to-white">
              <span className="w-8 h-8 rounded-lg bg-mint text-white font-display text-sm flex items-center justify-center">{idx + 1}</span>
              <h2 className="font-display text-xl text-ink">{section.title}</h2>
            </div>
            <div className="p-6">
              <ul className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex gap-2">
                    <span className="text-mint">•</span>
                    <span className="text-ink-soft">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Refund Timeline Table */}
        <div className="bg-white rounded-2xl border border-stone mb-4 hover:shadow-sm transition">
          <div className="flex items-center gap-3 p-5 border-b border-stone bg-gradient-to-r from-stone/30 to-white">
            <span className="w-8 h-8 rounded-lg bg-mint text-white font-display text-sm flex items-center justify-center">4</span>
            <h2 className="font-display text-xl text-ink">Refund Timeline</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-mint-light">
                    <th className="p-3 text-left text-mint-dark font-semibold">Payment Method</th>
                    <th className="p-3 text-left text-mint-dark font-semibold">Refund Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="p-3 text-ink-soft">Credit/Debit Card</td><td className="p-3 text-ink-soft">3-5 business days</td></tr>
                  <tr className="border-b"><td className="p-3 text-ink-soft">UPI / Netbanking</td><td className="p-3 text-ink-soft">2-4 business days</td></tr>
                  <tr className="border-b"><td className="p-3 text-ink-soft">Wallet</td><td className="p-3 text-ink-soft">24-48 hours</td></tr>
                  <tr><td className="p-3 text-ink-soft">Cash on Delivery</td><td className="p-3 text-ink-soft">Not applicable (no payment made)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Additional Sections */}
        {[
          { title: "Delivery Issues", items: ["Failed Delivery: If delivery fails due to incorrect address, re-delivery charges may apply", "Delayed Delivery: If order is delayed beyond 7 days, you may cancel for a full refund", "Missing Items: Report missing items within 24 hours of delivery"] },
          { title: "Prescription Medicines", items: ["Prescription medicines require a valid doctor's prescription. We cannot accept returns on prescription medicines once delivered due to safety regulations."] },
          { title: "Contact for Refunds", items: ["📧 Email: refunds@mediora.fit", "📞 Phone: +91-9649418425", "⏰ Hours: Monday-Saturday, 10 AM - 7 PM IST"] },
        ].map((section, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-stone mb-4 hover:shadow-sm transition">
            <div className="flex items-center gap-3 p-5 border-b border-stone bg-gradient-to-r from-stone/30 to-white">
              <span className="w-8 h-8 rounded-lg bg-mint text-white font-display text-sm flex items-center justify-center">{idx + 5}</span>
              <h2 className="font-display text-xl text-ink">{section.title}</h2>
            </div>
            <div className="p-6">
              <ul className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex gap-2">
                    <span className="text-mint">•</span>
                    <span className="text-ink-soft">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Footer */}
        <footer className="border-t border-stone mt-12 pt-8 text-center">
          <div className="font-display text-mint text-lg mb-2">✚ Mediora</div>
          <p className="text-ink-muted text-sm">© {new Date().getFullYear()} Mediora. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/privacy" className="text-ink-muted text-sm hover:text-mint transition">Privacy Policy</Link>
            <Link href="/terms" className="text-ink-muted text-sm hover:text-mint transition">Terms of Service</Link>
            <Link href="/" className="text-ink-muted text-sm hover:text-mint transition">Home</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}