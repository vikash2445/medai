import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-cf-signature');
    
    // For development, you can bypass signature check (remove in production)
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isDev && !signature) {
      console.error('Missing webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const body = JSON.parse(rawBody);
    const { type, data } = body;
    
    console.log(`Webhook received: ${type}`);

    // ✅ Handle payment success
    if (type === 'PAYMENT_SUCCESS_WEBHOOK' || type === 'payment_success') {
      const orderId = data.order?.order_id;
      const paymentStatus = data.payment?.payment_status;
      const cfPaymentId = data.payment?.cf_payment_id;
      
      console.log(`Processing payment for order: ${orderId}, status: ${paymentStatus}`);
      
      // Only process if payment is successful[citation:10]
      if (paymentStatus === 'SUCCESS') {
        // Check if order already marked as paid (idempotency)[citation:10]
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('payment_status')
          .eq('id', orderId)
          .single();
        
        if (existingOrder?.payment_status === 'paid') {
          console.log(`Order ${orderId} already marked as paid, skipping`);
          return NextResponse.json({ received: true });
        }
        
        // Update order status to paid
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            cf_payment_id: cfPaymentId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        
        if (updateError) {
          console.error('Failed to update order:', updateError);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
        
        console.log(`✅ Order ${orderId} marked as paid`);
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}