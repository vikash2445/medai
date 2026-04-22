import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Cache the tip for the day
let cachedTip: { tip: string; title: string; category: string; date: string; hindiTitle: string; hindiTip: string } | null = null;

export async function GET() {
  const today = new Date().toISOString().split('T')[0];
  
  // Return cached tip if already generated today
  if (cachedTip && cachedTip.date === today) {
    return NextResponse.json(cachedTip);
  }

  try {
    const prompt = `Generate a short, actionable, evidence-based health tip for today in HINDI language.
    
    Return ONLY valid JSON in this format (use Hindi language for hindiTitle and hindiTip):
    {
      "title": "English title (2-4 words)",
      "tip": "English tip (max 120 characters)",
      "hindiTitle": "हिंदी में शीर्षक (2-4 शब्द)",
      "hindiTip": "हिंदी में टिप (अधिकतम 120 अक्षर)",
      "category": "one of: hydration, exercise, sleep, nutrition, wellness, mental"
    }
    
    Examples in Hindi:
    {
      "title": "Stay Hydrated", 
      "tip": "Drink a glass of water first thing in the morning. It kickstarts your metabolism!", 
      "hindiTitle": "पानी पीते रहें",
      "hindiTip": "💧 सुबह उठते ही एक गिलास पानी पिएं। यह आपके मेटाबॉलिज्म को तेज करता है और शरीर से विषाक्त पदार्थों को बाहर निकालता है।",
      "category": "hydration"
    },
    {
      "title": "Move More", 
      "tip": "Take a 5-minute walk after every meal. It aids digestion!", 
      "hindiTitle": "अधिक चलें",
      "hindiTip": "🚶 खाने के बाद 5 मिनट टहलें। इससे पाचन बेहतर होता है और ब्लड शुगर कंट्रोल में रहता है।",
      "category": "exercise"
    },
    {
      "title": "Sleep Well", 
      "tip": "Aim for 7-8 hours of quality sleep. Your body repairs itself!", 
      "hindiTitle": "अच्छी नींद लें",
      "hindiTip": "😴 7-8 घंटे की अच्छी नींद लें। नींद के दौरान आपका शरीर खुद को रिपेयर करता है और इम्यूनिटी बढ़ाता है।",
      "category": "sleep"
    }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 300,
    });

    const text = completion.choices[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, '').trim();
    const tipData = JSON.parse(clean);
    
    cachedTip = { ...tipData, date: today };
    
    return NextResponse.json(cachedTip);
  } catch (error) {
    console.error('AI Tip generation error:', error);
    // Fallback to static Hindi tips
    const fallbackTips = [
      { 
        title: "Stay Hydrated", 
        tip: "💧 Drink a glass of water first thing in the morning. It kickstarts your metabolism!", 
        hindiTitle: "पानी पीते रहें",
        hindiTip: "💧 सुबह उठते ही एक गिलास पानी पिएं। यह आपके मेटाबॉलिज्म को तेज करता है और शरीर से विषाक्त पदार्थों को बाहर निकालता है।",
        category: "hydration" 
      },
      { 
        title: "Move More", 
        tip: "🚶 Take a 5-minute walk after every meal. It aids digestion!", 
        hindiTitle: "अधिक चलें",
        hindiTip: "🚶 खाने के बाद 5 मिनट टहलें। इससे पाचन बेहतर होता है और ब्लड शुगर कंट्रोल में रहता है।",
        category: "exercise" 
      },
      { 
        title: "Sleep Well", 
        tip: "😴 Aim for 7-8 hours of quality sleep. Your body repairs itself!", 
        hindiTitle: "अच्छी नींद लें",
        hindiTip: "😴 7-8 घंटे की अच्छी नींद लें। नींद के दौरान आपका शरीर खुद को रिपेयर करता है और इम्यूनिटी बढ़ाता है।",
        category: "sleep" 
      },
    ];
    const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
    return NextResponse.json({ ...randomTip, date: today });
  }
}