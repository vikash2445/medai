'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import Link from 'next/link';
import Navbar from '../components/Navbar';

// ── Cashfree SDK loader ────────────────────────────────────────────────────────
async function loadCashfree() {
  if (typeof window === 'undefined') throw new Error('Browser only');
  
  // Check if already loaded
  if ((window as any).Cashfree) return (window as any).Cashfree;
  
  const sdkUrl = 'https://sdk.cashfree.com/js/v3/cashfree.js';
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;
    script.onload = () => {
      if ((window as any).Cashfree) {
        console.log('✅ Cashfree SDK loaded successfully');
        resolve((window as any).Cashfree);
      } else {
        reject(new Error('Cashfree SDK loaded but global object missing'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.body.appendChild(script);
  });
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: done ? '#0fa381' : active ? '#0f1117' : '#e8e5df',
        color: done || active ? '#fff' : '#9299aa',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: done ? '1rem' : '0.88rem', fontWeight: 700,
        transition: 'all 0.3s ease',
        boxShadow: active ? '0 0 0 4px rgba(15,163,129,0.18)' : 'none',
      }}>
        {done ? '✓' : n}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { cart, cartTotal, cartCount, clearCart } = useCart();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [address, setAddress] = useState({
    name: '', phone: '', email: '', line1: '', city: '', zip: '',
  });

  const delivery = 0; // free delivery
  const grandTotal = cartTotal + delivery;

  // Restore address from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem('checkout_address');
    if (savedAddress) {
      try {
        setAddress(JSON.parse(savedAddress));
      } catch (e) {}
    }
  }, []);

  // Empty cart
  if (cart.length === 0 && step !== 3) {
    return (
      <>
        <style>{css}</style>
        <Navbar cartCount={cartCount} resetAll={() => {}} showHomeLink showStoreLink />
        <div className="co-empty">
          <div className="co-empty-icon">🛒</div>
          <h2 className="co-empty-title">Your cart is empty</h2>
          <p className="co-empty-sub">Add some products before checking out.</p>
          <Link href="/store" className="co-btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
            Browse Store →
          </Link>
        </div>
      </>
    );
  }

  // ── Payment handler ──
  const handlePayment = async () => {
  if (!address.name || !address.phone) {
    alert('Please fill in your name and phone number');
    setStep(1);
    return;
  }

  setLoading(true);

  try {
    const requestBody = {
      amount: grandTotal,
      customerName: address.name,
      customerEmail: address.email || 'customer@medai.com',
      customerPhone: address.phone,
      shippingAddress: `${address.line1 || ''} ${address.city || ''} ${address.zip || ''}`.trim(),
    };
    
    console.log('Creating order with:', requestBody);
    
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    console.log('Order creation response:', data);

    if (!res.ok || !data.payment_session_id) {
      throw new Error(data.error || "No session id received");
    }

    // Save pending order info for success page
    localStorage.setItem('checkout_address', JSON.stringify(address));
    localStorage.setItem('pending_order_total', grandTotal.toString());
    localStorage.setItem('pending_order_id', data.order_id);
    
    // ✅ Load Cashfree SDK once
    const CashfreeSDK = await loadCashfree();

    // ✅ CORRECT: Cashfree is the constructor directly
    const cashfree = new CashfreeSDK({
      mode: process.env.NEXT_PUBLIC_CASHFREE_ENV === "PRODUCTION" ? "production" : "sandbox",
    });

    // ✅ This will redirect the browser to Cashfree
    cashfree.checkout({
      paymentSessionId: data.payment_session_id,
      redirectTarget: "_self",
    });
    
    // ❌ Do NOT clear cart or setStep here - page redirects immediately

  } catch (err) {
    console.error("Payment Error:", err);
    alert(err instanceof Error ? err.message : "Payment initiation failed. Please try again.");
    setLoading(false);
  }
};

  return (
    <>
      <style>{css}</style>
      <Navbar cartCount={cartCount} resetAll={() => {}} showHomeLink showStoreLink />

      <div className="co-page">

        {/* Header */}
        <div className="co-header">
          <h1 className="co-title">Checkout</h1>

          {/* Step bar */}
          <div className="co-steps">
            <StepDot n={1} active={step === 1} done={step > 1} />
            <div className="co-step-line" style={{ background: step > 1 ? '#0fa381' : '#e8e5df' }} />
            <StepDot n={2} active={step === 2} done={step > 2} />
            <div className="co-step-line" style={{ background: step > 2 ? '#0fa381' : '#e8e5df' }} />
            <StepDot n={3} active={step === 3} done={false} />
          </div>
          <div className="co-step-labels">
            <span className={step === 1 ? 'active' : ''}>Delivery</span>
            <span className={step === 2 ? 'active' : ''}>Review</span>
            <span className={step === 3 ? 'active' : ''}>Confirmed</span>
          </div>
        </div>

        {/* STEP 1 — Address */}
        {step === 1 && (
          <div className="co-layout">
            <div className="co-card co-form-card">
              <div className="co-card-header">
                <div className="co-card-icon">📍</div>
                <div>
                  <div className="co-card-title">Delivery Address</div>
                  <div className="co-card-sub">Where should we deliver your products?</div>
                </div>
              </div>

              <div className="co-form">
                <div className="co-field-row">
                  <div className="co-field">
                    <label className="co-label">Full Name *</label>
                    <input
                      className="co-input"
                      placeholder="Rahul Sharma"
                      value={address.name}
                      onChange={e => setAddress({ ...address, name: e.target.value })}
                    />
                  </div>
                  <div className="co-field">
                    <label className="co-label">Phone Number *</label>
                    <input
                      className="co-input"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={address.phone}
                      onChange={e => setAddress({ ...address, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="co-field">
                  <label className="co-label">Email Address</label>
                  <input
                    className="co-input"
                    type="email"
                    placeholder="rahul@example.com (optional)"
                    value={address.email}
                    onChange={e => setAddress({ ...address, email: e.target.value })}
                  />
                </div>

                <div className="co-field">
                  <label className="co-label">Address</label>
                  <input
                    className="co-input"
                    placeholder="House No., Street, Area"
                    value={address.line1}
                    onChange={e => setAddress({ ...address, line1: e.target.value })}
                  />
                </div>

                <div className="co-field-row">
                  <div className="co-field">
                    <label className="co-label">City</label>
                    <input
                      className="co-input"
                      placeholder="Jaipur"
                      value={address.city}
                      onChange={e => setAddress({ ...address, city: e.target.value })}
                    />
                  </div>
                  <div className="co-field">
                    <label className="co-label">PIN Code</label>
                    <input
                      className="co-input"
                      placeholder="302001"
                      value={address.zip}
                      onChange={e => setAddress({ ...address, zip: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Trust row */}
              <div className="co-trust-row">
                {[
                  { icon: '🔒', text: 'Secure checkout' },
                  { icon: '🚚', text: 'Free delivery' },
                  { icon: '🔄', text: '7-day returns' },
                ].map((t, i) => (
                  <div key={i} className="co-trust-item">
                    <span>{t.icon}</span> {t.text}
                  </div>
                ))}
              </div>

              <button
                className="co-btn-primary co-btn-full"
                onClick={() => {
                  if (!address.name.trim() || !address.phone.trim()) {
                    alert('Please fill in your name and phone number.');
                    return;
                  }
                  setStep(2);
                }}
              >
                Continue to Review →
              </button>
            </div>

            <OrderSummary cart={cart} cartTotal={cartTotal} grandTotal={grandTotal} delivery={delivery} />
          </div>
        )}

        {/* STEP 2 — Review & Pay */}
        {step === 2 && (
          <div className="co-layout">
            <div>
              {/* Address summary */}
              <div className="co-card" style={{ marginBottom: 16 }}>
                <div className="co-card-header">
                  <div className="co-card-icon">📍</div>
                  <div style={{ flex: 1 }}>
                    <div className="co-card-title">Delivering to</div>
                    <div className="co-address-preview">
                      {address.name} · {address.phone}<br />
                      {address.line1 && `${address.line1}, `}{address.city} {address.zip}
                    </div>
                  </div>
                  <button className="co-edit-btn" onClick={() => setStep(1)}>Edit</button>
                </div>
              </div>

              {/* Items */}
              <div className="co-card" style={{ marginBottom: 16 }}>
                <div className="co-card-header" style={{ marginBottom: 16 }}>
                  <div className="co-card-icon">💊</div>
                  <div>
                    <div className="co-card-title">Order Items</div>
                    <div className="co-card-sub">{cart.length} item{cart.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="co-item-list">
                  {cart.map(item => (
                    <div key={item.id} className="co-item-row">
                      <div className="co-item-icon">
                        {(item as any).image
                          ? <img src={(item as any).image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                          : ((item as any).emoji || '💊')
                        }
                      </div>
                      <div className="co-item-info">
                        <div className="co-item-name">{item.name}</div>
                        {(item as any).category && (
                          <div className="co-item-cat">{(item as any).category}</div>
                        )}
                      </div>
                      <div className="co-item-qty">×{item.quantity}</div>
                      <div className="co-item-price">₹{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div className="co-card" style={{ marginBottom: 20 }}>
                <div className="co-card-header" style={{ marginBottom: 16 }}>
                  <div className="co-card-icon">💳</div>
                  <div>
                    <div className="co-card-title">Payment Method</div>
                    <div className="co-card-sub">Secured by Cashfree</div>
                  </div>
                </div>
                <div className="co-payment-methods">
                  {['UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Wallets'].map(m => (
                    <div key={m} className="co-pay-chip">{m}</div>
                  ))}
                </div>
                <div className="co-secure-note">
                  <span>🔒</span>
                  <span>Your payment is 100% secure. We never store your card details.</span>
                </div>
              </div>

              <div className="co-action-row">
                <button className="co-btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button
                  className="co-btn-primary co-btn-pay"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? (
                    <><span className="co-spinner" /> Processing…</>
                  ) : (
                    <>Pay ₹{grandTotal.toFixed(2)} →</>
                  )}
                </button>
              </div>
            </div>

            <OrderSummary cart={cart} cartTotal={cartTotal} grandTotal={grandTotal} delivery={delivery} />
          </div>
        )}

        {/* STEP 3 — Success */}
        {step === 3 && (
          <div className="co-success">
            <div className="co-success-anim">
              <div className="co-success-ring" />
              <div className="co-success-icon">🎉</div>
            </div>
            <h2 className="co-success-title">Order Confirmed!</h2>
            <p className="co-success-sub">
              Your products are on their way. Estimated delivery in <strong>1–3 business days</strong>.
            </p>
            <div className="co-order-id">
              Order ID: <strong>{orderId || `MED-${Math.random().toString(36).slice(2, 8).toUpperCase()}`}</strong>
            </div>
            <div className="co-success-address">
              📍 Delivering to {address.name}{address.city ? `, ${address.city}` : ''}
            </div>
            <div className="co-success-actions">
              <Link href="/orders" className="co-btn-secondary" style={{ textDecoration: 'none' }}>
                View Orders
              </Link>
              <Link href="/" className="co-btn-primary" style={{ textDecoration: 'none' }}>
                Back to Home
              </Link>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ── Order Summary sidebar ──────────────────────────────────────────────────────
function OrderSummary({
  cart, cartTotal, grandTotal, delivery,
}: {
  cart: any[]; cartTotal: number; grandTotal: number; delivery: number;
}) {
  return (
    <div className="co-summary-card">
      <div className="co-summary-title">Order Summary</div>

      <div className="co-summary-items">
        {cart.map(item => (
          <div key={item.id} className="co-summary-row">
            <span className="co-summary-name">
              {item.name}
              <span className="co-summary-qty"> ×{item.quantity}</span>
            </span>
            <span className="co-summary-price">₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="co-summary-divider" />

      <div className="co-summary-row">
        <span style={{ color: '#5a5f72' }}>Subtotal</span>
        <span>₹{cartTotal.toFixed(2)}</span>
      </div>
      <div className="co-summary-row" style={{ marginTop: 8 }}>
        <span style={{ color: '#5a5f72' }}>Delivery</span>
        <span style={{ color: '#0fa381', fontWeight: 600 }}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span>
      </div>

      <div className="co-summary-divider" />

      <div className="co-summary-total">
        <span>Total</span>
        <span>₹{grandTotal.toFixed(2)}</span>
      </div>

      <div className="co-summary-note">
        <span>🛡️</span>
        <span>100% genuine products. Easy 7-day returns.</span>
      </div>
    </div>
  );
}

// ── CSS remains the same (your existing CSS) ──
const css = `
  /* Your existing CSS - keep it exactly as you have it */
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');

  :root {
    --mint:       #0fa381;
    --mint-dark:  #0a7860;
    --mint-light: #e6f7f3;
    --cream:      #faf9f6;
    --stone:      #f0ede7;
    --ink:        #0f1117;
    --ink-soft:   #5a5f72;
    --ink-muted:  #9299aa;
    --dust:       #e8e5df;
    --white:      #ffffff;
    --red:        #d64040;
    --r:          14px;
    --shadow:     0 4px 24px rgba(15,163,129,0.10);
    --shadow-lg:  0 12px 40px rgba(0,0,0,0.10);
  }

  .co-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 24px 80px;
    font-family: 'Outfit', sans-serif;
    color: var(--ink);
    background: var(--cream);
    min-height: 100vh;
  }

  .co-header { text-align: center; margin-bottom: 40px; }
  .co-title {
    font-family: 'DM Serif Display', serif;
    font-size: 2.2rem; font-weight: 400;
    color: var(--ink); margin-bottom: 28px;
  }

  .co-steps {
    display: flex; align-items: center;
    justify-content: center; gap: 0;
    margin-bottom: 8px;
  }
  .co-step-line {
    width: 80px; height: 2px;
    border-radius: 2px; transition: background 0.4s ease;
  }
  .co-step-labels {
    display: flex; justify-content: center;
    gap: 92px; font-size: 0.78rem; font-weight: 500;
    color: var(--ink-muted);
  }
  .co-step-labels span.active { color: var(--ink); font-weight: 600; }

  .co-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 24px;
    align-items: start;
  }

  .co-card {
    background: var(--white);
    border-radius: 20px;
    border: 1px solid var(--dust);
    padding: 28px;
    box-shadow: var(--shadow);
  }
  .co-card-header {
    display: flex; align-items: flex-start;
    gap: 14px; margin-bottom: 24px;
  }
  .co-card-icon {
    width: 42px; height: 42px; border-radius: 12px;
    background: var(--mint-light);
    display: flex; align-items: center;
    justify-content: center; font-size: 1.2rem; flex-shrink: 0;
  }
  .co-card-title { font-size: 1rem; font-weight: 700; color: var(--ink); margin-bottom: 2px; }
  .co-card-sub   { font-size: 0.8rem; color: var(--ink-muted); }

  .co-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
  .co-field { display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .co-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .co-label {
    font-size: 0.76rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.8px;
    color: var(--ink-soft);
  }
  .co-input {
    border: 1.5px solid var(--dust);
    border-radius: 10px;
    padding: 12px 14px;
    font-family: 'Outfit', sans-serif;
    font-size: 0.92rem;
    color: var(--ink);
    background: var(--cream);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  .co-input:focus {
    border-color: var(--mint);
    box-shadow: 0 0 0 3px rgba(15,163,129,0.12);
    background: var(--white);
  }

  .co-trust-row {
    display: flex; gap: 20px; flex-wrap: wrap;
    margin-bottom: 24px;
    padding: 14px 16px;
    background: var(--stone);
    border-radius: 10px;
  }
  .co-trust-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.78rem; color: var(--ink-soft); font-weight: 500;
  }

  .co-btn-primary {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    background: var(--ink); color: var(--white);
    border: none; border-radius: 12px;
    padding: 15px 28px;
    font-family: 'Outfit', sans-serif;
    font-size: 0.96rem; font-weight: 700;
    cursor: pointer; transition: all 0.22s;
    text-decoration: none;
  }
  .co-btn-primary:hover:not(:disabled) { background: var(--mint); transform: translateY(-1px); }
  .co-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .co-btn-pay { background: var(--mint); min-width: 200px; }
  .co-btn-pay:hover:not(:disabled) { background: var(--mint-dark); }
  .co-btn-full { width: 100%; }

  .co-btn-secondary {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    background: var(--stone); color: var(--ink-soft);
    border: none; border-radius: 12px;
    padding: 14px 24px;
    font-family: 'Outfit', sans-serif;
    font-size: 0.92rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
    text-decoration: none;
  }
  .co-btn-secondary:hover { background: var(--dust); color: var(--ink); }

  .co-action-row { display: flex; gap: 12px; align-items: center; }

  .co-address-preview { font-size: 0.88rem; color: var(--ink-soft); line-height: 1.6; margin-top: 4px; }
  .co-edit-btn {
    background: var(--mint-light); color: var(--mint-dark);
    border: none; border-radius: 8px;
    padding: 6px 14px; font-size: 0.8rem; font-weight: 600;
    cursor: pointer; transition: all 0.18s;
    font-family: 'Outfit', sans-serif;
  }
  .co-edit-btn:hover { background: var(--mint); color: var(--white); }

  .co-item-list { display: flex; flex-direction: column; gap: 0; }
  .co-item-row {
    display: flex; align-items: center; gap: 14px;
    padding: 12px 0; border-bottom: 1px solid var(--stone);
  }
  .co-item-row:last-child { border-bottom: none; }
  .co-item-icon {
    width: 44px; height: 44px; border-radius: 10px;
    background: var(--mint-light); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.3rem; overflow: hidden;
  }
  .co-item-info { flex: 1; }
  .co-item-name { font-size: 0.88rem; font-weight: 600; color: var(--ink); margin-bottom: 2px; }
  .co-item-cat  { font-size: 0.72rem; color: var(--ink-muted); }
  .co-item-qty  { font-size: 0.82rem; color: var(--ink-muted); font-weight: 500; }
  .co-item-price { font-size: 0.92rem; font-weight: 700; color: var(--ink); min-width: 70px; text-align: right; }

  .co-payment-methods { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
  .co-pay-chip {
    padding: 6px 14px; border-radius: 50px;
    border: 1px solid var(--dust); background: var(--white);
    font-size: 0.78rem; font-weight: 600; color: var(--ink-soft);
  }
  .co-secure-note {
    display: flex; gap: 8px; align-items: center;
    background: var(--stone); border-radius: 10px;
    padding: 12px 14px; font-size: 0.78rem; color: var(--ink-soft);
  }

  .co-summary-card {
    background: var(--white);
    border-radius: 20px;
    border: 1px solid var(--dust);
    padding: 28px;
    box-shadow: var(--shadow);
    position: sticky;
    top: 80px;
  }
  .co-summary-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.2rem; font-weight: 400;
    color: var(--ink); margin-bottom: 20px;
  }
  .co-summary-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
  .co-summary-row { display: flex; justify-content: space-between; align-items: flex-start; font-size: 0.88rem; color: var(--ink); }
  .co-summary-name { flex: 1; line-height: 1.4; padding-right: 12px; }
  .co-summary-qty  { color: var(--ink-muted); font-weight: 400; }
  .co-summary-price { font-weight: 600; white-space: nowrap; }
  .co-summary-divider { height: 1px; background: var(--dust); margin: 16px 0; }
  .co-summary-total {
    display: flex; justify-content: space-between;
    font-size: 1.1rem; font-weight: 700; color: var(--ink);
    margin-bottom: 20px;
  }
  .co-summary-note {
    display: flex; gap: 8px; align-items: center;
    background: var(--stone); border-radius: 10px;
    padding: 12px 14px; font-size: 0.76rem; color: var(--ink-soft); line-height: 1.5;
  }

  .co-empty {
    text-align: center; padding: 80px 24px;
    max-width: 400px; margin: 0 auto;
  }
  .co-empty-icon { font-size: 4rem; margin-bottom: 20px; }
  .co-empty-title { font-family: 'DM Serif Display', serif; font-size: 1.8rem; color: var(--ink); margin-bottom: 10px; }
  .co-empty-sub { font-size: 0.92rem; color: var(--ink-muted); margin-bottom: 24px; }

  .co-success {
    text-align: center; padding: 48px 24px;
    max-width: 520px; margin: 0 auto;
  }
  .co-success-anim { position: relative; width: 100px; height: 100px; margin: 0 auto 28px; }
  .co-success-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 3px solid var(--mint);
    animation: coRingPulse 1.5s ease-out forwards;
  }
  @keyframes coRingPulse {
    0%   { transform: scale(0.6); opacity: 0; }
    60%  { transform: scale(1.15); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  .co-success-icon {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 3rem;
    animation: coIconIn 0.5s 0.4s ease both;
  }
  @keyframes coIconIn {
    from { transform: scale(0); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }
  .co-success-title {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem; font-weight: 400; color: var(--ink); margin-bottom: 12px;
  }
  .co-success-sub { font-size: 0.95rem; color: var(--ink-soft); margin-bottom: 24px; line-height: 1.6; }
  .co-order-id {
    display: inline-block;
    background: var(--mint-light); color: var(--mint-dark);
    border-radius: 10px; padding: 10px 24px;
    font-size: 0.9rem; font-weight: 600; margin-bottom: 12px;
  }
  .co-success-address {
    font-size: 0.84rem; color: var(--ink-muted); margin-bottom: 32px;
  }
  .co-success-actions { display: flex; gap: 12px; justify-content: center; }

  .co-spinner {
    display: inline-block;
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.4);
    border-top-color: #fff;
    border-radius: 50%;
    animation: coSpin 0.7s linear infinite;
  }
  @keyframes coSpin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .co-layout { grid-template-columns: 1fr; }
    .co-summary-card { position: static; order: -1; }
    .co-step-line { width: 48px; }
    .co-step-labels { gap: 56px; }
    .co-field-row { grid-template-columns: 1fr; }
    .co-page { padding: 20px 16px 60px; }
    .co-title { font-size: 1.7rem; }
    .co-action-row { flex-direction: column-reverse; }
    .co-btn-secondary, .co-btn-pay { width: 100%; }
    .co-success-actions { flex-direction: column; }
  }
`;