import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../lib/supabase';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, total, address, customerName, customerEmail, customerPhone, items } = body;

    if (!orderId || !total || !customerName || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Insert the main order
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        user_id: userId,
        total: Math.round(total * 100), // store as paise/cents
        status: 'paid',
        shipping_address: address || '',
        customer_name: customerName,
        customer_email: customerEmail || '',
        customer_phone: customerPhone,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // 2. Insert order items if provided
    if (items && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: orderId,
        medicine_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: Math.round(item.price * 100),
      }));
      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);
      if (itemsError) console.error('Order items insert error:', itemsError);
    }

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}