'use client';

import Link from 'next/link';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Link href="/" className="text-mint hover:underline text-sm">← Back to MedAI</Link>
          <h1 className="text-3xl font-bold text-ink mt-4">Refund & Cancellation Policy</h1>
          <p className="text-ink-soft mt-2">Last updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">1. Order Cancellation</h2>
            <ul className="list-disc pl-6 space-y-2 text-ink-soft">
              <li><strong>Before Dispatch:</strong> You can cancel your order within 30 minutes of placement for a full refund</li>
              <li><strong>After Dispatch:</strong> Orders cannot be canceled once dispatched from our pharmacy</li>
              <li><strong>How to Cancel:</strong> Contact us at <strong className="text-mint">support@medai.com</strong> or call our helpline</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">2. Return Eligibility</h2>
            <p className="text-ink-soft">Due to the nature of pharmaceutical products, returns are only accepted in specific circumstances:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-ink-soft">
              <li>✅ <strong>Damaged Product:</strong> Received in damaged condition</li>
              <li>✅ <strong>Wrong Product:</strong> Received incorrect medicine</li>
              <li>✅ <strong>Expired Product:</strong> Received expired medication</li>
              <li>❌ <strong>Change of Mind:</strong> Not accepted due to safety regulations</li>
              <li>❌ <strong>Opened Packaging:</strong> Cannot return opened or used medicines</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">3. Return Process</h2>
            <ol className="list-decimal pl-6 space-y-2 text-ink-soft">
              <li>Contact us within 48 hours of delivery</li>
              <li>Provide your order ID and photo/video evidence of the issue</li>
              <li>Our team will review and approve your return request</li>
              <li>We will arrange pickup of the product</li>
              <li>Refund will be processed within 7-10 business days</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">4. Refund Timeline</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-mint-light">
                    <th className="p-3 text-left text-mint-dark">Payment Method</th>
                    <th className="p-3 text-left text-mint-dark">Refund Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="p-3">Credit/Debit Card</td><td className="p-3">3-5 business days</td></tr>
                  <tr className="border-b"><td className="p-3">UPI / Netbanking</td><td className="p-3">2-4 business days</td></tr>
                  <tr className="border-b"><td className="p-3">Wallet</td><td className="p-3">24-48 hours</td></tr>
                  <tr><td className="p-3">Cash on Delivery</td><td className="p-3">Not applicable (no payment made)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">5. Delivery Issues</h2>
            <ul className="list-disc pl-6 space-y-1 text-ink-soft">
              <li><strong>Failed Delivery:</strong> If delivery fails due to incorrect address, re-delivery charges may apply</li>
              <li><strong>Delayed Delivery:</strong> If order is delayed beyond 7 days, you may cancel for a full refund</li>
              <li><strong>Missing Items:</strong> Report missing items within 24 hours of delivery</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">6. Prescription Medicines</h2>
            <p className="text-ink-soft">Prescription medicines require a valid doctor's prescription. We cannot accept returns on prescription medicines once delivered due to safety regulations.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">7. Contact for Refunds</h2>
            <p className="text-ink-soft">For refund-related queries:</p>
            <ul className="list-none mt-2 space-y-1 text-ink-soft">
              <li>📧 Email: <strong className="text-mint">refunds@medai.com</strong></li>
              <li>📞 Phone: <strong className="text-mint">+91-XXXXXXXXXX</strong></li>
              <li>⏰ Hours: Monday-Saturday, 10 AM - 7 PM</li>
            </ul>
          </section>

          <div className="border-t pt-4 text-center text-sm text-ink-muted">
            <p>© {new Date().getFullYear()} MedAI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}