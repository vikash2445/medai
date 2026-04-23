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

    if (!items || !total || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_name: item.name || '',
      quantity: item.qty || 0,
      price: Math.round((item.price || 0) * 100),
      subtotal: Math.round((item.price || 0) * (item.qty || 0) * 100)
    }));

    await supabase.from('order_items').insert(orderItems);

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error('Store order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}