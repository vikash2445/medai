'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/app/context/CartContext';

export default function CartDrawer() {
  const { cart, cartTotal, updateQuantity, removeFromCart } = useCart();
  const [open, setOpen] = useState(false);

  // Both Navbar and any page can open this panel via the same event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('openCart', handler);
    return () => window.removeEventListener('openCart', handler);
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(26,26,46,0.4)',
          zIndex: 200, animation: 'cdFadeIn 0.2s',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 440, background: '#fff', zIndex: 201,
        display: 'flex', flexDirection: 'column',
        animation: 'cdSlideIn 0.3s',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
      }}>

        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: '1px solid #eee',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', color: '#1a1a2e' }}>
            Your Cart 🛒
          </h2>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none', border: 'none', fontSize: '1.4rem',
              cursor: 'pointer', color: '#4a4a6a',
              width: 32, height: 32, display: 'flex',
              alignItems: 'center', justifyContent: 'center', borderRadius: 8,
            }}
          >✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {cart.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#4a4a6a' }}>
              <p style={{ fontSize: '2rem', marginBottom: 10 }}>💊</p>
              <p>Your cart is empty</p>
              <p style={{ fontSize: '0.82rem', marginTop: 8, opacity: 0.6 }}>
                Search symptoms or browse the store
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0', borderBottom: '1px solid #f0ede7',
              }}>
                {/* Icon */}
                <div style={{
                  width: 48, height: 48, background: '#e6f7f3', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', flexShrink: 0, overflow: 'hidden',
                }}>
                  {(item as any).image
                    ? <img src={(item as any).image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                    : ((item as any).emoji || '💊')
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#1a1a2e' }}>{item.name}</div>
                  <div style={{ color: '#0a7860', fontWeight: 700, fontSize: '0.88rem' }}>
                    ₹{((item.pricePerTablet ?? item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>

                {/* Qty controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => item.quantity <= 1 ? removeFromCart(item.id) : updateQuantity(item.id, item.quantity - 1)}
                    style={qtyBtnStyle}
                  >−</button>
                  <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center', fontSize: '0.95rem' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={qtyBtnStyle}
                  >+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid #eee' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: '#1a1a2e',
            }}>
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={() => setOpen(false)}
              style={{
                display: 'block', width: '100%', background: '#0fa381', color: '#fff',
                border: 'none', borderRadius: 12, padding: 16,
                fontFamily: "'Outfit', sans-serif", fontSize: '1rem', fontWeight: 700,
                cursor: 'pointer', textAlign: 'center', textDecoration: 'none',
                transition: 'background 0.2s',
              }}
            >
              Proceed to Checkout →
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cdFadeIn  { from { opacity: 0; }             to { opacity: 1; } }
        @keyframes cdSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @media (max-width: 600px) {
          /* override panel width on mobile — done via inline style override below */
        }
      `}</style>
    </>
  );
}

const qtyBtnStyle: React.CSSProperties = {
  background: '#f0ede7', border: 'none',
  width: 26, height: 26, borderRadius: 6,
  cursor: 'pointer', fontSize: '1rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};