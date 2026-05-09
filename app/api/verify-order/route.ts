import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

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

    // Cashfree config
    const APP_ID = process.env.CASHFREE_APP_ID;
    const SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
    const ENV = process.env.CASHFREE_ENV || 'PRODUCTION';

    const endpoint =
      ENV === 'PRODUCTION'
        ? `https://api.cashfree.com/pg/orders/${orderId}`
        : `https://sandbox.cashfree.com/pg/orders/${orderId}`;

    // Verify payment with Cashfree
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': APP_ID!,
        'x-client-secret': SECRET_KEY!,
      },
    });

    const data = await response.json();

    console.log('Cashfree verify response:', data);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || 'Cashfree verification failed',
        },
        { status: 500 }
      );
    }

    // Payment success check
    const paymentStatus = data.order_status;

    if (paymentStatus === 'PAID') {
      // Update DB
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'paid',
        })
        .eq('id', orderId);

      if (updateError) {
        console.error('Supabase update error:', updateError);

        return NextResponse.json(
          {
            success: false,
            error: updateError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        status: 'paid',
      });
    }

    return NextResponse.json({
      success: false,
      status: paymentStatus,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}