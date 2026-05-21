'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import PrescriptionScanner from '../components/PrescriptionScanner';
import EnhancedHealthTip from '../components/EnhancedHealthTip';
import Navbar from '../components/Navbar';
import { useCart } from './context/CartContext';
import "./css/homepage.css";
import BannerCarousel from '../components/BannerCarousel';

// ========== Types ==========
interface Medicine {
  id: number;
  name: string;
  type: string;
  emoji: string;
  price: number;
  description: string;
  tags: string[];
  recommended?: boolean;
  drugName?: string;
  image?: string;
  category?: string;
  is_antibiotic?: boolean;
  pricePerTablet?: number;
}
interface AnalysisResult { summary: string; products: Medicine[]; notes?: string[]; }

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ========== Static store data ==========

const TRUST_ITEMS = [
  { icon: '🛡️', title: '100% Genuine',   sub: 'Certified products' },
  { icon: '🚚', title: 'Fast Delivery',   sub: 'Across India' },
  { icon: '🔄', title: 'Easy Returns',    sub: 'No questions asked' },
  { icon: '🔒', title: 'Secure Payment',  sub: '100% Safe & Secure' },
];

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <span style={{ color: '#f59e0b', fontSize: '0.72rem' }}>
      {'★'.repeat(full)}{'☆'.repeat(5 - full)}
    </span>
  );
}

// ========== API ==========
async function analyzeSymptoms(query: string): Promise<{ result?: AnalysisResult; error?: string }> {
  try {
    const dbRes = await fetch("/api/search-medicine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const dbData = await dbRes.json();

    if (dbRes.ok && dbData.products?.length > 0) {
      return {
        result: {
          summary: `Based on "${query}", here are the products we found.${dbData.usedFallback ? ' Showing general recommendations.' : ''}`,
          products: dbData.products.map((m: any, i: number) => ({ ...m, recommended: i === 0 })),
          notes: [
            "⚠️ Always read the label before use",
            "💊 Complete the full course as prescribed",
            "🚫 Avoid alcohol while on medication",
            "📞 Consult doctor if symptoms persist for more than 3 days",
          ],
        },
      };
    }

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || `Server error ${res.status}` };
    if (!data.products || !Array.isArray(data.products)) return { error: "Unexpected response format" };
    return { result: data };
  } catch (err) {
    return { error: `Network error: ${(err as Error).message}` };
  }
}

