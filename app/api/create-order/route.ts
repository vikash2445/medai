import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import supabaseAdmin from '@/app/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('📦 Received order request:', body);
    
    const { amount, customerName, customerEmail, customerPhone, shippingAddress, cartItems } = body;

    // Validate
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Name and phone required' }, { status: 400 });
    }

    // Generate order ID
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Save pending order to Supabase using admin client
    const { error: dbError } = await supabaseAdmin
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
      console.error('❌ DB Error:', dbError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Check Cashfree credentials
    const APP_ID = process.env.CASHFREE_APP_ID;
    const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
    
    if (!APP_ID || !SECRET_KEY) {
      console.error('❌ Cashfree credentials missing');
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    // Call Cashfree API
    const ENV = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
    const endpoint = ENV === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';
    
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const cashfreeBody = {
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
    };

    console.log('📤 Cashfree request:', cashfreeBody);

    const cashfreeRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
      },
      body: JSON.stringify(cashfreeBody),
    });

    const cashfreeData = await cashfreeRes.json();
    console.log('📥 Cashfree response:', cashfreeData);

    if (!cashfreeRes.ok) {
      // Clean up pending order
      await supabaseAdmin.from('orders').delete().eq('id', orderId);
      return NextResponse.json({ error: cashfreeData.message || 'Cashfree error' }, { status: cashfreeRes.status });
    }

    if (!cashfreeData.payment_session_id) {
      return NextResponse.json({ error: 'No payment session ID' }, { status: 500 });
    }

    // Update order with Cashfree reference
    await supabaseAdmin
      .from('orders')
      .update({ cashfree_order_id: cashfreeData.order_id })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      payment_session_id: cashfreeData.payment_session_id,
      order_id: orderId,
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}