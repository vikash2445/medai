import { NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing order_id' },
        { status: 400 }
      );
    }

    const cashfree = new Cashfree( process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX' as any,
      process.env.CASHFREE_APP_ID!,
      process.env.CASHFREE_SECRET_KEY!
    );

    // ✅ Correct order of parameters
    const response = await cashfree.PGFetchOrder(orderId, '2023-08-01');

    if (!response || response.status !== 200) {
      throw new Error("Failed to fetch order from Cashfree");
    }

    const orderStatus = response.data?.order_status || "UNKNOWN";

    if (orderStatus === 'PAID') {
      return NextResponse.json({ success: true, status: orderStatus });
    }

    return NextResponse.json({ success: false, status: orderStatus });

  } catch (error: any) {
    console.error('Cashfree verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}