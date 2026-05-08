import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing order_id' }, { status: 400 });
    }

    // ✅ Direct initialization
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: order, error: dbError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      console.error('Database error:', dbError);
    }

    if (order?.status === 'paid') {
      return NextResponse.json({ success: true, status: 'PAID', order });
    }

    const APP_ID = process.env.CASHFREE_APP_ID;
    const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

    if (!APP_ID || !SECRET_KEY) {
      return NextResponse.json({ success: false, error: 'Payment gateway not configured' }, { status: 500 });
    }

    const response = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": APP_ID,
        "x-client-secret": SECRET_KEY,
        "x-api-version": "2023-08-01",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.message }, { status: response.status });
    }

    const orderStatus = data.order_status;

    if (orderStatus === "PAID") {
      await supabase
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', orderId);
    }

    return NextResponse.json({ success: orderStatus === "PAID", status: orderStatus, order: data });
  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}