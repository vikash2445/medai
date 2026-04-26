import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const prompt = `You are Dr. Mediora — a senior MBBS doctor with 20 years of experience in general medicine. 
A patient says: "${query}"

Your job: Give a DETAILED, ACCURATE, STEP-BY-STEP medical guidance in HINDI. Be specific — not generic.

Return ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "disease": {
    "name": "Condition name in Hindi",
    "englishName": "English medical name",
    "description": "What this condition is, in Hindi (2-3 sentences)",
    "severity": "mild | moderate | severe",
    "severityNote": "Brief note in Hindi about when to see a doctor immediately"
  },

  "symptoms": {
    "common": ["लक्षण 1", "लक्षण 2", "लक्षण 3"],
    "warning": ["⚠️ खतरनाक लक्षण जो तुरंत डॉक्टर के पास जाने का संकेत दें"]
  },

  "immediateRelief": {
    "title": "तुरंत राहत के उपाय",
    "steps": [
      {
        "step": 1,
        "action": "सटीक कार्य (क्या करें)",
        "duration": "कितनी देर करें",
        "tip": "ध्यान रखें: एक अतिरिक्त टिप"
      },
      {
        "step": 2,
        "action": "दूसरा कार्य",
        "duration": "समय",
        "tip": "टिप"
      },
      {
        "step": 3,
        "action": "तीसरा कार्य",
        "duration": "समय",
        "tip": "टिप"
      }
    ]
  },

  "homeRemedies": [
    {
      "name": "उपाय का नाम",
      "ingredients": ["सामग्री 1", "सामग्री 2"],
      "howTo": "बनाने और उपयोग करने का तरीका (step by step)",
      "frequency": "दिन में कितनी बार",
      "effectiveIn": "कितने घंटे/दिन में असर दिखेगा"
    },
    {
      "name": "दूसरा उपाय",
      "ingredients": ["सामग्री"],
      "howTo": "तरीका",
      "frequency": "बार-बार",
      "effectiveIn": "समय"
    }
  ],

  "dietPlan": {
    "healingFoods": [
      { "food": "खाना", "benefit": "इस बीमारी में इससे क्या फायदा होगा", "howMuch": "कितनी मात्रा में" }
    ],
    "avoidFoods": [
      { "food": "खाना", "reason": "क्यों बचें — बीमारी में क्या नुकसान करता है" }
    ],
    "mealPlan": {
      "morning": "सुबह का सुझाया भोजन",
      "afternoon": "दोपहर का सुझाया भोजन",
      "evening": "शाम का सुझाया भोजन",
      "night": "रात का सुझाया भोजन"
    }
  },

  "recoveryPlan": {
    "day1": "पहले दिन क्या करें — घंटे दर घंटे plan",
    "day2to3": "2-3 दिन का plan",
    "week1": "पहले हफ्ते में क्या करें",
    "prevention": "भविष्य में यह बीमारी न हो इसके लिए क्या करें"
  },

  "medicines": {
    "disclaimer": "ये सामान्य जानकारी है — डॉक्टर की सलाह के बिना कोई दवाई न लें।",
    "otcOptions": [
      { "name": "दवाई का नाम", "use": "किसलिए", "caution": "सावधानी" }
    ]
  },

  "doctorVisit": {
    "shouldVisit": true,
    "urgency": "routine | within 2 days | today | emergency",
    "reason": "डॉक्टर के पास कब और क्यों जाएं — Hindi में"
  },

  "lifestyle": [
    { "habit": "आदत/बदलाव", "how": "कैसे करें", "impact": "इससे क्या फर्क पड़ेगा" }
  ]
}

RULES:
- Every tip must be SPECIFIC to "${query}" — not generic wellness advice
- Use real medical knowledge — be like a doctor, not a search engine
- Respond entirely in Hindi (except field keys and english names)
- Be warm, reassuring but honest about severity`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const clean = content.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Health advice error:', error);
    const { query: q } = await req.json().catch(() => ({ query: '' }));
    return NextResponse.json(getDetailedFallback(q || ''), { status: 200 });
  }
}

