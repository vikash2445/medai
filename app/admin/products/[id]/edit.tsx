'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createBrowserClient } from '@lib/supabase-admin';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

// CSS (same as before)
const css = `
  .apr-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:14px; }
  .apr-title  { font-family:'DM Serif Display',serif; font-size:1.7rem; color:#e6edf3; margin-bottom:3px; }
  .apr-sub    { font-size:0.82rem; color:#8b949e; }
  .apr-add-btn { display:inline-flex; align-items:center; gap:7px; background:#0fa381; color:#fff; border:none; border-radius:10px; padding:10px 20px; font-family:'Outfit',sans-serif; font-size:0.85rem; font-weight:600; cursor:pointer; text-decoration:none; transition:background 0.18s; }
  .apr-add-btn:hover { background:#0a7860; }
  .apr-stats { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:22px; }
  .apr-stat  { background:#161b22; border:1px solid #21262d; border-radius:12px; padding:16px 18px; }
  .apr-stat-val   { font-family:'DM Serif Display',serif; font-size:1.5rem; line-height:1; margin-bottom:4px; }
  .apr-stat-label { font-size:0.72rem; color:#8b949e; }
  .apr-filters { background:#161b22; border:1px solid #21262d; border-radius:12px; padding:12px 18px; display:flex; align-items:center; gap:10px; margin-bottom:18px; flex-wrap:wrap; }
  .apr-filter-pill { padding:5px 14px; border-radius:50px; border:1px solid #21262d; background:transparent; font-family:'Outfit',sans-serif; font-size:0.76rem; font-weight:500; color:#8b949e; cursor:pointer; transition:all 0.18s; text-decoration:none; }
  .apr-filter-pill:hover, .apr-filter-pill.active { background:rgba(15,163,129,0.12); border-color:rgba(15,163,129,0.35); color:#0fa381; }
  .apr-table-wrap { background:#161b22; border:1px solid #21262d; border-radius:14px; overflow:hidden; overflow-x:auto; }
  .apr-table { width:100%; border-collapse:collapse; min-width:900px; }
  .apr-thead tr { background:#0d1117; border-bottom:1px solid #21262d; }
  .apr-th { padding:12px 16px; text-align:left; font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#8b949e; white-space:nowrap; }
  .apr-tbody tr { border-bottom:1px solid #21262d; transition:background 0.15s; }
  .apr-tbody tr:hover { background:rgba(255,255,255,0.025); }
  .apr-td { padding:12px 16px; vertical-align:middle; font-size:0.85rem; color:#e6edf3; }
  .apr-product-cell { display:flex; align-items:center; gap:12px; }
  .apr-thumb { width:44px; height:44px; border-radius:9px; background:#0d1117; display:flex; align-items:center; justify-content:center; font-size:1.4rem; flex-shrink:0; overflow:hidden; }
  .apr-thumb img { width:100%; height:100%; object-fit:cover; }
  .apr-prod-name { font-weight:600; color:#e6edf3; font-size:0.85rem; line-height:1.3; }
  .apr-prod-slug { font-family:'DM Mono',monospace; font-size:0.7rem; color:#8b949e; margin-top:2px; }
  .apr-price-cell { font-family:'DM Mono',monospace; font-size:0.85rem; }
  .apr-price-now { color:#0fa381; font-weight:600; }
  .apr-price-mrp { color:#8b949e; text-decoration:line-through; font-size:0.72rem; }
  .apr-badge { display:inline-flex; align-items:center; gap:4px; font-size:0.66rem; font-weight:700; padding:2px 9px; border-radius:50px; }
  .apr-badge-purple { background:rgba(139,92,246,0.15); color:#8b5cf6; }
  .apr-badge-yellow { background:rgba(240,180,41,0.15); color:#f0b429; }
  .apr-badge-red { background:rgba(214,64,64,0.15); color:#d64040; }
  .apr-badge-blue { background:rgba(59,130,246,0.15); color:#3b82f6; }
  .apr-tag { display:inline-block; font-size:0.62rem; font-weight:600; padding:2px 8px; border-radius:50px; background:rgba(15,163,129,0.1); color:#0fa381; margin:1px; }
  .apr-rating { display:flex; align-items:center; gap:5px; font-size:0.78rem; }
  .apr-stars { color:#f0b429; }
  .apr-action-btn { padding:5px 11px; border-radius:7px; font-size:0.73rem; font-weight:600; text-decoration:none; transition:all 0.18s; border:1px solid #21262d; color:#8b949e; background:transparent; cursor:pointer; font-family:'Outfit',sans-serif; display:inline-block; }
  .apr-action-btn:hover { border-color:rgba(15,163,129,0.4); color:#0fa381; }
  .apr-stock-bar { display:flex; flex-direction:column; gap:3px; }
  .apr-stock-val { font-size:0.82rem; font-weight:600; }
  .apr-stock-track { width:60px; height:4px; background:#21262d; border-radius:2px; overflow:hidden; }
  .apr-stock-fill { height:100%; border-radius:2px; }
  .apr-empty { padding:60px 0; text-align:center; color:#8b949e; }
`;

