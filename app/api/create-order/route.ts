import { NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg';

export async function POST(req: Request) {
  try {
    const { amount, orderId, customerName, customerEmail, customerPhone } = await req.json();

    const env = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
    const cashfree = new Cashfree(
      env as any,
      process.env.CASHFREE_APP_ID!,
      process.env.CASHFREE_SECRET_KEY!
    );

    const orderRequest = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerPhone,
        customer_phone: customerPhone,
        customer_name: customerName,
        customer_email: customerEmail,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-status?order_id={order_id}`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cashfree-webhook`,
      },
    };

    // ✅ Correct order: orderRequest first, then API version
    const response = await cashfree.PGCreateOrder(orderRequest, '2025-01-01');

    if (!response || response.status !== 200) {
      const errorMsg = (response?.data as any)?.message || (response?.data as any)?.error || 'Order creation failed';
      throw new Error(errorMsg);
    }

    return NextResponse.json({
      success: true,
      payment_session_id: response.data.payment_session_id,
    });
  } catch (error: any) {
    console.error('Cashfree order error:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}