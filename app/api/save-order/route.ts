export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { items, total, shippingAddress, customerName, customerEmail, customerPhone, razorpayPaymentId, razorpayOrderId } = body;

    // Validate required fields
    if (!items || !total || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        total: Math.round(total * 100),
        status: 'paid',
        shipping_address: shippingAddress || '',
        customer_name: customerName,
        customer_email: customerEmail || '',
        customer_phone: customerPhone,
        razorpay_payment_id: razorpayPaymentId || '',
        razorpay_order_id: razorpayOrderId || ''
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Insert order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_name: item.name || '',
      quantity: item.qty || 0,
      price: Math.round((item.price || 0) * 100),
      subtotal: Math.round((item.price || 0) * (item.qty || 0) * 100)
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items insert error:', itemsError);
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error('Save order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}