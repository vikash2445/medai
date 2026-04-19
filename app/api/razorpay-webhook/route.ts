import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { payload } = body;

    if (payload.payment.entity.status === 'captured') {
      // You'll need to store the order_id in your payment session
      // For now, this is a placeholder — you'll need to link it to your order
      const { error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', payload.payment.entity.order_id);

      if (error) throw error;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}