// ─── Rich Fallback Data ────────────────────────────────────────────────────────
function getDetailedFallback(query: string) {
  const q = query.toLowerCase();

  // ── BACK PAIN ──────────────────────────────────────────────────────────────
  if (q.includes('back') || q.includes('kamar') || q.includes('पीठ') || q.includes('कमर')) {
    return {
      disease: {
        name: 'कमर/पीठ दर्द', englishName: 'Lower Back Pain',
        description: 'यह रीढ़ की हड्डी के आसपास की मांसपेशियों या नसों में दर्द है। यह अक्सर गलत बैठने की मुद्रा, भारी सामान उठाने, या लंबे समय तक एक जगह बैठने से होता है।',
        severity: 'moderate',
        severityNote: '⚠️ यदि दर्द के साथ पैर सुन्न हो जाए, पेशाब में तकलीफ हो, या बुखार आए — तुरंत डॉक्टर को दिखाएं।'
      },
      symptoms: {
        common: ['कमर में खिंचाव या दर्द', 'झुकने या उठने में दिक्कत', 'लंबे समय तक बैठने पर दर्द बढ़ना', 'सुबह उठने पर अकड़न'],
        warning: ['⚠️ पैर या नितंब में दर्द फैलना (Sciatica)', '⚠️ पैर या पंजे का सुन्न होना', '⚠️ पेशाब या शौच में तकलीफ']
      },
      immediateRelief: {
        title: 'अभी राहत पाने के 3 कदम',
        steps: [
          { step: 1, action: 'आराम की स्थिति लें — पीठ के बल लेट जाएं, घुटनों के नीचे तकिया रखें', duration: '20-30 मिनट', tip: 'ध्यान रखें: पूरा दिन लेटे न रहें — इससे दर्द बढ़ता है' },
          { step: 2, action: 'बर्फ की सेंक (पहले 48 घंटे): कपड़े में बर्फ लपेटकर दर्द की जगह रखें', duration: 'हर 2 घंटे में 15-20 मिनट', tip: 'बर्फ सीधे त्वचा पर न लगाएं — जलन हो सकती है' },
          { step: 3, action: '48 घंटे बाद गर्म सेंक: हॉट वाटर बोतल या गर्म तौलिया लगाएं', duration: 'दिन में 3-4 बार, 15 मिनट', tip: 'बहुत गर्म न हो — सहनीय तापमान रखें' },
        ]
      },
      homeRemedies: [
        {
          name: 'हल्दी-अदरक का काढ़ा',
          ingredients: ['1 चम्मच हल्दी', '1 इंच अदरक (कूटी हुई)', '2 कप पानी', '1 चम्मच शहद'],
          howTo: '1. पानी में हल्दी और अदरक डालें। 2. 10 मिनट उबालें। 3. छानकर ठंडा करें। 4. शहद मिलाकर पिएं।',
          frequency: 'सुबह और रात — दिन में 2 बार',
          effectiveIn: '2-3 दिन में सूजन कम होगी'
        },
        {
          name: 'सरसों तेल मालिश',
          ingredients: ['4 चम्मच सरसों का तेल', '4-5 लहसुन की कलियाँ'],
          howTo: '1. तेल में लहसुन डालकर गर्म करें जब तक लहसुन भूरा न हो। 2. ठंडा होने दें। 3. दर्द की जगह 10 मिनट धीरे-धीरे मालिश करें।',
          frequency: 'रात को सोने से पहले',
          effectiveIn: '3-5 दिन में फर्क दिखेगा'
        }
      ],
      dietPlan: {
        healingFoods: [
          { food: 'हल्दी वाला दूध', benefit: 'Curcumin सूजन कम करता है', howMuch: 'रात को 1 गिलास' },
          { food: 'अखरोट और बादाम', benefit: 'Omega-3 मांसपेशियों की सूजन घटाता है', howMuch: '5-6 मेवे सुबह' },
          { food: 'पालक और मेथी', benefit: 'Magnesium मांसपेशियों को आराम देता है', howMuch: 'दिन में एक बार' },
          { food: 'दही', benefit: 'Calcium हड्डियों को मजबूत करता है', howMuch: '1 कटोरी दोपहर को' }
        ],
        avoidFoods: [
          { food: 'तला-भुना खाना', reason: 'Omega-6 फैटी एसिड सूजन बढ़ाता है' },
          { food: 'मैदा और प्रोसेस्ड फूड', reason: 'शरीर में अम्लता बढ़ाता है जो दर्द बढ़ाती है' },
          { food: 'अधिक चाय/कॉफी', reason: 'Calcium अवशोषण कम करता है' }
        ],
        mealPlan: {
          morning: 'गुनगुना पानी + हल्दी काढ़ा + 1 केला + 5 बादाम',
          afternoon: 'दाल-चावल / खिचड़ी + पालक की सब्जी + दही',
          evening: 'अदरक की चाय + मुट्ठी भर मेवे',
          night: 'हल्दी दूध + हल्की सब्जी + रोटी (कम मात्रा में)'
        }
      },
      recoveryPlan: {
        day1: 'आराम करें पर पूरी तरह से बिस्तर पर न रहें। हर 2 घंटे में 5 मिनट धीमे चलें। बर्फ की सेंक लगाएं।',
        day2to3: 'हल्की स्ट्रेचिंग शुरू करें। Child Pose और Cat-Cow Yoga करें — 3-5 बार। गर्म सेंक लगाएं।',
        week1: 'रोजाना 15-20 मिनट पैदल चलें। Core strengthening exercises शुरू करें। वजन न उठाएं।',
        prevention: 'कुर्सी पर सीधे बैठें, हर 45 मिनट पर उठें। Core muscles के लिए Plank करें। सोने के लिए कठोर गद्दा उपयोग करें।'
      },
      medicines: {
        disclaimer: 'ये सामान्य जानकारी है — डॉक्टर की सलाह के बिना कोई दवाई न लें।',
        otcOptions: [
          { name: 'Ibuprofen (Combiflam)', use: 'दर्द और सूजन के लिए', caution: 'खाली पेट न लें, 3 दिन से ज्यादा न लें' },
          { name: 'Diclofenac Gel', use: 'बाहर से लगाने के लिए', caution: 'त्वचा पर घाव हो तो न लगाएं' }
        ]
      },
      doctorVisit: {
        shouldVisit: true,
        urgency: 'within 2 days',
        reason: 'अगर 3 दिन में दर्द कम न हो, या पैर में दर्द/सुन्नपन हो — 2 दिन के अंदर डॉक्टर से मिलें। X-Ray या MRI की जरूरत हो सकती है।'
      },
      lifestyle: [
        { habit: 'Ergonomic बैठने की आदत', how: 'कुर्सी की ऊंचाई ऐसे रखें कि घुटने 90° पर हों', impact: 'कमर पर 40% कम दबाव' },
        { habit: 'Core Exercises', how: 'रोजाना 10 मिनट Plank और Bridge Exercise', impact: 'रीढ़ को सहारा देने वाली मांसपेशियाँ मजबूत होंगी' },
        { habit: 'वजन नियंत्रण', how: 'हर 5 किलो अतिरिक्त वजन — कमर पर 25 किलो दबाव बढ़ाता है', impact: 'वजन घटाने से कमर दर्द में 60% सुधार' }
      ]
    };
  }

  // ── FEVER ──────────────────────────────────────────────────────────────────
  if (q.includes('fever') || q.includes('बुखार') || q.includes('temperature') || q.includes('bukhar')) {
    return {
      disease: {
        name: 'बुखार', englishName: 'Fever / Pyrexia',
        description: 'बुखार तब होता है जब शरीर का तापमान 98.6°F (37°C) से ऊपर चला जाता है। यह शरीर की एक रक्षा प्रतिक्रिया है — जो वायरस या बैक्टीरिया से लड़ने के लिए होती है।',
        severity: 'moderate',
        severityNote: '⚠️ 103°F से ऊपर बुखार, 3 दिन से ज्यादा, या बच्चों में 100.4°F — तुरंत डॉक्टर के पास जाएं।'
      },
      symptoms: {
        common: ['शरीर गर्म लगना', 'कंपकंपी या ठंड लगना', 'सिर दर्द', 'थकान और कमजोरी', 'भूख न लगना'],
        warning: ['⚠️ 103°F से ऊपर तापमान', '⚠️ गर्दन में अकड़न', '⚠️ सांस लेने में तकलीफ', '⚠️ चकत्ते या रैश']
      },
      immediateRelief: {
        title: 'बुखार में तुरंत राहत के 3 कदम',
        steps: [
          { step: 1, action: 'तापमान मापें — थर्मामीटर से Axillary (बगल) में मापें', duration: '2 मिनट', tip: 'डिजिटल थर्मामीटर सबसे सटीक होता है' },
          { step: 2, action: 'ठंडे पानी में कपड़ा भिगोकर माथे, बगल और गर्दन पर रखें', duration: 'हर 15 मिनट में बदलें — जब तक बुखार कम न हो', tip: 'बर्फ का पानी न लें — हल्का ठंडा पानी उपयोग करें' },
          { step: 3, action: 'ORS या नींबू पानी पिलाएं — हर 30 मिनट में एक गिलास', duration: 'पूरे दिन', tip: 'बुखार में पसीने से पानी और Electrolytes खूब निकलते हैं' }
        ]
      },
      homeRemedies: [
        {
          name: 'तुलसी-अदरक-शहद काढ़ा',
          ingredients: ['10-12 तुलसी की पत्तियाँ', '1 इंच अदरक', '1 चम्मच शहद', '2 कप पानी', 'एक चुटकी काली मिर्च'],
          howTo: '1. पानी उबालें। 2. तुलसी और कूटा अदरक डालें। 3. 5 मिनट उबालें। 4. छानें, ठंडा करें। 5. शहद और काली मिर्च मिलाएं।',
          frequency: 'दिन में 3 बार — सुबह, दोपहर, रात',
          effectiveIn: '12-24 घंटों में बुखार कम होने लगेगा'
        },
        {
          name: 'सेब के सिरके की पट्टी',
          ingredients: ['2 चम्मच Apple Cider Vinegar', '1 कटोरी ठंडा पानी', 'मुलायम कपड़ा'],
          howTo: '1. पानी में सिरका मिलाएं। 2. कपड़ा भिगोकर निचोड़ें। 3. माथे और पैरों के तलवों पर रखें।',
          frequency: 'हर 20 मिनट पर बदलें',
          effectiveIn: '30-60 मिनट में तापमान 1-2 डिग्री घटेगा'
        }
      ],
      dietPlan: {
        healingFoods: [
          { food: 'नारियल पानी', benefit: 'Electrolytes की पूर्ति करता है', howMuch: 'दिन में 2-3 बार' },
          { food: 'मूंग दाल खिचड़ी', benefit: 'हल्का, पचने में आसान, प्रोटीन युक्त', howMuch: 'दोपहर और रात का मुख्य भोजन' },
          { food: 'अनार का रस', benefit: 'Antioxidants इम्यून सिस्टम को मजबूत करते हैं', howMuch: '1 गिलास सुबह' },
          { food: 'गर्म सूप (सब्जी/चिकन)', benefit: 'पोषण + हाइड्रेशन एक साथ', howMuch: 'दिन में 2 बार' }
        ],
        avoidFoods: [
          { food: 'तला-भुना और मसालेदार', reason: 'पाचन पर बोझ पड़ता है — बुखार बढ़ सकता है' },
          { food: 'दूध और डेयरी', reason: 'बुखार में mucus बढ़ सकता है' },
          { food: 'ठंडे पेय और आइसक्रीम', reason: 'गले में सूजन बढ़ा सकते हैं' }
        ],
        mealPlan: {
          morning: 'गर्म पानी + नींबू + शहद + तुलसी काढ़ा + 1 केला',
          afternoon: 'मूंग दाल खिचड़ी + थोड़ा देशी घी + नारियल पानी',
          evening: 'गर्म सब्जी सूप + ORS पानी',
          night: 'हल्की खिचड़ी या दलिया + तुलसी काढ़ा'
        }
      },
      recoveryPlan: {
        day1: 'पूरा आराम करें। तापमान हर 4 घंटे में नोट करें। खूब पानी पिएं। Paracetamol ले सकते हैं (डॉक्टर की सलाह पर)।',
        day2to3: 'अगर बुखार कम हो रहा है — हल्का चलना शुरू करें। काढ़ा जारी रखें। घर के बाहर न जाएं।',
        week1: 'बुखार उतरने के बाद भी 2-3 दिन आराम करें — शरीर को recover करने दें।',
        prevention: 'हाथ बार-बार साबुन से धोएं। भीड़ में मास्क पहनें। Immunity बढ़ाने के लिए Vitamin C और Zinc लें।'
      },
      medicines: {
        disclaimer: 'ये सामान्य जानकारी है — डॉक्टर की सलाह के बिना कोई दवाई न लें।',
        otcOptions: [
          { name: 'Paracetamol 500mg (Crocin/Dolo)', use: 'बुखार और दर्द के लिए', caution: '6 घंटे से पहले दूसरी खुराक न लें' },
          { name: 'ORS Sachet', use: 'Electrolyte balance के लिए', caution: 'पैकेट पर दिए अनुपात में ही पानी मिलाएं' }
        ]
      },
      doctorVisit: {
        shouldVisit: true,
        urgency: 'within 2 days',
        reason: '3 दिन से ज्यादा बुखार, 103°F से अधिक तापमान, बच्चों में 100.4°F, या रैश/सांस की तकलीफ — तुरंत डॉक्टर के पास जाएं। Dengue/Malaria test करवाना जरूरी हो सकता है।'
      },
      lifestyle: [
        { habit: 'हाथ धोने की आदत', how: '20 सेकंड साबुन से — खाने से पहले और बाथरूम के बाद', impact: 'संक्रमण का खतरा 50% कम' },
        { habit: 'Immunity बढ़ाएं', how: 'रोजाना Vitamin C (नींबू, आंवला) और सूरज की रोशनी', impact: 'बार-बार बुखार से बचाव' }
      ]
    };
  }

  // ── HEADACHE ───────────────────────────────────────────────────────────────
  if (q.includes('headache') || q.includes('सिर दर्द') || q.includes('migraine') || q.includes('sar dard')) {
    return {
      disease: {
        name: 'सिर दर्द', englishName: 'Headache / Cephalalgia',
        description: 'सिर में दर्द कई कारणों से हो सकता है — तनाव, डिहाइड्रेशन, नींद की कमी, या माइग्रेन। यह सबसे आम स्वास्थ्य समस्याओं में से एक है।',
        severity: 'mild',
        severityNote: '⚠️ अचानक बहुत तेज दर्द, दृष्टि धुंधली हो, या बोलने में तकलीफ हो — तुरंत Emergency में जाएं।'
      },
      symptoms: {
        common: ['माथे या सिर के किसी हिस्से में दर्द', 'आँखों के पीछे दर्द', 'गर्दन में अकड़न', 'रोशनी से परेशानी'],
        warning: ['⚠️ अचानक बहुत तेज दर्द — "Thunderclap Headache"', '⚠️ दृष्टि धुंधली या दोहरी दिखना', '⚠️ बोलने या चलने में तकलीफ']
      },
      immediateRelief: {
        title: 'सिर दर्द में तुरंत राहत',
        steps: [
          { step: 1, action: '1-2 गिलास ठंडा पानी पिएं — धीरे-धीरे', duration: '5 मिनट', tip: '70% सिर दर्द सिर्फ डिहाइड्रेशन से होते हैं' },
          { step: 2, action: 'अंधेरे और शांत कमरे में लेट जाएं। आँखें बंद करें।', duration: '15-20 मिनट', tip: 'फोन और स्क्रीन बिल्कुल बंद कर दें' },
          { step: 3, action: 'पुदीना तेल (Peppermint Oil) माथे और कनपटी पर लगाएं और हल्के से मालिश करें', duration: '2-3 मिनट', tip: 'आँखों के पास न लगाएं — जलन होती है' }
        ]
      },
      homeRemedies: [
        {
          name: 'अदरक-नींबू चाय',
          ingredients: ['1 इंच अदरक', '1/2 नींबू का रस', '1 चम्मच शहद', '1 कप गर्म पानी'],
          howTo: '1. अदरक को कूटें। 2. गर्म पानी में 5 मिनट उबालें। 3. छानें। 4. नींबू और शहद मिलाएं। 5. धीरे-धीरे पिएं।',
          frequency: 'दर्द होते ही पिएं — दिन में 2-3 बार',
          effectiveIn: '20-30 मिनट में असर दिखेगा'
        },
        {
          name: 'बर्फ और गर्म पट्टी (Contrast Therapy)',
          ingredients: ['बर्फ की थैली', 'गर्म तौलिया'],
          howTo: '1. माथे पर 10 मिनट बर्फ रखें। 2. फिर गर्दन के पीछे 10 मिनट गर्म तौलिया। 3. दोहराएं।',
          frequency: 'एक बार में 2-3 cycle',
          effectiveIn: '15-20 मिनट में'
        }
      ],
      dietPlan: {
        healingFoods: [
          { food: 'केला', benefit: 'Magnesium tension headache में फायदेमंद', howMuch: '1-2 केले' },
          { food: 'तरबूज', benefit: '92% पानी — hydration से दर्द कम होता है', howMuch: '2 कप टुकड़े' },
          { food: 'अदरक की चाय', benefit: 'Prostaglandins को ब्लॉक करता है — migraine में कारगर', howMuch: 'दिन में 2 बार' }
        ],
        avoidFoods: [
          { food: 'चाय और कॉफी (अधिक मात्रा)', reason: 'Caffeine withdrawal और vasodilation से दर्द बढ़ता है' },
          { food: 'Processed Meat (सॉसेज)', reason: 'Nitrates blood vessels को dilate करते हैं' },
          { food: 'पनीर और चॉकलेट', reason: 'Tyramine migraine trigger है' }
        ],
        mealPlan: {
          morning: 'गर्म पानी + नींबू + केला + बादाम',
          afternoon: 'हल्का भोजन — दाल-चावल, सलाद, दही',
          evening: 'अदरक चाय + मुट्ठी भर मेवे',
          night: 'हल्का खाना + Magnesium युक्त (पालक, काजू)'
        }
      },
      recoveryPlan: {
        day1: 'पानी पिएं, अंधेरे में आराम करें, स्क्रीन से दूर रहें, पुदीना तेल लगाएं।',
        day2to3: 'नींद का समय fix करें। हर दिन 7-8 घंटे सोएं। Caffeine कम करें।',
        week1: 'Headache Diary बनाएं — कब, क्यों, कितनी देर? Pattern समझें।',
        prevention: 'Screen time कम करें, हर 45 मिनट पर 5 मिनट का break लें। नियमित नींद, पानी, और व्यायाम।'
      },
      medicines: {
        disclaimer: 'ये सामान्य जानकारी है — डॉक्टर की सलाह के बिना कोई दवाई न लें।',
        otcOptions: [
          { name: 'Paracetamol 500mg', use: 'हल्के से मध्यम सिर दर्द', caution: '4 घंटे से पहले दूसरी खुराक न लें' },
          { name: 'Ibuprofen 400mg (Brufen)', use: 'सूजन वाले दर्द में', caution: 'खाली पेट न लें' }
        ]
      },
      doctorVisit: {
        shouldVisit: false,
        urgency: 'routine',
        reason: 'अगर हर हफ्ते 3 से ज्यादा बार सिर दर्द हो, या दर्द बहुत तेज हो — Neurologist से मिलें। MRI की जरूरत हो सकती है।'
      },
      lifestyle: [
        { habit: '20-20-20 Screen Rule', how: 'हर 20 मिनट पर 20 फीट दूर 20 सेकंड देखें', impact: 'Eye strain से होने वाले 60% headache बंद होंगे' },
        { habit: 'नियमित नींद', how: 'रोज एक ही समय पर सोएं और उठें — weekends भी', impact: 'Migraine frequency 50% कम हो सकती है' }
      ]
    };
  }

  // ── COLD / COUGH ───────────────────────────────────────────────────────────
  if (q.includes('cold') || q.includes('cough') || q.includes('खांसी') || q.includes('ज़ुकाम') || q.includes('zukam')) {
    return {
      disease: {
        name: 'खांसी और ज़ुकाम', englishName: 'Common Cold / Upper Respiratory Infection',
        description: 'यह Rhinovirus के कारण होने वाला संक्रमण है जो नाक और गले को प्रभावित करता है। यह 3-7 दिन में अपने आप ठीक होता है लेकिन सही उपचार से जल्दी आराम मिलता है।',
        severity: 'mild',
        severityNote: '⚠️ खांसी के साथ खून आए, सांस लेने में तकलीफ हो, या 5 दिन बाद भी बुखार हो — डॉक्टर को दिखाएं।'
      },
      symptoms: {
        common: ['नाक बहना या बंद नाक', 'गले में खराश', 'छींक आना', 'हल्का बुखार', 'थकान'],
        warning: ['⚠️ 5 दिन बाद भी बुखार', '⚠️ सीने में दर्द', '⚠️ सांस लेने में तकलीफ', '⚠️ खांसी में खून']
      },
      immediateRelief: {
        title: 'खांसी-ज़ुकाम में तुरंत राहत',
        steps: [
          { step: 1, action: 'Steam Inhalation: उबलते पानी में 4-5 बूंद Eucalyptus तेल डालें, सिर पर तौलिया रखकर 10 मिनट भाप लें', duration: '10 मिनट, दिन में 2-3 बार', tip: 'बहुत करीब न जाएं — जलन हो सकती है' },
          { step: 2, action: 'गर्म नमक पानी से गरारे: 1 गिलास गर्म पानी में 1/2 चम्मच नमक', duration: 'दिन में 3-4 बार, हर बार 30 सेकंड', tip: 'पानी निगलें नहीं — थूक दें' },
          { step: 3, action: 'गर्म तरल पदार्थ लगातार पिएं — हर 30 मिनट पर', duration: 'पूरे दिन', tip: 'गर्म पेय mucus को पतला करते हैं — बाहर निकालना आसान होता है' }
        ]
      },
      homeRemedies: [
        {
          name: 'शहद-अदरक-तुलसी काढ़ा',
          ingredients: ['2 चम्मच शहद', '1 इंच अदरक', '10 तुलसी पत्तियाँ', '4-5 काली मिर्च', '1 कप पानी'],
          howTo: '1. सभी चीजें पानी में उबालें — 10 मिनट। 2. छानें। 3. थोड़ा ठंडा होने पर शहद मिलाएं (गर्म में न मिलाएं)। 4. धीरे-धीरे चाय की तरह पिएं।',
          frequency: 'सुबह खाली पेट और रात सोने से पहले',
          effectiveIn: '24-48 घंटे में खांसी में राहत'
        },
        {
          name: 'हल्दी दूध (Golden Milk)',
          ingredients: ['1 गिलास गर्म दूध', '1 चम्मच हल्दी', '1/4 चम्मच काली मिर्च', '1 चम्मच शहद'],
          howTo: '1. दूध गर्म करें। 2. हल्दी और काली मिर्च मिलाएं। 3. 2 मिनट उबालें। 4. थोड़ा ठंडा होने पर शहद मिलाएं।',
          frequency: 'रात को सोने से पहले',
          effectiveIn: '2-3 रात में गले को आराम'
        }
      ],
      dietPlan: {
        healingFoods: [
          { food: 'लहसुन (कच्चा)', benefit: 'Allicin एक शक्तिशाली antiviral है', howMuch: '2-3 कलियाँ सुबह' },
          { food: 'अनार और संतरा', benefit: 'Vitamin C White Blood Cells बढ़ाता है', howMuch: '1 फल या 1 गिलास रस' },
          { food: 'चिकन सूप', benefit: 'वैज्ञानिक रूप से proven — mucus thin करता है', howMuch: 'दिन में 1-2 कटोरी' }
        ],
        avoidFoods: [
          { food: 'ठंडा पानी और आइसक्रीम', reason: 'गले की सूजन और mucus बढ़ाता है' },
          { food: 'दही और दूध (ज्यादा)', reason: 'Mucus production बढ़ सकती है' },
          { food: 'मीठा और शक्कर', reason: 'White Blood Cells की क्षमता घटाता है' }
        ],
        mealPlan: {
          morning: 'खाली पेट कच्ची लहसुन + तुलसी काढ़ा + केला',
          afternoon: 'गर्म सूप + मूंग दाल खिचड़ी + नारियल पानी',
          evening: 'अदरक चाय + मुट्ठी भर मेवे',
          night: 'हल्दी दूध + हल्का खाना'
        }
      },
      recoveryPlan: {
        day1: 'घर पर रहें। Steam लें। काढ़ा पिएं। भरपूर आराम करें।',
        day2to3: 'Steam और गरारे जारी रखें। नाक के लिए Saline drops (खारे पानी की बूंदें) उपयोग करें।',
        week1: 'ठीक होने पर बाहर जाएं लेकिन मास्क पहनें। Vitamin C supplement शुरू करें।',
        prevention: 'हाथ बार-बार धोएं। Zinc और Vitamin C रोजाना लें। भीड़ में मास्क पहनें।'
      },
      medicines: {
        disclaimer: 'ये सामान्य जानकारी है — डॉक्टर की सलाह के बिना कोई दवाई न लें।',
        otcOptions: [
          { name: 'Cetrizine (Zyrtec)', use: 'बहती नाक और छींक के लिए', caution: 'नींद आ सकती है — रात को लें' },
          { name: 'Benadryl Syrup', use: 'खांसी के लिए', caution: 'खुराक पैकेट के अनुसार लें' }
        ]
      },
      doctorVisit: {
        shouldVisit: false,
        urgency: 'routine',
        reason: 'सामान्य ज़ुकाम 5-7 दिन में ठीक होता है। अगर 7 दिन बाद भी ठीक न हो, या कान में दर्द हो — ENT डॉक्टर से मिलें।'
      },
      lifestyle: [
        { habit: 'नाक की सफाई (Nasal Rinse)', how: 'Neti pot या Saline spray से रोजाना सुबह', impact: 'Sinus congestion 50% कम होगा' },
        { habit: 'Immunity बूस्ट', how: 'रोजाना 30 मिनट धूप + Vitamin C + Zinc', impact: 'अगली बार जल्दी recover होंगे' }
      ]
    };
  }

  // ── DEFAULT ────────────────────────────────────────────────────────────────
  return {
    disease: {
      name: 'स्वास्थ्य संबंधी समस्या', englishName: 'General Health Concern',
      description: 'आपके बताए लक्षणों के आधार पर यह सामान्य स्वास्थ्य सुझाव हैं। सटीक जानकारी के लिए कृपया अपने लक्षण थोड़ा विस्तार से बताएं।',
      severity: 'mild',
      severityNote: '⚠️ लक्षण गंभीर लगें तो डॉक्टर से मिलें।'
    },
    symptoms: {
      common: ['थकान', 'कमजोरी', 'भूख न लगना'],
      warning: ['⚠️ अचानक तेज दर्द', '⚠️ सांस की तकलीफ', '⚠️ चेतना खोना']
    },
    immediateRelief: {
      title: 'सामान्य स्वास्थ्य सुधार',
      steps: [
        { step: 1, action: '2-3 गिलास पानी पिएं', duration: 'अभी और अगले 30 मिनट में', tip: 'शरीर की अधिकतर समस्याएं डिहाइड्रेशन से जुड़ी होती हैं' },
        { step: 2, action: '10 मिनट के लिए लेट जाएं — पूरी तरह आराम करें', duration: '10-15 मिनट', tip: 'आँखें बंद रखें और गहरी सांस लें' },
        { step: 3, action: 'हल्का और ताजा खाना खाएं', duration: 'अगले भोजन में', tip: 'प्रोसेस्ड और तला खाना बिल्कुल न खाएं' }
      ]
    },
    homeRemedies: [
      {
        name: 'अदरक-शहद काढ़ा',
        ingredients: ['1 इंच अदरक', '1 चम्मच शहद', '1 कप गर्म पानी'],
        howTo: '1. अदरक कूटें। 2. पानी में 5 मिनट उबालें। 3. छानें और शहद मिलाएं।',
        frequency: 'दिन में 2 बार',
        effectiveIn: '24 घंटे में सामान्य बेहतरी'
      }
    ],
    dietPlan: {
      healingFoods: [
        { food: 'ताजे फल और सब्जियाँ', benefit: 'Vitamins और Minerals की पूर्ति', howMuch: 'दिन में 5 serving' },
        { food: 'दाल और दही', benefit: 'Protein और Probiotics', howMuch: 'हर मुख्य भोजन में' }
      ],
      avoidFoods: [
        { food: 'जंक फूड और मैदा', reason: 'Inflammation बढ़ाता है' },
        { food: 'अधिक चीनी', reason: 'Immune system कमजोर करती है' }
      ],
      mealPlan: {
        morning: 'गर्म पानी + नींबू + ताजे फल + मेवे',
        afternoon: 'दाल-सब्जी-रोटी + दही + सलाद',
        evening: 'हर्बल चाय + मेवे',
        night: 'हल्का खाना + हल्दी दूध'
      }
    },
    recoveryPlan: {
      day1: 'आराम करें। खूब पानी पिएं। हल्का खाएं।',
      day2to3: 'धीरे-धीरे सामान्य दिनचर्या शुरू करें।',
      week1: 'नियमित व्यायाम और संतुलित भोजन पर ध्यान दें।',
      prevention: 'नियमित health checkup करवाएं। तनाव कम करें। नींद पूरी लें।'
    },
    medicines: {
      disclaimer: 'ये सामान्य जानकारी है — डॉक्टर की सलाह के बिना कोई दवाई न लें।',
      otcOptions: []
    },
    doctorVisit: {
      shouldVisit: true,
      urgency: 'routine',
      reason: 'लक्षण विस्तार से बताएं और अगर 2-3 दिन में बेहतर न हों तो डॉक्टर से मिलें।'
    },
    lifestyle: [
      { habit: 'नियमित व्यायाम', how: 'रोजाना 30 मिनट पैदल चलें', impact: 'Overall health में 40% सुधार' },
      { habit: 'नींद का समय fix करें', how: 'रात 10 बजे सोएं, सुबह 6 बजे उठें', impact: 'Immunity और energy दोनों बढ़ेंगे' }
    ]
  };
}