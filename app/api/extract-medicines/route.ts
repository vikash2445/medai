import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const prompt = `Extract medicine names from this prescription text. Return ONLY a JSON array of medicine names (e.g., ["Paracetamol", "Ibuprofen"]). If no medicines found, return an empty array.

Prescription text: "${text}"

Medicine names (return as JSON array):`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 200,
    });

    const responseText = completion.choices[0]?.message?.content || "[]";
    const clean = responseText.replace(/```json|```/g, '').trim();
    const medicines = JSON.parse(clean);
    
    return NextResponse.json({ medicines: Array.isArray(medicines) ? medicines : [] });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ medicines: [] });
  }
}