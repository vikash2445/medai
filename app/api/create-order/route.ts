import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { amount, orderId, customerName, customerEmail, customerPhone } =
      await req.json();

    const res = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID!,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
        "x-api-version": "2022-09-01",
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: `cust_${Date.now()}`,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          customer_name: customerName,
        },
        order_meta: {
  return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?order_id={order_id}`,
}
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Cashfree Error:", data);
      return NextResponse.json(
        { success: false, error: data },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      payment_session_id: data.payment_session_id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}