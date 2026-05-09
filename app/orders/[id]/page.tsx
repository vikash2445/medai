import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

type Props = {
  params: Promise<{ id: string }>;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const steps = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

const STEP_META: Record<string, { icon: string; label: string; desc: string }> = {
  pending:          { icon: '🕐', label: 'Order Placed',    desc: 'Awaiting confirmation' },
  paid:             { icon: '✅', label: 'Payment Done',    desc: 'Payment confirmed' },
  processing:       { icon: '⚙️', label: 'Processing',     desc: 'Preparing your order' },
  shipped:          { icon: '📦', label: 'Shipped',         desc: 'On the way to you' },
  out_for_delivery: { icon: '🚚', label: 'Out for Delivery',desc: 'Almost there!' },
  delivered:        { icon: '🎉', label: 'Delivered',       desc: 'Enjoy your medicines' },
};

function getStepIndex(status: string) {
  return steps.indexOf(status);
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --mint:       #0fa381;
    --mint-dark:  #0a7860;
    --mint-light: #e6f7f3;
    --cream:      #faf9f6;
    --stone:      #f0ede7;
    --dust:       #e8e5df;
    --ink:        #0f1117;
    --ink-soft:   #5a5f72;
    --ink-muted:  #9299aa;
    --white:      #ffffff;
    --red:        #d64040;
    --gold:       #f0b429;
  }

  .ot-page {
    font-family: 'Outfit', sans-serif;
    background: var(--cream);
    min-height: 100vh;
    color: var(--ink);
  }

  /* ── NAV ── */
  .ot-nav {
    background: rgba(250,249,246,0.93);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--dust);
    position: sticky; top: 0; z-index: 50;
    padding: 0 40px; height: 62px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .ot-nav-logo {
    font-family: 'DM Serif Display', serif;
    font-size: 1.45rem; color: var(--mint);
    text-decoration: none; display: flex; align-items: center; gap: 8px;
  }
  .ot-nav-logo span { color: var(--ink); }
  .ot-nav-links { display: flex; align-items: center; gap: 10px; }
  .ot-nav-link {
    font-size: 0.83rem; font-weight: 500; color: var(--ink-soft);
    text-decoration: none; padding: 7px 16px; border-radius: 8px; transition: all 0.18s;
  }
  .ot-nav-link:hover { background: var(--mint-light); color: var(--mint); }
  .ot-nav-link.dark { background: var(--ink); color: var(--white); }
  .ot-nav-link.dark:hover { background: var(--mint); }

  /* ── HERO BAND ── */
  .ot-hero {
    background: linear-gradient(140deg, #0a1a0f 0%, #0f2a18 60%, #0d1f14 100%);
    padding: 44px 40px 52px;
    position: relative; overflow: hidden;
  }
  .ot-hero::before {
    content: '';
    position: absolute; inset: 0;
    background-image: radial-gradient(circle, rgba(15,163,129,0.10) 1px, transparent 1px);
    background-size: 26px 26px;
    pointer-events: none;
  }
  .ot-hero-glow {
    position: absolute; width: 460px; height: 460px; border-radius: 50%;
    background: radial-gradient(circle, rgba(15,163,129,0.14) 0%, transparent 70%);
    top: -140px; right: -80px; pointer-events: none;
  }
  .ot-hero-inner {
    max-width: 1100px; margin: 0 auto;
    position: relative; z-index: 1;
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 28px; flex-wrap: wrap;
  }
  .ot-hero-tag {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(15,163,129,0.15);
    border: 1px solid rgba(15,163,129,0.3);
    color: #4ee8a8;
    font-size: 0.7rem; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;
    padding: 5px 14px; border-radius: 50px; margin-bottom: 16px; width: fit-content;
  }
  .ot-hero-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--mint); }
  .ot-hero-title {
    font-family: 'DM Serif Display', serif;
    font-size: clamp(1.8rem, 3.5vw, 2.6rem);
    color: #fff; line-height: 1.15; margin-bottom: 8px;
  }
  .ot-hero-title em { font-style: italic; color: #4ee8a8; }
  .ot-hero-id {
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem; color: rgba(255,255,255,0.4);
    word-break: break-all;
  }
  .ot-hero-amount {
    background: rgba(15,163,129,0.15);
    border: 1px solid rgba(15,163,129,0.25);
    border-radius: 16px; padding: 18px 28px;
    text-align: right; flex-shrink: 0;
  }
  .ot-hero-amount-label { font-size: 0.72rem; color: rgba(255,255,255,0.45); margin-bottom: 6px; }
  .ot-hero-amount-val {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem; color: #4ee8a8; line-height: 1;
  }

  /* ── CONTENT ── */
  .ot-content { max-width: 1100px; margin: 0 auto; padding: 32px 40px 80px; }
  .ot-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }

  /* ── CARDS ── */
  .ot-card {
    background: var(--white);
    border: 1px solid var(--dust);
    border-radius: 20px;
    padding: 32px;
    box-shadow: 0 2px 16px rgba(0,0,0,0.05);
  }
  .ot-card-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.3rem; color: var(--ink);
    margin-bottom: 24px;
    display: flex; align-items: center; gap: 10px;
  }
  .ot-card-title-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--mint-light);
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; flex-shrink: 0;
  }

  /* ── TIMELINE ── */
  .ot-timeline {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0;
    position: relative;
  }
  .ot-step {
    display: flex; flex-direction: column; align-items: center;
    text-align: center; position: relative;
  }
  /* Connector line */
  .ot-step:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 22px;
    left: 50%;
    width: 100%;
    height: 2px;
    z-index: 0;
    transition: background 0.4s ease;
  }
  .ot-step.done:not(:last-child)::after  { background: var(--mint); }
  .ot-step.next:not(:last-child)::after  { background: var(--dust); }
  .ot-step.idle:not(:last-child)::after  { background: var(--dust); }

  .ot-step-circle {
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.1rem; font-weight: 700;
    position: relative; z-index: 1;
    transition: all 0.3s ease;
    border: 3px solid transparent;
    flex-shrink: 0;
  }
  .ot-step.done  .ot-step-circle { background: var(--mint);       color: #fff; border-color: var(--mint); }
  .ot-step.active .ot-step-circle {
    background: var(--ink);  color: #fff; border-color: var(--ink);
    box-shadow: 0 0 0 5px rgba(15,163,129,0.18);
    animation: otPulse 2s ease-in-out infinite;
  }
  .ot-step.idle  .ot-step-circle { background: var(--stone); color: var(--ink-muted); border-color: var(--dust); }

  @keyframes otPulse {
    0%, 100% { box-shadow: 0 0 0 4px rgba(15,163,129,0.15); }
    50%       { box-shadow: 0 0 0 8px rgba(15,163,129,0.08); }
  }

  .ot-step-body { margin-top: 12px; padding: 0 4px; }
  .ot-step-label {
    font-size: 0.74rem; font-weight: 700;
    color: var(--ink); line-height: 1.3; margin-bottom: 3px;
  }
  .ot-step.idle .ot-step-label { color: var(--ink-muted); }
  .ot-step-sub {
    font-size: 0.65rem; color: var(--ink-muted);
    line-height: 1.3;
  }
  .ot-step.done  .ot-step-sub { color: var(--mint); }
  .ot-step.active .ot-step-sub { color: var(--ink-soft); }

  /* ── LIVE STATUS ── */
  .ot-live {
    background: linear-gradient(135deg, #e8f5ee 0%, #f0fbf6 100%);
    border: 1px solid rgba(15,163,129,0.2);
    border-radius: 14px; padding: 20px 24px;
    display: flex; align-items: center; gap: 18px;
  }
  .ot-live-icon {
    width: 54px; height: 54px; border-radius: 50%;
    background: var(--mint); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; flex-shrink: 0;
    animation: otBounce 2s ease-in-out infinite;
  }
  @keyframes otBounce {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-4px); }
  }
  .ot-live-title { font-size: 1rem; font-weight: 700; color: var(--mint-dark); margin-bottom: 3px; }
  .ot-live-sub { font-size: 0.85rem; color: var(--ink-soft); }
  .ot-live-pulse {
    margin-left: auto; flex-shrink: 0;
    display: flex; align-items: center; gap: 6px;
    font-size: 0.72rem; font-weight: 600; color: var(--mint-dark);
  }
  .ot-live-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--mint);
    animation: otBlink 1.2s ease-in-out infinite;
  }
  @keyframes otBlink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }

  /* ── TWO-COL GRID ── */
  .ot-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* ── INFO ROWS ── */
  .ot-info-row {
    display: flex; flex-direction: column; gap: 2px;
    padding: 14px 0; border-bottom: 1px solid var(--stone);
  }
  .ot-info-row:last-child { border-bottom: none; }
  .ot-info-label {
    font-size: 0.68rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 1px; color: var(--ink-muted);
  }
  .ot-info-val {
    font-size: 0.95rem; font-weight: 600; color: var(--ink);
    word-break: break-word; line-height: 1.4;
  }
  .ot-info-val.mono {
    font-family: 'DM Mono', monospace;
    font-size: 0.88rem; font-weight: 400;
  }

  /* ── ADDRESS ── */
  .ot-address {
    display: flex; gap: 14px; align-items: flex-start;
    background: var(--stone); border-radius: 12px;
    padding: 16px 18px;
  }
  .ot-address-pin { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }
  .ot-address-text {
    font-size: 0.92rem; color: var(--ink-soft);
    line-height: 1.7; font-weight: 400;
  }

  /* ── MAP ── */
  .ot-map-wrap {
    border-radius: 14px; overflow: hidden;
    border: 1px solid var(--dust);
    line-height: 0;
  }

  /* ── ACTIONS ── */
  .ot-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
  .ot-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 12px 24px; border-radius: 11px;
    font-family: 'Outfit', sans-serif;
    font-size: 0.88rem; font-weight: 600;
    text-decoration: none; transition: all 0.2s; cursor: pointer; border: none;
  }
  .ot-btn-dark { background: var(--ink); color: #fff; }
  .ot-btn-dark:hover { background: #1f2937; transform: translateY(-1px); }
  .ot-btn-green { background: var(--mint); color: #fff; }
  .ot-btn-green:hover { background: var(--mint-dark); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,163,129,0.28); }

  /* ── NOT FOUND ── */
  .ot-notfound {
    text-align: center; padding: 80px 24px;
    font-family: 'Outfit', sans-serif;
  }
  .ot-notfound-icon { font-size: 4rem; margin-bottom: 20px; }
  .ot-notfound-title {
    font-family: 'DM Serif Display', serif;
    font-size: 2rem; color: var(--ink); margin-bottom: 10px;
  }
  .ot-notfound-sub { font-size: 0.9rem; color: var(--ink-muted); margin-bottom: 28px; }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .ot-nav { padding: 0 20px; }
    .ot-hero { padding: 36px 20px 44px; }
    .ot-content { padding: 24px 20px 64px; }
    .ot-two-col { grid-template-columns: 1fr; }
    .ot-timeline { grid-template-columns: repeat(3, 1fr); row-gap: 32px; }
    .ot-step:not(:last-child)::after { display: none; }
    .ot-hero-inner { flex-direction: column; align-items: flex-start; }
    .ot-hero-amount { text-align: left; width: 100%; }
  }
  @media (max-width: 540px) {
    .ot-timeline { grid-template-columns: repeat(2, 1fr); }
    .ot-card { padding: 22px 18px; }
    .ot-actions { flex-direction: column; }
    .ot-btn { justify-content: center; }
    .ot-live { flex-wrap: wrap; }
    .ot-live-pulse { margin-left: 0; }
  }
`;

export default async function OrderTrackingPage({ params }: Props) {
  const { id } = await params;

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  /* ── Not found ── */
  if (!order) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="ot-page">
          <nav className="ot-nav">
            <Link href="/" className="ot-nav-logo">✚ <span>Medi</span>Ora</Link>
          </nav>
          <div className="ot-notfound">
            <div className="ot-notfound-icon">🔍</div>
            <h1 className="ot-notfound-title">Order not found</h1>
            <p className="ot-notfound-sub">We couldn't find this order. It may have been removed or the link is incorrect.</p>
            <Link href="/orders" className="ot-btn ot-btn-dark">← Back to Orders</Link>
          </div>
        </div>
      </>
    );
  }

  const currentStep = getStepIndex(order.status);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ot-page">

        {/* ── NAV ── */}
        <nav className="ot-nav">
          <Link href="/" className="ot-nav-logo">✚ <span>Medi</span>Ora</Link>
          <div className="ot-nav-links">
            <Link href="/orders" className="ot-nav-link">My Orders</Link>
            <Link href="/store"  className="ot-nav-link dark">Shop Again</Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div className="ot-hero">
          <div className="ot-hero-glow" />
          <div className="ot-hero-inner">
            <div>
              <div className="ot-hero-tag">
                <div className="ot-hero-tag-dot" />
                Live Order Tracking
              </div>
              <h1 className="ot-hero-title">
                Track your <em>delivery</em>
              </h1>
              <div className="ot-hero-id">Order ID: {order.id}</div>
            </div>
            <div className="ot-hero-amount">
              <div className="ot-hero-amount-label">Order Total</div>
              <div className="ot-hero-amount-val">₹{(order.total / 100).toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="ot-content">
          <div className="ot-grid">

            {/* ── TIMELINE ── */}
            <div className="ot-card">
              <div className="ot-card-title">
                <div className="ot-card-title-icon">🗺️</div>
                Delivery Progress
              </div>
              <div className="ot-timeline">
                {steps.map((step, index) => {
                  const meta = STEP_META[step] ?? { icon: '•', label: step.replaceAll('_', ' '), desc: '' };
                  const done   = index < currentStep;
                  const active = index === currentStep;
                  const cls    = done ? 'done' : active ? 'active' : 'idle';
                  return (
                    <div key={step} className={`ot-step ${cls}`}>
                      <div className="ot-step-circle">
                        {done ? '✓' : meta.icon}
                      </div>
                      <div className="ot-step-body">
                        <div className="ot-step-label">{meta.label}</div>
                        <div className="ot-step-sub">
                          {done ? 'Completed' : active ? 'In progress' : 'Upcoming'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── LIVE STATUS ── */}
            <div className="ot-card">
              <div className="ot-card-title">
                <div className="ot-card-title-icon">🚚</div>
                Live Delivery Status
              </div>
              <div className="ot-live">
                <div className="ot-live-icon">🚚</div>
                <div>
                  <div className="ot-live-title">Your order is on the way</div>
                  <div className="ot-live-sub">Estimated delivery in 25–35 minutes</div>
                </div>
                <div className="ot-live-pulse">
                  <div className="ot-live-dot" />
                  LIVE
                </div>
              </div>
            </div>

            {/* ── CUSTOMER + ADDRESS ── */}
            <div className="ot-two-col">

              {/* Customer Details */}
              <div className="ot-card">
                <div className="ot-card-title">
                  <div className="ot-card-title-icon">👤</div>
                  Customer Details
                </div>
                <div>
                  <div className="ot-info-row">
                    <div className="ot-info-label">Full Name</div>
                    <div className="ot-info-val">{order.customer_name}</div>
                  </div>
                  <div className="ot-info-row">
                    <div className="ot-info-label">Phone</div>
                    <div className="ot-info-val mono">{order.customer_phone}</div>
                  </div>
                  {order.customer_email && (
                    <div className="ot-info-row">
                      <div className="ot-info-label">Email</div>
                      <div className="ot-info-val mono">{order.customer_email}</div>
                    </div>
                  )}
                  <div className="ot-info-row">
                    <div className="ot-info-label">Order Status</div>
                    <div className="ot-info-val" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: currentStep >= 0 ? '#e8f5ee' : '#f0ede7',
                      color: currentStep >= 0 ? '#0a7860' : '#5a5f72',
                      padding: '4px 12px', borderRadius: 50,
                      fontSize: '0.8rem', fontWeight: 700,
                    }}>
                      {STEP_META[order.status]?.icon ?? '•'}&nbsp;
                      {order.status.replaceAll('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="ot-card">
                <div className="ot-card-title">
                  <div className="ot-card-title-icon">📍</div>
                  Delivery Address
                </div>
                <div className="ot-address">
                  <div className="ot-address-pin">📍</div>
                  <div className="ot-address-text">{order.shipping_address}</div>
                </div>
              </div>
            </div>

            {/* ── MAP ── */}
            <div className="ot-card">
              <div className="ot-card-title">
                <div className="ot-card-title-icon">🗺️</div>
                Delivery Location
              </div>
              <div className="ot-map-wrap">
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(order.shipping_address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="380"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                />
              </div>
              <div className="ot-actions">
                <Link href="/orders" className="ot-btn ot-btn-dark">← Back to Orders</Link>
                <Link href="/store"  className="ot-btn ot-btn-green">🛍️ Shop Again</Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}