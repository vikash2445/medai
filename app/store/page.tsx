'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import { useCart } from '../context/CartContext';
import StoreGrid from '../components/StoreGrid';
import Navbar from '../components/Navbar';

/* ── Static data for categories, brands, etc. (unchanged) ── */
const CATEGORIES = [
  { name: 'Skincare',             emoji: '🧴', bg: '#fde8d8' },
  { name: 'Health Supplements',  emoji: '💊', bg: '#e8f4e8' },
  { name: 'Immunity Boosters',   emoji: '🍋', bg: '#fef9e7' },
  { name: 'Baby Care',           emoji: '🍼', bg: '#e8f0fe' },
  { name: 'Personal Care',       emoji: '🪥', bg: '#e8f5e9' },
  { name: 'Fitness',             emoji: '🏋️', bg: '#f3e8ff' },
];

const BRANDS = [
  { name: 'Himalaya',      color: '#2e7d32' },
  { name: 'Dabur',         color: '#1b5e20' },
  { name: 'Patanjali',     color: '#33691e' },
  { name: 'Organic India', color: '#558b2f' },
  { name: 'Nutrabay',      color: '#00695c' },
  { name: 'Mamaearth',     color: '#2e7d32' },
  { name: 'Zandu',         color: '#e65100' },
];

const NAV_LINKS = ['Home', 'Medicines', 'Lab Tests', 'Healthcare Devices', 'Personal Care', 'Health Articles'];
const TRUST_ITEMS = [
  { icon: '🛡️', title: '100% Genuine',       sub: 'Medicines' },
  { icon: '🚚', title: 'Fast Delivery',       sub: 'Across India' },
  { icon: '🔄', title: 'Easy Returns',        sub: 'No questions asked' },
  { icon: '🔒', title: 'Secure Payment',      sub: '100% Safe & Secure' },
];

