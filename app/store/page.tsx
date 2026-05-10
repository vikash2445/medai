'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';

// ── Static data (categories, brand names, trust items, etc.) ──
const CATEGORIES = [
  { name: 'Skincare',           emoji: '🧴', bg: '#fde8d8' },
  { name: 'Health Supplements', emoji: '💊', bg: '#e8f4e8' },
  { name: 'Immunity Boosters',  emoji: '🍋', bg: '#fef9e7' },
  { name: 'Baby Care',          emoji: '🍼', bg: '#e8f0fe' },
  { name: 'Personal Care',      emoji: '🪥', bg: '#e8f5e9' },
  { name: 'Fitness',            emoji: '🏋️', bg: '#f3e8ff' },
];


const TRUST_ITEMS = [
  { icon: '🛡️', title: '100% Genuine',    sub: 'products' },
  { icon: '🚚', title: 'Fast Delivery',    sub: 'Across India' },
  { icon: '🔄', title: 'Easy Returns',     sub: 'No questions asked' },
  { icon: '🔒', title: 'Secure Payment',   sub: '100% Safe & Secure' },
];

const BOTTOM_STATS = [
  { icon: '💬', title: '24x7 Customer Support', sub: 'We are always here to help you' },
  { icon: '📦', title: '1 Lakh+ Products',       sub: 'Wide range of health products' },
  { icon: '🚚', title: 'Pan India Delivery',     sub: 'Fast delivery across India' },
  { icon: '🔒', title: '100% Secure Payments',   sub: 'Multiple payment options' },
];

function Stars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;
  return (
    <span style={{ color: '#f59e0b', fontSize: '0.72rem' }}>
      {'★'.repeat(fullStars)}{'☆'.repeat(emptyStars)}
    </span>
  );
}

