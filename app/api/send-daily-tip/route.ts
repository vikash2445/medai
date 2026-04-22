// app/api/send-daily-tip/route.ts
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { sendDailyHealthTip } from '@/app/lib/onesignal';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// A simple in-memory cache to prevent duplicate sends for the same day.
let lastSentDate: string | null = null;

export async function GET() {
  // 1. Check if we've already sent a tip today
  const today = new Date().toISOString().split('T')[0];
  if (lastSentDate === today) {
    return NextResponse.json({ message: 'Tip already sent for today.' });
  }

  try {
    // 2. Generate a health tip using Groq AI (Hindi + English)
    const prompt = `Generate a short, actionable, evidence-based health tip for today in HINDI and English.
    Return ONLY valid JSON in this format:
    {
      "title": "English title (2-4 words)",
      "englishTip": "English tip (max 100 characters)",
      "hindiTitle": "हिंदी में शीर्षक (2-4 शब्द)",
      "hindiTip": "हिंदी में टिप (अधिकतम 100 अक्षर)"
    }
    Example:
    {
      "title": "Stay Hydrated",
      "englishTip": "💧 Drink a glass of water first thing in the morning!",
      "hindiTitle": "पानी पीते रहें",
      "hindiTip": "💧 सुबह उठते ही एक गिलास पानी पिएं।"
    }`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiContent = completion.choices[0]?.message?.content || "{}";
    const cleanJson = aiContent.replace(/```json|```/g, '').trim();
    const tipData = JSON.parse(cleanJson);

    // 3. Send the notification using OneSignal
    const notificationSent = await sendDailyHealthTip(
      tipData.title,
      tipData.englishTip,
      '/'
    );

    if (!notificationSent) {
      throw new Error("Failed to send OneSignal notification.");
    }

    // 4. Update the cache to prevent re-sending today
    lastSentDate = today;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Daily health tip generated and sent successfully!',
      data: tipData 
    });

  } catch (error) {
    console.error('Failed to process daily tip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}