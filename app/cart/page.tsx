'use client';

import { useCart } from '../context/CartContext';
import { load } from 'cashfreepayments/cashfree-js';

export default function CheckoutPage() {
  const { cartTotal, cart } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCashfreePayment = async () => {
    setLoading(true);
    try {
      // 1. Generate a unique order ID (store it for later verification)
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      // 2. Call your backend to create the Cashfree order
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal,                  // in rupees
          orderId,
          customerName: 'John Doe',           // fetch from address
          customerEmail: 'john@example.com',
          customerPhone: '9876543210',
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // 3. Load Cashfree SDK and open the checkout page
      const cashfree = await load({ mode: 'sandbox' }); // or 'production'
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',              // redirect inside the same tab
      };
      cashfree.checkout(checkoutOptions);
    } catch (err) {
      console.error(err);
      alert('Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCashfreePayment}
      disabled={loading}
      className="bg-green-600 text-white px-6 py-3 rounded-lg"
    >
      {loading ? 'Processing...' : 'Pay with Cashfree'}
    </button>
  );
}