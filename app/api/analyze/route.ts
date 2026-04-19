import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// ✅ CACHE (yahan add kiya)
const cache = new Map();

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// ---------- Your existing medicine database ----------
const medicineDatabase: Record<string, any> = {
  headache: { /* ... */ },
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

// detectCategory (same)
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

    // ✅ CACHE CHECK (yahan add kiya)
    if (cache.has(query)) {
      console.log("⚡ Cache hit");
      return NextResponse.json(cache.get(query));
    }

    // ---- Try Groq AI first ----
    if (process.env.GROQ_API_KEY) {
      try {
        const prompt = `...same as your prompt...`;

        const completion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 1000,
        });

        const aiText = completion.choices[0]?.message?.content || "";
        const cleanJson = aiText.replace(/```json\s*|\s*```/g, '').trim();

        let aiResult;

        try {
          aiResult = JSON.parse(cleanJson);
        } catch {
          throw new Error("Invalid JSON from AI");
        }

        if (aiResult.summary && Array.isArray(aiResult.medicines)) {
          aiResult.medicines = aiResult.medicines.map((med: any, idx: number) => ({
            ...med,
            id: idx + 1
          }));

          // ✅ CACHE SAVE (AI result)
          cache.set(query, aiResult);

          return NextResponse.json(aiResult);
        }

      } catch (aiError) {
        console.error("Groq AI error, fallback:", aiError);
      }
    }

    // ---- Fallback: local DB ----
    const category = detectCategory(query);
    const data = medicineDatabase[category] || medicineDatabase.default;

    const response = {
      summary: data.summary,
      medicines: data.medicines.map((med: any, idx: number) => ({
        ...med,
        id: idx + 1
      }))
    };

    // ✅ CACHE SAVE (fallback result)
    cache.set(query, response);

    return NextResponse.json(response);

  } catch (error) {
    console.error("Fatal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}