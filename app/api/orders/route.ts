import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET: Fetch orders
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: orders, error } = await supabase
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

// POST: Create a new order (simplified)
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📦 Received order data:', body); // Debug log

    const { orderId, total, address, customerName, customerEmail, customerPhone } = body;

    // Validate required fields
    if (!orderId || !total || !customerName || !customerPhone) {
      return NextResponse.json({ 
        error: 'Missing required fields', 
        received: { orderId, total, customerName, customerPhone } 
      }, { status: 400 });
    }

    // Insert the order
    const { data, error } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: userId,
        total: Math.round(total * 100), // convert to paise
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
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('✅ Order saved successfully:', data);
    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('❌ Order creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}