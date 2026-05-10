import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  shipping_address: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
}

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; bg: string; color: string; dot: string; icon: string }> = {
  paid:       { label: 'Paid',       bg: '#e8f5ee', color: '#1a6b3c', dot: '#0fa381', icon: '✓' },
  pending:    { label: 'Pending',    bg: '#fff8e1', color: '#8a6200', dot: '#f0b429', icon: '⏳' },
  shipped:    { label: 'Shipped',    bg: '#e8f0fe', color: '#1a47ab', dot: '#3b82f6', icon: '🚚' },
  delivered:  { label: 'Delivered',  bg: '#e8f5ee', color: '#1a6b3c', dot: '#0fa381', icon: '📦' },
  cancelled:  { label: 'Cancelled',  bg: '#fde8e8', color: '#8b1a1a', dot: '#d64040', icon: '✕' },
};

function getStatus(s: string) {
  return STATUS[s?.toLowerCase()] ?? { label: s, bg: '#f0ede7', color: '#5a5f72', dot: '#9299aa', icon: '•' };
}

// ── Inline CSS ─────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  .op-wrap {
    font-family: 'Outfit', sans-serif;
    background: #faf9f6;
    min-height: 100vh;
    color: #0f1117;
  }

  /* ── Top nav strip ── */
  .op-topnav {
    background: rgba(250,249,246,0.92);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid #e8e5df;
    padding: 0 40px;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .op-logo {
    font-family: 'DM Serif Display', serif;
    font-size: 1.5rem;
    color: #0fa381;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .op-logo span { color: #0f1117; }
  .op-nav-links { display: flex; align-items: center; gap: 12px; }
  .op-nav-link {
    font-size: 0.85rem;
    font-weight: 500;
    color: #5a5f72;
    text-decoration: none;
    padding: 7px 16px;
    border-radius: 8px;
    transition: all 0.18s;
  }
  .op-nav-link:hover { background: #e6f7f3; color: #0fa381; }
  .op-nav-link.primary {
    background: #0f1117;
    color: #fff;
  }
  .op-nav-link.primary:hover { background: #0fa381; }

  /* ── Hero band ── */
  .op-hero {
    background: linear-gradient(135deg, #0f1117 0%, #1a2a1e 100%);
    padding: 48px 40px 52px;
    position: relative;
    overflow: hidden;
  }
  .op-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(15,163,129,0.08) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }
  .op-hero-inner {
    max-width: 900px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }
  .op-hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(15,163,129,0.15);
    border: 1px solid rgba(15,163,129,0.3);
    color: #4ee8a8;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 50px;
    margin-bottom: 18px;
  }
  .op-hero-tag-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #0fa381;
  }
  .op-hero-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(1.9rem, 4vw, 2.8rem);
    font-weight: 400;
    color: #fff;
    line-height: 1.15;
    margin-bottom: 10px;
  }
  .op-hero-title em { font-style: italic; color: #4ee8a8; }
  .op-hero-sub {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.5);
    font-weight: 300;
  }

  /* ── Content ── */
  .op-content {
    max-width: 900px;
    margin: 0 auto;
    padding: 36px 40px 80px;
  }

  /* ── Summary bar ── */
  .op-summary-bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 32px;
  }
  .op-stat {
    background: #fff;
    border: 1px solid #e8e5df;
    border-radius: 14px;
    padding: 18px 22px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .op-stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #e6f7f3;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }
  .op-stat-val {
    font-family: 'DM Serif Display', serif;
    font-size: 1.5rem;
    font-weight: 400;
    color: #0f1117;
    line-height: 1;
  }
  .op-stat-label {
    font-size: 0.72rem;
    color: #9299aa;
    font-weight: 500;
    margin-top: 3px;
  }

  /* ── Section header ── */
  .op-sec-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .op-sec-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.4rem;
    font-weight: 400;
    color: #0f1117;
  }
  .op-count-pill {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    font-weight: 500;
    background: #e8e5df;
    color: #5a5f72;
    padding: 4px 12px;
    border-radius: 50px;
  }

  /* ── Order cards ── */
  .op-card {
    background: #fff;
    border: 1px solid #e8e5df;
    border-radius: 18px;
    overflow: hidden;
    margin-bottom: 14px;
    transition: all 0.22s;
  }
  .op-card:hover {
    border-color: #b8d8c8;
    box-shadow: 0 6px 28px rgba(15,163,129,0.09);
    transform: translateY(-1px);
  }

  /* Card top row */
  .op-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f4f1ec;
    gap: 16px;
    flex-wrap: wrap;
  }
  .op-order-id-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .op-order-num {
    font-family: 'DM Mono', monospace;
    font-size: 0.92rem;
    font-weight: 500;
    color: #0f1117;
  }
  .op-order-date {
    font-size: 0.78rem;
    color: #9299aa;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* Status badge */
  .op-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    border-radius: 50px;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.3px;
  }
  .op-status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  /* Card body */
  .op-card-body {
    padding: 16px 24px 20px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 16px;
    align-items: end;
  }
  .op-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 24px;
  }
  .op-info-item {}
  .op-info-label {
    font-size: 0.68rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9299aa;
    margin-bottom: 3px;
  }
  .op-info-val {
    font-size: 0.88rem;
    color: #0f1117;
    font-weight: 500;
    line-height: 1.4;
  }
  .op-info-val.price {
    font-family: 'DM Serif Display', serif;
    font-size: 1.15rem;
    color: #0fa381;
  }

  /* Card action */
  .op-card-action {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }
  .op-track-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #0f1117;
    color: #fff;
    border: none;
    border-radius: 9px;
    padding: 9px 18px;
    font-family: 'Outfit', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.18s;
    text-decoration: none;
    white-space: nowrap;
  }
  .op-track-btn:hover { background: #0fa381; }
  .op-reorder-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    color: #5a5f72;
    border: 1px solid #e8e5df;
    border-radius: 9px;
    padding: 8px 16px;
    font-family: 'Outfit', sans-serif;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s;
    white-space: nowrap;
  }
  .op-reorder-btn:hover { border-color: #0fa381; color: #0fa381; }

  /* ── Empty state ── */
  .op-empty {
    text-align: center;
    padding: 64px 24px;
    background: #fff;
    border: 1.5px dashed #e8e5df;
    border-radius: 20px;
  }
  .op-empty-icon { font-size: 4rem; margin-bottom: 20px; }
  .op-empty-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.7rem;
    color: #0f1117;
    margin-bottom: 10px;
  }
  .op-empty-sub {
    font-size: 0.9rem;
    color: #9299aa;
    margin-bottom: 28px;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;
  }
  .op-shop-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #0f1117;
    color: #fff;
    border-radius: 12px;
    padding: 13px 28px;
    font-size: 0.92rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s;
  }
  .op-shop-btn:hover { background: #0fa381; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,163,129,0.25); }

  /* ── Not signed in ── */
  .op-auth {
    text-align: center;
    padding: 80px 24px;
    max-width: 400px;
    margin: 0 auto;
    font-family: 'Outfit', sans-serif;
  }
  .op-auth-icon { font-size: 4rem; margin-bottom: 24px; }
  .op-auth-title { font-family: 'DM Serif Display', serif; font-size: 1.9rem; color: #0f1117; margin-bottom: 10px; }
  .op-auth-sub { font-size: 0.9rem; color: #9299aa; margin-bottom: 28px; line-height: 1.6; }
  .op-auth-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #0fa381;
    color: #fff;
    border-radius: 12px;
    padding: 13px 32px;
    font-size: 0.92rem;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.2s;
  }
  .op-auth-btn:hover { background: #0a7860; }

  /* ── Error ── */
  .op-error {
    background: #fff0f0;
    border: 1px solid rgba(214,64,64,0.25);
    border-radius: 14px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 0.9rem;
    color: #8b1a1a;
    margin-top: 24px;
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .op-hero { padding: 36px 20px 40px; }
    .op-content { padding: 24px 16px 60px; }
    .op-topnav { padding: 0 16px; }
    .op-summary-bar { grid-template-columns: 1fr; }
    .op-info-grid { grid-template-columns: 1fr; }
    .op-card-body { grid-template-columns: 1fr; }
    .op-card-action { align-items: flex-start; flex-direction: row; flex-wrap: wrap; }
    .op-card-top { flex-direction: column; align-items: flex-start; }
  }
`;

export default async function OrdersPage() {
  const { userId } = await auth();

  // ── Not signed in ──
  if (!userId) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="op-wrap">
          <nav className="op-topnav">
            <Link href="/" className="op-logo">✚ <span>Medi</span>Ora</Link>
            <div className="op-nav-links">
              <Link href="/" className="op-nav-link">← Home</Link>
              <Link href="/store" className="op-nav-link primary">Browse Store</Link>
            </div>
          </nav>
          <div className="op-auth">
            <div className="op-auth-icon">🔐</div>
            <h1 className="op-auth-title">Sign in to view orders</h1>
            <p className="op-auth-sub">Your order history is private and secure. Please sign in to access it.</p>
            <Link href="/" className="op-auth-btn">← Back to Home</Link>
          </div>
        </div>
      </>
    );
  }

  // ── Fetch orders ──
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // ── Stats ──
  const totalOrders  = orders?.length ?? 0;
  const totalSpent   = orders?.reduce((s, o) => s + (o.total ?? 0), 0) ?? 0;
  const paidOrders   = orders?.filter(o => o.status === 'paid' || o.status === 'delivered').length ?? 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="op-wrap">

        {/* ── Top nav ── */}
        <nav className="op-topnav">
          <Link href="/" className="op-logo">✚ <span>Medi</span>Ora</Link>
          <div className="op-nav-links">
            <Link href="/" className="op-nav-link">Home</Link>
            <Link href="/store" className="op-nav-link">Store</Link>
            <Link href="/store" className="op-nav-link primary">+ New Order</Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <div className="op-hero">
          <div className="op-hero-inner">
            <div className="op-hero-tag">
              <div className="op-hero-tag-dot" />
              Order History
            </div>
            <h1 className="op-hero-title">
              Your <em>orders,</em><br />all in one place.
            </h1>
            <p className="op-hero-sub">
              Track deliveries, review purchases, and reorder your favourites.
            </p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="op-content">

          {/* ── Error ── */}
          {error && (
            <div className="op-error">
              <span style={{ fontSize: '1.4rem' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Could not load orders</div>
                <div style={{ opacity: 0.75 }}>Please refresh the page or try again later.</div>
              </div>
            </div>
          )}

          {!error && (
            <>
              {/* ── Stats bar ── */}
              {totalOrders > 0 && (
                <div className="op-summary-bar">
                  <div className="op-stat">
                    <div className="op-stat-icon">📦</div>
                    <div>
                      <div className="op-stat-val">{totalOrders}</div>
                      <div className="op-stat-label">Total Orders</div>
                    </div>
                  </div>
                  <div className="op-stat">
                    <div className="op-stat-icon">💰</div>
                    <div>
                      <div className="op-stat-val">₹{(totalSpent / 100).toFixed(0)}</div>
                      <div className="op-stat-label">Total Spent</div>
                    </div>
                  </div>
                  <div className="op-stat">
                    <div className="op-stat-icon">✅</div>
                    <div>
                      <div className="op-stat-val">{paidOrders}</div>
                      <div className="op-stat-label">Completed</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Empty state ── */}
              {(!orders || orders.length === 0) && (
                <div className="op-empty">
                  <div className="op-empty-icon">🛍️</div>
                  <h2 className="op-empty-title">No orders yet</h2>
                  <p className="op-empty-sub">
                    Looks like you haven't placed any orders. Browse our products and get started!
                  </p>
                  <Link href="/store" className="op-shop-btn">
                    Browse products →
                  </Link>
                </div>
              )}

              {/* ── Order list ── */}
              {orders && orders.length > 0 && (
                <>
                  <div className="op-sec-head">
                    <h2 className="op-sec-title">Recent Orders</h2>
                    <span className="op-count-pill">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div>
                    {orders.map((order: Order) => {
                      const st = getStatus(order.status);
                      const date = new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      });
                      return (
                        <div key={order.id} className="op-card">

                          {/* Top row */}
                          <div className="op-card-top">
                            <div className="op-order-id-row">
                              <span className="op-order-num">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className="op-order-date">
                                🗓 {date}
                              </span>
                            </div>
                            <div
                              className="op-status"
                              style={{ background: st.bg, color: st.color }}
                            >
                              <div className="op-status-dot" style={{ background: st.dot }} />
                              {st.icon} {st.label}
                            </div>
                          </div>

                          {/* Body */}
                          <div className="op-card-body">
                            <div className="op-info-grid">
                              <div className="op-info-item">
                                <div className="op-info-label">Amount</div>
                                <div className="op-info-val price">
                                  ₹{(order.total / 100).toFixed(2)}
                                </div>
                              </div>
                              <div className="op-info-item">
                                <div className="op-info-label">Customer</div>
                                <div className="op-info-val">{order.customer_name || '—'}</div>
                              </div>
                              {order.shipping_address && (
                                <div className="op-info-item" style={{ gridColumn: '1 / -1' }}>
                                  <div className="op-info-label">Delivery Address</div>
                                  <div className="op-info-val">📍 {order.shipping_address}</div>
                                </div>
                              )}
                              {order.customer_phone && (
                                <div className="op-info-item">
                                  <div className="op-info-label">Phone</div>
                                  <div className="op-info-val">{order.customer_phone}</div>
                                </div>
                              )}
                            </div>

                            <div className="op-card-action">
                              <a href={`/orders/${order.id}`} className="op-track-btn">
                                Track Order →
                              </a>
                              <Link href="/store" className="op-reorder-btn">
                                🔄 Reorder
                              </Link>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}