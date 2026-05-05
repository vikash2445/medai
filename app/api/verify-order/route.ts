import { NextRequest, NextResponse } from "next/server";

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

    // ✅ Direct API call (BEST PRACTICE - no SDK issues)
    const response = await fetch(
      `https://api.cashfree.com/pg/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID!,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
          "x-api-version": "2022-09-01",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree Verify Error:", data);
      return NextResponse.json(
        { success: false, error: data },
        { status: response.status }
      );
    }

    const orderStatus = data.order_status;

    // ✅ Only treat PAID as success
    if (orderStatus === "PAID") {
      return NextResponse.json({
        success: true,
        status: orderStatus,
        order: data,
      });
    }

    return NextResponse.json({
      success: false,
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