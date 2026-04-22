'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DisclaimerPage() {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const opts: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    setCurrentDate(new Date().toLocaleDateString('en-IN', opts));
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-neutral-900">

      {/* Navbar */}
      <div className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Mediora
        </Link>

        <div className="flex items-center gap-6 text-sm text-neutral-600">
          <Link href="/privacy" className="hover:text-black">Privacy</Link>
          <Link href="/terms" className="hover:text-black">Terms</Link>
          <Link href="/" className="hover:text-black">Home</Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pb-20">

        {/* Title */}
        <h1 className="text-4xl font-semibold tracking-tight mb-2">
          Medical Disclaimer
        </h1>

        <p className="text-sm text-neutral-500 mb-10">
          Last updated: {currentDate}
        </p>

        {/* Emergency Notice */}
        <div className="mb-10">
          <p className="text-red-600 font-medium mb-2">
            🚨 Emergency Notice
          </p>
          <p className="text-neutral-700 leading-relaxed text-[15px]">
            If you are experiencing a medical emergency, call emergency services immediately 
            (911 or 108 in India). Do not rely on this platform in urgent situations.
          </p>
        </div>

        {/* Sections */}

        <div className="space-y-10">

          <section>
            <h2 className="text-lg font-semibold mb-2">1. Not Medical Advice</h2>
            <p className="text-neutral-700 leading-relaxed text-[15px]">
              The information provided by Mediora is for general informational purposes only. 
              We make no guarantees regarding accuracy, reliability, or completeness. 
              Always consult a qualified healthcare professional before making medical decisions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              2. No Doctor-Patient Relationship
            </h2>
            <p className="text-neutral-700 leading-relaxed text-[15px]">
              Your use of Mediora does not establish a doctor-patient relationship. 
              AI-generated suggestions are not personalized medical advice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              3. OTC vs Prescription
            </h2>
            <p className="text-neutral-700 leading-relaxed text-[15px]">
              Mediora only recommends over-the-counter (OTC) medications. 
              Prescription medicines require consultation with a licensed doctor.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              4. Limitations of AI
            </h2>
            <p className="text-neutral-700 leading-relaxed text-[15px]">
              Our AI may not account for complex conditions, drug interactions, allergies, 
              pregnancy, or age-specific considerations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              5. Your Responsibility
            </h2>
            <p className="text-neutral-700 leading-relaxed text-[15px]">
              You are responsible for reading medication labels, checking allergies, 
              following dosage instructions, and consulting a doctor when necessary.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              6. When to See a Doctor
            </h2>
            <p className="text-neutral-700 leading-relaxed text-[15px]">
              Seek immediate medical attention if you experience chest pain, difficulty breathing, 
              severe fever, allergic reactions, seizures, or symptoms lasting more than 7 days.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-6 border-t text-sm text-neutral-500 flex flex-col sm:flex-row justify-between gap-4">
          <p>© {new Date().getFullYear()} Mediora</p>

          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-black">Privacy</Link>
            <Link href="/terms" className="hover:text-black">Terms</Link>
            <Link href="/refund" className="hover:text-black">Refund</Link>
          </div>
        </div>

      </div>
    </div>
  );
}