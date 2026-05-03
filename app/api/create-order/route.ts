import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { amount, orderId, customerName, customerEmail, customerPhone } = await request.json();

    const APP_ID = process.env.CASHFREE_APP_ID!;
    const SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
    const ENV = process.env.NEXT_PUBLIC_CASHFREE_ENV === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const endpoint = ENV === 'PRODUCTION'
      ? 'https://api.cashfree.com/pg/orders'
      : 'https://sandbox.cashfree.com/pg/orders';

    const requestBody = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: `cust_${Date.now()}`,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_name: customerName,
      },
      order_meta: {
        return_url: `${BASE_URL}/payment-success?order_id={order_id}`,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2022-09-01',
        'x-client-id': APP_ID,
        'x-client-secret': SECRET_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Cashfree error:', data);
      return NextResponse.json({ success: false, error: data.message }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      payment_session_id: data.payment_session_id,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}