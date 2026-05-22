'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth,useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Tag, Gift, Truck, Clock, ShieldCheck ,Lock} from 'lucide-react';

// Coupon Input Component (inline)
function CouponInput({ subtotal, onApplyCoupon }: { 
  subtotal: number; 
  onApplyCoupon: (coupon: any) => void;
}) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/coupons/validate?code=${couponCode}`);
      const data = await res.json();

      if (data.success && data.coupon) {
        const coupon = data.coupon;
        
        if (subtotal < coupon.min_order) {
          setError(`Minimum order amount of ₹${coupon.min_order} required`);
          setLoading(false);
          return;
        }

        setAppliedCoupon(coupon);
        const discountAmount = coupon.discount_type === 'percentage'
          ? (subtotal * coupon.discount_value) / 100
          : coupon.discount_value;
        
        setSuccess(`Coupon applied! You saved ₹${discountAmount}`);
        onApplyCoupon({ coupon, discountAmount });
      } else {
        setError(data.error || 'Invalid coupon code');
      }
    } catch (err) {
      setError('Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    onApplyCoupon(null);
    setSuccess('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag size={18} className="text-green-600" />
        <span className="font-semibold text-gray-800">Apply Coupon</span>
      </div>

      {appliedCoupon ? (
        <div className="bg-green-50 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">{appliedCoupon.code}</span>
            <span className="text-xs text-gray-500">
              {appliedCoupon.discount_type === 'percentage' 
                ? `${appliedCoupon.discount_value}% off` 
                : `₹${appliedCoupon.discount_value} off`}
            </span>
          </div>
          <button
            onClick={removeCoupon}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-green-500"
          />
          <button
            onClick={applyCoupon}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      {success && <p className="text-green-600 text-xs mt-2">{success}</p>}
    </div>
  );
}

// Load Cashfree SDK
async function loadCashfree({ mode }: { mode: string }): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Cashfree SDK can only be loaded in the browser');
  }

  const sdkUrl =
    mode === 'production'
      ? 'https://sdk.cashfree.com/js/v2/cashfree.js'
      : 'https://sdk.cashfree.com/js/v2/cashfree.sandbox.js';

  const globalKey = 'Cashfree';
  const existingGlobal = (window as any)[globalKey];
  if (existingGlobal) {
    return existingGlobal;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${sdkUrl}"]`);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => {
        const loadedGlobal = (window as any)[globalKey];
        if (loadedGlobal) resolve(loadedGlobal);
        else reject(new Error('Cashfree SDK loaded but global object is missing'));
      });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Cashfree SDK')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;
    script.onload = () => {
      const loadedGlobal = (window as any)[globalKey];
      if (loadedGlobal) {
        resolve(loadedGlobal);
      } else {
        reject(new Error('Cashfree SDK loaded but global object is missing'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { cartTotal, cart, clearCart } = useCart();
  const { isSignedIn } = useAuth();
   const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(40);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  });

  // Calculate totals
  const subtotal = cartTotal;
  const delivery = subtotal > 499 ? 0 : deliveryCharge;
  const total = subtotal - discount + delivery;

  // Handle coupon application
  const handleApplyCoupon = (couponData: any) => {
    if (couponData) {
      setAppliedCoupon(couponData.coupon);
      setDiscount(couponData.discountAmount);
    } else {
      setAppliedCoupon(null);
      setDiscount(0);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCustomerDetails({
      ...customerDetails,
      [e.target.name]: e.target.value,
    });
  };

  // Handle payment
  const handleCashfreePayment = async () => {
    // Validate customer details
    if (!customerDetails.name || !customerDetails.email || !customerDetails.phone || !customerDetails.address) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          orderId,
          customerName: customerDetails.name,
          customerEmail: customerDetails.email,
          customerPhone: customerDetails.phone,
          discount,
          couponCode: appliedCoupon?.code,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const cashfree = await loadCashfree({ mode: 'sandbox' });
      const checkoutOptions = {
        paymentSessionId: data.payment_session_id,
        redirectTarget: '_self',
      };
      cashfree.checkout(checkoutOptions);
    } catch (err) {
      console.error(err);
      alert('Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill from Clerk if signed in
  useEffect(() => {
    if (isSignedIn && user) {
      setCustomerDetails(prev => ({
        ...prev,
        name: user.fullName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
      }));
    }
  }, [isSignedIn, user]);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h1>
            <p className="text-gray-500 mb-6">Add some products to your cart before checking out.</p>
            <Link href="/store" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700">
              Browse Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/cart" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Customer Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck size={20} className="text-green-600" />
                <h2 className="text-lg font-semibold text-gray-800">Delivery Address</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={customerDetails.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={customerDetails.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={customerDetails.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="9876543210"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={customerDetails.pincode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="400001"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea
                    name="address"
                    value={customerDetails.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="House No., Street, Landmark"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Order Items Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-gray-100">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">{item.emoji || '💊'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="font-semibold text-gray-800">₹{item.price * item.quantity}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Options */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={20} className="text-green-600" />
                <h2 className="text-lg font-semibold text-gray-800">Delivery Slot</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {['Today, 6-8 PM', 'Tomorrow, 9-11 AM', 'Tomorrow, 4-6 PM', 'Wed, 9-11 AM'].map((slot) => (
                  <label key={slot} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-green-500">
                    <input type="radio" name="deliverySlot" className="text-green-600" />
                    <span className="text-sm">{slot}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Billing Summary */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Billing Summary</h2>
              
              {/* Coupon Input */}
              <CouponInput subtotal={subtotal} onApplyCoupon={handleApplyCoupon} />
              
              {/* Price Breakdown */}
              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Charges</span>
                  <span>{delivery === 0 ? 'Free' : `₹${delivery}`}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total Amount</span>
                    <span className="text-green-600">₹{total.toLocaleString()}</span>
                  </div>
                  {subtotal > 499 && (
                    <p className="text-xs text-green-600 mt-1">✨ Free delivery on this order</p>
                  )}
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handleCashfreePayment}
                disabled={loading}
                className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Processing...' : `Pay ₹${total.toLocaleString()} via Cashfree`}
              </button>

              {/* Security Badges */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <ShieldCheck size={14} />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock size={14} />
                  <span>SSL Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}