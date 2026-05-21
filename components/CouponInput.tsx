'use client';

import { useState } from 'react';
import { Tag, Gift, CheckCircle } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order: number;
}

export default function CouponInput({ subtotal, onApplyCoupon }: { 
  subtotal: number; 
  onApplyCoupon: (coupon: Coupon | null) => void;
}) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
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
        setSuccess(`Coupon applied! ${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : '₹'} off`);
        onApplyCoupon(coupon);
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
            <CheckCircle size={16} className="text-green-600" />
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