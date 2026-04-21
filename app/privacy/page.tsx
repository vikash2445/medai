'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-mint hover:underline text-sm">← Back to MedAI</Link>
          <h1 className="text-3xl font-bold text-ink mt-4">Privacy Policy</h1>
          <p className="text-ink-soft mt-2">Last updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          <div className="p-4 bg-mint-light rounded-lg">
            <p className="text-mint-dark text-sm">
              At MedAI, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information when you use our pharmacy services.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">1. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2 text-ink-soft">
              <li><strong>Personal Information:</strong> Name, email address, phone number, delivery address</li>
              <li><strong>Medical Information:</strong> Symptoms you describe, prescription images, medicine preferences</li>
              <li><strong>Payment Information:</strong> Processed securely via Razorpay (we don't store card details)</li>
              <li><strong>Usage Data:</strong> Search history, order history, device information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-ink-soft">
              <li>To provide AI-powered medicine recommendations based on your symptoms</li>
              <li>To process and deliver your orders</li>
              <li>To improve our AI algorithms and service quality</li>
              <li>To send order confirmations and delivery updates</li>
              <li>To comply with legal and regulatory requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">3. Data Storage & Security</h2>
            <p className="text-ink-soft">Your data is stored securely using Supabase with encryption at rest. We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-ink-soft">
              <li>Encrypted database connections (SSL/TLS)</li>
              <li>Secure authentication via Clerk</li>
              <li>Regular security audits and updates</li>
              <li>Limited employee access to user data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">4. Sharing Your Information</h2>
            <p className="text-ink-soft">We do not sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-ink-soft">
              <li><strong>Delivery Partners:</strong> To deliver your orders (address, phone number only)</li>
              <li><strong>Payment Processors:</strong> Razorpay for payment processing</li>
              <li><strong>AI Providers:</strong> Groq/Gemini for symptom analysis (anonymized queries)</li>
              <li><strong>Legal Authorities:</strong> When required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">5. Your Rights</h2>
            <p className="text-ink-soft">You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-ink-soft">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications</li>
              <li>Download your data in a portable format</li>
            </ul>
            <p className="text-ink-soft mt-3">To exercise these rights, contact us at <strong className="text-mint">privacy@medai.com</strong></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">6. Cookies & Tracking</h2>
            <p className="text-ink-soft">We use essential cookies for authentication and cart functionality. We do not use tracking cookies for advertising purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">7. Children's Privacy</h2>
            <p className="text-ink-soft">Our services are not directed to children under 18. We do not knowingly collect information from minors.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">8. Changes to This Policy</h2>
            <p className="text-ink-soft">We may update this privacy policy periodically. We will notify you of significant changes via email or website notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">9. Contact Us</h2>
            <p className="text-ink-soft">For privacy concerns or questions:</p>
            <ul className="list-none mt-2 space-y-1 text-ink-soft">
              <li>📧 Email: <strong className="text-mint">privacy@medai.com</strong></li>
              <li>📞 Phone: <strong className="text-mint">+91-XXXXXXXXXX</strong></li>
              <li>🏢 Address: [Your Business Address]</li>
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