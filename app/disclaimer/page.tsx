'use client';

import Link from 'next/link';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Link href="/" className="text-mint hover:underline text-sm">← Back to MedAI</Link>
          <h1 className="text-3xl font-bold text-ink mt-4">Medical Disclaimer</h1>
          <p className="text-ink-soft mt-2">Last updated: {new Date().toLocaleDateString('en-IN')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
          <div className="p-6 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-800 font-bold text-lg">⚠️ EMERGENCY WARNING</p>
            <p className="text-red-700 mt-2">
              If you are experiencing a medical emergency, call emergency services immediately (911 or 108 in India). 
              DO NOT use this website for emergency medical situations.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">Not Medical Advice</h2>
            <p className="text-ink-soft">
              The information provided by MedAI is for general informational purposes only. All information on the site is provided in good faith; however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">No Doctor-Patient Relationship</h2>
            <p className="text-ink-soft">
              Your use of MedAI does not create a doctor-patient relationship. Our AI recommendations are based on general medical guidelines and are not tailored to your specific health condition. Always consult a qualified healthcare professional for medical advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">OTC vs Prescription</h2>
            <p className="text-ink-soft">
              MedAI only recommends over-the-counter (OTC) medications. We do not provide prescription medicines without a valid doctor's prescription. If you need prescription medication, please consult a doctor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">Limitations of AI</h2>
            <p className="text-ink-soft">
              Our AI is trained on general medical data but may not be accurate for:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-ink-soft">
              <li>Rare or complex medical conditions</li>
              <li>Drug interactions with your current medications</li>
              <li>Allergies or sensitivities you may have</li>
              <li>Pediatric or geriatric dosing (consult a doctor)</li>
              <li>Pregnancy or breastfeeding considerations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">Your Responsibility</h2>
            <p className="text-ink-soft">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-ink-soft">
              <li>Reading medicine labels and package inserts</li>
              <li>Checking for potential allergies or contraindications</li>
              <li>Following recommended dosages</li>
              <li>Consulting a doctor if symptoms persist or worsen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">Third-Party Links</h2>
            <p className="text-ink-soft">
              Our website may contain links to external websites that are not provided or maintained by us. We do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">Consent</h2>
            <p className="text-ink-soft">
              By using our website, you hereby consent to our disclaimer and agree to its terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">When to See a Doctor</h2>
            <p className="text-ink-soft">You should consult a doctor immediately if you experience:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-ink-soft">
              <li>Chest pain or difficulty breathing</li>
              <li>Severe headache or confusion</li>
              <li>High fever (above 103°F / 39.5°C)</li>
              <li>Severe allergic reaction (swelling, difficulty breathing)</li>
              <li>Uncontrolled bleeding or vomiting</li>
              <li>Seizures or loss of consciousness</li>
              <li>Symptoms lasting more than 7 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink mb-3">Contact Information</h2>
            <p className="text-ink-soft">If you have questions about this disclaimer:</p>
            <ul className="list-none mt-2 space-y-1 text-ink-soft">
              <li>📧 Email: <strong className="text-mint">medical@medai.com</strong></li>
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