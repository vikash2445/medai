import { NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Received order request:', body);
    
    const { amount, customerName, customerEmail, customerPhone, shippingAddress } = body;

    // Validate required fields
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }
    
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Customer name and phone are required' }, { status: 400 });
    }

    // Generate order ID
    const orderId = `MED_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // ✅ STEP 1: Create order in database with 'pending' status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: userId,
        total: Math.round(amount * 100), // store in paise
        status: 'pending',
        shipping_address: shippingAddress || '',
        customer_name: customerName,
        customer_email: customerEmail || '',
        customer_phone: customerPhone,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Database order error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // ✅ STEP 2: Configure Cashfree
    const APP_ID = process.env.CASHFREE_APP_ID!;
    const SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
    const ENV = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const endpoint = ENV === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    const requestBody = {
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
        notify_url: `${BASE_URL}/api/cashfree-webhook`,
      },
    };

    console.log('Creating Cashfree order:', requestBody);

    // ✅ STEP 3: Call Cashfree API directly (more reliable than SDK)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree API error:', data);
      
      // Clean up the pending order
      await supabase.from('orders').delete().eq('id', orderId);
      
      return NextResponse.json(
        { error: data.message || 'Failed to create Cashfree order' },
        { status: response.status }
      );
    }

    // ✅ STEP 4: Update order with Cashfree reference
    await supabase
      .from('orders')
      .update({ cashfree_order_id: data.order_id })
      .eq('id', orderId);

    return NextResponse.json({
      success: true,
      payment_session_id: data.payment_session_id,
      order_id: orderId,
    });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}