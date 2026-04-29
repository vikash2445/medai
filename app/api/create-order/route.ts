import { NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg';

export async function POST(req: Request) {
  try {
    const { amount, orderId, customerName, customerEmail, customerPhone } = await req.json();

    const cashfree = new Cashfree(
      (process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX') as any,
      process.env.CASHFREE_APP_ID!,
      process.env.CASHFREE_SECRET_KEY!
    );

    // Build the request object (matches Cashfree API exactly)
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

    // Use type assertion to ignore TypeScript's strict type check
    const response = await cashfree.PGCreateOrder(orderRequest as any, '2023-08-01');

    if (!response || response.status !== 200) {
      throw new Error(response?.data?.order_status || 'Order creation failed');
    }

    return NextResponse.json({
      success: true,
      payment_session_id: response.data.payment_session_id,
    });
  } catch (error: any) {
    console.error('Cashfree order error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}