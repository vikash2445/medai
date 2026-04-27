'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';        // ← same Navbar as homepage
import StoreGrid from '../components/StoreGrid';
import { useCart } from '../context/CartContext';

export default function StorePage() {
  const { cartCount, addToCart } = useCart();     // ← shared cart, not local state
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddToCart = (medicine: any, quantity: number, quantityType: string) => {
    addToCart({                                   // ← writes to CartContext, not local counter
      id:             medicine.id,
      name:           medicine.name,
      price:          medicine.price,
      quantity,
      image:          medicine.image,
      type:           medicine.type,
      pricePerTablet: medicine.pricePerTablet,
      emoji:          medicine.emoji,
      category:       medicine.category,
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* ── Same Navbar as homepage ── */}
      <Navbar cartCount={cartCount} resetAll={() => {}} />

      {/* ── Hero ── */}
      <section className="store-hero">
        <div className="hero-bg-pattern" />
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span />
            Verified &amp; Genuine Medicines
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
              onChange={e => setSearchQuery(e.target.value)}
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

      {/* ── Product grid ── */}
      <div className="store-main">
        <StoreGrid onAddToCart={handleAddToCart} searchQuery={searchQuery} />
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
  );
}