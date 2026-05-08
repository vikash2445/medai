import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing order_id' }, { status: 400 });
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Check if payment is successful (status 'paid')
    const isPaid = order.status === 'paid';
    return NextResponse.json({ success: isPaid, status: order.status, order });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}