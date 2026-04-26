'use client';

import { useState, useEffect } from 'react';
import MedicineCard from './MedicineCard';

interface Medicine {
  id: number;
  name: string;
  generic: string;
  type: string;
  category: string;
  price: number;
  isAntibiotic: boolean;
  tags: string[];
  image: string;
  description: string;
  stock: number;
  quantitySelector: any;
  pricePerTablet: number;
}

interface StoreGridProps {
  onAddToCart: (medicine: any, quantity: number, quantityType: string) => void;
  searchQuery?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  all: '💊',
  pain: '🩹',
  fever: '🌡️',
  antibiotic: '🧬',
  allergy: '🌿',
  vitamins: '✨',
  digestive: '🫁',
  cold: '🤧',
  skin: '🧴',
  eye: '👁️',
  diabetes: '🩸',
  heart: '❤️',
};

function getCategoryIcon(cat: string) {
  const key = Object.keys(CATEGORY_ICONS).find(k =>
    cat.toLowerCase().includes(k)
  );
  return key ? CATEGORY_ICONS[key] : '💉';
}

export default function StoreGrid({ onAddToCart, searchQuery = '' }: StoreGridProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 200 });
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);

  useEffect(() => { fetchMedicines(); }, []);
  useEffect(() => { filterMedicines(); }, [medicines, searchQuery, selectedCategory, priceRange, showOnlyInStock]);

  const fetchMedicines = async () => {
    try {
      const response = await fetch('/api/medicines');
      const data = await response.json();
      if (data.medicines) {
        setMedicines(data.medicines);
        setFilteredMedicines(data.medicines);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMedicines = () => {
    let filtered = [...medicines];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(query) ||
        med.generic.toLowerCase().includes(query) ||
        med.category.toLowerCase().includes(query) ||
        med.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(med => med.category === selectedCategory);
    }
    filtered = filtered.filter(med => med.price >= priceRange.min && med.price <= priceRange.max);
    if (showOnlyInStock) {
      filtered = filtered.filter(med => med.stock > 0);
    }
    setFilteredMedicines(filtered);
  };

  const categories = ['all', ...new Set(medicines.map(med => med.category))];

  /* ── Loading skeletons ── */
  if (loading) {
    return (
      <>
        <style>{gridStyles}</style>
        <div className="sg-cat-bar">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="sg-cat-skeleton" />
          ))}
        </div>
        <div className="sg-topbar">
          <div style={{ width: 160, height: 16, borderRadius: 6, background: '#e8e3db' }} />
        </div>
        <div className="sg-grid">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="sg-skeleton-card">
              <div className="sg-skel-img" />
              <div className="sg-skel-body">
                <div className="sg-skel-line" style={{ width: '75%', height: 14 }} />
                <div className="sg-skel-line" style={{ width: '50%', height: 11 }} />
                <div className="sg-skel-line" style={{ width: '100%', height: 36, borderRadius: 10 }} />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <style>{gridStyles}</style>

      {/* ── Category Pills ── */}
      <div className="sg-cat-scroll-wrap">
        <div className="sg-cat-bar">
          {categories.map(cat => (
            <button
              key={cat}
              className={`sg-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <span>{getCategoryIcon(cat)}</span>
              {cat === 'all' ? 'All Medicines' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Top Bar ── */}
      <div className="sg-topbar">
        <p className="sg-results-label">
          Showing <strong>{filteredMedicines.length}</strong> of {medicines.length} medicines
          {searchQuery && <> for "<em style={{ color: 'var(--sage)' }}>{searchQuery}</em>"</>}
        </p>
        <div className="sg-filters">
          {/* Price Range */}
          <div className="sg-filter-chip">
            <span className="sg-filter-label">Max price</span>
            <input
              type="range" min={0} max={200}
              value={priceRange.max}
              onChange={e => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
              className="sg-range"
            />
            <span className="sg-filter-val">₹{priceRange.max}</span>
          </div>

          {/* In Stock */}
          <label className="sg-stock-toggle">
            <div className={`sg-toggle-track ${showOnlyInStock ? 'on' : ''}`}
              onClick={() => setShowOnlyInStock(v => !v)}>
              <div className="sg-toggle-thumb" />
            </div>
            <span>In Stock only</span>
          </label>
        </div>
      </div>

      {/* ── Grid ── */}
      {filteredMedicines.length === 0 ? (
        <div className="sg-empty">
          <div className="sg-empty-icon">🔬</div>
          <h3 className="sg-empty-title">No medicines found</h3>
          <p className="sg-empty-sub">Try a different search term or reset your filters.</p>
          <button
            className="sg-reset-btn"
            onClick={() => { setSelectedCategory('all'); setPriceRange({ min: 0, max: 200 }); setShowOnlyInStock(false); }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="sg-grid">
          {filteredMedicines.map((medicine, idx) => (
            <div
              key={medicine.id}
              className="sg-card-wrap"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <MedicineCard
                medicine={medicine}
                onAddToCart={onAddToCart}
                isRecommended={false}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── Scoped styles ── */
const gridStyles = `
  .sg-cat-scroll-wrap {
    overflow-x: auto; scrollbar-width: none;
    margin-bottom: 20px;
    padding-bottom: 2px;
  }
  .sg-cat-scroll-wrap::-webkit-scrollbar { display: none; }

  .sg-cat-bar {
    display: flex; gap: 8px;
    width: max-content; padding-bottom: 4px;
  }

  .sg-cat-skeleton {
    width: 100px; height: 36px; border-radius: 50px;
    background: linear-gradient(90deg, #f0ece6 25%, #e8e3db 50%, #f0ece6 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }

  .sg-cat-pill {
    display: flex; align-items: center; gap: 7px;
    white-space: nowrap;
    padding: 8px 18px; border-radius: 50px;
    font-size: 0.85rem; font-weight: 500;
    border: 1.5px solid #e8e3db;
    background: white; color: #666;
    cursor: pointer; transition: all 0.18s;
    font-family: 'Outfit', sans-serif;
  }
  .sg-cat-pill:hover { border-color: #74c69d; color: #2d6a4f; }
  .sg-cat-pill.active {
    background: #2d6a4f; border-color: #2d6a4f;
    color: white; box-shadow: 0 4px 14px rgba(45,106,79,0.28);
    transform: translateY(-1px);
  }

  /* ── Topbar ── */
  .sg-topbar {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
    margin-bottom: 24px;
  }
  .sg-results-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.82rem; color: #888;
  }
  .sg-results-label strong { color: #2d6a4f; font-weight: 500; }

  .sg-filters { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

  .sg-filter-chip {
    display: flex; align-items: center; gap: 10px;
    background: white; border: 1.5px solid #e8e3db;
    padding: 8px 16px; border-radius: 12px;
  }
  .sg-filter-label { font-size: 0.8rem; color: #999; white-space: nowrap; }
  .sg-range { width: 90px; accent-color: #2d6a4f; }
  .sg-filter-val {
    font-family: 'DM Mono', monospace;
    font-size: 0.82rem; color: #2d6a4f; font-weight: 500;
  }

  .sg-stock-toggle {
    display: flex; align-items: center; gap: 10px;
    background: white; border: 1.5px solid #e8e3db;
    padding: 8px 16px; border-radius: 12px;
    cursor: pointer; user-select: none;
    font-size: 0.83rem; color: #666;
  }
  .sg-toggle-track {
    width: 36px; height: 20px; border-radius: 50px;
    background: #ddd; position: relative;
    cursor: pointer; transition: background 0.2s;
    flex-shrink: 0;
  }
  .sg-toggle-track.on { background: #2d6a4f; }
  .sg-toggle-thumb {
    position: absolute; top: 3px; left: 3px;
    width: 14px; height: 14px; border-radius: 50%;
    background: white; transition: transform 0.2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  .sg-toggle-track.on .sg-toggle-thumb { transform: translateX(16px); }

  /* ── Card animation ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sg-card-wrap {
    animation: fadeUp 0.4s ease both;
  }

  /* ── Grid layout ── */
  .sg-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(255px, 1fr));
    gap: 20px;
  }

  /* ── Empty state ── */
  .sg-empty {
    text-align: center; padding: 80px 20px;
    background: white; border-radius: 20px;
    border: 1.5px dashed #e8e3db;
  }
  .sg-empty-icon { font-size: 3.5rem; margin-bottom: 16px; }
  .sg-empty-title {
    font-family: 'Fraunces', serif;
    font-size: 1.4rem; color: #1a1f1c; margin-bottom: 8px;
  }
  .sg-empty-sub { color: #999; font-size: 0.9rem; font-weight: 300; margin-bottom: 24px; }
  .sg-reset-btn {
    background: #2d6a4f; color: white;
    border: none; border-radius: 50px;
    padding: 10px 28px; font-size: 0.88rem;
    font-family: 'Outfit', sans-serif; font-weight: 500;
    cursor: pointer; transition: background 0.18s;
  }
  .sg-reset-btn:hover { background: #40916c; }

  /* ── Skeleton ── */
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .sg-skeleton-card {
    background: white; border-radius: 16px; overflow: hidden;
    border: 1px solid #e8e3db;
  }
  .sg-skel-img {
    height: 180px;
    background: linear-gradient(90deg, #f4f0ea 25%, #eae5dd 50%, #f4f0ea 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
  .sg-skel-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .sg-skel-line {
    border-radius: 6px;
    background: linear-gradient(90deg, #f4f0ea 25%, #eae5dd 50%, #f4f0ea 75%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }

  @media (max-width: 640px) {
    .sg-topbar { flex-direction: column; align-items: flex-start; }
    .sg-filters { width: 100%; }
  }
`;