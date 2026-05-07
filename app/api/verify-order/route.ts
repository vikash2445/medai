import { NextRequest, NextResponse } from "next/server";
import { supabase } from '@/app/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing order_id" },
        { status: 400 }
      );
    }

    // First check local database
    const { data: order, error: dbError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
    }

    // If order is already paid in database
    if (order?.status === 'paid') {
      return NextResponse.json({
        success: true,
        status: 'PAID',
        order: order,
      });
    }

    // Otherwise verify with Cashfree API
    const response = await fetch(
      `https://api.cashfree.com/pg/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID!,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
          "x-api-version": "2023-08-01",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree Verify Error:", data);
      return NextResponse.json(
        { success: false, error: data.message || 'Verification failed' },
        { status: response.status }
      );
    }

    const orderStatus = data.order_status;

    // ✅ Update database if payment is successful
    if (orderStatus === "PAID") {
      await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    }

    return NextResponse.json({
      success: orderStatus === "PAID",
      status: orderStatus,
      order: data,
    });

  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Verification failed" },
      { status: 500 }
    );
  }
}