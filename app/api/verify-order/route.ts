import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing order_id',
        },
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

    // Verify payment from Cashfree
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

    const paymentStatus = data.order_status;

    // Payment success
    if (paymentStatus === 'PAID') {
      // Check existing order
      const { data: existingOrder, error: fetchError } =
        await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();

      if (fetchError || !existingOrder) {
        return NextResponse.json(
          {
            success: false,
            error: 'Order not found',
          },
          { status: 404 }
        );
      }

      // Update only if not already paid
      if (existingOrder.status !== 'paid') {
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
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