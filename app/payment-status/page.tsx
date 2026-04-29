'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentStatusPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/verify-payment?order_id=${orderId}`)
      .then(res => res.json())
      .then(data => setStatus(data.success ? 'success' : 'failed'))
      .catch(() => setStatus('failed'));
  }, [orderId]);

  if (status === 'loading') return <div className="text-center p-8">Verifying your payment…</div>;
  if (status === 'success')
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-green-600">Payment Successful! 🎉</h1>
        <Link href="/orders" className="text-blue-600 underline mt-2 inline-block">View Orders</Link>
      </div>
    );
  return (
    <div className="text-center p-8">
      <h1 className="text-2xl font-bold text-red-600">Payment Failed</h1>
      <Link href="/cart" className="text-blue-600 underline mt-2 inline-block">Try Again</Link>
    </div>
  );
}