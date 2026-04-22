import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const Razorpay = require('razorpay');
    
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Test if credentials work by fetching orders
    const orders = await razorpay.orders.all({ count: 1 });
    
    return NextResponse.json({ 
      success: true, 
      message: "Razorpay credentials are valid",
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.substring(0, 10) + "..."
    });
  } catch (error: any) {
    console.error("Razorpay test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}