'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, SignInButton, UserButton } from '@clerk/nextjs';
import StoreGrid from '../components/StoreGrid';

export default function StorePage() {
  const { isSignedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const handleAddToCart = (medicine: any, quantity: number, quantityType: string) => {
    console.log('Added to cart:', medicine, quantity, quantityType);
    setCartCount(prev => prev + 1);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600;700&display=swap');

        :root {
          --sage:    #2d6a4f;
          --sage-mid:#40916c;
          --sage-lt: #74c69d;
          --cream:   #f8f5f0;
          --ink:     #1a1f1c;
          --dust:    #e8e3db;
          --warm:    #c8a96e;
          --white:   #ffffff;
          --card-r:  16px;
          --shadow:  0 4px 24px rgba(45,106,79,0.10);
          --shadow-hover: 0 12px 40px rgba(45,106,79,0.18);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Outfit', sans-serif;
          background: var(--cream);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
        }

        /* ── NAV ──────────────────────────────────── */
        .med-nav {
          position: sticky; top: 0; z-index: 100;
          background: rgba(248,245,240,0.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--dust);
          padding: 0 2rem;
          height: 68px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .med-nav-logo {
          font-family: 'Fraunces', serif;
          font-size: 1.6rem; font-weight: 600;
          color: var(--ink); text-decoration: none;
          display: flex; align-items: center; gap: 8px;
        }
        .med-nav-logo .plus {
          width: 28px; height: 28px; border-radius: 8px;
          background: var(--sage);
          color: white; font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
        }
        .med-nav-logo .accent { color: var(--sage-mid); }
        .med-nav-right {
          display: flex; align-items: center; gap: 10px;
        }
        .nav-icon-btn {
          position: relative;
          width: 40px; height: 40px; border-radius: 10px;
          background: var(--white); border: 1px solid var(--dust);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem; text-decoration: none;
          color: var(--ink); cursor: pointer;
          transition: all 0.2s;
        }
        .nav-icon-btn:hover { background: var(--sage); color: white; border-color: var(--sage); }
        .nav-sign-btn {
          background: var(--sage); color: white;
          border: none; border-radius: 10px;
          padding: 8px 20px; font-size: 0.9rem; font-weight: 500;
          cursor: pointer; font-family: 'Outfit', sans-serif;
          transition: background 0.2s;
        }
        .nav-sign-btn:hover { background: var(--sage-mid); }
        .cart-badge {
          position: absolute; top: -4px; right: -4px;
          background: var(--warm); color: white;
          width: 18px; height: 18px; border-radius: 50%;
          font-size: 0.65rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }

        /* ── HERO ─────────────────────────────────── */
        .store-hero {
          position: relative; overflow: hidden;
          background: var(--sage);
          padding: 64px 2rem 80px;
        }
        .hero-bg-pattern {
          position: absolute; inset: 0; opacity: 0.06;
          background-image: radial-gradient(circle, white 1px, transparent 1px);
          background-size: 32px 32px;
        }
        .hero-blob {
          position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.3;
        }
        .hero-blob-1 {
          width: 400px; height: 400px;
          background: var(--sage-lt);
          top: -100px; right: -100px;
        }
        .hero-blob-2 {
          width: 300px; height: 300px;
          background: var(--warm);
          bottom: -80px; left: 20%;
        }
        .hero-inner {
          position: relative; z-index: 1;
          max-width: 1280px; margin: 0 auto;
        }
        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.25);
          color: rgba(255,255,255,0.9);
          font-size: 0.78rem; font-weight: 500; letter-spacing: 2px;
          text-transform: uppercase;
          padding: 6px 16px; border-radius: 50px;
          margin-bottom: 20px;
        }
        .hero-eyebrow span { width: 6px; height: 6px; border-radius: 50%; background: var(--sage-lt); }
        .hero-title {
          font-family: 'Fraunces', serif;
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          font-weight: 600; color: white; line-height: 1.1;
          margin-bottom: 14px; max-width: 640px;
        }
        .hero-title em { font-style: italic; color: var(--sage-lt); }
        .hero-sub {
          color: rgba(255,255,255,0.65);
          font-size: 1.05rem; font-weight: 300;
          margin-bottom: 36px; max-width: 500px;
        }
        .hero-search-wrap {
          position: relative; max-width: 540px;
        }
        .hero-search {
          width: 100%; padding: 16px 56px 16px 20px;
          border-radius: 14px; border: none;
          background: white;
          font-size: 0.95rem; font-family: 'Outfit', sans-serif;
          color: var(--ink); outline: none;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          transition: box-shadow 0.2s;
        }
        .hero-search:focus { box-shadow: 0 8px 32px rgba(0,0,0,0.25), 0 0 0 3px rgba(116,198,157,0.4); }
        .hero-search::placeholder { color: #aaa; }
        .hero-search-icon {
          position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
          color: var(--sage); width: 20px; height: 20px;
        }
        .hero-stats {
          display: flex; gap: 32px; margin-top: 36px;
        }
        .hero-stat {
          display: flex; flex-direction: column;
        }
        .hero-stat-num {
          font-family: 'Fraunces', serif;
          font-size: 1.7rem; font-weight: 600; color: white; line-height: 1;
        }
        .hero-stat-label {
          font-size: 0.78rem; color: rgba(255,255,255,0.55);
          font-weight: 300; margin-top: 4px;
        }
        .hero-stat-divider {
          width: 1px; background: rgba(255,255,255,0.15); align-self: stretch;
        }

        /* ── CATEGORY PILLS ───────────────────────── */
        .cat-scroll-wrap {
          background: white; border-bottom: 1px solid var(--dust);
          overflow-x: auto; scrollbar-width: none;
        }
        .cat-scroll-wrap::-webkit-scrollbar { display: none; }
        .cat-scroll {
          display: flex; gap: 6px; padding: 14px 2rem;
          max-width: 1280px; margin: 0 auto;
          width: max-content;
        }
        .cat-pill {
          white-space: nowrap;
          padding: 7px 18px; border-radius: 50px;
          font-size: 0.85rem; font-weight: 500;
          border: 1.5px solid var(--dust);
          background: white; color: #666;
          cursor: pointer; transition: all 0.18s;
          font-family: 'Outfit', sans-serif;
          display: flex; align-items: center; gap: 7px;
        }
        .cat-pill:hover { border-color: var(--sage-lt); color: var(--sage); background: rgba(116,198,157,0.06); }
        .cat-pill.active {
          background: var(--sage); border-color: var(--sage);
          color: white; box-shadow: 0 4px 12px rgba(45,106,79,0.25);
        }
        .cat-pill-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: currentColor; opacity: 0.6;
        }

        /* ── MAIN LAYOUT ──────────────────────────── */
        .store-main {
          max-width: 1280px; margin: 0 auto;
          padding: 32px 2rem 64px;
        }
        .store-topbar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
        }
        .results-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.8rem; color: #888; font-weight: 300;
        }
        .results-label strong { color: var(--sage); font-weight: 500; }
        .filter-row {
          display: flex; align-items: center; gap: 12px;
        }
        .price-filter {
          display: flex; align-items: center; gap: 10px;
          background: white; border: 1.5px solid var(--dust);
          padding: 8px 16px; border-radius: 10px;
        }
        .price-filter label { font-size: 0.82rem; color: #888; white-space: nowrap; }
        .price-filter input[type=range] {
          width: 100px; accent-color: var(--sage);
        }
        .price-filter span {
          font-family: 'DM Mono', monospace;
          font-size: 0.82rem; color: var(--sage); font-weight: 500;
        }
        .stock-toggle {
          display: flex; align-items: center; gap: 8px;
          background: white; border: 1.5px solid var(--dust);
          padding: 8px 14px; border-radius: 10px;
          cursor: pointer; font-size: 0.85rem; color: #666;
          user-select: none; transition: all 0.18s;
        }
        .stock-toggle:hover { border-color: var(--sage-lt); }
        .stock-toggle input { accent-color: var(--sage); }

        /* ── GRID ─────────────────────────────────── */
        .med-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 20px;
        }

        /* ── SKELETON ─────────────────────────────── */
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton-card {
          background: white; border-radius: var(--card-r); overflow: hidden;
          border: 1px solid var(--dust);
        }
        .skeleton-img {
          height: 180px;
          background: linear-gradient(90deg, #f0ece6 25%, #e8e3db 50%, #f0ece6 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }
        .skeleton-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .skeleton-line {
          border-radius: 6px;
          background: linear-gradient(90deg, #f0ece6 25%, #e8e3db 50%, #f0ece6 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
        }

        /* ── EMPTY ────────────────────────────────── */
        .empty-state {
          text-align: center; padding: 80px 20px;
          background: white; border-radius: 20px;
          border: 1.5px dashed var(--dust);
        }
        .empty-icon { font-size: 3.5rem; margin-bottom: 16px; }
        .empty-title {
          font-family: 'Fraunces', serif;
          font-size: 1.4rem; color: var(--ink); margin-bottom: 8px;
        }
        .empty-sub { color: #999; font-size: 0.9rem; font-weight: 300; }

        /* ── FOOTER ───────────────────────────────── */
        .store-footer {
          background: var(--ink); color: rgba(255,255,255,0.55);
          padding: 32px 2rem;
        }
        .footer-inner {
          max-width: 1280px; margin: 0 auto;
          display: flex; flex-wrap: wrap; align-items: center;
          justify-content: space-between; gap: 16px;
          font-size: 0.83rem;
        }
        .footer-links { display: flex; gap: 20px; }
        .footer-links a {
          color: rgba(255,255,255,0.45); text-decoration: none;
          transition: color 0.15s;
        }
        .footer-links a:hover { color: var(--sage-lt); }
        .footer-disclaimer {
          color: rgba(255,255,255,0.25); font-size: 0.75rem;
          font-style: italic;
        }

        /* ── RESPONSIVE ───────────────────────────── */
        @media (max-width: 640px) {
          .hero-stats { gap: 16px; }
          .store-topbar { flex-direction: column; align-items: flex-start; }
          .filter-row { flex-wrap: wrap; }
          .med-nav { padding: 0 1rem; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

        {/* ── Navigation ── */}
        <nav className="med-nav">
          <Link href="/" className="med-nav-logo">
            <div className="plus">✚</div>
            Medi<span className="accent">Ora</span>
          </Link>
          <div className="med-nav-right">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="nav-sign-btn">Sign In</button>
              </SignInButton>
            ) : (
              <>
                <Link href="/dashboard" className="nav-icon-btn" title="Dashboard">👤</Link>
                <Link href="/orders" className="nav-icon-btn" title="Orders">📦</Link>
                <UserButton />
              </>
            )}
            <Link href="/" className="nav-icon-btn" title="Home">🏠</Link>
            <Link href="/cart" className="nav-icon-btn" title="Cart">
              🛒
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="store-hero">
          <div className="hero-bg-pattern" />
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
          <div className="hero-inner">
            <div className="hero-eyebrow">
              <span />
              Verified & Genuine Medicines
            </div>
            <h1 className="hero-title">
              Your trusted<br />
              <em>pharmacy,</em> online.
            </h1>
            <p className="hero-sub">
              Browse 500+ medicines with full dosage info, safe alternatives, and flexible quantities.
            </p>
            <div className="hero-search-wrap">
              <input
                className="hero-search"
                type="text"
                placeholder="Search by name, brand, or category…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="hero-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-num">500+</span>
                <span className="hero-stat-label">Medicines</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-num">100%</span>
                <span className="hero-stat-label">Genuine</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-num">24h</span>
                <span className="hero-stat-label">Fast Delivery</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Store Grid with filters ── */}
        <div className="store-main">
          <StoreGrid
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
          />
        </div>

        {/* ── Footer ── */}
        <footer className="store-footer">
          <div className="footer-inner">
            <span>© {new Date().getFullYear()} Mediora. All rights reserved.</span>
            <div className="footer-links">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/refund">Refund</Link>
              <Link href="/disclaimer">Disclaimer</Link>
            </div>
            <span className="footer-disclaimer">Not a substitute for professional medical advice.</span>
          </div>
        </footer>

      </div>
    </>
  );
}