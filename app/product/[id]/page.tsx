'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

// ── Types ──────────────────────────────────────────────────────────────────────
interface MedicineDetail {
  id: number;
  name: string;
  generic: string;
  category: string;
  type: string;
  price: number;
  is_antibiotic: boolean;
  tags: string[];
  image: string | null;
  description: string | null;
  stock?: number;
  created_at?: string;
}

interface Review {
  id: number;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  userImage?: string;
}

// ── Static data (for reviews, FAQs, etc.) ─────────────────────────────────────
const SIZES = ['30ml', '50ml', '100ml'];
const SKIN_TYPES = ['All Skin Types', 'Oily / Acne-Prone', 'Dry & Sensitive'];

const PRODUCT_DETAILS = [
  ['Brand', 'Mediora'],
  ['Volume', '30 ml'],
  ['Prescription Required', 'No (OTC)'],
  ['Country of Origin', 'India'],
  ['Dermatologist Tested', '✓ Yes'],
];

const FAQ = [
  { q: 'How long does it take to work?', a: 'Effects usually start within 30-60 minutes and last for 4-6 hours.' },
  { q: 'Can I take this with other products?', a: 'Consult your doctor before combining with other medications.' },
  { q: 'Is it safe during pregnancy?', a: 'Always take medical advice before using any medicine during pregnancy.' },
];

const TABS = ['Description', 'Specifications', 'How to Use', 'Reviews', 'FAQ'] as const;
type Tab = typeof TABS[number];

// ── Stars helper ───────────────────────────────────────────────────────────────
function Stars({ rating, size = '0.9rem' }: { rating: number; size?: string }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ color: '#e8a420', opacity: i <= rating ? 1 : 0.25 }}>★</span>
      ))}
    </span>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart, cartCount } = useCart();

  // State
  const [product, setProduct] = useState<MedicineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [imgFading, setImgFading] = useState(false);
  const [wishlist, setWishlist] = useState(false);
  const [activeSize, setActiveSize] = useState(0);
  const [activeSkin, setActiveSkin] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('Description');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });
  const [addedRelated, setAddedRelated] = useState<Set<number>>(new Set());
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  

  const heroRef = useRef<HTMLElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gallery images (use product image or fallback)
  const galleryImages = product?.image && product.image.length > 0
  ? product.image  // Use the images array from database
  : product?.image 
    ? [product.image]  // Fallback to single image as array
    : ['/placeholder.jpg'];

  // Safely get images array for gallery
const getDisplayImages = (product: any): string[] => {
  if (!product) return ['/placeholder.jpg', '/placeholder.jpg', '/placeholder.jpg'];
  
  // Check if product has images array
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const images = [...product.images];
    // Ensure we have at least 3 images for display
    while (images.length < 3) {
      images.push(images[0]);
    }
    return images;
  }
  
  // Fallback to single image
  if (product.image && typeof product.image === 'string') {
    return [product.image, product.image, product.image];
  }
  
  // Default placeholder
  return ['/placeholder.jpg', '/placeholder.jpg', '/placeholder.jpg'];
};

