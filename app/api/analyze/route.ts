// app/api/analyze/route.ts – Groq AI (free) + local fallback with Smart Medicine Features
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// ---------- Your existing medicine database (fallback) ----------
const medicineDatabase: Record<string, any> = {
  headache: { 
    summary: "Your symptoms suggest a tension headache or mild migraine. These OTC medications help relieve pain.",
    medicines: [
      { id: 1, name: "Ibuprofen 400mg", type: "NSAID", emoji: "💊", description: "Reduces inflammation and pain. Effective for headaches, muscle aches, and fever.", tags: ["Pain", "Headache", "Inflammation"], price: 45, recommended: true, drugName: "ibuprofen" },
      { id: 2, name: "Paracetamol 500mg", type: "Analgesic", emoji: "💊", description: "Gentle on the stomach, works well for tension headaches.", tags: ["Pain", "Headache"], price: 35, recommended: false, drugName: "paracetamol" },
      { id: 3, name: "Aspirin 300mg", type: "NSAID", emoji: "💊", description: "Helpful for migraine pain. Not for children or people with stomach ulcers.", tags: ["Migraine", "Pain"], price: 28, recommended: false, drugName: "aspirin" }
    ]
  },
  fever: { 
    summary: "Your symptoms indicate a fever, likely due to infection. These medications help reduce temperature and provide relief.",
    medicines: [
      { id: 1, name: "Paracetamol 500mg", type: "Analgesic", emoji: "🌡️", description: "First choice for fever reduction. Safe and effective.", tags: ["Fever", "Pain"], price: 35, recommended: true, drugName: "paracetamol" },
      { id: 2, name: "Ibuprofen 400mg", type: "NSAID", emoji: "💊", description: "Reduces fever and also helps with body aches.", tags: ["Fever", "Body pain"], price: 45, recommended: false, drugName: "ibuprofen" },
      { id: 3, name: "Mefenamic Acid 250mg", type: "NSAID", emoji: "💊", description: "For fever with severe body pain.", tags: ["Fever", "Severe pain"], price: 65, recommended: false, drugName: "mefenamic acid" }
    ]
  },
  allergy: { 
    summary: "Your symptoms suggest seasonal allergies or allergic rhinitis. These antihistamines will help control sneezing, runny nose, and itchy eyes.",
    medicines: [
      { id: 1, name: "Cetirizine 10mg", type: "Antihistamine", emoji: "🌸", description: "24-hour relief, non-drowsy for most people.", tags: ["Allergy", "Sneezing", "Itchy eyes"], price: 55, recommended: true, drugName: "cetirizine" },
      { id: 2, name: "Loratadine 10mg", type: "Antihistamine", emoji: "🌿", description: "Non-drowsy, perfect for daytime use.", tags: ["Allergy", "Hay fever"], price: 48, recommended: false, drugName: "loratadine" },
      { id: 3, name: "Fexofenadine 120mg", type: "Antihistamine", emoji: "💊", description: "Stronger relief for severe allergies.", tags: ["Severe allergy", "Hives"], price: 85, recommended: false, drugName: "fexofenadine" }
    ]
  },
  cold: { 
    summary: "Your symptoms indicate a common cold or upper respiratory infection. These medications provide multi-symptom relief.",
    medicines: [
      { id: 1, name: "Cold & Flu Tablet", type: "Combination", emoji: "🤧", description: "Relieves cold, fever, congestion, and body aches.", tags: ["Cold", "Fever", "Congestion"], price: 65, recommended: true, drugName: "cold and flu" },
      { id: 2, name: "Cough Syrup DM", type: "Cough Suppressant", emoji: "🍯", description: "Suppresses dry, hacking cough. Helps you rest.", tags: ["Cough", "Dry cough"], price: 85, recommended: false, drugName: "dextromethorphan" },
      { id: 3, name: "Nasal Decongestant Spray", type: "Decongestant", emoji: "👃", description: "Quick relief for blocked nose. Use max 3 days.", tags: ["Blocked nose", "Congestion"], price: 95, recommended: false, drugName: "oxymetazoline" }
    ]
  },
  stomach: { 
    summary: "Your symptoms suggest acidity, heartburn, or indigestion. These antacids and acid reducers provide relief.",
    medicines: [
      { id: 1, name: "Antacid Suspension", type: "Antacid", emoji: "🧴", description: "Immediate relief from acidity and heartburn.", tags: ["Acidity", "Heartburn"], price: 40, recommended: true, drugName: "antacid" },
      { id: 2, name: "Omeprazole 20mg", type: "PPI", emoji: "🔵", description: "Long-lasting acid reduction. Take before breakfast.", tags: ["GERD", "Acid reflux"], price: 70, recommended: false, drugName: "omeprazole" },
      { id: 3, name: "Digestive Enzyme Tablet", type: "Digestive Aid", emoji: "💊", description: "Reduces bloating and gas after heavy meals.", tags: ["Bloating", "Gas"], price: 60, recommended: false, drugName: "digestive enzymes" }
    ]
  },
  bodyPain: { 
    summary: "Your symptoms indicate muscle pain or body aches. These pain relievers will help.",
    medicines: [
      { id: 1, name: "Ibuprofen 400mg", type: "NSAID", emoji: "💊", description: "Excellent for muscle pain, backache, and general body pain.", tags: ["Muscle pain", "Back pain"], price: 45, recommended: true, drugName: "ibuprofen" },
      { id: 2, name: "Diclofenac Gel", type: "Topical NSAID", emoji: "🧴", description: "Apply directly to painful area for targeted relief.", tags: ["Joint pain", "Localized pain"], price: 95, recommended: false, drugName: "diclofenac" },
      { id: 3, name: "Paracetamol 500mg", type: "Analgesic", emoji: "💊", description: "Gentle relief for mild to moderate body aches.", tags: ["Mild pain"], price: 35, recommended: false, drugName: "paracetamol" }
    ]
  },
  diarrhea: { 
    summary: "Your symptoms indicate diarrhea or loose motions. These products help prevent dehydration and control frequency.",
    medicines: [
      { id: 1, name: "ORS Solution", type: "Electrolyte", emoji: "💧", description: "Replaces lost fluids and electrolytes. Most important.", tags: ["Diarrhea", "Dehydration"], price: 25, recommended: true, drugName: "ors" },
      { id: 2, name: "Loperamide 2mg", type: "Anti-diarrheal", emoji: "💊", description: "Controls diarrhea. Take after each loose stool.", tags: ["Diarrhea", "Loose motion"], price: 40, recommended: false, drugName: "loperamide" }
    ]
  },
  nausea: { 
    summary: "Your symptoms indicate nausea or vomiting. These anti‑emetics help settle your stomach.",
    medicines: [
      { id: 1, name: "Ondansetron 4mg", type: "Anti-emetic", emoji: "💊", description: "Dissolves on tongue for fast action against nausea.", tags: ["Nausea", "Vomiting"], price: 75, recommended: true, drugName: "ondansetron" },
      { id: 2, name: "Domperidone 10mg", type: "Anti-emetic", emoji: "💊", description: "Helps with nausea and stomach emptying.", tags: ["Nausea", "Bloating"], price: 50, recommended: false, drugName: "domperidone" }
    ]
  },
  constipation: { 
    summary: "Your symptoms indicate constipation. These laxatives and fiber supplements provide gentle relief.",
    medicines: [
      { id: 1, name: "Psyllium Husk", type: "Fiber", emoji: "🌾", description: "Natural fiber for gentle relief. Drink plenty of water.", tags: ["Constipation", "Fiber"], price: 85, recommended: true, drugName: "psyllium" },
      { id: 2, name: "Bisacodyl 5mg", type: "Stimulant Laxative", emoji: "💊", description: "Stronger relief for occasional constipation. Take at bedtime.", tags: ["Constipation"], price: 35, recommended: false, drugName: "bisacodyl" }
    ]
  },
  throat: { 
    summary: "Your symptoms indicate a sore or scratchy throat. These lozenges and sprays provide soothing relief.",
    medicines: [
      { id: 1, name: "Throat Lozenges", type: "Mouth/Throat", emoji: "🍬", description: "Soothes pain with local anesthetic.", tags: ["Sore throat", "Pain"], price: 25, recommended: true, drugName: "benzocaine" },
      { id: 2, name: "Throat Spray", type: "Topical Anesthetic", emoji: "💊", description: "Spray directly on painful area for quick relief.", tags: ["Sore throat"], price: 55, recommended: false, drugName: "lidocaine" }
    ]
  },
  default: { 
    summary: "Based on your symptoms, here are some common OTC medications that may help. For severe or persistent symptoms, please consult a doctor.",
    medicines: [
      { id: 1, name: "Ibuprofen 400mg", type: "NSAID", emoji: "💊", description: "Common OTC for pain, fever, and inflammation.", tags: ["Pain", "Fever"], price: 45, recommended: true, drugName: "ibuprofen" },
      { id: 2, name: "Paracetamol 500mg", type: "Analgesic", emoji: "💊", description: "For headaches, fever, and mild pain.", tags: ["Headache", "Fever"], price: 35, recommended: false, drugName: "paracetamol" },
      { id: 3, name: "Cetirizine 10mg", type: "Antihistamine", emoji: "🌸", description: "For allergy symptoms like sneezing and runny nose.", tags: ["Allergy"], price: 55, recommended: false, drugName: "cetirizine" }
    ]
  }
};

