import { NextResponse } from 'next/server';
import { Cashfree } from 'cashfree-pg';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Missing order_id' }, { status: 400 });
    }

    const cashfree = new Cashfree(
      process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX' as any,
      process.env.CASHFREE_APP_ID!,
      process.env.CASHFREE_SECRET_KEY!
    );

    // Use the correct method: PGFetchOrder (or getOrder? The error says getOrder doesn't exist. Use PGFetchOrder)
    const response = await cashfree.PGFetchOrder('2023-08-01', orderId);
    const orderStatus = response.data.order_status;

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