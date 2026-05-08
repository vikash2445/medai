import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../lib/supabase';  // ✅ Fixed path

// GET: Fetch orders for authenticated user
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

    if (error) throw error;
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new order (called from webhook or success page)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 Received order data:', body);

    const { orderId, total, address, customerName, customerEmail, customerPhone, items } = body;

    // Validate required fields
    if (!orderId || !total || !customerName || !customerPhone) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        received: { orderId, total, customerName, customerPhone } 
      }, { status: 400 });
    }

    // Insert the order using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert({
        id: orderId,
        user_id: userId,
        total: Math.round(total * 100),
        status: 'paid',
        shipping_address: address || '',
        customer_name: customerName,
        customer_email: customerEmail || '',
        customer_phone: customerPhone,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Insert order items if provided
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
      
      if (itemsError) {
        console.error('Order items error:', itemsError);
        // Don't fail the whole request, just log
      }
    }

    console.log('✅ Order saved successfully:', data);
    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('❌ Order creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}