// Then in your JSX, use displayImages
const displayImages = getDisplayImages(product);
console.log('Display Images:', displayImages);
console.log('Active Index:', activeImg);
console.log('Current Image URL:', displayImages[activeImg]);



  // Fetch product from Supabase
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', Number(id))
          .single();
        if (error) throw error;
        setProduct(data);

        // Fetch related products from same category
        if (data.category) {
          const { data: related } = await supabase
            .from('products')
            .select('id, name, price, image, category')
            .eq('category', data.category)
            .neq('id', data.id)
            .limit(4);
          if (related) setRelatedProducts(related);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        router.push('/store');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, router]);

  // Mock reviews (replace with actual reviews table later)
  useEffect(() => {
    if (product) {
      setReviews([
        {
          id: 1,
          userName: 'Rahul Sharma',
          rating: 5,
          comment: 'Excellent product! Fast relief.',
          date: '2025-03-15',
          userImage: 'https://randomuser.me/api/portraits/men/1.jpg',
        },
        {
          id: 2,
          userName: 'Priya Patel',
          rating: 4,
          comment: 'Good quality, works as expected.',
          date: '2025-02-28',
          userImage: 'https://randomuser.me/api/portraits/women/2.jpg',
        },
      ]);
    }
  }, [product]);

  // Sticky CTA observer
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setStickyVisible(!e.isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ show: false, msg: '' }), 2800);
  }, []);

  const switchImg = (idx: number) => {
  console.log('Switching to image:', idx);
  setImgFading(true);
  setTimeout(() => {
    setActiveImg(idx);
    setImgFading(false);
  }, 180);
};

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      category: product.category,
      emoji: product.is_antibiotic ? '💊⚠️' : '💊',
      image: product.image || undefined,
    });
    showToast(`✓ Added to cart — ${qty} item${qty > 1 ? 's' : ''}`);
  };

  const handleAddRelated = (p: any) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      quantity: 1,
      category: p.category,
      emoji: '💊',
      image: p.image || undefined,
    });
    setAddedRelated(prev => new Set(prev).add(p.id));
    showToast(`✓ ${p.name} added!`);
  };

  if (loading) {
    return (
      <>
        <Navbar cartCount={cartCount} resetAll={() => {}} showHomeLink showStoreLink />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar cartCount={cartCount} resetAll={() => {}} showHomeLink showStoreLink />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold text-gray-700">Product not found</h2>
          <Link href="/store" className="text-mint hover:underline mt-4 inline-block">← Back to Store</Link>
        </div>
      </>
    );
  }

  const avgRating = reviews.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 4.5;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        .pdp { font-family:'DM Sans',sans-serif; background:#faf9f6; color:#0f1117; }
        .pdp * { box-sizing:border-box; }

        /* Breadcrumb */
        .pdp-crumb { max-width:1280px; margin:0 auto; padding:14px 40px; display:flex; align-items:center; gap:6px; font-size:0.75rem; color:#9299aa; }
        .pdp-crumb a { color:#9299aa; text-decoration:none; }
        .pdp-crumb a:hover { color:#1f6b44; }

        /* Main grid */
        .pdp-main { max-width:1280px; margin:0 auto; padding:0 40px 72px; display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:start; }

        /* Gallery */
        .pdp-gallery { position:sticky; top:72px; }
        .pdp-main-img {
          width:100%; aspect-ratio:1/1; border-radius:20px; overflow:hidden;
          background:#fff; border:1px solid #ece9e2;
          box-shadow:0 8px 32px rgba(0,0,0,0.1); position:relative; cursor:zoom-in;
        }
        .pdp-main-img img { width:100%; height:100%; object-fit:cover; transition:opacity 0.2s ease, transform 0.5s cubic-bezier(.4,0,.2,1); }
        .pdp-main-img:hover img { transform:scale(1.06); }
        .pdp-main-img img.fading { opacity:0; transform:scale(0.97); }
        .pdp-badge { position:absolute; top:18px; left:18px; background:#d64040; color:#fff; font-size:0.72rem; font-weight:700; padding:5px 12px; border-radius:50px; }
        .pdp-wish {
          position:absolute; top:18px; right:18px; width:38px; height:38px; border-radius:50%;
          background:rgba(255,255,255,0.9); border:none; cursor:pointer; display:flex; align-items:center; justify-content:center;
          font-size:1rem; box-shadow:0 3px 12px rgba(0,0,0,0.08); transition:all 0.2s;
        }
        .pdp-wish:hover { transform:scale(1.08); background:#fff; }

        .pdp-thumbs { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:14px; }
        .pdp-thumb { aspect-ratio:1/1; border-radius:14px; border:2px solid transparent; overflow:hidden; cursor:pointer; background:#fff; transition:all 0.2s; }
        .pdp-thumb img { width:100%; height:100%; object-fit:cover; }
        .pdp-thumb:hover { border-color:#2d9260; }
        .pdp-thumb.active { border-color:#1f6b44; box-shadow:0 0 0 3px rgba(31,107,68,0.15); }

        /* Info panel */
        .pdp-info { padding-top:8px; }
        .pdp-cat { font-size:0.72rem; font-weight:500; letter-spacing:2px; text-transform:uppercase; color:#1f6b44; margin-bottom:12px; }
        .pdp-title { font-family:'Cormorant Garamond',serif; font-size:2.6rem; font-weight:600; line-height:1.1; color:#0f1117; margin-bottom:6px; }
        .pdp-sub { font-size:0.92rem; color:#5a5f72; margin-bottom:20px; }

        .pdp-rating { display:flex; align-items:center; gap:12px; margin-bottom:24px; flex-wrap:wrap; }
        .pdp-rating-val { font-weight:600; font-size:0.9rem; }
        .pdp-rating-count { font-size:0.82rem; color:#9299aa; }
        .pdp-verified { font-size:0.72rem; color:#1f6b44; font-weight:600; background:#e8f5ee; padding:3px 10px; border-radius:50px; }

        .pdp-price-block { margin-bottom:28px; }
        .pdp-price-row { display:flex; align-items:baseline; gap:12px; margin-bottom:6px; }
        .pdp-price { font-size:2.2rem; font-weight:600; color:#0f1117; }
        .pdp-mrp { font-size:1rem; color:#9299aa; text-decoration:line-through; }
        .pdp-save { background:#fdf2e9; color:#c8935a; font-size:0.78rem; font-weight:700; padding:4px 10px; border-radius:50px; }
        .pdp-tax { font-size:0.78rem; color:#9299aa; }

        .pdp-var-label { font-size:0.78rem; font-weight:600; text-transform:uppercase; letter-spacing:1px; color:#5a5f72; margin-bottom:10px; }
        .pdp-pills { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
        .pdp-pill {
          padding:7px 18px; border-radius:50px; border:1.5px solid #ece9e2;
          background:#fff; font-size:0.84rem; font-weight:500; cursor:pointer;
          transition:all 0.2s; color:#0f1117;
        }
        .pdp-pill:hover { border-color:#2d9260; }
        .pdp-pill.active { border-color:#1f6b44; background:#e8f5ee; color:#1f6b44; }

        .pdp-qty-row { display:flex; align-items:center; gap:14px; margin-bottom:28px; }
        .pdp-qty-ctrl { display:flex; align-items:center; border:1.5px solid #ece9e2; border-radius:8px; overflow:hidden; background:#fff; }
        .pdp-qty-btn { width:40px; height:44px; border:none; background:transparent; font-size:1.1rem; cursor:pointer; transition:all 0.2s; }
        .pdp-qty-btn:hover { background:#e8f5ee; color:#1f6b44; }
        .pdp-qty-val { width:44px; text-align:center; font-size:0.95rem; font-weight:600; border:none; outline:none; background:transparent; }
        .pdp-stock { font-size:0.78rem; color:#1f6b44; font-weight:600; }

        .pdp-cta-row { display:grid; grid-template-columns:1fr auto; gap:12px; margin-bottom:12px; }
        .pdp-btn-cart { display:flex; align-items:center; justify-content:center; gap:10px; background:#0f1117; color:#fff; border:none; border-radius:14px; padding:16px 28px; font-size:0.95rem; font-weight:600; cursor:pointer; transition:all 0.22s; }
        .pdp-btn-cart:hover { background:#1f6b44; transform:translateY(-1px); }
        .pdp-btn-buy { display:flex; align-items:center; justify-content:center; gap:8px; background:#1f6b44; color:#fff; border:none; border-radius:14px; padding:16px 24px; font-size:0.95rem; font-weight:600; cursor:pointer; }
        .pdp-btn-buy:hover { background:#2d9260; transform:translateY(-1px); }
        .pdp-btn-wish { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; background:transparent; color:#5a5f72; border:1.5px solid #ece9e2; border-radius:14px; padding:12px; font-size:0.84rem; font-weight:500; cursor:pointer; margin-bottom:24px; }
        .pdp-btn-wish:hover { border-color:#d64040; color:#d64040; }
        .pdp-btn-wish.active { border-color:#d64040; color:#d64040; background:#fff5f5; }

        .pdp-trust { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding-top:24px; border-top:1px solid #ece9e2; margin-bottom:20px; }
        .pdp-trust-item { display:flex; align-items:flex-start; gap:10px; }
        .pdp-trust-icon { width:36px; height:36px; border-radius:8px; background:#e8f5ee; display:flex; align-items:center; justify-content:center; font-size:1rem; flex-shrink:0; }
        .pdp-trust-title { font-size:0.8rem; font-weight:700; color:#0f1117; margin-bottom:2px; }
        .pdp-trust-sub { font-size:0.72rem; color:#9299aa; }

        /* Tabs */
        .pdp-tabs { max-width:1280px; margin:0 auto; padding:0 40px 72px; }
        .pdp-tabs-nav { display:flex; gap:0; border-bottom:1.5px solid #ece9e2; margin-bottom:32px; overflow-x:auto; }
        .pdp-tab-btn { padding:14px 22px; background:transparent; border:none; font-size:0.88rem; font-weight:500; color:#9299aa; cursor:pointer; border-bottom:2px solid transparent; transition:all 0.2s; white-space:nowrap; }
        .pdp-tab-btn:hover { color:#0f1117; }
        .pdp-tab-btn.active { color:#1f6b44; border-bottom-color:#1f6b44; font-weight:600; }

        .pdp-desc-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:start; }
        .pdp-desc-lead { font-family:'Cormorant Garamond',serif; font-size:1.5rem; font-weight:400; line-height:1.55; color:#0f1117; margin-bottom:18px; }
        .pdp-desc-body { font-size:0.9rem; line-height:1.8; color:#5a5f72; margin-bottom:20px; }
        .pdp-check-list { list-style:none; display:flex; flex-direction:column; gap:10px; }
        .pdp-check-list li { display:flex; align-items:flex-start; gap:10px; font-size:0.88rem; color:#5a5f72; }
        .pdp-check { color:#1f6b44; font-weight:700; flex-shrink:0; }

        .pdp-info-card { background:#fff; border:1px solid #ece9e2; border-radius:20px; padding:28px; }
        .pdp-info-card-title { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; margin-bottom:16px; color:#0f1117; }
        .pdp-info-row { display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:1px solid #ece9e2; font-size:0.84rem; }
        .pdp-info-row:last-child { border-bottom:none; }
        .pdp-info-key { color:#9299aa; }
        .pdp-info-val { font-weight:600; color:#0f1117; text-align:right; }

        .pdp-step { display:flex; gap:16px; align-items:flex-start; margin-bottom:20px; }
        .pdp-step-num { width:36px; height:36px; border-radius:50%; background:#1f6b44; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0; }
        .pdp-step-title { font-weight:600; margin-bottom:4px; font-size:0.92rem; color:#0f1117; }
        .pdp-step-desc { font-size:0.84rem; color:#5a5f72; line-height:1.7; }

        /* Reviews */
        .pdp-reviews-layout { display:grid; grid-template-columns:280px 1fr; gap:48px; }
        .pdp-rating-card { background:#fff; border:1px solid #ece9e2; border-radius:20px; padding:28px; }
        .pdp-rating-big { font-family:'Cormorant Garamond',serif; font-size:4rem; font-weight:300; line-height:1; color:#0f1117; margin-bottom:8px; }
        .pdp-rating-total { font-size:0.8rem; color:#9299aa; margin-bottom:20px; }
        .pdp-bar-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
        .pdp-bar-label { font-size:0.78rem; color:#9299aa; width:12px; }
        .pdp-bar-track { flex:1; height:6px; background:#ece9e2; border-radius:50px; overflow:hidden; }
        .pdp-bar-fill { height:100%; background:#e8a420; border-radius:50px; transition:width 0.6s ease; }

        .pdp-review-card { background:#fff; border:1px solid #ece9e2; border-radius:20px; padding:24px; margin-bottom:14px; }
        .pdp-review-head { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .pdp-review-avatar { width:40px; height:40px; border-radius:50%; background:#e8f5ee; display:flex; align-items:center; justify-content:center; font-size:1rem; font-weight:700; color:#1f6b44; }
        .pdp-review-name { font-weight:600; font-size:0.9rem; color:#0f1117; }
        .pdp-review-date { font-size:0.74rem; color:#9299aa; }
        .pdp-review-title { font-weight:600; font-size:0.88rem; color:#0f1117; margin-bottom:6px; }
        .pdp-review-body { font-size:0.84rem; color:#5a5f72; line-height:1.6; }
        .pdp-review-verified { display:inline-flex; align-items:center; gap:4px; font-size:0.7rem; color:#1f6b44; font-weight:600; background:#e8f5ee; padding:2px 8px; border-radius:50px; }
        .pdp-review-helpful { display:flex; align-items:center; gap:8px; margin-top:14px; font-size:0.76rem; color:#9299aa; }
        .pdp-helpful-btn { padding:4px 12px; border-radius:50px; border:1px solid #ece9e2; background:transparent; font-size:0.74rem; cursor:pointer; }

        /* FAQ */
        .pdp-faq-item { background:#fff; border:1px solid #ece9e2; border-radius:14px; overflow:hidden; margin-bottom:12px; }
        .pdp-faq-q { width:100%; text-align:left; padding:18px 22px; background:transparent; border:none; display:flex; justify-content:space-between; align-items:center; font-size:0.92rem; font-weight:600; color:#0f1117; cursor:pointer; }
        .pdp-faq-q:hover { color:#1f6b44; }
        .pdp-faq-icon { font-size:1.1rem; transition:transform 0.2s; color:#9299aa; }
        .pdp-faq-icon.open { transform:rotate(45deg); color:#1f6b44; }
        .pdp-faq-a { padding:0 22px 18px; font-size:0.86rem; color:#5a5f72; line-height:1.7; }

        /* Related products */
        .pdp-related { max-width:1280px; margin:0 auto; padding:0 40px 80px; }
        .pdp-sec-head { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:28px; }
        .pdp-sec-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:#0f1117; }
        .pdp-sec-link { font-size:0.84rem; color:#1f6b44; font-weight:600; text-decoration:none; }
        .pdp-related-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
        .pdp-rel-card { background:#fff; border:1px solid #ece9e2; border-radius:20px; overflow:hidden; transition:all 0.22s; cursor:pointer; }
        .pdp-rel-card:hover { transform:translateY(-4px); box-shadow:0 8px 32px rgba(0,0,0,0.1); }
        .pdp-rel-img { aspect-ratio:1/1; position:relative; overflow:hidden; background:#faf9f6; display:flex; align-items:center; justify-content:center; font-size:3rem; }
        .pdp-rel-img img { width:100%; height:100%; object-fit:cover; transition:transform 0.4s; }
        .pdp-rel-card:hover .pdp-rel-img img { transform:scale(1.05); }
        .pdp-rel-disc { position:absolute; top:10px; left:10px; background:#d64040; color:#fff; font-size:0.65rem; font-weight:800; padding:3px 9px; border-radius:50px; }
        .pdp-rel-body { padding:16px; }
        .pdp-rel-cat { font-size:0.68rem; color:#9299aa; font-weight:500; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
        .pdp-rel-name { font-size:0.9rem; font-weight:600; color:#0f1117; margin-bottom:8px; }
        .pdp-rel-price { display:flex; align-items:baseline; gap:8px; margin-bottom:12px; }
        .pdp-rel-now { font-size:1rem; font-weight:700; color:#0f1117; }
        .pdp-rel-btn { width:100%; padding:10px; border-radius:8px; border:1.5px solid #1f6b44; background:transparent; color:#1f6b44; font-size:0.82rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
        .pdp-rel-btn:hover { background:#1f6b44; color:#fff; }
        .pdp-rel-btn.added { background:#1f6b44; color:#fff; cursor:default; }

        /* Sticky CTA */
        .pdp-sticky {
          position:fixed; bottom:0; left:0; right:0;
          background:rgba(250,249,246,0.96); backdrop-filter:blur(20px);
          border-top:1px solid #ece9e2; padding:14px 40px;
          display:flex; align-items:center; justify-content:space-between; gap:20px; z-index:50;
          transform:translateY(100%); transition:transform 0.32s cubic-bezier(.4,0,.2,1);
        }
        .pdp-sticky.visible { transform:translateY(0); }
        .pdp-sticky-name { font-weight:600; font-size:0.9rem; color:#0f1117; }
        .pdp-sticky-price { font-size:1.2rem; font-weight:700; color:#0f1117; }
        .pdp-sticky-cart { padding:12px 28px; border-radius:12px; background:#0f1117; color:#fff; border:none; font-size:0.88rem; font-weight:600; cursor:pointer; transition:background 0.2s; }
        .pdp-sticky-cart:hover { background:#1f6b44; }
        .pdp-sticky-buy { padding:12px 28px; border-radius:12px; background:#1f6b44; color:#fff; border:none; font-size:0.88rem; font-weight:600; cursor:pointer; transition:background 0.2s; }
        .pdp-sticky-buy:hover { background:#2d9260; }

        /* Toast */
        .pdp-toast {
          position:fixed; bottom:76px; left:50%; transform:translateX(-50%) translateY(16px);
          background:#0f1117; color:#fff; padding:12px 22px; border-radius:50px;
          font-size:0.88rem; font-weight:500; display:flex; align-items:center; gap:8px;
          opacity:0; pointer-events:none; transition:all 0.3s cubic-bezier(.4,0,.2,1);
          z-index:300; white-space:nowrap; box-shadow:0 8px 32px rgba(0,0,0,0.2);
        }
        .pdp-toast.show { opacity:1; transform:translateX(-50%) translateY(0); }

        @media (max-width:1024px) {
          .pdp-main { grid-template-columns:1fr; gap:32px; padding:0 20px 56px; }
          .pdp-gallery { position:static; }
          .pdp-desc-grid { grid-template-columns:1fr; }
          .pdp-reviews-layout { grid-template-columns:1fr; }
          .pdp-related-grid { grid-template-columns:repeat(2,1fr); }
          .pdp-tabs { padding:0 20px 56px; }
        }
        @media (max-width:640px) {
          .pdp-title { font-size:1.9rem; }
          .pdp-cta-row { grid-template-columns:1fr; }
          .pdp-related-grid { grid-template-columns:1fr; }
          .pdp-sticky { padding:12px 16px; }
          .pdp-sticky-name, .pdp-sticky-price { display:none; }
          .pdp-sticky-right { width:100%; }
          .pdp-sticky-cart, .pdp-sticky-buy { flex:1; text-align:center; }
        }
      `}</style>

      <div className="pdp">
        <Navbar cartCount={cartCount} resetAll={() => {}} showHomeLink showStoreLink />

        {/* Breadcrumb */}
        <nav className="pdp-crumb">
          <Link href="/">Home</Link>
          <span className="pdp-crumb-sep">/</span>
          <Link href="/store">Store</Link>
          <span className="pdp-crumb-sep">/</span>
          <span style={{ color: '#0f1117' }}>{product.name}</span>
        </nav>

        {/* Product Hero */}
        <section className="pdp-main" ref={heroRef}>
          {/* Gallery */}
<div className="pdp-gallery">
  <div className="pdp-main-img">
    {displayImages && displayImages[activeImg] ? (
      <img 
        src={displayImages[activeImg]} 
        alt={product.name} 
        className={imgFading ? 'fading' : ''}
        onError={(e) => {
          console.error('Image load error:', displayImages[activeImg]);
          e.currentTarget.src = '/placeholder.jpg';
        }}
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <span className="text-5xl">💊</span>
      </div>
    )}
    <div className="pdp-badge">{product.is_antibiotic ? 'Prescription' : 'OTC'}</div>
    <button
      className="pdp-wish"
      onClick={() => {
        setWishlist(!wishlist);
        showToast(wishlist ? 'Removed from Wishlist' : 'Saved to Wishlist ♥');
      }}
      style={{ color: wishlist ? '#d64040' : '#9299aa' }}
    >
      {wishlist ? '♥' : '♡'}
    </button>
  </div>
  
  {/* Thumbnails */}
  <div className="pdp-thumbs">
    {displayImages.map((src, i) => (
      <div 
        key={i} 
        className={`pdp-thumb${activeImg === i ? ' active' : ''}`} 
        onClick={() => switchImg(i)}
      >
        <img 
          src={src} 
          alt={`Thumbnail ${i + 1}`}
          onError={(e) => {
            e.currentTarget.src = '/placeholder.jpg';
          }}
        />
      </div>
    ))}
  </div>
</div>

          {/* Info Panel */}
          <div className="pdp-info">
            <div className="pdp-cat">{product.category}</div>
            <h1 className="pdp-title">{product.name}</h1>
            <p className="pdp-sub">Generic: {product.generic} · {product.type}</p>

            <div className="pdp-rating">
              <Stars rating={avgRating} size="1rem" />
              <span className="pdp-rating-val">{avgRating.toFixed(1)}</span>
              <span className="pdp-rating-count">{reviews.length} reviews</span>
              <span className="pdp-verified">✓ Verified Medicine</span>
            </div>

            <div className="pdp-price-block">
              <div className="pdp-price-row">
                <span className="pdp-price">₹{product.price}</span>
                <span className="pdp-mrp">₹{Math.round(product.price * 1.2)}</span>
                <span className="pdp-save">Save ₹{Math.round(product.price * 0.2)}</span>
              </div>
              <div className="pdp-tax">Inclusive of all taxes · Free delivery above ₹299</div>
            </div>

            {/* Size Variation (if applicable) */}
            <div className="pdp-var-label">Size: <span>{SIZES[activeSize]}</span></div>
            <div className="pdp-pills">
              {SIZES.map((s, i) => (
                <button key={i} className={`pdp-pill${activeSize === i ? ' active' : ''}`} onClick={() => setActiveSize(i)}>{s}</button>
              ))}
            </div>

            {/* Skin Type (if applicable) */}
            <div className="pdp-var-label">Suitable for: <span>{SKIN_TYPES[activeSkin]}</span></div>
            <div className="pdp-pills">
              {SKIN_TYPES.map((s, i) => (
                <button key={i} className={`pdp-pill${activeSkin === i ? ' active' : ''}`} onClick={() => setActiveSkin(i)}>{s}</button>
              ))}
            </div>

            {/* Quantity */}
            <div className="pdp-var-label" style={{ marginBottom: 10 }}>Quantity</div>
            <div className="pdp-qty-row">
              <div className="pdp-qty-ctrl">
                <button className="pdp-qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <div className="pdp-qty-div" />
                <input className="pdp-qty-val" type="text" value={qty} readOnly />
                <div className="pdp-qty-div" />
                <button className="pdp-qty-btn" onClick={() => setQty(q => Math.min(10, q + 1))}>+</button>
              </div>
              <span className="pdp-stock">✓ In Stock — ships in 1–2 days</span>
            </div>

            {/* CTAs */}
            <div className="pdp-cta-row">
              <button className="pdp-btn-cart" onClick={handleAddToCart}>🛒 Add to Cart</button>
              <button className="pdp-btn-buy" onClick={() => showToast('Redirecting to checkout...')}>⚡ Buy Now</button>
            </div>
            <button
              className={`pdp-btn-wish${wishlist ? ' active' : ''}`}
              onClick={() => {
                setWishlist(!wishlist);
                showToast(wishlist ? 'Removed from Wishlist' : 'Saved to Wishlist ♥');
              }}
            >
              {wishlist ? '♥' : '♡'} {wishlist ? 'Saved to Wishlist' : 'Save to Wishlist'}
            </button>

            {/* Trust Signals */}
            <div className="pdp-trust">
              {[
                { icon: '🔄', title: 'Easy Returns', sub: '7-day return policy' },
                { icon: '🛡️', title: '100% Genuine', sub: 'Directly sourced' },
                { icon: '🚚', title: 'Fast Delivery', sub: '1–3 business days' },
              ].map((t, i) => (
                <div className="pdp-trust-item" key={i}>
                  <div className="pdp-trust-icon">{t.icon}</div>
                  <div><div className="pdp-trust-title">{t.title}</div><div className="pdp-trust-sub">{t.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabs Section */}
        <div className="pdp-tabs">
          <div className="pdp-tabs-nav">
            {TABS.map(t => (
              <button key={t} className={`pdp-tab-btn${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
            ))}
          </div>

          {/* Description Tab */}
          {activeTab === 'Description' && (
            <div className="pdp-desc-grid">
              <div>
                <p className="pdp-desc-lead">{product.name} – trusted by thousands for effective relief.</p>
                <p className="pdp-desc-body">{product.description || `${product.generic} is used for ${product.category.toLowerCase()}. ${product.is_antibiotic ? 'Antibiotic – complete full course as prescribed.' : 'OTC medicine for relief.'}`}</p>
                {product.tags && product.tags.length > 0 && (
                  <>
                    <h3 className="text-md font-semibold mt-4 mb-2">Key Benefits</h3>
                    <ul className="pdp-check-list">
                      {product.tags.map((tag, i) => <li key={i}><span className="pdp-check">✓</span>{tag}</li>)}
                    </ul>
                  </>
                )}
              </div>
              <div className="pdp-info-card">
                <div className="pdp-info-card-title">Product Details</div>
                {PRODUCT_DETAILS.map(([k, v]) => (
                  <div className="pdp-info-row" key={k}><span className="pdp-info-key">{k}</span><span className="pdp-info-val">{v}</span></div>
                ))}
                <div className="pdp-info-row"><span className="pdp-info-key">Generic Name</span><span className="pdp-info-val">{product.generic}</span></div>
                <div className="pdp-info-row"><span className="pdp-info-key">Type</span><span className="pdp-info-val">{product.type}</span></div>
              </div>
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === 'Specifications' && (
            <div className="pdp-desc-grid">
              <div>
                <p className="pdp-desc-lead">Technical details and usage information.</p>
                <ul className="pdp-check-list">
                  <li><span className="pdp-check">✓</span><strong>Dosage:</strong> As prescribed by doctor</li>
                  <li><span className="pdp-check">✓</span><strong>Storage:</strong> Store in a cool, dry place away from sunlight</li>
                  <li><span className="pdp-check">✓</span><strong>Manufacturer:</strong> Mediora Pharmaceuticals</li>
                  <li><span className="pdp-check">✓</span><strong>Safety:</strong> For external use only. Keep out of reach of children.</li>
                </ul>
              </div>
              <div className="pdp-info-card">
                <div className="pdp-info-card-title">Safety Information</div>
                <p className="text-sm text-gray-600">Read the label carefully before use. Do not exceed the recommended dose. Consult your doctor if symptoms persist.</p>
              </div>
            </div>
          )}

          {/* How to Use Tab */}
          {activeTab === 'How to Use' && (
            <div className="pdp-desc-grid">
              <div>
                <p className="pdp-desc-lead">Follow these steps for best results.</p>
                <div style={{ marginTop: 20 }}>
                  <div className="pdp-step">
                    <div className="pdp-step-num">1</div>
                    <div><div className="pdp-step-title">Read the label</div><div className="pdp-step-desc">Carefully read the product label and dosage instructions.</div></div>
                  </div>
                  <div className="pdp-step">
                    <div className="pdp-step-num">2</div>
                    <div><div className="pdp-step-title">Take as directed</div><div className="pdp-step-desc">Follow the prescribed dosage and timing.</div></div>
                  </div>
                  <div className="pdp-step">
                    <div className="pdp-step-num">3</div>
                    <div><div className="pdp-step-title">Complete the course</div><div className="pdp-step-desc">Complete the full course as prescribed, especially for antibiotics.</div></div>
                  </div>
                </div>
              </div>
              <div className="pdp-info-card">
                <div className="pdp-info-card-title">Pro Tips</div>
                {[
                  ['Frequency', 'As prescribed'],
                  ['Best time', 'With or after meals'],
                  ['Missed dose', 'Take as soon as you remember'],
                  ['Consult doctor', 'If symptoms persist beyond 3 days'],
                ].map(([k, v]) => (
                  <div className="pdp-info-row" key={k}><span className="pdp-info-key">{k}</span><span className="pdp-info-val">{v}</span></div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'Reviews' && (
            <div className="pdp-reviews-layout">
              <div className="pdp-rating-card">
                <div className="pdp-rating-big">{avgRating.toFixed(1)}</div>
                <Stars rating={avgRating} size="1.2rem" />
                <div className="pdp-rating-total">Based on {reviews.length} reviews</div>
              </div>
              <div>
                {reviews.map((r) => (
                  <div className="pdp-review-card" key={r.id}>
                    <div className="pdp-review-head">
                      <div className="pdp-review-avatar">{r.userName[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div className="pdp-review-name">{r.userName}</div>
                        <Stars rating={r.rating} size="0.76rem" />
                      </div>
                      <span className="pdp-review-date">{new Date(r.date).toLocaleDateString()}</span>
                    </div>
                    <div className="pdp-review-body">{r.comment}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQ Tab */}
          {activeTab === 'FAQ' && (
            <div style={{ maxWidth: 720 }}>
              {FAQ.map((f, i) => (
                <div className="pdp-faq-item" key={i}>
                  <button className="pdp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    {f.q}
                    <span className={`pdp-faq-icon${openFaq === i ? ' open' : ''}`}>+</span>
                  </button>
                  {openFaq === i && <div className="pdp-faq-a">{f.a}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="pdp-related">
            <div className="pdp-sec-head">
              <h2 className="pdp-sec-title">You may also like</h2>
              <Link href="/store" className="pdp-sec-link">View all →</Link>
            </div>
            <div className="pdp-related-grid">
              {relatedProducts.map((rel) => (
                <div className="pdp-rel-card" key={rel.id}>
                  <Link href={`/product/${rel.id}`}>
                    <div className="pdp-rel-img">
                      {rel.image ? (
                        <img src={rel.image} alt={rel.name} />
                      ) : (
                        <span className="text-5xl">💊</span>
                      )}
                    </div>
                    <div className="pdp-rel-body">
                      <div className="pdp-rel-cat">{rel.category}</div>
                      <div className="pdp-rel-name">{rel.name}</div>
                      <div className="pdp-rel-price">
                        <span className="pdp-rel-now">₹{rel.price}</span>
                      </div>
                      <button
                        className={`pdp-rel-btn${addedRelated.has(rel.id) ? ' added' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleAddRelated(rel); }}
                      >
                        {addedRelated.has(rel.id) ? '✓ Added' : 'Add to Cart'}
                      </button>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div className={`pdp-sticky${stickyVisible ? ' visible' : ''}`}>
        <div>
          <div className="pdp-sticky-name">{product.name}</div>
          <div className="pdp-sticky-price">₹{product.price} <span style={{ fontSize: '0.78rem', textDecoration: 'line-through', color: '#9299aa' }}>₹{Math.round(product.price * 1.2)}</span></div>
        </div>
        <div className="pdp-sticky-right">
          <button className="pdp-sticky-cart" onClick={handleAddToCart}>Add to Cart</button>
          <button className="pdp-sticky-buy" onClick={() => showToast('Redirecting to checkout...')}>Buy Now ⚡</button>
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`pdp-toast${toast.show ? ' show' : ''}`}>
        <span>✓</span>
        <span>{toast.msg}</span>
      </div>
    </>
  );
}