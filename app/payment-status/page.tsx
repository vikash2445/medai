'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    if (!orderId) return;

    // ✅ Correct endpoint: /api/verify-order (not verify-payment)
    fetch(`/api/verify-order?order_id=${orderId}`)
      .then(res => res.json())
      .then(data => {
        console.log('Verification response:', data);
        setStatus(data.success ? 'success' : 'failed');
      })
      .catch(err => {
        console.error('Verification error:', err);
        setStatus('failed');
      });
  }, [orderId]);

  if (status === 'loading')
    return <div className="text-center p-8">Verifying your payment…</div>;

  if (status === 'success')
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-green-600">
          Payment Successful! 🎉
        </h1>
        <Link href="/orders" className="text-blue-600 underline mt-2 inline-block">
          View Orders
        </Link>
        <Link href="/" className="text-blue-600 underline mt-2 inline-block ml-4">
          Continue Shopping
        </Link>
      </div>
    );

  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-600">Payment Failed</h1>
      <p className="text-gray-600 mt-2">Order ID: {orderId}</p>
      <Link href="/checkout" className="text-blue-600 underline mt-4 inline-block">
        Try Again
      </Link>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <PaymentStatusContent />
    </Suspense>
  );
}