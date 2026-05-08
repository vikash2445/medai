import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Initialize Supabase DIRECTLY - no import needed
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await req.json();
    const { amount, customerName, customerEmail, customerPhone, shippingAddress } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Name and phone required' }, { status: 400 });
    }

    const orderId = `MED_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Save to Supabase
    const { error: dbError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: userId,
        total: Math.round(amount * 100),
        status: 'pending',
        shipping_address: shippingAddress || '',
        customer_name: customerName,
        customer_email: customerEmail || '',
        customer_phone: customerPhone,
        created_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error('DB Error:', dbError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Cashfree API
    const APP_ID = process.env.CASHFREE_APP_ID;
    const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
    const ENV = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (!APP_ID || !SECRET_KEY) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const endpoint = ENV === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    const cashfreeRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: userId,
          customer_phone: customerPhone,
          customer_name: customerName,
          customer_email: customerEmail || '',
        },
        order_meta: {
          return_url: `${BASE_URL}/payment-success?order_id={order_id}`,
        },
      }),
    });

    const data = await cashfreeRes.json();

    if (!cashfreeRes.ok) {
      await supabase.from('orders').delete().eq('id', orderId);
      return NextResponse.json({ error: data.message }, { status: cashfreeRes.status });
    }

    return NextResponse.json({
      success: true,
      payment_session_id: data.payment_session_id,
      order_id: orderId,
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}