'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../context/CartContext';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');

  const { clearCart } = useCart();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      setMessage('No order ID provided');
      return;
    }

    const verifyPayment = async () => {
      try {
        // Verify payment
        console.log('🔍 Verifying payment for order:', orderId);

        const verifyRes = await fetch(
          `/api/verify-order?order_id=${orderId}`
        );

        if (!verifyRes.ok) {
          throw new Error(`Verification failed: ${verifyRes.status}`);
        }

        const verifyData = await verifyRes.json();

        console.log('✅ Verification response:', verifyData);

        if (!verifyData.success) {
          setStatus('error');
          setMessage(
            verifyData.error || 'Payment verification failed'
          );
          return;
        }

        // Get localStorage data
        const cartItemsRaw = localStorage.getItem('mediora_cart');
        const addressRaw = localStorage.getItem('checkout_address');
        const pendingTotalRaw =
          localStorage.getItem('pending_order_total');

        console.log('📦 Cart from localStorage:', cartItemsRaw);
        console.log('📍 Address from localStorage:', addressRaw);
        console.log('💰 Total from localStorage:', pendingTotalRaw);

        const cartItems = cartItemsRaw
          ? JSON.parse(cartItemsRaw)
          : [];

        const address = addressRaw
          ? JSON.parse(addressRaw)
          : {};

        const pendingTotal = pendingTotalRaw
          ? parseFloat(pendingTotalRaw)
          : 0;

        // Validate address
        if (!address.name || !address.phone) {
          console.error('❌ Missing address data:', address);

          setStatus('error');
          setMessage(
            'Missing address information. Please contact support.'
          );

          return;
        }

        // Prepare order data
        const orderData = {
          orderId: orderId,
          total: pendingTotal,
          address: `${address.line1 || ''}, ${address.city || ''} ${
            address.zip || ''
          }`.trim(),

          customerName: address.name,
          customerEmail: address.email || '',
          customerPhone: address.phone,

          items: cartItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        };

        console.log('📤 Sending order data:', orderData);

        // Save order
        const saveRes = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        const saveData = await saveRes.json();

        console.log(
          '📡 Save order response:',
          saveRes.status,
          saveData
        );

        if (!saveRes.ok) {
          console.error('❌ Failed to save order:', saveData);
        } else {
          console.log('✅ Order saved successfully');
        }

        // Clear storage
        localStorage.removeItem('checkout_address');
        localStorage.removeItem('pending_order_total');
        localStorage.removeItem('mediora_cart');

        // Clear cart context
        clearCart();

        setStatus('success');
      } catch (err) {
        console.error('❌ Payment verification error:', err);

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
        <div className="text-red-600 text-5xl mb-4">❌</div>

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
      <div className="text-green-600 text-5xl mb-4">✓</div>

      <h1 className="text-2xl font-bold mb-2">
        Payment Successful!
      </h1>

      <p className="text-gray-600 mb-4">
        Your order{' '}
        <strong className="font-mono">{orderId}</strong> has
        been confirmed.
      </p>

      <p className="text-gray-500 mb-6">
        You will receive an email with order details.
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