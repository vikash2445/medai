// app/api/analyze/route.ts – Groq AI (free) + local fallback
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// ---------- Your existing medicine database (fallback) ----------
const medicineDatabase: Record<string, any> = {
  headache: { /* ... keep all your existing data ... */ },
  fever: { /* ... */ },
  allergy: { /* ... */ },
  cold: { /* ... */ },
  stomach: { /* ... */ },
  bodyPain: { /* ... */ },
  diarrhea: { /* ... */ },
  nausea: { /* ... */ },
  constipation: { /* ... */ },
  throat: { /* ... */ },
  default: { /* ... */ }
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

// ---------- Main API handler ----------
export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || query.trim() === "") {
      return NextResponse.json({ error: "Query is empty" }, { status: 400 });
    }

    // ---- Try Groq AI first (if API key exists) ----
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
      "id": 1,
      "name": "Medicine Name + Dosage",
      "type": "Category (e.g. Analgesic, Antihistamine)",
      "emoji": "💊",
      "description": "2‑sentence explanation of why this helps",
      "tags": ["tag1", "tag2", "tag3"],
      "price": 45,
      "recommended": true,
      "drugName": "generic name"
    }
  ]
}

Rules:
- First medicine must have "recommended": true, others false.
- Use realistic OTC medicines available in India.
- Prices in INR between ₹20 and ₹300.
- Be safe and do not recommend prescription drugs.
`;

        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile", // free, powerful model
          temperature: 0.7,
          max_tokens: 1000,
        });

        const aiText = completion.choices[0]?.message?.content || "";
        // Remove any markdown code fences
        const cleanJson = aiText.replace(/```json\s*|\s*```/g, '').trim();
        const aiResult = JSON.parse(cleanJson);

        // Validate structure
        if (aiResult.summary && Array.isArray(aiResult.medicines) && aiResult.medicines.length > 0) {
          // Assign sequential ids
          aiResult.medicines = aiResult.medicines.map((med: any, idx: number) => ({ ...med, id: idx + 1 }));
          return NextResponse.json(aiResult);
        }
      } catch (aiError) {
        console.error("Groq AI error, falling back to local DB:", aiError);
        // Fall through to local database
      }
    }

    // ---- Fallback: local medicine database ----
    const category = detectCategory(query);
    const data = medicineDatabase[category] || medicineDatabase.default;
    const medicines = data.medicines.map((med: any, idx: number) => ({ ...med, id: idx + 1 }));
    return NextResponse.json({
      summary: data.summary,
      medicines: medicines,
    });
  } catch (error) {
    console.error("Fatal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}