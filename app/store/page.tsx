'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import { useCart } from '../context/CartContext';
import '../css/storepage.css';

// Helper function for emoji and bg based on category
const getCategoryStyle = (categoryName: string) => {
  const styleMap: Record<string, { emoji: string; bg: string }> = {
    'Skincare': { emoji: '🧴', bg: '#fde8d8' },
    'Health Supplements': { emoji: '💊', bg: '#e8f4e8' },
    'Immunity Boosters': { emoji: '🍋', bg: '#fef9e7' },
    'Baby Care': { emoji: '🍼', bg: '#e8f0fe' },
    'Personal Care': { emoji: '🪥', bg: '#e8f5e9' },
    'Fitness': { emoji: '🏋️', bg: '#f3e8ff' },
    'Medicines': { emoji: '💊', bg: '#e8f4e8' },
    'Ayurvedic': { emoji: '🌿', bg: '#e8f5e9' },
    'Wellness': { emoji: '🧘', bg: '#f3e8ff' },
  };
  return styleMap[categoryName] || { emoji: '📦', bg: '#f3f4f6' };
};

const TRUST_ITEMS = [
  { icon: '🛡️', title: '100% Genuine', sub: 'products' },
  { icon: '🚚', title: 'Fast Delivery', sub: 'Across India' },
  { icon: '🔄', title: 'Easy Returns', sub: 'No questions asked' },
  { icon: '🔒', title: 'Secure Payment', sub: '100% Safe & Secure' },
];

const BOTTOM_STATS = [
  { icon: '💬', title: '24x7 Customer Support', sub: 'We are always here to help you' },
  { icon: '📦', title: '1 Lakh+ Products', sub: 'Wide range of health products' },
  { icon: '🚚', title: 'Pan India Delivery', sub: 'Fast delivery across India' },
  { icon: '🔒', title: '100% Secure Payments', sub: 'Multiple payment options' },
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
  const { cart, cartCount, addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch categories from database
  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };
  
  fetchCategories();
}, []);


  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/products');
        const data = await res.json();

        if (data.success && data.products) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Filter products based on search and category
  const filteredProducts = products.filter(p => {
    const matchSearch = search === '' || 
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    
    const matchCategory = selectedCategory === 'all' || 
      p.category === selectedCategory;
    
    return matchSearch && matchCategory;
  });

  const handleAddToCart = (p: any) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      quantity: 1,
      category: p.category,
      emoji: getCategoryStyle(p.category).emoji,
    });
  };

  return (
    <div className="sp">
      <Navbar cartCount={cartCount} resetAll={() => {}} showHomeLink={true} showStoreLink={false} />

      {/* Hero Banner */}
      <div className="sp-hero">
        <div className="sp-hero-left">
          <h1 className="sp-hero-h1">Your Health,<br /><span>Our Priority</span></h1>
          <p className="sp-hero-sub">100% genuine products delivered to your doorstep</p>

          <div className="sp-search">
            <input
              type="text"
              placeholder="Search products..."
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
  {categories.slice(0, 4).map((cat, i) => (
    <div key={cat.id} className="sp-pill" style={{ transform: `translateY(${i === 1 ? '-12px' : i === 3 ? '-8px' : '0'})` }}>
      <div className="sp-pill-emoji">{cat.emoji || '📦'}</div>
      <div className="sp-pill-name">{cat.name}</div>
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

      {/* Category Navigation - DYNAMIC from database */}
      <div className="sp-catnav">
  <button 
    className="sp-allcat"
    onClick={() => setSelectedCategory('all')}
  >
    🛍️ All Categories
  </button>
  
  {categoriesLoading ? (
    <div className="sp-navlink">Loading...</div>
  ) : (
    categories.map((cat) => (
      <button
        key={cat.id}
        onClick={() => setSelectedCategory(cat.name)}
        className={`sp-navlink ${selectedCategory === cat.name ? 'sp-active' : ''}`}
      >
        {cat.emoji || '📦'} {cat.name}
      </button>
    ))
  )}
</div>

      {/* Shop by Category Section - DYNAMIC from database */}
      <div className="sp-section">
  <div className="sp-sec-head">
    <div className="sp-sec-title">Shop by Category</div>
    <span className="sp-view-all">View All</span>
  </div>
  
  {categoriesLoading ? (
    <div className="text-center py-8">Loading categories...</div>
  ) : (
    <div className="sp-cat-grid">
      {categories.map((cat) => (
        <div 
          key={cat.id}
          className="sp-cat-card"
          onClick={() => setSelectedCategory(cat.name)}
          style={{ cursor: 'pointer' }}
        >
          <div className="sp-cat-icon" style={{ background: cat.bg || '#f3f4f6' }}>
            {cat.image ? (
              <img 
                src={cat.image} 
                alt={cat.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
              />
            ) : (
              <span style={{ fontSize: '1.8rem' }}>{cat.emoji || '📦'}</span>
            )}
          </div>
          <div className="sp-cat-name">{cat.name}</div>
        </div>
      ))}
    </div>
  )}
</div>

      {/* Products Grid */}
      <div className="sp-section" id="sp-products">
        <div className="sp-sec-head">
          <div className="sp-sec-title">
            {selectedCategory === 'all' ? 'All Products' : `${selectedCategory}`}
          </div>
          <span className="sp-view-all">View All</span>
        </div>
        
        {loading ? (
          <div className="text-center py-8">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8">No products found.</div>
        ) : (
          <div className="sp-prod-grid">
            {filteredProducts.map(p => {
              const discount = p.mrp && p.mrp > p.price 
                ? Math.round(((p.mrp - p.price) / p.mrp) * 100) 
                : 0;
              const categoryStyle = getCategoryStyle(p.category);
              
              return (
                <div key={p.id} className="sp-prod-card">
                  <Link href={`/product/${p.id}`} className="block cursor-pointer">
                    <div className="sp-prod-img" style={{ background: categoryStyle.bg }}>
                      {discount > 0 && (
                        <span className="sp-disc-badge">{discount}% OFF</span>
                      )}
                      <span className="sp-wish-btn">🤍</span>
                      <span style={{ fontSize: '3.2rem' }}>{categoryStyle.emoji}</span>
                    </div>
                    <div className="sp-prod-body">
                      <div className="sp-prod-name">{p.name}</div>
                      <div className="sp-prod-cat">{p.category}</div>
                      <div className="sp-prod-stars">
                        <Stars rating={p.rating || 4.5} />
                        <span className="sp-rating-num">{p.rating || 4.5}</span>
                      </div>
                      <div className="sp-prod-price">
                        <span className="sp-price-now">₹{p.price}</span>
                        {p.mrp && p.mrp > p.price && (
                          <span className="sp-price-mrp">₹{p.mrp}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="px-3 pb-3">
                    <button 
                      className="sp-add-btn" 
                      onClick={() => handleAddToCart(p)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
    </div>
  );
}