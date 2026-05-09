import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, customerName, customerEmail, customerPhone, shippingAddress } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ error: 'Name and phone required' }, { status: 400 });
    }

    // Generate a unique order ID
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // 1. Save order as 'pending' in database
    console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('SERVICE ROLE EXISTS:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
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
      console.error('DB Error:', dbError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 2. Call Cashfree API to create payment session
    const APP_ID = process.env.CASHFREE_APP_ID;
    const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
    const ENV = process.env.CASHFREE_ENV || 'SANDBOX';
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    if (!APP_ID || !SECRET_KEY) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    const endpoint = ENV === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

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

    if (!cashfreeRes.ok) {
      // Clean up the pending order if Cashfree creation fails
      await supabaseAdmin.from('orders').delete().eq('id', orderId);
      console.error('Cashfree error:', cashfreeData);
      return NextResponse.json({ error: cashfreeData.message || 'Cashfree error' }, { status: cashfreeRes.status });
    }

    // 3. Update order with Cashfree reference ID
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
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}