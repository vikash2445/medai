'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Link href="/" className="text-mint hover:underline text-sm">← Back to MedAI</Link>
          <h1 className="text-3xl font-bold text-ink mt-4">Terms of Service</h1>
          <p className="text-ink-soft mt-2">Last updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm font-semibold">⚠️ IMPORTANT MEDICAL DISCLAIMER</p>
            <p className="text-yellow-700 text-sm mt-1">
              Mediora is NOT a substitute for professional medical advice, diagnosis, or treatment. 
              Always seek the advice of your physician or qualified healthcare provider.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">1. Acceptance of Terms</h2>
            <p className="text-ink-soft">By accessing or using Mediora, you agree to be bound by these Terms of Service. If you disagree with any part, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">2. Eligibility</h2>
            <p className="text-ink-soft">You must be at least 18 years old to use Mediora. By using our services, you represent that you are 18 or older.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">3. Our Services</h2>
            <p className="text-ink-soft">Mediora provides:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-ink-soft">
              <li>AI-powered over-the-counter (OTC) medicine recommendations based on symptoms</li>
              <li>Prescription image scanning and medicine identification</li>
              <li>Online ordering and delivery of medicines</li>
            </ul>
            <p className="text-ink-soft mt-3 font-semibold">We do NOT provide:</p>
            <ul className="list-disc pl-6 mt-1 text-ink-soft">
              <li>Medical diagnosis or prescription services</li>
              <li>Emergency medical advice</li>
              <li>Treatment for serious or life-threatening conditions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">4. Account Responsibility</h2>
            <p className="text-ink-soft">You are responsible for:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-ink-soft">
              <li>Maintaining the confidentiality of your account</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">5. Orders & Payments</h2>
            <ul className="list-disc pl-6 space-y-2 text-ink-soft">
              <li>All orders are subject to availability and confirmation</li>
              <li>Prices are subject to change without notice</li>
              <li>Payments are processed securely via Razorpay</li>
              <li>We reserve the right to refuse or cancel any order</li>
              <li>Prescription medicines require a valid doctor's prescription</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">6. Delivery & Returns</h2>
            <p className="text-ink-soft">Please refer to our Refund Policy for detailed information on returns, refunds, and delivery timelines.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">7. Prohibited Uses</h2>
            <p className="text-ink-soft">You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-ink-soft">
              <li>Use our services for any illegal purpose</li>
              <li>Attempt to bypass our security measures</li>
              <li>Upload false or misleading information</li>
              <li>Reverse engineer any part of our platform</li>
              <li>Use our AI for medical diagnosis or emergency situations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">8. Intellectual Property</h2>
            <p className="text-ink-soft">All content, trademarks, and intellectual property on MedAI belong to us or our licensors. You may not reproduce, distribute, or create derivative works without permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">9. Limitation of Liability</h2>
            <p className="text-ink-soft">To the maximum extent permitted by law, Mediora shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">10. Indemnification</h2>
            <p className="text-ink-soft">You agree to indemnify and hold Mediora harmless from any claims arising from your violation of these Terms or applicable laws.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">11. Governing Law</h2>
            <p className="text-ink-soft">These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in [Your City].</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">12. Changes to Terms</h2>
            <p className="text-ink-soft">We may modify these Terms at any time. Continued use of Mediora constitutes acceptance of the modified Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">13. Contact</h2>
            <p className="text-ink-soft">For questions about these Terms: <strong className="text-mint">legal@mediora.fit</strong></p>
          </section>

          <div className="border-t pt-4 text-center text-sm text-ink-muted">
            <p>© {new Date().getFullYear()} Mediora. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}