// Your existing detectCategory function (unchanged)
function detectCategory(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("headache") || q.includes("migraine")) return "headache";
  if (q.includes("fever") || q.includes("temperature") || q.includes("high temp")) return "fever";
  if (q.includes("allergy") || q.includes("sneeze") || q.includes("runny nose") || q.includes("itchy eyes")) return "allergy";
  if (q.includes("cold") || q.includes("cough") || q.includes("flu") || q.includes("congestion") || q.includes("sore throat")) return "cold";
  if (q.includes("stomach") || q.includes("acidity") || q.includes("heartburn") || q.includes("gas") || q.includes("indigestion")) return "stomach";
  if (q.includes("body pain") || q.includes("muscle pain") || q.includes("back pain") || q.includes("joint pain")) return "bodyPain";
  if (q.includes("diarrhea") || q.includes("loose motion")) return "diarrhea";
  if (q.includes("vomit") || q.includes("nausea")) return "nausea";
  if (q.includes("constipation") || q.includes("hard stool")) return "constipation";
  if (q.includes("throat") || q.includes("sore throat")) return "throat";
  return "default";
}

// NEW: Enhanced medicine response with quantity selector and safety rules
function enhanceWithSmartFeatures(result: any, query: string) {
  if (!result.medicines || result.medicines.length === 0) return result;
  
  const q = query.toLowerCase();
  const isAntibioticCondition = q.includes("antibiotic") || q.includes("infection");
  
  // Enhance each medicine with smart features
  result.medicines = result.medicines.map((med: any, idx: number) => {
    // Determine if this medicine is likely an antibiotic
    const isAntibiotic = isAntibioticCondition || 
      med.name.toLowerCase().includes("mycin") || 
      med.name.toLowerCase().includes("cillin") ||
      med.name.toLowerCase().includes("xazole");
    
    // Calculate total tablets based on duration
    let totalTablets = 10;
    if (med.usage?.duration) {
      const days = parseInt(med.usage.duration) || 3;
      const frequency = med.usage.frequency?.includes("twice") ? 2 : 
                       med.usage.frequency?.includes("thrice") ? 3 : 2;
      totalTablets = days * frequency;
    }
    
    return {
      ...med,
      id: idx + 1,
      dosage: med.dosage || "500mg",
      type: med.type || "tablet",
      category: med.type || "general",
      isAntibiotic: isAntibiotic,
      usage: {
        frequency: med.frequency || "twice daily",
        duration: med.duration || "3 days",
        totalTablets: Math.min(totalTablets, 20)
      },
      quantitySelector: {
        allowLoose: !isAntibiotic,
        tabletsPerStrip: 10,
        minQuantity: 1,
        maxQuantity: 20,
        defaultQuantity: Math.min(totalTablets, 10),
        step: 1,
        recommendedType: isAntibiotic ? "strip" : "loose",
        note: isAntibiotic ? "⚠️ Complete full course is required. Do not stop early." : "You can buy loose tablets or full strip"
      },
      pricePerTablet: Math.round(med.price / 10),
      estimatedTotalPrice: med.price
    };
  });
  
  // Add safety notes
  result.notes = [
    "⚠️ Do not take medicines without consulting a doctor if symptoms persist for more than 3 days",
    "💊 Always read the package insert before use",
    "🚫 Avoid alcohol while on medication",
    ...(isAntibioticCondition ? ["🔴 Complete the full antibiotic course even if you feel better"] : [])
  ];
  
  return result;
}

