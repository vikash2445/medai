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
    if (!amount || isNaN(amount)) {
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
        total: Math.round(amount * 100),
        payment_status: 'pending',
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

    // ✅ STEP 2: Create Cashfree order
    const environment = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
    const cashfree = new Cashfree(
      environment as any,
      process.env.CASHFREE_APP_ID!,
      process.env.CASHFREE_SECRET_KEY!
    );

    const orderRequest = {
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
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-status?order_id={order_id}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cashfree-webhook`,
      },
    };

    console.log('Creating Cashfree order:', orderRequest);
    
    const response = await cashfree.PGCreateOrder(orderRequest as any, '2025-01-01');

    // Check response
    if (!response || response.status !== 200) {
      // Clean up the pending order if Cashfree creation fails
      await supabase.from('orders').delete().eq('id', orderId);
      
      const errorMsg = (response?.data as any)?.message || (response?.data as any)?.error || 'Order creation failed';
      throw new Error(errorMsg);
    }

    // ✅ STEP 3: Update order with Cashfree order ID
    const cashfreeOrderId = response.data?.order_id;
    if (cashfreeOrderId) {
      await supabase
        .from('orders')
        .update({ cashfree_order_id: cashfreeOrderId })
        .eq('id', orderId);
    }

    return NextResponse.json({
      success: true,
      payment_session_id: response.data?.payment_session_id,
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