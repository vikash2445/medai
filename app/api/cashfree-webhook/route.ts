import { NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature');
    const timestamp = req.headers.get('x-webhook-timestamp');

    const cashfree = new Cashfree(
      (process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX') as any,
      process.env.CASHFREE_APP_ID!,
      process.env.CASHFREE_SECRET_KEY!
    );

    // ✅ Correct method: PGVerifyWebhookSignature
    cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);

    const body = JSON.parse(rawBody);
    if (body.type === 'PAYMENT_SUCCESS') {
      const orderId = body.data.order.order_id;
      console.log(`[PROD] Webhook: Payment for order ${orderId} succeeded`);
      // Immediately update your database – mark order as paid
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return NextResponse.json({ error: 'Invalid signature or webhook failed' }, { status: 400 });
  }
}