// ---------- Main API handler (UPDATED with new features) ----------
export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || query.trim() === "") {
      return NextResponse.json({ error: "Query is empty" }, { status: 400 });
    }

    // ---- Try Groq AI first (if API key exists) with enhanced prompt ----
    if (process.env.GROQ_API_KEY) {
      try {
        const prompt = `
You are a helpful pharmacy assistant. Recommend 3 over‑the‑counter (OTC) medicines for the user's condition.

User query: "${query}"

Return ONLY valid JSON (no markdown, no extra text) in this exact format:
{
  "summary": "brief, helpful summary of the condition and approach",
  "medicines": [
    {
      "name": "Medicine Name + Dosage",
      "type": "Category (e.g. Analgesic, Antihistamine)",
      "emoji": "💊",
      "description": "2‑sentence explanation of why this helps",
      "tags": ["tag1", "tag2", "tag3"],
      "price": 45,
      "recommended": true,
      "drugName": "generic name",
      "dosage": "500mg",
      "frequency": "twice daily",
      "duration": "3 days"
    }
  ]
}

Rules:
- First medicine must have "recommended": true, others false.
- Use realistic OTC medicines available in India.
- Prices in INR between ₹20 and ₹300.
- Be safe and do not recommend prescription drugs.
- Include dosage, frequency, and duration for each medicine.`;

        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 1000,
        });

        const aiText = completion.choices[0]?.message?.content || "";
        const cleanJson = aiText.replace(/```json\s*|\s*```/g, '').trim();
        let aiResult = JSON.parse(cleanJson);

        if (aiResult.summary && Array.isArray(aiResult.medicines) && aiResult.medicines.length > 0) {
          // Enhance with smart features
          aiResult = enhanceWithSmartFeatures(aiResult, query);
          aiResult.medicines = aiResult.medicines.map((med: any, idx: number) => ({ ...med, id: idx + 1 }));
          return NextResponse.json(aiResult);
        }
      } catch (aiError) {
        console.error("Groq AI error, falling back to local DB:", aiError);
      }
    }

    // ---- Fallback: local medicine database with smart enhancement ----
    const category = detectCategory(query);
    const data = medicineDatabase[category] || medicineDatabase.default;
    let result = {
      summary: data.summary,
      medicines: [...data.medicines]
    };
    
    // Enhance with smart features
    result = enhanceWithSmartFeatures(result, query);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Fatal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}