export default function StorePage() {
  const { cart, cartCount, cartTotal, addToCart, updateQuantity } = useCart();
  const [search, setSearch] = useState('');
  const [activeNav, setActiveNav] = useState('Home');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const addedIds = new Set(cart.map(item => item.id));


  // Fetch real products from Supabase via your existing API
  // Fetch products + products from Supabase APIs
useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Sirf products API
      const res = await fetch('/api/products');

      const data = await res.json();

      const products = Array.isArray(data.products)
        ? data.products.map((item: any) => {
            const price = item.price || 0;
            const mrp = item.mrp || Math.round(price * 1.25);
            const discount = Math.round(((mrp - price) / mrp) * 100);

            let bg = '#f3f4f6';

            if (item.category === 'Daily Essentials') bg = '#fff4e6';
            else if (item.category === 'Personal Care') bg = '#e8f5e9';
            else if (item.category === 'Baby Care') bg = '#e8f0fe';
            else if (item.category === 'Women Care') bg = '#fde8f2';
            else if (item.category === 'Protein') bg = '#f3e8ff';

            return {
              id: item.id,
              name: item.name,
              category: item.category || 'Product',
              price,
              mrp,
              discount,
              rating: (Math.random() * 1.5 + 3.8).toFixed(1),
              emoji: item.emoji || '🛒',
              bg,
              image: item.image || '',
              type: 'product',
            };
          })
        : [];

      setProducts(products);

    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, []);

  const filteredProducts = products.filter(p =>
    search === '' ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (p: any) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      quantity: 1,
      category: p.category,
      emoji: p.emoji,
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .sp { font-family: 'Plus Jakarta Sans', sans-serif; background: #f4f7f4; min-height: 100vh; color: #1a1a1a; }
        .sp * { box-sizing: border-box; }

        /* ── CATEGORY NAV below navbar ── */
        .sp-catnav {
          background: #1a6b3c;
          display: flex;
          align-items: stretch;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 0 16px;
        }
        .sp-catnav::-webkit-scrollbar { display: none; }
        .sp-allcat {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #145230;
          color: #fff;
          border: none;
          padding: 0 20px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.86rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          min-height: 46px;
          border-right: 1px solid rgba(255,255,255,0.15);
        }
        .sp-navlink {
          padding: 0 16px;
          min-height: 46px;
          display: flex;
          align-items: center;
          color: rgba(255,255,255,0.85);
          font-size: 0.86rem;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          text-decoration: none;
          border-bottom: 2px solid transparent;
          transition: all 0.18s;
          flex-shrink: 0;
        }
        .sp-navlink:hover { color: #fff; }
        .sp-navlink.sp-active { color: #fff; border-bottom-color: #fff; font-weight: 700; }

        /* ── HERO BANNER ── */
        .sp-hero {
          background: linear-gradient(130deg, #eaf5ee 0%, #f5fbf7 55%, #e2f0e8 100%);
          margin: 14px 14px 0;
          border-radius: 16px;
          padding: 36px 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 230px;
          overflow: hidden;
          position: relative;
        }
        .sp-hero-left { flex: 1; max-width: 440px; }
        .sp-hero-h1 { font-size: 2.3rem; font-weight: 800; line-height: 1.12; margin-bottom: 10px; }
        .sp-hero-h1 span { color: #1a6b3c; }
        .sp-hero-sub { font-size: 0.96rem; color: #555; margin-bottom: 22px; font-weight: 500; }
        .sp-hero-cta {
          display: inline-block;
          background: #1a6b3c;
          color: #fff;
          padding: 12px 30px;
          border-radius: 9px;
          font-size: 0.94rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.18s;
        }
        .sp-hero-cta:hover { background: #145230; }
        .sp-hero-badges { display: flex; gap: 20px; margin-top: 18px; flex-wrap: wrap; }
        .sp-hero-badge { display: flex; align-items: center; gap: 6px; font-size: 0.76rem; color: #444; font-weight: 600; }

        .sp-hero-pills { display: flex; gap: 12px; align-items: flex-end; flex-shrink: 0; }
        .sp-pill {
          background: #fff;
          border-radius: 14px;
          padding: 18px 14px;
          text-align: center;
          box-shadow: 0 4px 18px rgba(0,0,0,0.08);
          min-width: 76px;
          transition: transform 0.2s;
        }
        .sp-pill:hover { transform: translateY(-3px); }
        .sp-pill-emoji { font-size: 2rem; margin-bottom: 5px; }
        .sp-pill-name { font-size: 0.66rem; font-weight: 700; color: #333; }

        /* ── TRUST BAR ── */
        .sp-trust {
          margin: 14px 14px 0;
          background: #fff;
          border-radius: 12px;
          border: 1px solid #eee;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          overflow: hidden;
        }
        .sp-trust-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 22px;
          border-right: 1px solid #f2f2f2;
        }
        .sp-trust-item:last-child { border-right: none; }
        .sp-trust-icon { font-size: 1.7rem; flex-shrink: 0; }
        .sp-trust-title { font-size: 0.88rem; font-weight: 700; color: #1a1a1a; }
        .sp-trust-sub { font-size: 0.72rem; color: #888; }

        /* ── SECTION HEADER ── */
        .sp-section { padding: 22px 14px 0; }
        .sp-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .sp-sec-title { font-size: 1.15rem; font-weight: 800; color: #1a1a1a; }
        .sp-view-all { color: #1a6b3c; font-size: 0.85rem; font-weight: 700; text-decoration: none; cursor: pointer; }
        .sp-view-all:hover { text-decoration: underline; }

        /* ── SEARCH INPUT (inside hero) ── */
        .sp-search {
          display: flex;
          border: 1.5px solid #ddd;
          border-radius: 10px;
          overflow: hidden;
          background: #fff;
          max-width: 420px;
          margin-bottom: 16px;
        }
        .sp-search input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 10px 16px;
          font-size: 0.88rem;
          color: #333;
          outline: none;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .sp-search input::placeholder { color: #aaa; }
        .sp-search-btn {
          background: #1a6b3c;
          border: none;
          padding: 0 16px;
          color: #fff;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.18s;
        }
        .sp-search-btn:hover { background: #145230; }

        /* ── CATEGORIES GRID ── */
        .sp-cat-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        .sp-cat-card {
          background: #fff;
          border-radius: 14px;
          padding: 20px 10px;
          text-align: center;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .sp-cat-card:hover {
          border-color: #1a6b3c;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(26,107,60,0.1);
        }
        .sp-cat-icon {
          width: 62px;
          height: 62px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          margin: 0 auto 10px;
        }
        .sp-cat-name { font-size: 0.78rem; font-weight: 700; color: #333; }

        /* ── PRODUCT GRID ── */
        .sp-prod-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        .sp-prod-card {
          background: #fff;
          border-radius: 14px;
          border: 1.5px solid #f0f0f0;
          overflow: hidden;
          transition: all 0.22s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .sp-prod-card:hover {
          border-color: #1a6b3c;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(26,107,60,0.12);
        }
        .sp-prod-img {
          height: 136px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-size: 3.2rem;
        }
        .sp-disc-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: #e53935;
          color: #fff;
          font-size: 0.62rem;
          font-weight: 800;
          padding: 3px 7px;
          border-radius: 5px;
        }
        .sp-wish-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #fff;
          border: 1px solid #eee;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          cursor: pointer;
          color: #ccc;
          transition: color 0.18s;
        }
        .sp-wish-btn:hover { color: #e53935; }
        .sp-prod-body { padding: 11px; }
        .sp-prod-name { font-size: 0.8rem; font-weight: 700; color: #1a1a1a; line-height: 1.3; margin-bottom: 2px; }
        .sp-prod-cat { font-size: 0.68rem; color: #999; margin-bottom: 6px; }
        .sp-prod-stars { display: flex; align-items: center; gap: 4px; margin-bottom: 6px; }
        .sp-rating-num { font-size: 0.7rem; color: #666; font-weight: 600; }
        .sp-prod-price { display: flex; align-items: baseline; gap: 6px; margin-bottom: 9px; }
        .sp-price-now { font-size: 0.98rem; font-weight: 800; color: #1a1a1a; }
        .sp-price-mrp { font-size: 0.72rem; color: #bbb; text-decoration: line-through; }
        .sp-add-btn {
          width: 100%;
          background: #1a6b3c;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 9px 0;
          font-size: 0.78rem;
          font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          transition: background 0.18s;
        }
        .sp-add-btn:hover { background: #145230; }
        .sp-add-btn.sp-added { background: #145230; cursor: default; }

        /* ── PROMO BANNERS ── */
        .sp-promos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .sp-promo {
          border-radius: 14px;
          padding: 22px;
          position: relative;
          overflow: hidden;
          min-height: 118px;
        }
        .sp-promo-green { background: linear-gradient(135deg, #e8f5ec, #c8e6c9); }
        .sp-promo-yellow { background: linear-gradient(135deg, #fff8e1, #ffecb3); }
        .sp-promo-blue { background: linear-gradient(135deg, #e8eaf6, #c5cae9); }
        .sp-promo-title { font-size: 1.05rem; font-weight: 800; color: #1a1a1a; margin-bottom: 3px; }
        .sp-promo-sub { font-size: 0.78rem; color: #555; margin-bottom: 10px; font-weight: 500; }
        .sp-promo-code { font-size: 0.86rem; font-weight: 800; color: #1a6b3c; margin-bottom: 10px; }
        .sp-promo-btn {
          display: inline-block;
          border: 1.5px solid currentColor;
          border-radius: 7px;
          padding: 6px 16px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          background: transparent;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.18s;
        }
        .sp-promo-btn-green { color: #1a6b3c; }
        .sp-promo-btn-green:hover { background: #1a6b3c; color: #fff; }
        .sp-promo-btn-blue { color: #3949ab; }
        .sp-promo-btn-blue:hover { background: #3949ab; color: #fff; }
        .sp-promo-bg-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 3.8rem;
          opacity: 0.22;
          pointer-events: none;
        }

        /* ── BRANDS ── */
        .sp-brands {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 10px;
        }
        .sp-brand-card {
          background: #fff;
          border-radius: 11px;
          padding: 16px 10px;
          text-align: center;
          border: 1.5px solid transparent;
          cursor: pointer;
          transition: all 0.18s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          font-size: 0.8rem;
          font-weight: 800;
          color: #1a6b3c;
        }
        .sp-brand-card:hover {
          border-color: #1a6b3c;
          transform: translateY(-2px);
        }

        /* ── BOTTOM STATS ── */
        .sp-stats {
          background: #1a6b3c;
          margin: 22px 14px 14px;
          border-radius: 14px;
          padding: 22px 10px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .sp-stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px;
          border-right: 1px solid rgba(255,255,255,0.15);
        }
        .sp-stat-item:first-child { padding-left: 10px; }
        .sp-stat-item:last-child { border-right: none; }
        .sp-stat-icon { font-size: 1.7rem; flex-shrink: 0; }
        .sp-stat-title { font-size: 0.85rem; font-weight: 700; color: #fff; }
        .sp-stat-sub { font-size: 0.7rem; color: rgba(255,255,255,0.7); }

        /* ── FOOTER ── */
        .sp-footer {
          background: #111;
          color: rgba(255,255,255,0.5);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 0.8rem;
        }
        .sp-footer-links { display: flex; gap: 16px; }
        .sp-footer-links a { color: rgba(255,255,255,0.4); text-decoration: none; transition: color 0.15s; }
        .sp-footer-links a:hover { color: #74c69d; }

        /* ── CART PANEL ── */
        .sp-cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(26,26,46,0.4);
          z-index: 200;
          animation: spFadeIn 0.2s;
        }
        .sp-cart-panel {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: 440px;
          background: #fff;
          z-index: 201;
          display: flex;
          flex-direction: column;
          animation: spSlideIn 0.3s;
          box-shadow: -8px 0 40px rgba(0,0,0,0.12);
        }
        @keyframes spFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .sp-cart-header { padding: 24px; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; }
        .sp-cart-header h2 { font-family: 'DM Serif Display', serif; font-size: 1.4rem; }
        .sp-close-btn {
          background: none;
          border: none;
          font-size: 1.4rem;
          cursor: pointer;
          color: #4a4a6a;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
        .sp-close-btn:hover { background: #f0ede7; }
        .sp-cart-items { flex: 1; overflow-y: auto; padding: 16px 24px; }
        .sp-cart-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid #f0ede7;
        }
        .sp-cart-icon {
          width: 48px;
          height: 48px;
          background: #e6f7f3;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .sp-cart-info { flex: 1; }
        .sp-cart-name { font-weight: 600; font-size: 0.92rem; }
        .sp-cart-price { color: #0a7860; font-weight: 700; font-size: 0.88rem; }
        .sp-cart-qty { display: flex; align-items: center; gap: 8px; }
        .sp-qty-btn {
          background: #f0ede7;
          border: none;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sp-qty-btn:hover { background: #e6f7f3; }
        .sp-cart-empty { padding: 60px 0; text-align: center; color: #4a4a6a; }
        .sp-cart-footer { padding: 20px 24px; border-top: 1px solid #eee; }
        .sp-cart-total { display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; }
        .sp-checkout-btn {
          width: 100%;
          background: #0fa381;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 16px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          text-align: center;
          display: block;
          text-decoration: none;
        }
        .sp-checkout-btn:hover { background: #0a7860; }

        @media (max-width: 1024px) {
          .sp-prod-grid { grid-template-columns: repeat(4, 1fr); }
          .sp-cat-grid { grid-template-columns: repeat(4, 1fr); }
          .sp-brands { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 768px) {
          .sp-hero { flex-direction: column; padding: 24px 20px; gap: 20px; margin: 10px 10px 0; }
          .sp-hero-pills { display: none; }
          .sp-hero-h1 { font-size: 1.7rem; }
          .sp-trust { grid-template-columns: repeat(2, 1fr); margin: 10px 10px 0; }
          .sp-cat-grid { grid-template-columns: repeat(3, 1fr); }
          .sp-prod-grid { grid-template-columns: repeat(2, 1fr); }
          .sp-promos { grid-template-columns: 1fr; }
          .sp-brands { grid-template-columns: repeat(3, 1fr); }
          .sp-stats { grid-template-columns: repeat(2, 1fr); }
          .sp-stat-item { border-right: none; padding: 8px 10px; }
          .sp-cart-panel { width: 100%; }
        }
        @media (max-width: 480px) {
          .sp-cat-grid { grid-template-columns: repeat(2, 1fr); }
          .sp-prod-grid { grid-template-columns: repeat(2, 1fr); }
          .sp-trust { grid-template-columns: 1fr; }
          .sp-brands { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="sp">
        <Navbar cartCount={cartCount} resetAll={() => {}} showHomeLink={true} showStoreLink={false} />

        {/* Category Navigation */}

        {/* Hero Banner */}
        <div className="sp-hero">
          <div className="sp-hero-left">
            <h1 className="sp-hero-h1">Your Health,<br /><span>Our Priority</span></h1>
            <p className="sp-hero-sub">100% genuine products delivered to your doorstep</p>

            <div className="sp-search">
              <input
                id="store-search"
                name="search"
                type="text"
                placeholder="Search products, products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className="sp-search-btn">🔍</button>
            </div>

            <Link href="#sp-products" className="sp-hero-cta">Shop Now</Link>
            <div className="sp-hero-badges">
              <span className="sp-hero-badge">🛡️ Genuine Products</span>
              <span className="sp-hero-badge">🚚 Fast Delivery</span>
              <span className="sp-hero-badge">🔒 Secure Payment</span>
            </div>
          </div>

          <div className="sp-hero-pills">
            {[
              { emoji: '💊', name: 'Vitamins', offset: 0 },
              { emoji: '🧴', name: 'Skincare', offset: -12 },
              { emoji: '🌿', name: 'Herbal',   offset: 0 },
              { emoji: '💪', name: 'Fitness',  offset: -8 },
            ].map((p, i) => (
              <div key={i} className="sp-pill" style={{ transform: `translateY(${p.offset}px)` }}>
                <div className="sp-pill-emoji">{p.emoji}</div>
                <div className="sp-pill-name">{p.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Bar */}
        <div className="sp-trust">
          {TRUST_ITEMS.map((t, i) => (
            <div key={i} className="sp-trust-item">
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
          <div className="sp-sec-head">
            <div className="sp-sec-title">Shop by Category</div>
            <span className="sp-view-all">View All</span>
          </div>
          <div className="sp-cat-grid">
            {CATEGORIES.map((c, i) => (
              <div key={i} className="sp-cat-card">
                <div className="sp-cat-icon" style={{ background: c.bg }}>{c.emoji}</div>
                <div className="sp-cat-name">{c.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Products Grid – dynamic from Supabase */}
        <div className="sp-section" id="sp-products">
          <div className="sp-sec-head">
            <div className="sp-sec-title">Best Selling Products</div>
            <span className="sp-view-all">View All</span>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">No products found.</div>
          ) : (
            <div className="sp-prod-grid">
              {filteredProducts.map(p => (
                <div key={p.id} className="sp-prod-card">
                  <Link href={`/product/${p.id}`} className="block cursor-pointer">
                    <div className="sp-prod-img" style={{ background: p.bg }}>
                      <span className="sp-disc-badge">{p.discount}% OFF</span>
                      <span>{p.emoji}</span>
                    </div>
                    <div className="sp-prod-body">
                      <div className="sp-prod-name">{p.name}</div>
                      <div className="sp-prod-cat">{p.category}</div>
                      <div className="sp-prod-stars">
                        <Stars rating={parseFloat(p.rating)} />
                        <span className="sp-rating-num">{p.rating}</span>
                      </div>
                      <div className="sp-prod-price">
                        <span className="sp-price-now">₹{p.price}</span>
                        <span className="sp-price-mrp">₹{p.mrp}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="px-3 pb-3">
                    <button className="sp-add-btn" onClick={() => handleAdd(p)}>Add to Cart</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Brands */}

        {/* Bottom Stats */}
        <div className="sp-stats">
          {BOTTOM_STATS.map((s, i) => (
            <div key={i} className="sp-stat-item">
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
          <div className="sp-footer-links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/refund">Refund</Link>
            <Link href="/disclaimer">Disclaimer</Link>
          </div>
          <span style={{ fontStyle: 'italic', fontSize: '0.72rem', opacity: 0.5 }}>
            Not a substitute for professional medical advice.
          </span>
        </footer>

        {/* ❌ REMOVED: Entire local cart panel – now handled by global CartDrawer in layout */}
      </div>
    </>
  );
}