interface Product {
  id: number;
  name: string;
  slug: string;
  category: string;
  generic?: string;
  price: number;
  mrp?: number;
  stock: number;
  image?: string;
  featured: boolean;
  bestseller: boolean;
  combo_offer: boolean;
  is_antibiotic: boolean;
  prescription_required: boolean;
  rating: number;
  reviews: number;
  tags: string[];
  created_at: string;
}

function stockColor(stock: number): string {
  if (stock <= 0) return '#d64040';
  if (stock <= 10) return '#f0b429';
  return '#0fa381';
}

export default function AdminProductsPage() {
  const supabase = createBrowserClient();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get('category') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>(categoryFromUrl);
  
  // Stats
  const [featuredCount, setFeaturedCount] = useState(0);
  const [bestsellerCount, setBestsellerCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);

  // ✅ FIXED: fetchProducts with proper dependencies - NO infinite loop
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        const all = data as Product[];
        setProducts(all);
        
        // Calculate stats
        setFeaturedCount(all.filter(p => p.featured).length);
        setBestsellerCount(all.filter(p => p.bestseller).length);
        setOutOfStockCount(all.filter(p => (p.stock ?? 0) <= 0).length);
        setLowStockCount(all.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 10).length);
        
        // Get unique categories
        const uniqueCats = [...new Set(all.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCats);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, supabase]);

  // ✅ FIXED: useEffect with proper dependency
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]); // fetchProducts is stable because of useCallback

  // Handle category filter change
  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    // Update URL without reload
    const url = new URL(window.location.href);
    if (category) {
      url.searchParams.set('category', category);
    } else {
      url.searchParams.delete('category');
    }
    window.history.pushState({}, '', url.toString());
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div className="apr-header">
        <div>
          <h1 className="apr-title">Products</h1>
          <p className="apr-sub">{products.length} products in the store</p>
        </div>
        <Link href="/admin/products/new" className="apr-add-btn">+ Add Product</Link>
      </div>

      {/* Stats */}
      <div className="apr-stats">
        {[
          { val: products.length, label: 'Total Products', color: '#e6edf3' },
          { val: featuredCount, label: 'Featured', color: '#8b5cf6' },
          { val: bestsellerCount, label: 'Bestsellers', color: '#f0b429' },
          { val: lowStockCount, label: 'Low Stock (≤10)', color: '#f0b429' },
          { val: outOfStockCount, label: 'Out of Stock', color: '#d64040' },
        ].map((s, i) => (
          <div key={i} className="apr-stat">
            <div className="apr-stat-val" style={{ color: s.color }}>{s.val}</div>
            <div className="apr-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category filter pills */}
      <div className="apr-filters">
        <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>Category:</span>
        <button 
          onClick={() => handleCategoryFilter('')} 
          className={`apr-filter-pill ${categoryFilter === '' ? 'active' : ''}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat} 
            onClick={() => handleCategoryFilter(cat)} 
            className={`apr-filter-pill ${categoryFilter === cat ? 'active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="apr-table-wrap">
        {products.length === 0 ? (
          <div className="apr-empty">
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🏪</div>
            <div>No products yet</div>
          </div>
        ) : (
          <table className="apr-table">
            <thead className="apr-thead">
              <tr>
                <th className="apr-th">Product</th>
                <th className="apr-th">Category</th>
                <th className="apr-th">Price / MRP</th>
                <th className="apr-th">Stock</th>
                <th className="apr-th">Rating</th>
                <th className="apr-th">Badges</th>
                <th className="apr-th">Tags</th>
                <th className="apr-th">Action</th>
              </tr>
            </thead>
            <tbody className="apr-tbody">
              {products.map(prod => {
                const stock = prod.stock ?? 0;
                const sc = stockColor(stock);
                const stockPct = Math.min((stock / 100) * 100, 100);
                return (
                  <tr key={prod.id}>
                    <td className="apr-td">
                      <div className="apr-product-cell">
                        <div className="apr-thumb">
                          {prod.image ? (
                            <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            '💊'
                          )}
                        </div>
                        <div>
                          <div className="apr-prod-name">{prod.name}</div>
                          {prod.slug && <div className="apr-prod-slug">/{prod.slug}</div>}
                          {prod.generic && <div style={{ fontSize: '0.7rem', color: '#8b949e', marginTop: 1 }}>{prod.generic}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="apr-td">
                      <span className="apr-badge apr-badge-purple">{prod.category ?? '—'}</span>
                    </td>
                    <td className="apr-td">
                      <div className="apr-price-cell">
                        <div className="apr-price-now">₹{prod.price}</div>
                        {prod.mrp && prod.mrp > prod.price && (
                          <div className="apr-price-mrp">₹{prod.mrp}</div>
                        )}
                      </div>
                    </td>
                    <td className="apr-td">
                      <div className="apr-stock-bar">
                        <div className="apr-stock-val" style={{ color: sc }}>{stock}</div>
                        <div className="apr-stock-track">
                          <div className="apr-stock-fill" style={{ width: `${stockPct}%`, background: sc }} />
                        </div>
                      </div>
                    </td>
                    <td className="apr-td">
                      <div className="apr-rating">
                        <span className="apr-stars">★</span>
                        <span style={{ color: '#e6edf3', fontWeight: 600 }}>{prod.rating ?? '—'}</span>
                        <span style={{ color: '#8b949e', fontSize: '0.72rem' }}>({prod.reviews ?? 0})</span>
                      </div>
                    </td>
                    <td className="apr-td">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {prod.featured && <span className="apr-badge apr-badge-purple">Featured</span>}
                        {prod.bestseller && <span className="apr-badge apr-badge-yellow">Bestseller</span>}
                        {prod.combo_offer && <span className="apr-badge apr-badge-blue">Combo</span>}
                        {prod.is_antibiotic && <span className="apr-badge apr-badge-red">Rx</span>}
                        {prod.prescription_required && <span className="apr-badge apr-badge-red">Prescription</span>}
                        {stock <= 0 && <span className="apr-badge apr-badge-red">Out of Stock</span>}
                        {stock > 0 && stock <= 10 && <span className="apr-badge apr-badge-yellow">Low Stock</span>}
                      </div>
                    </td>
                    <td className="apr-td">
                      <div style={{ display: 'flex', flexWrap: 'wrap', maxWidth: 160 }}>
                        {(prod.tags ?? []).slice(0, 3).map((t: string, i: number) => (
                          <span key={i} className="apr-tag">{t}</span>
                        ))}
                        {(prod.tags ?? []).length > 3 && (
                          <span className="apr-tag">+{(prod.tags ?? []).length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="apr-td">
                      <Link href={`/admin/products/${prod.id}`} className="apr-action-btn">Edit →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}