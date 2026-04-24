import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const prompt = `You are a health advisor. Based on the user's symptom: "${query}", provide personalized health tips, diet plan, and lifestyle advice in HINDI language.

IMPORTANT: 
- Respond ONLY in Hindi language (हिंदी में जवाब दें)
- Make tips specific to the symptom, not generic
- Include practical, actionable advice

Return ONLY valid JSON in this exact format:
{
  "disease": {
    "name": "Condition name in Hindi",
    "description": "Brief description in Hindi"
  },
  "healthTips": [
    "Specific health tip 1 in Hindi",
    "Specific health tip 2 in Hindi",
    "Specific health tip 3 in Hindi",
    "Specific health tip 4 in Hindi",
    "Specific health tip 5 in Hindi"
  ],
  "dietPlan": {
    "foodsToEat": ["Food item 1", "Food item 2", "Food item 3"],
    "foodsToAvoid": ["Avoid item 1", "Avoid item 2", "Avoid item 3"],
    "recommendations": "Dietary advice in Hindi"
  },
  "lifestyleAdvice": [
    "Advice 1 in Hindi",
    "Advice 2 in Hindi",
    "Advice 3 in Hindi"
  ]
}

Example for "back pain":
{
  "disease": {
    "name": "कमर दर्द",
    "description": "रीढ़ की हड्डी के आसपास दर्द, जो अक्सर गलत मुद्रा या अधिक बैठने से होता है"
  },
  "healthTips": [
    "सीधे बैठें और हर 30 मिनट में उठकर टहलें",
    "रात को सख्त गद्दे पर सोएं",
    "सुबह-शाम हल्का व्यायाम करें",
    "भारी सामान उठाने से बचें",
    "गर्म पानी की सेंक लगाएं"
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const clean = content.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Health advice error:', error);
    return NextResponse.json(getSmartFallbackData(""), { status: 200 });
  }
}

function getSmartFallbackData(query: string) {
  const q = query.toLowerCase();
  
  // Back Pain
  if (q.includes("back") || q.includes("kamar") || q.includes("पीठ")) {
    return {
      disease: { name: "कमर दर्द", description: "रीढ़ की हड्डी में दर्द, जो गलत मुद्रा या अत्यधिक बैठने से हो सकता है" },
      healthTips: [
        "💺 सीधे बैठें और हर घंटे उठकर टहलें - इससे रीढ़ पर दबाव कम होता है",
        "🛏️ रात को सख्त गद्दे पर सोएं और करवट लेकर सोएं",
        "🧘 सुबह-शाम 'भुजंगासन' और 'मार्जरी आसन' करें",
        "❄️ पहले 2 दिन बर्फ की सेंक, फिर गर्म पानी की सेंक लगाएं",
        "🏊 तैराकी या पैदल चलना शुरू करें - ये कमर के लिए बेहतर व्यायाम हैं"
      ],
      dietPlan: {
        foodsToEat: ["दूध और दही (कैल्शियम)", "हल्दी वाला दूध", "अदरक की चाय", "हरी सब्जियाँ", "मेवे (अखरोट, बादाम)"],
        foodsToAvoid: ["तला-भुना खाना", "मैदा", "कोल्ड ड्रिंक", "ज्यादा नमक", "प्रोसेस्ड फूड"],
        recommendations: "हल्का और पौष्टिक भोजन करें। हल्दी और अदरक का सेवन बढ़ाएं क्योंकि ये सूजन कम करते हैं। पर्याप्त मात्रा में पानी पिएं।"
      },
      lifestyleAdvice: [
        "गलत मुद्रा में न बैठें - कमर सीधी रखें",
        "वजन नियंत्रित रखें - अधिक वजन कमर पर दबाव बढ़ाता है",
        "हाई हील्स पहनने से बचें",
        "एक्सरसाइज से पहले वार्मअप जरूर करें",
        "दर्द बढ़ने पर डॉक्टर से संपर्क करें"
      ]
    };
  }
  
  // Fever
  if (q.includes("fever") || q.includes("बुखार") || q.includes("temperature")) {
    return {
      disease: { name: "बुखार", description: "शरीर का तापमान बढ़ना, आमतौर पर संक्रमण के कारण" },
      healthTips: [
        "💧 खूब सारा पानी, नींबू पानी और नारियल पानी पिएं - डिहाइड्रेशन से बचें",
        "🛌 पूरा आराम करें - शरीर को ठीक होने का समय दें",
        "🌡️ हर 4 घंटे में तापमान चेक करें",
        "🧴 गीले कपड़े से माथे पर सेंक लगाएं",
        "🍲 हल्का और पौष्टिक भोजन करें जैसे दलिया, खिचड़ी"
      ],
      dietPlan: {
        foodsToEat: ["गर्म सूप", "हर्बल चाय", "खिचड़ी", "दलिया", "फलों का रस", "नारियल पानी"],
        foodsToAvoid: ["मसालेदार खाना", "तेल-घी", "ठंडी चीजें", "जंक फूड", "मीठा"],
        recommendations: "हल्का और पचने में आसान भोजन करें। गर्म तरल पदार्थ ज्यादा पिएं। खाना देर तक न रखें।"
      },
      lifestyleAdvice: [
        "पूरा आराम करें - बिस्तर पर ही रहें",
        "कमरे में हवा आने दें, पंखा चलाएं",
        "हल्के सूती कपड़े पहनें",
        "ठंडे पानी से नहाएं नहीं, हल्के गर्म पानी से स्पंज करें",
        "3 दिन से अधिक बुखार रहे तो डॉक्टर से मिलें"
      ]
    };
  }
  
  // Cold / Cough
  if (q.includes("cold") || q.includes("cough") || q.includes("खांसी") || q.includes("ज़ुकाम")) {
    return {
      disease: { name: "खांसी और ज़ुकाम", description: "ऊपरी श्वसन संक्रमण, जिसमें नाक बहना, छींक और खांसी होती है" },
      healthTips: [
        "🍯 शहद के साथ हल्का गर्म पानी पिएं - खांसी में आराम मिलता है",
        "🧅 स्टीम लें - पानी में यूकेलिप्टस तेल डालें",
        "💧 गर्म तरल पदार्थ ज्यादा पिएं - सूप, हर्बल चाय",
        "🛌 पर्याप्त आराम करें",
        "🧴 नमक वाले पानी से गरारे करें"
      ],
      dietPlan: {
        foodsToEat: ["गर्म सूप", "अदरक वाली चाय", "शहद", "हल्दी वाला दूध", "लहसुन", "संतरा, मौसमी"],
        foodsToAvoid: ["ठंडा पानी", "आइसक्रीम", "तला हुआ", "मीठा", "दही"],
        recommendations: "गर्म और हल्का भोजन करें। अदरक, तुलसी, और हल्दी का सेवन बढ़ाएं। दूध से बचें।"
      },
      lifestyleAdvice: [
        "हाथ बार-बार धोएं",
        "खांसते समय मुंह पर कपड़ा रखें",
        "धूल-मिट्टी से बचें",
        "गुनगुने पानी से गरारे करें",
        "बाजार में मास्क पहनें"
      ]
    };
  }
  
  // Headache
  if (q.includes("headache") || q.includes("सिर दर्द") || q.includes("migraine")) {
    return {
      disease: { name: "सिर दर्द", description: "सिर में दर्द, जो तनाव, थकान या अन्य कारणों से हो सकता है" },
      healthTips: [
        "💧 पानी पीते रहें - डिहाइड्रेशन सिर दर्द का मुख्य कारण है",
        "😴 7-8 घंटे की नींद लें",
        "🍵 पुदीना या अदरक की चाय पिएं",
        "🧘 गहरी सांस लें और ध्यान करें",
        "📱 स्क्रीन टाइम कम करें और ब्रेक लें"
      ],
      dietPlan: {
        foodsToEat: ["केला", "बादाम", "तरबूज", "हरी सब्जियाँ", "अदरक की चाय"],
        foodsToAvoid: ["चाय-कॉफी", "शराब", "प्रोसेस्ड मीट", "पनीर", "कोल्ड ड्रिंक"],
        recommendations: "नियमित समय पर भोजन करें - भूखे रहने से सिर दर्द बढ़ता है। कैफीन और शराब से बचें।"
      },
      lifestyleAdvice: [
        "सिर दर्द डायरी रखें - कब और क्यों दर्द होता है नोट करें",
        "सीधे बैठें - गलत मुद्रा से दर्द बढ़ता है",
        "ठंडा या गर्म सेक लगाएं",
        "नियमित व्यायाम करें",
        "तनाव कम करने के लिए मेडिटेशन करें"
      ]
    };
  }
  
  // General / Default - Symptom-specific dynamic response
  return {
    disease: { name: "स्वास्थ्य संबंधी समस्या", description: "आपके द्वारा बताए गए लक्षणों के अनुसार ये सुझाव आपके लिए लाभकारी हो सकते हैं।" },
    healthTips: [
      "💧 दिनभर में 8-10 गिलास पानी जरूर पिएं",
      "😴 रोजाना 7-8 घंटे की गहरी नींद लें",
      "🚶 हर घंटे उठकर 5 मिनट टहलें",
      "🥗 ताजे फल और हरी सब्जियां खाएं",
      "🧘 तनाव कम करने के लिए ध्यान करें"
    ],
    dietPlan: {
      foodsToEat: ["ताजे फल", "हरी सब्जियाँ", "साबुत अनाज", "दालें", "मेवे और बीज"],
      foodsToAvoid: ["जंक फूड", "तला-भुना", "कोल्ड ड्रिंक", "मैदा", "ज्यादा मीठा"],
      recommendations: "पौष्टिक और संतुलित भोजन करें। हल्का खाएं और खाने को अच्छे से चबाकर खाएं।"
    },
    lifestyleAdvice: [
      "रोजाना 30 मिनट व्यायाम करें",
      "सोशल कनेक्शन बनाए रखें",
      "समय-समय पर हेल्थ चेकअप करवाएं",
      "धूम्रपान और शराब से बचें",
      "अच्छी हाइजीन बनाए रखें"
    ]
  };
}