// ========== Main Component ==========
export default function MedAI() {
  const [query, setQuery]           = useState("");
  const [recording, setRecording]   = useState(false);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading]       = useState(false);
  const [results, setResults]       = useState<AnalysisResult | null>(null);
  const [apiError, setApiError]     = useState<string | null>(null);
  const [healthData, setHealthData] = useState<any>(null);

  // Store state
  const [storeProducts, setStoreProducts]   = useState<any[]>([]);
  const [storeLoading, setStoreLoading]     = useState(true);

  const { cart, addToCart, clearCart, cartCount } = useCart();
  const addedIds = new Set(cart.map(item => item.id));
  const recognitionRef = useRef<any>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Has the user triggered a search?
  const hasResults = !!(results || apiError || loading);

  // ── Fetch store products once ──────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/products');
        const data = await res.json();
        const products = Array.isArray(data.products)
          ? data.products.map((item: any) => {
              const price    = item.price || 0;
              const mrp      = item.mrp  || Math.round(price * 1.25);
              const discount = Math.round(((mrp - price) / mrp) * 100);
              return { ...item, price, mrp, discount, rating: (Math.random() * 1.5 + 3.8).toFixed(1) };
            })
          : [];
        setStoreProducts(products);
      } catch { /* silent */ }
      finally { setStoreLoading(false); }
    })();
  }, []);

  // ── Speech Recognition ─────────────────────────────────────
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setTranscript(t); setQuery(t);
    };
    rec.onend = () => setRecording(false);
    recognitionRef.current = rec;
  }, []);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) { alert("Voice not supported. Please type."); return; }
    if (recording) { recognitionRef.current.stop(); setRecording(false); }
    else { setTranscript(""); recognitionRef.current.start(); setRecording(true); }
  }, [recording]);

  // ── Analyze ────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true); setResults(null); setApiError(null); setHealthData(null);
    try {
      const { result, error } = await analyzeSymptoms(query);
      if (error) setApiError(error);
      else if (result) setResults(result);
      // Health advice (non-blocking)
      fetch("/api/health-advice", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ query }) })
        .then(r => r.json()).then(setHealthData).catch(() => {});
    } catch { setApiError("Failed to analyze. Please try again."); }
    finally {
      setLoading(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
    }
  };

  const handlePrescriptionProducts = (products: any[]) => {
    products.forEach(m => addToCart({ ...m, quantity: 1 }));
    alert(`Added ${products.length} medicine(s) to cart!`);
  };

  const resetAll = () => { setResults(null); setApiError(null); setQuery(""); setTranscript(""); clearCart(); };

  const getImageUrl = (m: Medicine) =>
    m.image || `https://placehold.co/400x300/0fa381/white?text=${encodeURIComponent(m.name)}`;

  return (
    <>
      <style>{`
        /* ───────── STORE EMBED STYLES ───────── */
        .home-store { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
        .home-store * { box-sizing: border-box; }

        /* Trust bar */
        .hs-trust { display: grid; grid-template-columns: repeat(4,1fr); background:#fff; border:1px solid #eee; border-radius:12px; overflow:hidden; margin-bottom:28px; }
        .hs-trust-item { display:flex; align-items:center; gap:12px; padding:14px 18px; border-right:1px solid #f0f0f0; }
        .hs-trust-item:last-child { border-right:none; }
        .hs-trust-icon { font-size:1.5rem; flex-shrink:0; }
        .hs-trust-title { font-size:0.82rem; font-weight:700; color:#1a1a1a; }
        .hs-trust-sub { font-size:0.68rem; color:#999; }

        /* Section header */
        .hs-sec-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .hs-sec-title { font-size:1.1rem; font-weight:800; color:#1a1a1a; }
        .hs-view-all { color:#1a6b3c; font-size:0.82rem; font-weight:700; text-decoration:none; cursor:pointer; }
        .hs-view-all:hover { text-decoration:underline; }

        /* Category grid */
        .hs-cat-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; margin-bottom:28px; }
        .hs-cat-card { background:#fff; border-radius:12px; padding:16px 8px; text-align:center; border:1.5px solid transparent; cursor:pointer; transition:all .2s; box-shadow:0 2px 6px rgba(0,0,0,.04); }
        .hs-cat-card:hover { border-color:#1a6b3c; transform:translateY(-2px); box-shadow:0 6px 18px rgba(26,107,60,.1); }
        .hs-cat-icon { width:54px; height:54px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.6rem; margin:0 auto 8px; }
        .hs-cat-name { font-size:0.72rem; font-weight:700; color:#333; }

        /* Product grid */
        .hs-prod-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; }
        .hs-prod-card { background:#fff; border-radius:13px; border:1.5px solid #f0f0f0; overflow:hidden; transition:all .22s; box-shadow:0 2px 6px rgba(0,0,0,.04); }
        .hs-prod-card:hover { border-color:#1a6b3c; transform:translateY(-3px); box-shadow:0 8px 24px rgba(26,107,60,.12); }
        .hs-prod-img { height:120px; display:flex; align-items:center; justify-content:center; position:relative; font-size:2.8rem; }
        .hs-disc-badge { position:absolute; top:7px; left:7px; background:#e53935; color:#fff; font-size:0.58rem; font-weight:800; padding:2px 6px; border-radius:4px; }
        .hs-prod-body { padding:10px; }
        .hs-prod-name { font-size:0.76rem; font-weight:700; color:#1a1a1a; line-height:1.3; margin-bottom:2px; }
        .hs-prod-cat  { font-size:0.64rem; color:#aaa; margin-bottom:5px; }
        .hs-prod-stars { display:flex; align-items:center; gap:3px; margin-bottom:5px; }
        .hs-rating-num { font-size:0.66rem; color:#666; font-weight:600; }
        .hs-prod-price { display:flex; align-items:baseline; gap:5px; margin-bottom:8px; }
        .hs-price-now { font-size:0.92rem; font-weight:800; color:#1a1a1a; }
        .hs-price-mrp { font-size:0.68rem; color:#ccc; text-decoration:line-through; }
        .hs-add-btn { width:100%; background:#1a6b3c; color:#fff; border:none; border-radius:7px; padding:8px 0; font-size:0.74rem; font-weight:700; font-family:inherit; cursor:pointer; transition:background .18s; }
        .hs-add-btn:hover { background:#145230; }
        .hs-add-btn.added { background:#145230; opacity:.7; cursor:default; }

        /* Results push-down animation */
        .hs-store-wrap { transition: margin-top .3s ease; }

        /* Health data cards (compact) */
        .hd-section { margin-top: 20px; }
        .hd-card { border-radius:12px; padding:16px; margin-bottom:12px; }

        /* Skeleton loading */
        .hs-skeleton { background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:8px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        @media(max-width:1024px){
          .hs-prod-grid{grid-template-columns:repeat(4,1fr)}
          .hs-cat-grid{grid-template-columns:repeat(4,1fr)}
        }
        @media(max-width:768px){
          .hs-trust{grid-template-columns:repeat(2,1fr)}
          .hs-cat-grid{grid-template-columns:repeat(3,1fr)}
          .hs-prod-grid{grid-template-columns:repeat(2,1fr)}
        }
        @media(max-width:480px){
          .hs-cat-grid{grid-template-columns:repeat(2,1fr)}
          .hs-prod-grid{grid-template-columns:repeat(2,1fr)}
          .hs-trust{grid-template-columns:1fr}
        }
      `}</style>

      <Navbar cartCount={cartCount} resetAll={resetAll} />

      {/* Banner Carousel - Only show when no search results */}
{!hasResults && <BannerCarousel />}


      {/* ── Hero ──────────────────────────────────────────────── */}
      {/* Hero section - only show when no search results */}
{!hasResults && (
  <section className="hero">
    {/* hero content */}
  </section>
)}
      <section className="hero">
        <div className="hero-badge">✦ AI-Powered Pharmacy</div>
        <h1>Describe your symptoms,<br />get the <em>right medicine</em> delivered</h1>
        <p>Tell us how you feel — type or speak — and our AI recommends the best over-the-counter treatment.</p>
      </section>

      {/* ── Daily health tip ──────────────────────────────────── */}
      <div className="max-w-720 mx-auto px-4 mb-6">
        <EnhancedHealthTip />
      </div>

      {/* ── Search Box ────────────────────────────────────────── */}
      <div className="search-box">
        <div className="search-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="search-input"
            placeholder="e.g. I have a headache and mild fever since this morning..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAnalyze()}
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults(null); setApiError(null); setHealthData(null); }}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#999", fontSize:"1.1rem", padding:"0 6px", lineHeight:1 }}
              aria-label="Clear search"
            >×</button>
          )}
        </div>

        <div className="search-actions">
          <div className="flex gap-2 flex-1">
            <button className={`voice-btn flex-1 ${recording ? "recording" : ""}`} onClick={toggleVoice}>
              {recording ? "🔴 Recording… tap to stop" : "🎙️ Describe with voice"}
            </button>
            <PrescriptionScanner onproductsDetected={handlePrescriptionProducts} onSearchQuery={handleAnalyze} />
          </div>
          <button className="analyze-btn" onClick={handleAnalyze} disabled={!query.trim() || loading}>
            {loading ? "Analyzing…" : "Find Medicine →"}
          </button>
        </div>

        {transcript && (
          <div className="voice-transcript">
            <span>🎤</span>
            <span><b>Heard:</b> {transcript}</span>
          </div>
        )}
      </div>

      {/* ── SEARCH RESULTS (shown above store when active) ────── */}
      <div ref={resultsRef}>
        {loading && (
          <div className="results-section">
            <div className="loading-state">
              <div className="spinner" />
              <p>Analyzing your symptoms and finding the best medications…</p>
            </div>
          </div>
        )}

        {apiError && !loading && (
          <div className="results-section">
            <div className="error-box">
              <h3>⚠️ Error</h3>
              <div className="error-detail">{apiError}</div>
              <button
                onClick={() => setApiError(null)}
                style={{ marginTop:12, padding:"8px 18px", background:"#1a6b3c", color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:600 }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {results && !loading && !apiError && (
          <div className="results-section">
            {/* Results header + close */}
            <div className="results-header" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
              <div>
                <h2>Recommended for You</h2>
                <p>Based on your described symptoms, here are the best options</p>
              </div>
              <button
                onClick={() => { setResults(null); setHealthData(null); }}
                style={{ flexShrink:0, background:"none", border:"1px solid #ddd", borderRadius:8, padding:"6px 14px", fontSize:"0.82rem", fontWeight:600, cursor:"pointer", color:"#666", whiteSpace:"nowrap" }}
              >
                ✕ Clear results
              </button>
            </div>

            <div className="disclaimer">
              <span>⚠️</span>
              <span><b>Medical Disclaimer:</b> These are general OTC suggestions only. Always consult a healthcare professional for serious conditions.</span>
            </div>

            {results.summary && (
              <div className="symptom-card">
                <h3>AI Assessment</h3>
                <p>{results.summary}</p>
              </div>
            )}

            {/* Medicine cards grid */}
            <div className="meds-grid">
              {results.products.map((med, idx) => {
                const price = med.price ?? med.pricePerTablet ?? 0;
                return (
                  <div key={med.id || idx} className={`med-card ${med.recommended ? "recommended" : ""}`}>
                    <div className="med-img-wrap">
                      <img
                        src={getImageUrl(med)}
                        alt={med.name}
                        className="med-img"
                        onError={e => { (e.target as HTMLImageElement).src = `https://placehold.co/400x300/0fa381/white?text=${encodeURIComponent(med.name)}`; }}
                      />
                      {med.recommended && <div className="rec-badge">⭐ Best Match</div>}
                    </div>
                    <div className="med-body">
                      <div className="med-name">{med.name}</div>
                      <div className="med-type">{med.type || med.category || 'Medicine'}</div>
                      <div className="med-desc">{med.description || 'No description available'}</div>
                      {med.tags?.length > 0 && (
                        <div className="med-tags">
                          {med.tags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                        </div>
                      )}
                      <div className="med-footer">
                        <div className="med-price">₹{price.toFixed(2)} <span>/ pack</span></div>
                        <button
                          className={`add-cart-btn ${addedIds.has(med.id) ? "added" : ""}`}
                          disabled={addedIds.has(med.id)}
                          onClick={() => addToCart({ id: med.id, name: med.name, price, quantity: 1, category: med.category, emoji: med.emoji, image: med.image })}
                        >
                          {addedIds.has(med.id) ? "✓ Added" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Safety notes */}
            {results.notes && results.notes.length > 0 && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Safety Notes</h4>
                <ul className="space-y-1">
                  {results.notes.map((note, i) => (
                    <li key={i} className="text-sm text-yellow-700">{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Health data */}
            {healthData && (
              <div className="mt-8 space-y-4">
                {healthData.disease && (
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2"><span className="text-2xl">📋</span><h3 className="font-bold text-lg text-blue-800">बीमारी की जानकारी</h3></div>
                    <h4 className="font-semibold text-blue-900">{healthData.disease.name}</h4>
                    <p className="text-blue-700 text-sm mt-1">{healthData.disease.description}</p>
                  </div>
                )}
                {healthData.immediateRelief && (
                  <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                    <div className="flex items-center gap-3 mb-3"><span className="text-2xl">⚡</span><h3 className="font-bold text-lg text-green-800">{healthData.immediateRelief.title || "तुरंत राहत के उपाय"}</h3></div>
                    <div className="space-y-3">
                      {healthData.immediateRelief.steps?.map((step: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{step.step}</span>
                            <span className="font-semibold text-gray-800">{step.action}</span>
                          </div>
                          <p className="text-xs text-gray-500 ml-8">⏱️ {step.duration}</p>
                          {step.tip && <p className="text-xs text-green-600 mt-1 ml-8">💡 {step.tip}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {healthData.homeRemedies?.length > 0 && (
                  <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-3"><span className="text-2xl">🏠</span><h3 className="font-bold text-lg text-yellow-800">घरेलू उपाय</h3></div>
                    <div className="space-y-3">
                      {healthData.homeRemedies.map((r: any, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-3">
                          <h4 className="font-semibold text-yellow-800">{r.name}</h4>
                          <p className="text-sm text-gray-700 mt-1"><strong>सामग्री:</strong> {r.ingredients?.join(", ")}</p>
                          <p className="text-sm text-gray-700 mt-1"><strong>विधि:</strong> {r.howTo}</p>
                          <p className="text-xs text-gray-500 mt-1">⏰ {r.frequency} | ✨ {r.effectiveIn}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {healthData.dietPlan && (
                  <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                    <div className="flex items-center gap-3 mb-3"><span className="text-2xl">🥗</span><h3 className="font-bold text-lg text-orange-800">आहार योजना</h3></div>
                    {healthData.dietPlan.healingFoods?.length > 0 && (
                      <div className="mb-3">
                        <p className="font-semibold text-green-700 mb-1">✅ फायदेमंद खाद्य पदार्थ:</p>
                        <div className="space-y-2">
                          {healthData.dietPlan.healingFoods.map((f: any, i: number) => (
                            <div key={i} className="bg-white rounded-lg p-2">
                              <p className="font-medium text-gray-800">{f.food}</p>
                              <p className="text-xs text-gray-600">{f.benefit}</p>
                              <p className="text-xs text-green-600">मात्रा: {f.howMuch}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {healthData.dietPlan.mealPlan && (
                      <div className="mt-3">
                        <p className="font-semibold text-orange-700 mb-1">📅 दिन का आहार:</p>
                        <div className="bg-white rounded-lg p-3 space-y-1">
                          <p className="text-sm"><strong>सुबह:</strong> {healthData.dietPlan.mealPlan.morning}</p>
                          <p className="text-sm"><strong>दोपहर:</strong> {healthData.dietPlan.mealPlan.afternoon}</p>
                          <p className="text-sm"><strong>शाम:</strong> {healthData.dietPlan.mealPlan.evening}</p>
                          <p className="text-sm"><strong>रात:</strong> {healthData.dietPlan.mealPlan.night}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {healthData.doctorVisit && (
                  <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
                    <div className="flex items-center gap-3 mb-3"><span className="text-2xl">👨‍⚕️</span><h3 className="font-bold text-lg text-indigo-800">डॉक्टर से कब मिलें</h3></div>
                    <p className="text-indigo-700 text-sm">{healthData.doctorVisit.reason}</p>
                    <div className="mt-2 inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Urgency: {healthData.doctorVisit.urgency}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          STORE SECTION — always visible, shifts down when results show
          ══════════════════════════════════════════════════════════ */}
      <div className="home-store hs-store-wrap" style={{ padding: "0 14px 40px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ── "How it works" strip — only when no search ──────── */}
        {!hasResults && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:22 }}>
            {[
              { icon:"🗣️", title:"Describe Symptoms", desc:"Type or use voice to describe how you feel." },
              { icon:"🤖", title:"AI Analysis",       desc:"AI finds the right OTC medications for you." },
              { icon:"🛒", title:"Add to Cart",       desc:"Choose your preferred medication." },
              { icon:"💳", title:"Secure Payment",    desc:"Pay with Cashfree — UPI, cards, netbanking." },
            ].map((step, i) => (
              <div key={i} style={{ background:"#fff", borderRadius:12, padding:"18px 16px", display:"flex", gap:12, alignItems:"flex-start", border:"1px solid #eee", boxShadow:"0 2px 6px rgba(0,0,0,.04)" }}>
                <span style={{ fontSize:"1.6rem", flexShrink:0 }}>{step.icon}</span>
                <div>
                  <div style={{ fontWeight:700, fontSize:"0.85rem", marginBottom:3 }}>{step.title}</div>
                  <div style={{ fontSize:"0.72rem", color:"#777", lineHeight:1.4 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Trust bar ──────────────────────────────────────── */}
        <div className="hs-trust" style={{ marginBottom:22 }}>
          {TRUST_ITEMS.map((t, i) => (
            <div key={i} className="hs-trust-item">
              <div className="hs-trust-icon">{t.icon}</div>
              <div>
                <div className="hs-trust-title">{t.title}</div>
                <div className="hs-trust-sub">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Best Selling Products ──────────────────────────── */}
        <div>
          <div className="hs-sec-head">
            <div className="hs-sec-title">
              {hasResults ? "You May Also Need" : "Best Selling Products"}
            </div>
            <Link href="/store" className="hs-view-all">View All →</Link>
          </div>

          {storeLoading ? (
            <div className="hs-prod-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background:"#fff", borderRadius:13, overflow:"hidden", border:"1.5px solid #f0f0f0" }}>
                  <div className="hs-skeleton" style={{ height:120 }} />
                  <div style={{ padding:10 }}>
                    <div className="hs-skeleton" style={{ height:12, marginBottom:6, borderRadius:4 }} />
                    <div className="hs-skeleton" style={{ height:10, width:"60%", marginBottom:8, borderRadius:4 }} />
                    <div className="hs-skeleton" style={{ height:30, borderRadius:7 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : storeProducts.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#aaa" }}>No products found.</div>
          ) : (
            <div className="hs-prod-grid">
              {storeProducts.slice(0, 12).map(p => (
                <div key={p.id} className="hs-prod-card">
                  <Link href={`/product/${p.id}`} style={{ textDecoration:"none", display:"block" }}>
                    <div className="hs-prod-img" style={{ background: p.bg || "#f3f4f6" }}>
                      {p.discount > 0 && <span className="hs-disc-badge">{p.discount}% OFF</span>}
                      {p.image
                        ? <img src={p.image} alt={p.name} style={{ maxHeight:"100%", maxWidth:"100%", objectFit:"contain" }} />
                        : <span>{p.emoji || "🛒"}</span>
                      }
                    </div>
                    <div className="hs-prod-body">
                      <div className="hs-prod-name">{p.name}</div>
                      <div className="hs-prod-cat">{p.category}</div>
                      <div className="hs-prod-stars">
                        <Stars rating={parseFloat(p.rating)} />
                        <span className="hs-rating-num">{p.rating}</span>
                      </div>
                      <div className="hs-prod-price">
                        <span className="hs-price-now">₹{p.price}</span>
                        <span className="hs-price-mrp">₹{p.mrp}</span>
                      </div>
                    </div>
                  </Link>
                  <div style={{ padding:"0 10px 10px" }}>
                    <button
                      className={`hs-add-btn ${addedIds.has(p.id) ? "added" : ""}`}
                      disabled={addedIds.has(p.id)}
                      onClick={() => addToCart({ id: p.id, name: p.name, price: p.price, quantity: 1, category: p.category, emoji: p.emoji, image: p.image })}
                    >
                      {addedIds.has(p.id) ? "✓ Added" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* See full store CTA */}
          <div style={{ textAlign:"center", marginTop:22 }}>
            <Link href="/store">
              <button style={{ background:"#1a6b3c", color:"#fff", border:"none", borderRadius:10, padding:"13px 36px", fontSize:"0.9rem", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                Browse Full Store →
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="footer">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <span>© {new Date().getFullYear()} Mediora. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy"    className="hover:text-mint transition">Privacy</Link>
            <Link href="/terms"      className="hover:text-mint transition">Terms</Link>
            <Link href="/refund"     className="hover:text-mint transition">Refund</Link>
            <Link href="/disclaimer" className="hover:text-mint transition">Disclaimer</Link>
          </div>
          <span>Not a substitute for professional medical advice.</span>
        </div>
      </footer>
    </>
  );
}