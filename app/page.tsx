'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import PrescriptionScanner from './components/PrescriptionScanner';
import MedicineCard from './components/MedicineCard';
import EnhancedHealthTip from './components/EnhancedHealthTip';
import Navbar from './components/Navbar';

// ========== Web Speech API Type Declarations ==========
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  interpretation: any;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    Cashfree: any;
  }
}

// ========== Application Types ==========
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
  imageQuery?: string;
  image?: string;
  dosage?: string;
  category?: string;
  isAntibiotic?: boolean;
  usage?: {
    frequency: string;
    duration: string;
    totalTablets: number;
  };
  quantitySelector?: {
    allowLoose: boolean;
    tabletsPerStrip: number;
    minQuantity: number;
    maxQuantity: number;
    defaultQuantity: number;
    step: number;
    recommendedType: string;
    note: string;
  };
  pricePerTablet?: number;
  estimatedTotalPrice?: number;
}
interface CartItem extends Medicine { qty: number; }
interface AnalysisResult { summary: string; medicines: Medicine[]; notes?: string[]; }
interface Address { name: string; line1: string; city: string; zip: string; phone: string; email?: string; }

// ========== CSS (your full CSS – unchanged) ==========
const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --mint: #0fa381;
    --mint-light: #e6f7f3;
    --mint-dark: #0a7860;
    --cream: #faf9f6;
    --stone: #f0ede7;
    --ink: #1a1a2e;
    --ink-soft: #4a4a6a;
    --red: #e05c5c;
    --gold: #f0b429;
    --card-shadow: 0 4px 24px rgba(15,163,129,.12);
    --radius: 16px;
  }

  body { font-family:'Outfit',sans-serif; background:var(--cream); color:var(--ink); min-height:100vh; }

  .nav { position:sticky;top:0;z-index:100;background:rgba(250,249,246,.9);backdrop-filter:blur(12px);
         border-bottom:1px solid rgba(15,163,129,.15);display:flex;align-items:center;
         justify-content:space-between;padding:0 40px;height:64px; }
  .nav-logo { font-family:'DM Serif Display',serif;font-size:1.5rem;color:var(--mint);
              display:flex;align-items:center;gap:8px;cursor:pointer; }
  .nav-logo span { color:var(--ink); }
  .nav-actions { display:flex;align-items:center;gap:16px; }
  .cart-btn { background:var(--mint);color:#fff;border:none;border-radius:40px;
              padding:8px 20px;font-family:'Outfit',sans-serif;font-weight:600;
              cursor:pointer;display:flex;align-items:center;gap:8px;transition:background .2s; }
  .cart-btn:hover { background:var(--mint-dark); }
  .cart-count { background:#fff;color:var(--mint);border-radius:50%;
                width:20px;height:20px;font-size:.7rem;font-weight:700;
                display:flex;align-items:center;justify-content:center; }

  .hero { padding:80px 40px 60px;text-align:center;position:relative;overflow:hidden; }
  .hero::before { content:'';position:absolute;inset:0;
    background:radial-gradient(ellipse 70% 50% at 50% 0%, rgba(15,163,129,.12) 0%, transparent 70%);
    pointer-events:none; }
  .hero-badge { display:inline-flex;align-items:center;gap:6px;background:var(--mint-light);
                color:var(--mint-dark);border-radius:40px;padding:6px 16px;
                font-size:.8rem;font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-bottom:24px; }
  .hero h1 { font-family:'DM Serif Display',serif;font-size:clamp(2.2rem,5vw,3.8rem);
             line-height:1.12;max-width:700px;margin:0 auto 16px;color:var(--ink); }
  .hero h1 em { color:var(--mint);font-style:normal; }
  .hero p { font-size:1.1rem;color:var(--ink-soft);max-width:500px;margin:0 auto 48px;line-height:1.6; }

  .search-box { background:#fff;border-radius:24px;box-shadow:var(--card-shadow);
                max-width:720px;margin:0 auto;padding:24px;border:1.5px solid rgba(15,163,129,.2); }
  .search-input-wrap { display:flex;align-items:center;gap:12px;border:1.5px solid #e0ddd8;
                       border-radius:14px;padding:12px 16px;background:var(--cream);transition:border-color .2s; }
  .search-input-wrap:focus-within { border-color:var(--mint); }
  .search-input { border:none;background:transparent;font-family:'Outfit',sans-serif;
                  font-size:1rem;color:var(--ink);flex:1;outline:none; }
  .search-input::placeholder { color:#a0a0b8; }
  .search-actions { display:flex;align-items:center;gap:10px;margin-top:14px; }
  .voice-btn { display:flex;align-items:center;gap:8px;background:var(--mint-light);
               color:var(--mint-dark);border:none;border-radius:10px;padding:10px 18px;
               font-family:'Outfit',sans-serif;font-weight:600;cursor:pointer;transition:all .2s;flex:1;
               justify-content:center; }
  .voice-btn:hover { background:var(--mint);color:#fff; }
  .voice-btn.recording { background:var(--red);color:#fff;animation:pulse 1s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.7} }
  .analyze-btn { background:var(--mint);color:#fff;border:none;border-radius:10px;
                 padding:10px 28px;font-family:'Outfit',sans-serif;font-weight:700;
                 cursor:pointer;transition:background .2s;white-space:nowrap; }
  .analyze-btn:hover:not(:disabled) { background:var(--mint-dark); }
  .analyze-btn:disabled { opacity:.5;cursor:not-allowed; }
  .voice-transcript { margin-top:12px;padding:10px 14px;background:var(--mint-light);
                      border-radius:10px;font-size:.9rem;color:var(--mint-dark);display:flex;gap:8px;align-items:flex-start; }

  .error-box { background:#fff0f0;border:1.5px solid rgba(224,92,92,.3);border-radius:16px;
               padding:24px;margin-bottom:32px; }
  .error-box h3 { color:var(--red);font-size:1rem;margin-bottom:12px;display:flex;align-items:center;gap:8px; }
  .error-detail { font-family:monospace;background:#fff;border:1px solid #f0c0c0;border-radius:8px;
                  padding:10px 14px;font-size:.82rem;color:#c0392b;word-break:break-all;margin:10px 0; }

  .loading-state { padding:48px;text-align:center; }
  .spinner { width:48px;height:48px;border:3px solid var(--mint-light);
             border-top-color:var(--mint);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 20px; }
  @keyframes spin { to { transform:rotate(360deg); } }

  .results-section { max-width:1100px;margin:0 auto;padding:0 40px 80px; }
  .results-header { margin-bottom:32px; }
  .results-header h2 { font-family:'DM Serif Display',serif;font-size:1.8rem;margin-bottom:6px; }
  .disclaimer { display:flex;gap:10px;align-items:flex-start;background:#fff8e7;
                border:1.5px solid #f0b42944;border-radius:12px;padding:14px 18px;
                margin-bottom:28px;font-size:.85rem;color:#7a5a00; }

  .meds-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:24px; }

  .symptom-card { background:var(--mint-light);border-radius:var(--radius);padding:20px 24px;
                  margin-bottom:28px;border:1.5px solid rgba(15,163,129,.2); }
  .symptom-card h3 { font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;
                     color:var(--mint-dark);margin-bottom:8px; }

  /* Medicine Card Image Styles */
  .med-img-wrap {
    position: relative;
    width: 100%;
    height: 180px;
    background: var(--mint-light);
    border-radius: var(--radius) var(--radius) 0 0;
    overflow: hidden;
  }
  .med-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  .med-card:hover .med-img {
    transform: scale(1.05);
  }
  .med-card {
    background: white;
    border-radius: var(--radius);
    overflow: hidden;
    transition: all 0.3s ease;
    border: 1px solid var(--stone);
  }
  .med-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--card-shadow);
    border-color: var(--mint);
  }
  .med-card.recommended {
    border: 2px solid var(--mint);
  }
  .rec-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: var(--mint);
    color: white;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    z-index: 10;
  }
  .med-body {
    padding: 16px;
  }
  .med-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
    margin-bottom: 4px;
  }
  .med-type {
    font-size: 0.75rem;
    color: var(--mint-dark);
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .med-desc {
    font-size: 0.85rem;
    color: var(--ink-soft);
    margin-bottom: 12px;
    line-height: 1.4;
  }
  .med-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 12px;
  }
  .tag {
    background: var(--stone);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    color: var(--ink-soft);
  }
  .med-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid var(--stone);
  }
  .med-price {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--mint-dark);
  }
  .med-price span {
    font-size: 0.7rem;
    font-weight: normal;
    color: var(--ink-soft);
  }
  .add-cart-btn {
    background: var(--mint);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }
  .add-cart-btn:hover {
    background: var(--mint-dark);
  }
  .add-cart-btn.added {
    background: var(--mint-dark);
  }

  .cart-overlay { position:fixed;inset:0;background:rgba(26,26,46,.4);z-index:200;animation:fadeIn .2s; }
  @keyframes fadeIn { from{opacity:0}to{opacity:1} }
  .cart-panel { position:fixed;right:0;top:0;bottom:0;width:440px;background:#fff;
                z-index:201;display:flex;flex-direction:column;animation:slideIn .3s;
                box-shadow:-8px 0 40px rgba(0,0,0,.12); }
  @keyframes slideIn { from{transform:translateX(100%)}to{transform:translateX(0)} }
  .cart-header { padding:24px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between; }
  .cart-header h2 { font-family:'DM Serif Display',serif;font-size:1.4rem; }
  .close-btn { background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--ink-soft);
               width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px; }
  .close-btn:hover { background:var(--stone); }
  .cart-items { flex:1;overflow-y:auto;padding:16px 24px; }
  .cart-item { display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #f0ede7; }
  .cart-item-icon { width:48px;height:48px;background:var(--mint-light);border-radius:10px;
                    display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0; }
  .cart-item-info { flex:1; }
  .cart-item-name { font-weight:600;font-size:.92rem; }
  .cart-item-price { color:var(--mint-dark);font-weight:700;font-size:.88rem; }
  .cart-item-qty { display:flex;align-items:center;gap:8px; }
  .qty-btn { background:var(--stone);border:none;width:26px;height:26px;border-radius:6px;
             cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center; }
  .qty-btn:hover { background:var(--mint-light); }
  .cart-empty { padding:60px 0;text-align:center;color:var(--ink-soft); }
  .cart-footer { padding:20px 24px;border-top:1px solid #eee; }
  .cart-total { display:flex;justify-content:space-between;font-size:1.1rem;font-weight:700;margin-bottom:16px; }
  .checkout-btn { width:100%;background:var(--mint);color:#fff;border:none;border-radius:12px;
                  padding:16px;font-family:'Outfit',sans-serif;font-size:1rem;font-weight:700;cursor:pointer; }
  .checkout-btn:hover { background:var(--mint-dark); }

  .modal-overlay { position:fixed;inset:0;background:rgba(26,26,46,.5);z-index:300;
                   display:flex;align-items:center;justify-content:center;animation:fadeIn .2s;padding:20px; }
  .modal { background:#fff;border-radius:24px;width:100%;max-width:560px;max-height:90vh;
           overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2); }
  .modal-header { padding:28px 28px 0;display:flex;align-items:center;justify-content:space-between; }
  .modal-header h2 { font-family:'DM Serif Display',serif;font-size:1.5rem; }
  .modal-body { padding:24px 28px 28px; }
  .step-indicator { display:flex;gap:8px;margin-bottom:28px; }
  .step-dot { height:4px;flex:1;border-radius:4px;background:var(--stone);transition:background .3s; }
  .step-dot.active { background:var(--mint); }
  .field-group { margin-bottom:18px; }
  .field-group label { display:block;font-size:.8rem;font-weight:700;text-transform:uppercase;
                       letter-spacing:.07em;color:var(--ink-soft);margin-bottom:6px; }
  .field-input { width:100%;border:1.5px solid #e0ddd8;border-radius:10px;padding:12px 14px;
                 font-family:'Outfit',sans-serif;font-size:.95rem;color:var(--ink);
                 background:var(--cream);outline:none;transition:border-color .2s; }
  .field-input:focus { border-color:var(--mint); }
  .field-row { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
  .modal-actions { display:flex;gap:12px;margin-top:24px; }
  .btn-secondary { flex:1;background:var(--stone);border:none;border-radius:12px;padding:14px;
                   font-family:'Outfit',sans-serif;font-weight:600;cursor:pointer; }
  .btn-secondary:hover { background:#e0ddd8; }
  .btn-primary { flex:2;background:var(--mint);color:#fff;border:none;border-radius:12px;padding:14px;
                 font-family:'Outfit',sans-serif;font-weight:700;cursor:pointer;transition:background .2s; }
  .btn-primary:hover:not(:disabled) { background:var(--mint-dark); }
  .btn-primary:disabled { opacity:.55;cursor:not-allowed; }

  .success-view { text-align:center;padding:48px 28px; }
  .success-icon { width:80px;height:80px;background:var(--mint-light);border-radius:50%;
                  display:flex;align-items:center;justify-content:center;font-size:2.5rem;margin:0 auto 20px; }
  .track-id { background:var(--mint-light);color:var(--mint-dark);border-radius:10px;
              padding:10px 20px;font-weight:700;display:inline-block;margin-bottom:28px; }

  .how-section { background:#fff;padding:80px 40px; }
  .how-section h2 { font-family:'DM Serif Display',serif;font-size:2rem;text-align:center;margin-bottom:48px; }
  .steps-grid { display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;max-width:900px;margin:0 auto; }
  .step-card { text-align:center; }
  .step-num { width:52px;height:52px;background:var(--mint-light);border-radius:14px;
              display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 16px; }

  .footer { padding:32px 40px;border-top:1px solid #e8e5df;display:flex;align-items:center;
            justify-content:space-between;color:var(--ink-soft);font-size:.85rem; }

  /* Health Tips Section Styles */
  .bg-blue-50 { background: #eff6ff; }
  .bg-green-50 { background: #f0fdf4; }
  .bg-orange-50 { background: #fff7ed; }
  .bg-purple-50 { background: #faf5ff; }
  .text-blue-800 { color: #1e40af; }
  .text-blue-900 { color: #1e3a8a; }
  .text-blue-700 { color: #1d4ed8; }
  .text-green-800 { color: #166534; }
  .text-green-700 { color: #15803d; }
  .text-orange-800 { color: #9a3412; }
  .text-purple-800 { color: #5b21b6; }
  .text-purple-600 { color: #7c3aed; }
  .bg-green-100 { background: #dcfce7; }
  .bg-red-100 { background: #fee2e2; }

  @media(max-width:600px) {
    .nav { padding:0 20px; }
    .hero { padding:48px 20px 40px; }
    .search-box { padding:16px; }
    .search-actions { flex-direction:column; }
    .results-section { padding:0 20px 60px; }
    .cart-panel { width:100%; }
    .how-section { padding:60px 20px; }
    .footer { flex-direction:column;gap:8px;text-align:center; }
    .meds-grid { grid-template-columns:1fr; }
  }
`;

// ========== API Call (YOUR WORKING VERSION – UNCHANGED) ==========
async function analyzeSymptoms(query: string): Promise<{ result?: AnalysisResult; error?: string }> {
  try {
    // First, try to search from Supabase database
    console.log("🔍 Searching database for:", query);
    
    const dbResponse = await fetch("/api/search-medicine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const dbData = await dbResponse.json();

    if (dbResponse.ok && dbData.medicines && dbData.medicines.length > 0) {
      console.log("✅ Found medicines in database:", dbData.medicines.length);
      
      // Format database results
      const result: AnalysisResult = {
        summary: `Based on your search "${query}", here are the medicines we found. ${dbData.usedFallback ? 'We showed general recommendations since no exact match was found.' : ''}`,
        medicines: dbData.medicines.map((med: any, idx: number) => ({
          ...med,
          id: med.id,
          recommended: idx === 0,
        })),
        notes: [
          "⚠️ Always read the label before use",
          "💊 Complete the full course as prescribed",
          "🚫 Avoid alcohol while on medication",
          "📞 Consult doctor if symptoms persist for more than 3 days"
        ]
      };
      
      return { result };
    }

    // If database search fails or returns no results, fallback to Groq AI
    console.log("🔄 No database results, falling back to Groq AI");
    
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || `Server error ${response.status}` };
    }

    if (!data.medicines || !Array.isArray(data.medicines)) {
      return { error: "AI returned an unexpected format" };
    }

    return { result: data };
  } catch (err) {
    console.error("Analysis error:", err);
    return { error: `Network error: ${(err as Error).message}` };
  }
}

// ========== Main Component ==========
export default function MedAI() {
  const [query, setQuery] = useState<string>("");
  const [recording, setRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [checkout, setCheckout] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<number>(1);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [healthData, setHealthData] = useState<any>(null);

  const [address, setAddress] = useState<Address>({ name: "", line1: "", city: "", zip: "", phone: "", email: "" });

  const recognitionRef = useRef<any>(null);
  const { isSignedIn } = useAuth();

  // Load Cashfree SDK (replaces Razorpay)
  useEffect(() => {
    const loadCashfree = async () => {
      if (!window.Cashfree) {
        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;
        script.onload = () => console.log("✅ Cashfree SDK loaded");
        script.onerror = () => console.error("❌ Cashfree SDK failed to load");
        document.body.appendChild(script);
      }
    };
    loadCashfree();
  }, []);

  // Cart event listener
  useEffect(() => {
    const handleOpenCart = () => setCartOpen(true);
    window.addEventListener('openCart', handleOpenCart);
    return () => window.removeEventListener('openCart', handleOpenCart);
  }, []);

  // Speech Recognition (unchanged)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      const transcriptText = Array.from(event.results).map((result: any) => result[0].transcript).join("");
      setTranscript(transcriptText);
      setQuery(transcriptText);
    };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) {
      alert("Voice recognition not supported. Please type your symptoms.");
      return;
    }
    if (recording) {
      recognitionRef.current.stop();
      setRecording(false);
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setRecording(true);
    }
  }, [recording]);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    setApiError(null);
    setAddedIds(new Set());
    setHealthData(null);

    try {
      const { result, error } = await analyzeSymptoms(query);
      
      if (error) {
        setApiError(error);
      } else if (result) {
        setResults(result);
      }
      
      try {
        const healthResponse = await fetch("/api/health-advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const healthDataResult = await healthResponse.json();
        setHealthData(healthDataResult);
      } catch (healthError) {
        console.error("Health tips error:", healthError);
      }
      
    } catch (err) {
      console.error("Analysis error:", err);
      setApiError("Failed to analyze symptoms. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => document.getElementById("results-anchor")?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handlePrescriptionMedicines = async (medicines: any[]) => {
    medicines.forEach(medicine => addToCart(medicine));
    alert(`Added ${medicines.length} medicine(s) from prescription to cart!`);
  };

  const addToCart = (med: Medicine) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === med.id);
      if (existing) return prev.map(item => item.id === med.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...med, qty: 1 }];
    });
    setAddedIds(prev => new Set(prev).add(med.id));
  };

  const addToCartFromMedicine = (medicine: any, quantity: number, quantityType: string) => {
    const cartItem = {
      ...medicine,
      id: Date.now() + Math.random(),
      qty: quantity,
      price: medicine.pricePerTablet || medicine.price / 10,
      totalPrice: (medicine.pricePerTablet || medicine.price / 10) * quantity
    };
    setCart(prev => [...prev, cartItem]);
    alert(`✅ Added ${quantity} ${quantityType} tablets of ${medicine.name} to cart!`);
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + delta } : item).filter(item => item.qty > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.pricePerTablet || item.price) * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // -------------------- CASHFREE PAYMENT HANDLER --------------------
  const handlePayment = async () => {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  if (!address.name || !address.phone) {
    alert("Please fill in your name and phone number.");
    setCheckoutStep(1);
    return;
  }

  setIsProcessingPayment(true);
  try {
    const orderId = `MED_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const amountInRupees = cartTotal + 4.99;

    const res = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: amountInRupees,
        orderId,
        customerName: address.name,
        customerEmail: address.email || "customer@medai.com",
        customerPhone: address.phone,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create Cashfree order");
    }

    const data = await res.json();
    const paymentSessionId = data.payment_session_id;
    if (!paymentSessionId) throw new Error("No payment session ID received");

    // Load Cashfree SDK dynamically
    const cashfree = new (window as any).Cashfree({
  mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === "PRODUCTION"
    ? "production"
    : "sandbox",
});

cashfree.checkout({
  paymentSessionId: paymentSessionId,
  redirectTarget: "_self",
});
  } catch (err) {
    console.error("Cashfree payment error:", err);
    alert(err instanceof Error ? err.message : "Payment initiation failed. Please try again.");
  } finally {
    setIsProcessingPayment(false);
  }
};

  const resetAll = () => {
    setResults(null);
    setApiError(null);
    setQuery("");
    setTranscript("");
    setCart([]);
    setAddedIds(new Set());
  };

  const getImageUrl = (medicine: Medicine) => medicine.image || `https://placehold.co/400x300/0fa381/white?text=${encodeURIComponent(medicine.name)}`;

  return (
    <>
      <style>{css}</style>

      <Navbar cartCount={cartCount} resetAll={resetAll} />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">✦ AI-Powered Pharmacy</div>
        <h1>Describe your symptoms,<br />get the <em>right medicine</em> delivered</h1>
        <p>Tell us how you feel — type or speak — and our AI recommends the best over-the-counter treatment for you.</p>
      </section>

      {/* Daily Health Tip */}
      <div className="max-w-720 mx-auto px-4 mb-6">
        <EnhancedHealthTip />
      </div>

      {/* Search Box */}
      <div className="search-box">
        <div className="search-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            className="search-input"
            placeholder="e.g. I have a terrible headache and mild fever since this morning..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAnalyze()}
          />
        </div>

        <div className="search-actions">
          <div className="flex gap-2 flex-1">
            <button className={`voice-btn flex-1 ${recording ? "recording" : ""}`} onClick={toggleVoice}>
              {recording ? "🔴 Recording… tap to stop" : "🎙️ Describe with voice"}
            </button>
            <PrescriptionScanner onMedicinesDetected={handlePrescriptionMedicines} onSearchQuery={handleAnalyze} />
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

      <div id="results-anchor" />

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
          </div>
        </div>
      )}

      {results && !loading && !apiError && (
        <div className="results-section">
          <div className="results-header">
            <h2>Recommended for You</h2>
            <p>Based on your described symptoms, here are the best options</p>
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

          <div className="meds-grid">
            {results.medicines.map((med, idx) => (
              <div key={med.id || idx} className={`med-card ${med.recommended ? "recommended" : ""}`}>
                <div className="med-img-wrap">
                  <img src={getImageUrl(med)} alt={med.name} className="med-img"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x300/0fa381/white?text=${encodeURIComponent(med.name)}`; }} />
                  {med.recommended && <div className="rec-badge">⭐ Best Match</div>}
                </div>
                <div className="med-body">
                  <div className="med-name">{med.name}</div>
                  <div className="med-type">{med.type || med.category}</div>
                  <div className="med-desc">{med.description}</div>
                  <div className="med-tags">{med.tags?.map((tag, i) => <span key={i} className="tag">{tag}</span>)}</div>
                  <div className="med-footer">
                    <div className="med-price">₹{med.price.toFixed(2)} <span>/ pack</span></div>
                    <button className={`add-cart-btn ${addedIds.has(med.id) ? "added" : ""}`}
                      onClick={() => !addedIds.has(med.id) && addToCart(med)}>
                      {addedIds.has(med.id) ? "✓ Added" : "Add to Cart"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {results.notes && results.notes.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Safety Notes</h4>
              <ul className="space-y-1">{results.notes.map((note, i) => <li key={i} className="text-sm text-yellow-700">• {note}</li>)}</ul>
            </div>
          )}

          {healthData && (
            <div className="mt-8 space-y-6">
              {healthData.disease && (
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center gap-3 mb-2"><span className="text-2xl">📋</span><h3 className="font-bold text-lg text-blue-800">बीमारी की जानकारी</h3></div>
                  <h4 className="font-semibold text-blue-900">{healthData.disease.name}</h4>
                  <p className="text-blue-700 text-sm mt-1">{healthData.disease.description}</p>
                </div>
              )}
              {healthData.healthTips && healthData.healthTips.length > 0 && (
                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center gap-3 mb-3"><span className="text-2xl">💚</span><h3 className="font-bold text-lg text-green-800">स्वास्थ्य सुझाव</h3></div>
                  <div className="space-y-2">{healthData.healthTips.map((tip, i) => <div key={i} className="flex gap-2 items-start"><span className="text-green-600 mt-0.5">✓</span><span className="text-gray-700 text-sm">{tip}</span></div>)}</div>
                </div>
              )}
              {healthData.dietPlan && (
                <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                  <div className="flex items-center gap-3 mb-3"><span className="text-2xl">🥗</span><h3 className="font-bold text-lg text-orange-800">आहार योजना</h3></div>
                  {healthData.dietPlan.foodsToEat?.length > 0 && (<div className="mb-3"><p className="font-semibold text-green-700 mb-1">✅ क्या खाएं:</p><div className="flex flex-wrap gap-2">{healthData.dietPlan.foodsToEat.map((food, i) => <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">{food}</span>)}</div></div>)}
                  {healthData.dietPlan.foodsToAvoid?.length > 0 && (<div className="mb-3"><p className="font-semibold text-red-700 mb-1">❌ क्या न खाएं:</p><div className="flex flex-wrap gap-2">{healthData.dietPlan.foodsToAvoid.map((food, i) => <span key={i} className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs">{food}</span>)}</div></div>)}
                  {healthData.dietPlan.recommendations && <p className="text-gray-700 text-sm bg-white/50 p-3 rounded-lg mt-2">{healthData.dietPlan.recommendations}</p>}
                </div>
              )}
              {healthData.lifestyleAdvice?.length > 0 && (
                <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                  <div className="flex items-center gap-3 mb-3"><span className="text-2xl">🧘</span><h3 className="font-bold text-lg text-purple-800">जीवनशैली सुझाव</h3></div>
                  <ul className="space-y-2">{healthData.lifestyleAdvice.map((advice, i) => <li key={i} className="flex gap-2 items-start"><span className="text-purple-600">•</span><span className="text-gray-700 text-sm">{advice}</span></li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!results && !loading && !apiError && (
        <section className="how-section">
          <h2>How Mediora Works</h2>
          <div className="steps-grid">
            {[
              { icon: "🗣️", title: "Describe Symptoms", desc: "Type or use voice to describe how you're feeling." },
              { icon: "🤖", title: "AI Analysis", desc: "AI identifies the most suitable OTC medications for your condition." },
              { icon: "🛒", title: "Add to Cart", desc: "Choose your preferred medication and add it to your cart." },
              { icon: "💳", title: "Secure Payment", desc: "Pay with Cashfree — cards, UPI, or netbanking." },
            ].map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="footer">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <span>© {new Date().getFullYear()} Mediora. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-mint transition">Privacy</Link>
            <Link href="/terms" className="hover:text-mint transition">Terms</Link>
            <Link href="/refund" className="hover:text-mint transition">Refund</Link>
            <Link href="/disclaimer" className="hover:text-mint transition">Disclaimer</Link>
          </div>
          <span>Not a substitute for professional medical advice.</span>
        </div>
      </footer>

      {/* Cart Panel */}
      {cartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-panel">
            <div className="cart-header">
              <h2>Your Cart 🛒</h2>
              <button className="close-btn" onClick={() => setCartOpen(false)}>✕</button>
            </div>
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="cart-empty"><p>💊</p><p>Your cart is empty</p></div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-icon">{item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" /> : (item.emoji || '💊')}</div>
                    <div className="cart-item-info"><div className="cart-item-name">{item.name}</div><div className="cart-item-price">₹{((item.pricePerTablet || item.price) * item.qty).toFixed(2)}</div></div>
                    <div className="cart-item-qty"><button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button><span style={{ fontWeight: 600, minWidth: 20, textAlign: "center" }}>{item.qty}</span><button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button></div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total"><span>Total</span><span>₹{cartTotal.toFixed(2)}</span></div>
                <button className="checkout-btn" onClick={() => { setCartOpen(false); setCheckout(true); setCheckoutStep(1); }}>Proceed to Checkout →</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Checkout Modal */}
      {checkout && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget && checkoutStep !== 3) setCheckout(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h2>{checkoutStep === 1 ? "Delivery Address" : checkoutStep === 2 ? "Confirm & Pay" : "Order Confirmed!"}</h2>
              {checkoutStep !== 3 && <button className="close-btn" onClick={() => setCheckout(false)}>✕</button>}
            </div>
            <div className="modal-body">
              {checkoutStep !== 3 && (
                <div className="step-indicator">
                  {[1, 2].map(step => <div key={step} className={`step-dot ${checkoutStep >= step ? "active" : ""}`} />)}
                </div>
              )}

              {checkoutStep === 1 && (
                <>
                  <div className="field-group"><label>Full Name *</label><input className="field-input" placeholder="John Smith" value={address.name} onChange={e => setAddress({ ...address, name: e.target.value })} /></div>
                  <div className="field-group"><label>Address Line</label><input className="field-input" placeholder="123 Oak Street, Apt 4B" value={address.line1} onChange={e => setAddress({ ...address, line1: e.target.value })} /></div>
                  <div className="field-row"><div className="field-group"><label>City</label><input className="field-input" placeholder="Mumbai" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} /></div><div className="field-group"><label>PIN Code</label><input className="field-input" placeholder="400001" value={address.zip} onChange={e => setAddress({ ...address, zip: e.target.value })} /></div></div>
                  <div className="field-group"><label>Email Address</label><input className="field-input" type="email" placeholder="john@example.com" value={address.email || ""} onChange={e => setAddress({ ...address, email: e.target.value })} /></div>
                  <div className="field-group"><label>Phone Number *</label><input className="field-input" placeholder="+91 98765 43210" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} /></div>
                  <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => { setCheckout(false); setCartOpen(true); }}>← Back to Cart</button>
                    <button className="btn-primary" onClick={() => setCheckoutStep(2)}>Continue to Payment →</button>
                  </div>
                </>
              )}

              {checkoutStep === 2 && (
                <>
                  <div style={{ background: "var(--mint-light)", borderRadius: 12, padding: "16px", marginBottom: 20, textAlign: "center" }}>
                    🔒 Secure payment via Cashfree<br /><small>Cards • UPI • Netbanking • Wallets accepted</small>
                  </div>
                  <div style={{ borderTop: "1px solid #eee", paddingTop: 16, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>Order Total</span><span style={{ color: "var(--mint)" }}>₹{(cartTotal + 4.99).toFixed(2)}</span>
                  </div>
                  <div className="modal-actions">
                    <button className="btn-secondary" onClick={() => setCheckoutStep(1)}>← Back</button>
                    <button className="btn-primary" onClick={handlePayment} disabled={isProcessingPayment}>
                      {isProcessingPayment ? "Processing..." : "Pay Now 💳"}
                    </button>
                  </div>
                </>
              )}

              {checkoutStep === 3 && (
                <div className="success-view">
                  <div className="success-icon">🎉</div>
                  <h2>Order Placed!</h2>
                  <p>Your medication is on its way. Estimated delivery: <b>45–90 minutes</b>.</p>
                  <div className="track-id">Order #MED-{Math.random().toString(36).slice(2, 8).toUpperCase()}</div>
                  <button className="btn-primary" onClick={() => { setCheckout(false); resetAll(); }}>Back to Home</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}