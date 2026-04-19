import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { drugName } = await request.json();
    
    if (!drugName) {
      return NextResponse.json({ imageUrl: null });
    }

    // Simple colored placeholder with drug name (always works)
    const imageUrl = `https://dummyimage.com/200x200/0fa381/ffffff?text=${encodeURIComponent(drugName.substring(0, 15))}`;
    return NextResponse.json({ imageUrl });
    
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ imageUrl: null });
  }
}