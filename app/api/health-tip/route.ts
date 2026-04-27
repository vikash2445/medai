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

Return ONLY valid JSON in this EXACT format — no extra text, no markdown, no trailing commas:
{
  "title": "Short English title (3-5 words)",
  "tip": "One-line English tip (max 100 chars)",
  "hindiTitle": "हिंदी में शीर्षक",
  "hindiTip": "हिंदी में मुख्य टिप (एक वाक्य)",
  "whyItMatters": "1-2 sentences: WHY this tip matters, with a science fact",
  "hindiWhyItMatters": "यह टिप क्यों जरूरी है — एक वैज्ञानिक तथ्य के साथ (1-2 वाक्य)",
  "steps": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "hindiSteps": ["चरण 1", "चरण 2", "चरण 3", "चरण 4"],
  "quickFact": "One surprising science-backed fact about this tip",
  "hindiQuickFact": "इस टिप के बारे में एक आश्चर्यजनक वैज्ञानिक तथ्य",
  "reminderTime": "morning",
  "category": "wellness"
}

Rules:
- ALL strings must be wrapped in double quotes (not single quotes)
- NO trailing commas
- NO comments inside JSON
- Pick a different category each day: hydration, exercise, sleep, nutrition, wellness, mental
- Keep tips specific and actionable`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 800,
    });

    const text = completion.choices[0]?.message?.content || '';
    console.log('Raw AI response:', text);
    
    // Clean the response
    let clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    // Fix common JSON issues
    clean = clean
      .replace(/'/g, '"') // Replace single quotes with double quotes
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // Add quotes to unquoted property names
    
    console.log('Cleaned JSON:', clean);
    
    const tipData = JSON.parse(clean);
    
    // Validate required fields
    const validatedTip = {
      title: tipData.title || "Stay Healthy",
      tip: tipData.tip || "Take care of your health daily",
      hindiTitle: tipData.hindiTitle || "स्वस्थ रहें",
      hindiTip: tipData.hindiTip || "अपने स्वास्थ्य का ध्यान रखें",
      whyItMatters: tipData.whyItMatters || "Small daily habits lead to better health",
      hindiWhyItMatters: tipData.hindiWhyItMatters || "छोटी-छोटी आदतें बेहतर स्वास्थ्य की ओर ले जाती हैं",
      steps: Array.isArray(tipData.steps) ? tipData.steps : ["Start small", "Be consistent", "Track progress", "Stay motivated"],
      hindiSteps: Array.isArray(tipData.hindiSteps) ? tipData.hindiSteps : ["छोटी शुरुआत करें", "नियमित रहें", "प्रगति देखें", "प्रेरित रहें"],
      quickFact: tipData.quickFact || "Healthy habits improve quality of life",
      hindiQuickFact: tipData.hindiQuickFact || "स्वस्थ आदतें जीवन की गुणवत्ता बढ़ाती हैं",
      reminderTime: tipData.reminderTime || "morning",
      category: tipData.category || "wellness",
      date: today
    };
    
    cachedTip = validatedTip;
    return NextResponse.json(cachedTip);

  } catch (error) {
    console.error('AI Tip error:', error);
    const fallbackTip = getFallbackTip();
    return NextResponse.json({ ...fallbackTip, date: today });
  }
}

function getFallbackTip() {
  const fallbacks = [
    {
      title: 'Box Breathing Reset',
      tip: 'Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 5 times.',
      hindiTitle: 'बॉक्स ब्रीदिंग से तनाव मुक्त हों',
      hindiTip: '4 सेकंड सांस लें → 4 रोकें → 4 में छोड़ें → 4 रोकें। 5 बार दोहराएं।',
      whyItMatters: 'Box breathing activates your parasympathetic nervous system, lowering cortisol by up to 30% in minutes.',
      hindiWhyItMatters: 'यह तकनीक आपके तंत्रिका तंत्र को शांत करती है और कोर्टिसोल 30% तक घटाती है।',
      steps: [
        'Sit upright on a chair or floor — back straight.',
        'Inhale slowly through nose for exactly 4 seconds.',
        'Hold breath for 4 seconds (don\'t tense up).',
        'Exhale through mouth for 4 seconds. Hold 4s. Repeat 5 cycles.'
      ],
      hindiSteps: [
        'कुर्सी या जमीन पर सीधे बैठें।',
        'नाक से 4 सेकंड में धीरे-धीरे सांस लें।',
        '4 सेकंड के लिए सांस रोकें।',
        'मुंह से 4 सेकंड में सांस छोड़ें। 5 बार दोहराएं।'
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
        'Set alarm 15 minutes earlier than usual.',
        'Go outside within 60 minutes of waking — don\'t wear sunglasses.',
        'Walk, stretch, or just sit — 10 minutes minimum.',
        'Do this 7 days straight to feel the difference in sleep.'
      ],
      hindiSteps: [
        'अलार्म 15 मिनट पहले लगाएं।',
        'उठने के 60 मिनट में बाहर जाएं — चश्मा न लगाएं।',
        'टहलें, स्ट्रेच करें या बस बैठें — कम से कम 10 मिनट।',
        '7 दिन लगातार करें और नींद में सुधार देखें।'
      ],
      quickFact: 'Andrew Huberman\'s research shows morning sunlight is more powerful than any sleep supplement.',
      hindiQuickFact: 'शोध बताते हैं कि सुबह की धूप किसी भी नींद की दवा से ज्यादा असरदार है।',
      reminderTime: 'morning',
      category: 'sleep',
    },
    {
      title: 'Hydration Boost',
      tip: 'Drink 2 glasses of water immediately after waking up.',
      hindiTitle: 'पानी पीने की आदत',
      hindiTip: 'सुबह उठते ही 2 गिलास पानी पिएं।',
      whyItMatters: 'After 7-8 hours of sleep, your body is dehydrated. Water kickstarts metabolism and flushes toxins.',
      hindiWhyItMatters: '7-8 घंटे की नींद के बाद शरीर में पानी की कमी हो जाती है। पानी मेटाबॉलिज्म को तेज करता है।',
      steps: [
        'Keep a water bottle by your bedside.',
        'Drink first glass immediately after waking.',
        'Wait 2 minutes, then drink second glass.',
        'Wait 30 minutes before eating breakfast.'
      ],
      hindiSteps: [
        'पानी की बोतल बिस्तर के पास रखें।',
        'उठते ही पहला गिलास पानी पिएं।',
        '2 मिनट रुकें, फिर दूसरा गिलास पिएं।',
        'नाश्ते से 30 मिनट पहले रुकें।'
      ],
      quickFact: 'Drinking water first thing increases metabolism by 24% for 90 minutes.',
      hindiQuickFact: 'सुबह पानी पीने से मेटाबॉलिज्म 24% तक बढ़ जाता है।',
      reminderTime: 'morning',
      category: 'hydration',
    }
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}