export default function StorePage() {
  const { isSignedIn } = useAuth();
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState('Medicines'); // default to show products

  // You can use this to filter products by category if needed
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const resetAll = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap');

        .sp-root { font-family:'Plus Jakarta Sans',sans-serif; background:#f4f7f4; min-height:100vh; }

        /* ── TOP HEADER ───────────────────── */
        .sp-header {
          background:#fff; padding:12px 24px;
          display:flex; align-items:center; gap:16px;
          box-shadow:0 2px 8px rgba(0,0,0,0.06); position:sticky; top:0; z-index:100;
        }
        .sp-logo { display:flex; align-items:center; gap:10px; text-decoration:none; flex-shrink:0; cursor:pointer; }
        .sp-logo-icon {
          width:40px; height:40px; background:#1a6b3c; border-radius:10px;
          display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.2rem;
        }
        .sp-logo-text { line-height:1; }
        .sp-logo-name { font-size:1.25rem; font-weight:800; color:#1a6b3c; }
        .sp-logo-tag  { font-size:0.65rem; color:#666; font-weight:500; }

        .sp-search {
          flex:1; display:flex; align-items:center;
          border:1.5px solid #e0e0e0; border-radius:10px;
          overflow:hidden; background:#f8f8f8; max-width:560px;
        }
        .sp-search input {
          flex:1; border:none; background:transparent; padding:10px 16px;
          font-size:0.9rem; font-family:'Plus Jakarta Sans',sans-serif; outline:none; color:#333;
        }
        .sp-search input::placeholder { color:#aaa; }
        .sp-search-btn {
          background:#1a6b3c; border:none; padding:10px 18px;
          cursor:pointer; color:#fff; font-size:1rem;
          display:flex; align-items:center;
        }

        .sp-header-actions { display:flex; align-items:center; gap:20px; margin-left:auto; }
        .sp-header-action  { display:flex; flex-direction:column; align-items:center; gap:2px; text-decoration:none; color:#333; cursor:pointer; }
        .sp-header-action-icon { font-size:1.3rem; position:relative; }
        .sp-header-action-label { font-size:0.7rem; color:#555; font-weight:600; }
        .sp-cart-count {
          position:absolute; top:-6px; right:-8px;
          background:#1a6b3c; color:#fff; width:18px; height:18px;
          border-radius:50%; font-size:0.6rem; font-weight:700;
          display:flex; align-items:center; justify-content:center;
        }

        /* ── CATEGORY NAV ─────────────────── */
        .sp-catnav {
          background:#1a6b3c; display:flex; align-items:center;
          padding:0 24px; gap:0; overflow-x:auto; scrollbar-width:none;
        }
        .sp-catnav::-webkit-scrollbar { display:none; }
        .sp-catnav-all {
          display:flex; align-items:center; gap:8px; white-space:nowrap;
          background:#145230; color:#fff; border:none;
          padding:12px 20px; font-family:'Plus Jakarta Sans',sans-serif;
          font-size:0.88rem; font-weight:700; cursor:pointer;
          border-right:1px solid rgba(255,255,255,0.15); flex-shrink:0;
        }
        .sp-navlink {
          padding:12px 18px; color:rgba(255,255,255,0.85);
          font-size:0.88rem; font-weight:500; cursor:pointer;
          white-space:nowrap; text-decoration:none; border-bottom:2px solid transparent;
          transition:all 0.2s; flex-shrink:0;
        }
        .sp-navlink:hover { color:#fff; }
        .sp-navlink.active { color:#fff; border-bottom-color:#fff; font-weight:700; }

        /* ── HERO BANNER ──────────────────── */
        .sp-hero {
          background:linear-gradient(135deg, #e8f5ec 0%, #f0faf3 50%, #e0f2e9 100%);
          margin:16px; border-radius:16px; padding:40px 48px;
          display:flex; align-items:center; justify-content:space-between;
          min-height:240px; overflow:hidden; position:relative;
        }
        .sp-hero::after {
          content:''; position:absolute; top:-40px; right:200px;
          width:180px; height:180px; border-radius:50%;
          background:rgba(26,107,60,0.06); pointer-events:none;
        }
        .sp-hero-text { flex:1; max-width:420px; }
        .sp-hero-h1 {
          font-size:2.4rem; font-weight:800; line-height:1.1; color:#1a1a1a;
          margin-bottom:12px;
        }
        .sp-hero-h1 span { color:#1a6b3c; }
        .sp-hero-sub { font-size:1rem; color:#555; margin-bottom:24px; font-weight:500; }
        .sp-hero-btn {
          background:#1a6b3c; color:#fff; border:none; border-radius:8px;
          padding:13px 32px; font-size:0.95rem; font-weight:700;
          font-family:'Plus Jakarta Sans',sans-serif; cursor:pointer;
          transition:background 0.2s; text-decoration:none; display:inline-block;
        }
        .sp-hero-btn:hover { background:#145230; }
        .sp-hero-badges { display:flex; gap:20px; margin-top:20px; }
        .sp-hero-badge  { display:flex; align-items:center; gap:6px; font-size:0.78rem; color:#444; font-weight:600; }

        .sp-hero-products {
          display:flex; gap:16px; align-items:flex-end; flex-shrink:0;
        }
        .sp-hero-pill {
          background:#fff; border-radius:16px; padding:20px 16px;
          text-align:center; box-shadow:0 4px 20px rgba(0,0,0,0.08);
          min-width:80px;
        }
        .sp-hero-pill-emoji { font-size:2.2rem; margin-bottom:4px; }
        .sp-hero-pill-name  { font-size:0.68rem; font-weight:700; color:#333; }
        .sp-hero-pill:nth-child(2) { transform:translateY(-12px); }
        .sp-hero-pill:nth-child(4) { transform:translateY(-8px); }

        /* ── TRUST BAR ────────────────────── */
        .sp-trust {
          margin:0 16px 16px; background:#fff; border-radius:12px;
          display:grid; grid-template-columns:repeat(4,1fr);
          border:1px solid #e8e8e8; overflow:hidden;
        }
        .sp-trust-item {
          display:flex; align-items:center; gap:14px;
          padding:18px 24px; border-right:1px solid #f0f0f0;
        }
        .sp-trust-item:last-child { border-right:none; }
        .sp-trust-icon { font-size:1.8rem; flex-shrink:0; }
        .sp-trust-title { font-size:0.9rem; font-weight:700; color:#1a1a1a; }
        .sp-trust-sub   { font-size:0.75rem; color:#888; font-weight:500; }

        /* ── SECTION HEADER ───────────────── */
        .sp-section { padding:0 16px 24px; }
        .sp-section-head {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:16px;
        }
        .sp-section-title { font-size:1.2rem; font-weight:800; color:#1a1a1a; }
        .sp-view-all { color:#1a6b3c; font-size:0.88rem; font-weight:700; text-decoration:none; cursor:pointer; }
        .sp-view-all:hover { text-decoration:underline; }

        /* ── CATEGORIES GRID (static) ──────── */
        .sp-cat-grid {
          display:grid; grid-template-columns:repeat(6,1fr); gap:12px;
        }
        .sp-cat-card {
          background:#fff; border-radius:14px; padding:20px 12px;
          text-align:center; cursor:pointer; border:1.5px solid transparent;
          transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.04);
        }
        .sp-cat-card:hover { border-color:#1a6b3c; transform:translateY(-2px); box-shadow:0 6px 20px rgba(26,107,60,0.12); }
        .sp-cat-emoji-wrap {
          width:64px; height:64px; border-radius:16px;
          display:flex; align-items:center; justify-content:center;
          font-size:1.8rem; margin:0 auto 10px;
        }
        .sp-cat-name { font-size:0.8rem; font-weight:700; color:#333; }

        /* ── PRODUCT GRID (StoreGrid will be injected) ── */
        .sp-prod-section {
          margin-top: 16px;
        }
        /* Override StoreGrid styles to match design */
        .sp-prod-section .sg-topbar {
          margin-top: 12px;
        }
        .sp-prod-section .sg-cat-scroll-wrap {
          margin-bottom: 16px;
        }

        /* ── PROMO BANNERS ────────────────── */
        .sp-promos { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .sp-promo  {
          border-radius:14px; padding:24px; position:relative; overflow:hidden;
          min-height:120px;
        }
        .sp-promo-1 { background:linear-gradient(135deg,#e8f5ec,#c8e6c9); }
        .sp-promo-2 { background:linear-gradient(135deg,#fff8e1,#ffecb3); }
        .sp-promo-3 { background:linear-gradient(135deg,#e8eaf6,#c5cae9); }
        .sp-promo-title   { font-size:1.1rem; font-weight:800; color:#1a1a1a; margin-bottom:4px; }
        .sp-promo-sub     { font-size:0.8rem; color:#555; margin-bottom:12px; font-weight:500; }
        .sp-promo-code    { font-size:0.88rem; font-weight:800; color:#1a6b3c; margin-bottom:12px; }
        .sp-promo-btn {
          display:inline-block; border:1.5px solid #1a6b3c; color:#1a6b3c;
          border-radius:8px; padding:7px 18px; font-size:0.8rem; font-weight:700;
          cursor:pointer; background:transparent; font-family:'Plus Jakarta Sans',sans-serif;
          text-decoration:none; transition:all 0.2s;
        }
        .sp-promo-btn:hover { background:#1a6b3c; color:#fff; }
        .sp-promo-icon { position:absolute; right:20px; top:50%; transform:translateY(-50%); font-size:4rem; opacity:0.25; }

        /* ── BRANDS ───────────────────────── */
        .sp-brands {
          display:grid; grid-template-columns:repeat(7,1fr); gap:12px;
        }
        .sp-brand-card {
          background:#fff; border-radius:12px; padding:18px 12px;
          text-align:center; cursor:pointer; border:1.5px solid transparent;
          transition:all 0.2s; box-shadow:0 2px 6px rgba(0,0,0,0.04);
        }
        .sp-brand-card:hover { border-color:#1a6b3c; transform:translateY(-2px); }
        .sp-brand-name { font-size:0.82rem; font-weight:800; }

        /* ── BOTTOM STATS ─────────────────── */
        .sp-stats {
          background:#1a6b3c; margin:16px; border-radius:14px;
          display:grid; grid-template-columns:repeat(4,1fr); padding:24px;
        }
        .sp-stat-item {
          display:flex; align-items:center; gap:14px;
          border-right:1px solid rgba(255,255,255,0.15); padding:0 20px;
        }
        .sp-stat-item:first-child { padding-left:0; }
        .sp-stat-item:last-child  { border-right:none; }
        .sp-stat-icon  { font-size:1.8rem; flex-shrink:0; }
        .sp-stat-title { font-size:0.88rem; font-weight:700; color:#fff; }
        .sp-stat-sub   { font-size:0.72rem; color:rgba(255,255,255,0.7); }

        /* ── FOOTER ───────────────────────── */
        .sp-footer {
          background:#1a1a1a; color:rgba(255,255,255,0.55);
          padding:24px; text-align:center; font-size:0.82rem;
          display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;
        }
        .sp-footer a { color:rgba(255,255,255,0.45); text-decoration:none; margin:0 8px; }
        .sp-footer a:hover { color:#74c69d; }

        @media (max-width: 1280px) {
          .sp-cat-grid, .sp-prod-grid, .sp-brands { grid-template-columns:repeat(auto-fill, minmax(160px,1fr)); }
        }
        @media (max-width: 640px) {
          .sp-hero { flex-direction:column; text-align:center; padding:32px 24px; }
          .sp-hero-products { margin-top:24px; justify-content:center; }
          .sp-trust { grid-template-columns:1fr; }
          .sp-stats { grid-template-columns:1fr; gap:20px; }
          .sp-footer { flex-direction:column; text-align:center; }
        }
      `}</style>

      <div className="sp-root">
        {/* Header (custom, not using Navbar component to match design) */}
        <header className="sp-header">
          <div className="sp-logo" onClick={() => window.location.href = '/'}>
            <div className="sp-logo-icon">✚</div>
            <div className="sp-logo-text">
              <div className="sp-logo-name">mediora</div>
              <div className="sp-logo-tag">Your Health, Our Priority</div>
            </div>
          </div>

          <div className="sp-search">
            <input
              type="text"
              placeholder="Search for medicines, health products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button className="sp-search-btn">🔍</button>
          </div>

          <div className="sp-header-actions">
            <div className="sp-header-action">
              <div className="sp-header-action-icon">🏷️</div>
              <div className="sp-header-action-label">Offers</div>
            </div>
            <Link href="/cart" className="sp-header-action">
              <div className="sp-header-action-icon">
                🛒
                {cartCount > 0 && <span className="sp-cart-count">{cartCount}</span>}
              </div>
              <div className="sp-header-action-label">Cart</div>
            </Link>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <div className="sp-header-action" style={{ cursor: 'pointer' }}>
                  <div className="sp-header-action-icon">👤</div>
                  <div className="sp-header-action-label">Account</div>
                </div>
              </SignInButton>
            ) : (
              <div className="sp-header-action">
                <UserButton />
                <div className="sp-header-action-label">Account</div>
              </div>
            )}
          </div>
        </header>

        {/* Category Nav (static) */}
        <nav className="sp-catnav">
          <button className="sp-catnav-all">☰ &nbsp;All Categories ▾</button>
          {NAV_LINKS.map(link => (
            <a
              key={link}
              className={`sp-navlink${activeNav === link ? ' active' : ''}`}
              onClick={() => setActiveNav(link)}
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Hero Banner */}
        <div className="sp-hero">
          <div className="sp-hero-text">
            <h1 className="sp-hero-h1">Your Health,<br /><span>Our Priority</span></h1>
            <p className="sp-hero-sub">100% genuine products delivered to your doorstep</p>
            <Link href="/store" className="sp-hero-btn">Shop Now</Link>
            <div className="sp-hero-badges">
              <span className="sp-hero-badge">🛡️ Genuine Products</span>
              <span className="sp-hero-badge">🚚 Fast Delivery</span>
              <span className="sp-hero-badge">🔒 Secure Payment</span>
            </div>
          </div>
          <div className="sp-hero-products">
            {[
              { emoji: '💊', name: 'Vitamins' },
              { emoji: '🧴', name: 'Skincare' },
              { emoji: '🌿', name: 'Herbal' },
              { emoji: '💪', name: 'Fitness' },
            ].map((p, i) => (
              <div className="sp-hero-pill" key={i}>
                <div className="sp-hero-pill-emoji">{p.emoji}</div>
                <div className="sp-hero-pill-name">{p.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Bar */}
        <div className="sp-trust">
          {TRUST_ITEMS.map((t, i) => (
            <div className="sp-trust-item" key={i}>
              <div className="sp-trust-icon">{t.icon}</div>
              <div>
                <div className="sp-trust-title">{t.title}</div>
                <div className="sp-trust-sub">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Shop by Category (static) */}
        <div className="sp-section">
          <div className="sp-section-head">
            <div className="sp-section-title">Shop by Category</div>
            <a href="#" className="sp-view-all">View All</a>
          </div>
          <div className="sp-cat-grid">
            {CATEGORIES.map((c, i) => (
              <div className="sp-cat-card" key={i}>
                <div className="sp-cat-emoji-wrap" style={{ background: c.bg }}>
                  {c.emoji}
                </div>
                <div className="sp-cat-name">{c.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Selling Products – using StoreGrid for real data */}
        <div className="sp-section sp-prod-section">
          <div className="sp-section-head">
            <div className="sp-section-title">Best Selling Products</div>
            {/* No "View All" needed; StoreGrid has its own filters */}
          </div>
        </div>

        {/* Promotional Banners */}
        <div className="sp-section">
          <div className="sp-promos">
            <div className="sp-promo sp-promo-1">
              <div className="sp-promo-icon">📋</div>
              <div className="sp-promo-title" style={{ color: '#1a6b3c' }}>Upload Prescription</div>
              <div className="sp-promo-sub">Get medicines without stepping out</div>
              <button className="sp-promo-btn">Upload Now</button>
            </div>
            <div className="sp-promo sp-promo-2">
              <div className="sp-promo-icon">🎁</div>
              <div className="sp-promo-title">Flat 20% Off</div>
              <div className="sp-promo-sub">On all medicines</div>
              <div className="sp-promo-code">Use code: MEDIORA20</div>
            </div>
            <div className="sp-promo sp-promo-3">
              <div className="sp-promo-icon">👑</div>
              <div className="sp-promo-title" style={{ color: '#3949ab' }}>Save More with Mediora Plus</div>
              <div className="sp-promo-sub">Join our membership &amp; enjoy exclusive benefits</div>
              <button className="sp-promo-btn" style={{ borderColor: '#3949ab', color: '#3949ab' }}>Join Now</button>
            </div>
          </div>
        </div>

        {/* Popular Brands */}
        <div className="sp-section">
          <div className="sp-section-head">
            <div className="sp-section-title">Popular Brands</div>
            <a href="#" className="sp-view-all">View All</a>
          </div>
          <div className="sp-brands">
            {BRANDS.map((b, i) => (
              <div className="sp-brand-card" key={i}>
                <div className="sp-brand-name" style={{ color: b.color }}>{b.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="sp-stats">
          {[
            { icon: '💬', title: '24x7 Customer Support', sub: 'We are always here to help you' },
            { icon: '📦', title: '1 Lakh+ Products',      sub: 'Wide range of health products' },
            { icon: '🚚', title: 'Pan India Delivery',     sub: 'Fast delivery across India' },
            { icon: '🔒', title: '100% Secure Payments',  sub: 'Multiple payment options' },
          ].map((s, i) => (
            <div className="sp-stat-item" key={i}>
              <div className="sp-stat-icon">{s.icon}</div>
              <div>
                <div className="sp-stat-title">{s.title}</div>
                <div className="sp-stat-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="sp-footer">
          <span>© {new Date().getFullYear()} Mediora. All rights reserved.</span>
          <div>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/refund">Refund</a>
            <a href="/disclaimer">Disclaimer</a>
          </div>
          <span style={{ fontStyle: 'italic', fontSize: '0.75rem', opacity: 0.5 }}>
            Not a substitute for professional medical advice.
          </span>
        </footer>
      </div>
    </>
  );
}