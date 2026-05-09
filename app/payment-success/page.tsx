'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  const { clearCart } = useCart();

  const [status, setStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');

  const [message, setMessage] = useState('');

  // Prevent duplicate execution
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!orderId || hasVerified.current) return;

    hasVerified.current = true;

    const verifyPayment = async () => {
      try {
        console.log(
          '🔍 Verifying payment for order:',
          orderId
        );

        const verifyRes = await fetch(
          `/api/verify-order?order_id=${orderId}`
        );

        const verifyData = await verifyRes.json();

        console.log(
          '✅ Verification response:',
          verifyData
        );

        if (!verifyRes.ok || !verifyData.success) {
          setStatus('error');

          setMessage(
            verifyData.error ||
              'Payment verification failed'
          );

          return;
        }

        // Clear local storage
        localStorage.removeItem('checkout_address');
        localStorage.removeItem('pending_order_total');
        localStorage.removeItem('mediora_cart');

        // Clear cart
        clearCart();

        setStatus('success');
      } catch (err) {
        console.error(
          '❌ Payment verification error:',
          err
        );

        setStatus('error');

        setMessage(
          'Could not verify payment. Please contact support.'
        );
      }
    };

    verifyPayment();
  }, [orderId, clearCart]);

  // Loading
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>

          <p className="mt-4 text-gray-600">
            Verifying your payment...
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (status === 'error') {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 text-center">
        <div className="text-red-600 text-5xl mb-4">
          ❌
        </div>

        <h1 className="text-2xl font-bold mb-2">
          Payment Issue
        </h1>

        <p className="text-gray-600 mb-4">
          {message || 'Something went wrong'}
        </p>

        <p className="text-sm text-gray-500 mb-6">
          Order ID: {orderId}
        </p>

        <Link
          href="/checkout"
          className="bg-green-600 text-white px-6 py-2 rounded-lg inline-block"
        >
          Try Again
        </Link>
      </div>
    );
  }

  // Success
  return (
    <div className="max-w-md mx-auto mt-20 p-6 text-center">
      <div className="text-green-600 text-5xl mb-4">
        ✓
      </div>

      <h1 className="text-2xl font-bold mb-2">
        Payment Successful!
      </h1>

      <p className="text-gray-600 mb-4">
        Your order{' '}
        <strong className="font-mono">
          {orderId}
        </strong>{' '}
        has been confirmed.
      </p>

      <p className="text-gray-500 mb-6">
        You will receive an email with order
        details.
      </p>

      <div className="space-y-3">
        <Link
          href="/orders"
          className="block bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
        >
          View My Orders
        </Link>

        <Link
          href="/"
          className="block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}