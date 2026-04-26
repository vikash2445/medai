import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

let cachedTip: {
  title: string; tip: string; hindiTitle: string; hindiTip: string;
  category: string; date: string;
  whyItMatters: string; hindiWhyItMatters: string;
  steps: string[]; hindiSteps: string[];
  quickFact: string; hindiQuickFact: string;
  reminderTime: string;
} | null = null;

export async function GET() {
  const today = new Date().toISOString().split('T')[0];

  if (cachedTip && cachedTip.date === today) {
    return NextResponse.json(cachedTip);
  }

  const prompt = `You are a certified health expert. Generate ONE highly specific, evidence-based daily health tip.

Return ONLY valid JSON in this EXACT format — no extra text, no markdown:
{
  "title": "Short English title (3-5 words)",
  "tip": "One-line English tip (max 100 chars)",
  "hindiTitle": "हिंदी में शीर्षक",
  "hindiTip": "हिंदी में मुख्य टिप (एक वाक्य)",

  "whyItMatters": "1-2 sentences: WHY this tip matters, with a science fact",
  "hindiWhyItMatters": "यह टिप क्यों जरूरी है — एक वैज्ञानिक तथ्य के साथ (1-2 वाक्य)",

  "steps": [
    "Step 1: Exact action to take (be very specific)",
    "Step 2: When and how to do it",
    "Step 3: How to make it a habit",
    "Step 4: How to track progress"
  ],
  "hindiSteps": [
    "चरण 1: क्या करें (बिल्कुल सटीक निर्देश)",
    "चरण 2: कब और कैसे करें",
    "चरण 3: इसे आदत कैसे बनाएं",
    "चरण 4: प्रगति कैसे देखें"
  ],

  "quickFact": "One surprising science-backed fact about this tip",
  "hindiQuickFact": "इस टिप के बारे में एक आश्चर्यजनक वैज्ञानिक तथ्य",

  "reminderTime": "Best time of day to do this: morning/afternoon/evening/night",
  "category": "one of: hydration, exercise, sleep, nutrition, wellness, mental"
}

Pick a DIFFERENT category each call. Be specific — avoid vague advice. Examples of BAD tips: "drink water", "exercise daily". Good tip example: "Do 5 rounds of box breathing (4-4-4-4 count) before bed to lower cortisol by up to 30%."`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.75,
      max_tokens: 700,
    });

    const text = completion.choices[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const tipData = JSON.parse(clean);
    cachedTip = { ...tipData, date: today };
    return NextResponse.json(cachedTip);

  } catch (error) {
    console.error('AI Tip error:', error);
    const fallbacks = [
      {
        title: 'Box Breathing Reset',
        tip: 'Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 5 times.',
        hindiTitle: 'बॉक्स ब्रीदिंग से तनाव मुक्त हों',
        hindiTip: '4 सेकंड सांस लें → 4 रोकें → 4 में छोड़ें → 4 रोकें। 5 बार दोहराएं।',
        whyItMatters: 'Box breathing activates your parasympathetic nervous system, lowering cortisol by up to 30% in minutes.',
        hindiWhyItMatters: 'यह तकनीक आपके तंत्रिका तंत्र को शांत करती है और कोर्टिसोल 30% तक घटाती है।',
        steps: [
          'Step 1: Sit upright on a chair or floor — back straight.',
          'Step 2: Inhale slowly through nose for exactly 4 seconds.',
          'Step 3: Hold breath for 4 seconds (don\'t tense up).',
          'Step 4: Exhale through mouth for 4 seconds. Hold 4s. Repeat 5 cycles.',
        ],
        hindiSteps: [
          'चरण 1: कुर्सी या जमीन पर सीधे बैठें।',
          'चरण 2: नाक से 4 सेकंड में धीरे-धीरे सांस लें।',
          'चरण 3: 4 सेकंड के लिए सांस रोकें।',
          'चरण 4: मुंह से 4 सेकंड में सांस छोड़ें। 5 बार दोहराएं।',
        ],
        quickFact: 'US Navy SEALs use box breathing to stay calm under extreme stress.',
        hindiQuickFact: 'अमेरिकी नेवी सील्स इस तकनीक का उपयोग अत्यधिक तनाव में शांत रहने के लिए करते हैं।',
        reminderTime: 'evening',
        category: 'mental',
      },
      {
        title: 'Morning Sunlight Habit',
        tip: 'Get 10 mins of morning sunlight within 1 hour of waking.',
        hindiTitle: 'सुबह की धूप की आदत',
        hindiTip: 'उठने के 1 घंटे के अंदर 10 मिनट धूप में बैठें।',
        whyItMatters: 'Morning light sets your circadian rhythm, boosts serotonin, and improves sleep quality by 50%.',
        hindiWhyItMatters: 'सुबह की रोशनी आपकी बॉडी क्लॉक सेट करती है और नींद की गुणवत्ता 50% तक सुधारती है।',
        steps: [
          'Step 1: Set alarm 15 minutes earlier than usual.',
          'Step 2: Go outside within 60 minutes of waking — don\'t wear sunglasses.',
          'Step 3: Walk, stretch, or just sit — 10 minutes minimum.',
          'Step 4: Do this 7 days straight to feel the difference in sleep.',
        ],
        hindiSteps: [
          'चरण 1: अलार्म 15 मिनट पहले लगाएं।',
          'चरण 2: उठने के 60 मिनट में बाहर जाएं — चश्मा न लगाएं।',
          'चरण 3: टहलें, स्ट्रेच करें या बस बैठें — कम से कम 10 मिनट।',
          'चरण 4: 7 दिन लगातार करें और नींद में सुधार देखें।',
        ],
        quickFact: 'Andrew Huberman\'s research shows morning sunlight is more powerful than any sleep supplement.',
        hindiQuickFact: 'शोध बताते हैं कि सुबह की धूप किसी भी नींद की दवा से ज्यादा असरदार है।',
        reminderTime: 'morning',
        category: 'sleep',
      },
    ];
    const tip = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return NextResponse.json({ ...tip, date: today });
  }
}