import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createWorker } from 'tesseract.js';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Convert image to buffer
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Extract text using Tesseract OCR
    console.log('📷 Running OCR on image...');
    const extractedText = await extractTextWithTesseract(buffer);
    console.log('📝 Extracted Text:', extractedText);

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Could not read text from image. Please ensure the prescription is clear and well-lit.',
        extractedText: extractedText 
      }, { status: 400 });
    }

    // Step 2: Analyze with AI
    console.log('🤖 Analyzing with AI...');
    const analysis = await analyzeWithAI(extractedText);
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Prescription analysis error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed. Please try again with a clearer image.' 
    }, { status: 500 });
  }
}

async function extractTextWithTesseract(buffer: Buffer): Promise<string> {
  // Create a worker
  const worker = await createWorker('eng');
  
  try {
    // Convert buffer to image data
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();
    return text;
  } catch (error) {
    console.error('Tesseract error:', error);
    await worker.terminate();
    return '';
  }
}

async function analyzeWithAI(text: string) {
  const prompt = `You are a medical assistant. Analyze this prescription text and provide detailed information.

Prescription text: "${text}"

Return ONLY valid JSON in this exact format (no markdown, no backticks):
{
  "disease": {
    "name": "Main diagnosis/disease name",
    "description": "Brief 1-line description of this condition",
    "severity": "mild",
    "duration": "Expected recovery time (e.g., 5-7 days)"
  },
  "medicines": [
    {
      "name": "Medicine name",
      "dosage": "How to take",
      "duration": "How many days",
      "purpose": "What it treats",
      "type": "antibiotic/painkiller/antihistamine/other"
    }
  ],
  "healthTips": [
    "Tip 1",
    "Tip 2",
    "Tip 3",
    "Tip 4",
    "Tip 5"
  ],
  "dietPlan": {
    "foodsToEat": ["Food 1", "Food 2", "Food 3"],
    "foodsToAvoid": ["Avoid 1", "Avoid 2", "Avoid 3"],
    "recommendations": "Dietary advice paragraph"
  },
  "lifestyleAdvice": [
    "Advice 1",
    "Advice 2",
    "Advice 3"
  ]
}

Important: If specific medicines or details are not in the prescription, suggest common OTC alternatives. Always be helpful and practical.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    max_tokens: 2000,
  });

  const content = completion.choices[0]?.message?.content || "{}";
  const clean = content.replace(/```json|```/g, '').trim();
  
  try {
    return JSON.parse(clean);
  } catch (error) {
    console.error('JSON parse error:', clean);
    // Return fallback data
    return getFallbackAnalysis(text);
  }
}

function getFallbackAnalysis(text: string) {
  const lowerText = text.toLowerCase();
  
  // Detect disease from text
  let disease = "General Health Condition";
  if (lowerText.includes("fever") || lowerText.includes("temperature")) disease = "Fever";
  else if (lowerText.includes("cough") || lowerText.includes("cold")) disease = "Upper Respiratory Infection";
  else if (lowerText.includes("headache") || lowerText.includes("migraine")) disease = "Headache";
  else if (lowerText.includes("stomach") || lowerText.includes("acidity")) disease = "Acidity";
  else if (lowerText.includes("allergy") || lowerText.includes("sneeze")) disease = "Allergy";
  
  return {
    disease: {
      name: disease,
      description: `Based on your prescription, this condition requires proper medication and rest.`,
      severity: "mild",
      duration: "5-7 days"
    },
    medicines: [
      {
        name: "Consult your pharmacist",
        dosage: "As prescribed",
        duration: "As directed",
        purpose: "Treatment of symptoms",
        type: "other"
      }
    ],
    healthTips: [
      "Get plenty of rest to help your body recover",
      "Stay hydrated by drinking warm water throughout the day",
      "Avoid stress and take adequate sleep (7-8 hours)",
      "Keep yourself warm and avoid sudden temperature changes",
      "Monitor your symptoms and consult doctor if they worsen"
    ],
    dietPlan: {
      foodsToEat: ["Warm soups", "Herbal tea", "Fresh fruits", "Light meals", "Honey with warm water"],
      foodsToAvoid: ["Spicy food", "Cold drinks", "Fried items", "Dairy products", "Processed food"],
      recommendations: "Eat light, easily digestible foods. Avoid heavy, oily, or spicy meals until recovery."
    },
    lifestyleAdvice: [
      "Take prescribed medicines on time",
      "Avoid going out in extreme weather",
      "Wash hands frequently",
      "Use a mask if going out",
      "Follow up with doctor if no improvement in 3 days"
    ]
  };
}