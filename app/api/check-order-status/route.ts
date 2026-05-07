import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('payment_status, total, cf_payment_id')
      .eq('id', orderId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      payment_status: order.payment_status,
      total: order.total,
      cf_payment_id: order.cf_payment_id,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}