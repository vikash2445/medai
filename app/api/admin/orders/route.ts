import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Order status update schema
interface OrderUpdate {
  status?: string;
  payment_status?: string;
  tracking_status?: string;
  delivery_partner_name?: string;
  delivery_partner_phone?: string;
  estimated_delivery?: string;
  tracking_note?: string;
}

// Helper to create Supabase client
async function createSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}

// GET: Fetch orders with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (paymentStatus && paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus);
    }
    
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,` +
        `customer_email.ilike.%${search}%,` +
        `customer_phone.ilike.%${search}%,` +
        `id.ilike.%${search}%`
      );
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data: orders, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    // Get additional stats
    const { data: stats } = await supabase
      .from('orders')
      .select('status, payment_status, total')
      .not('status', 'is', null);
    
    const orderStats = {
      total: count || 0,
      pending: stats?.filter(o => o.status === 'pending').length || 0,
      processing: stats?.filter(o => o.status === 'processing').length || 0,
      shipped: stats?.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery').length || 0,
      delivered: stats?.filter(o => o.status === 'delivered').length || 0,
      cancelled: stats?.filter(o => o.status === 'cancelled').length || 0,
      totalRevenue: stats?.reduce((sum, o) => sum + (o.total || 0), 0) || 0,
    };
    
    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats: orderStats,
    });
    
  } catch (error: any) {
    console.error('Orders fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST: Create new order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const body = await request.json();
    
    const {
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      items,
      total,
      payment_method,
    } = body;
    
    // Validate required fields
    if (!customer_name || !customer_email || !shipping_address || !items || !total) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Start a transaction
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: user_id || null,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        total,
        status: 'pending',
        payment_status: payment_method === 'cod' ? 'pending' : 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (orderError) {
      throw orderError;
    }
    
    // Insert order items
    const orderItems = items.map((item: any) => ({
      order_id: orderId,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
      created_at: new Date().toISOString(),
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) {
      // Rollback - delete the order if items insertion fails
      await supabase.from('orders').delete().eq('id', orderId);
      throw itemsError;
    }
    
    // Add tracking entry
    await supabase.from('order_tracking').insert({
      order_id: orderId,
      status: 'pending',
      note: 'Order placed successfully',
      created_at: new Date().toISOString(),
    });
    
    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
    
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

// PUT: Update order status
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const body = await request.json();
    
    const { order_id, updates, tracking_note, send_notification } = body;
    
    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Get current order
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();
    
    if (fetchError || !currentOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
      ...updates,
    };
    
    // If status is being updated, update tracking_status as well
    if (updates.status) {
      updateData.tracking_status = updates.status
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
    }
    
    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order_id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    // Add tracking history entry
    if (updates.status || tracking_note) {
      await supabase.from('order_tracking').insert({
        order_id,
        status: updates.status || currentOrder.status,
        note: tracking_note || `Order status updated to ${updates.status || currentOrder.status}`,
        created_at: new Date().toISOString(),
      });
    }
    
    // Send notification if requested
    if (send_notification && updates.status) {
      const statusText = updates.status.replace(/_/g, ' ').toUpperCase();
      const notificationData = {
        userId: currentOrder.user_id,
        title: `Order ${statusText}`,
        message: `Your order #${order_id.slice(0, 8)} is now ${statusText}.`,
        orderId: order_id,
      };
      
      // Trigger notification (async, don't await)
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
      }).catch(console.error);
    }
    
    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully',
    });
    
  } catch (error: any) {
    console.error('Order update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE: Cancel/Delete order
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('id');
    const cancelOnly = searchParams.get('cancel_only') === 'true';
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    if (cancelOnly) {
      // Only cancel the order, don't delete
      const { data: updatedOrder, error: cancelError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          tracking_status: 'Cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();
      
      if (cancelError) throw cancelError;
      
      // Add tracking entry
      await supabase.from('order_tracking').insert({
        order_id: orderId,
        status: 'cancelled',
        note: 'Order cancelled by admin',
        created_at: new Date().toISOString(),
      });
      
      return NextResponse.json({
        success: true,
        data: updatedOrder,
        message: 'Order cancelled successfully',
      });
    } else {
      // Hard delete order
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (deleteError) throw deleteError;
      
      return NextResponse.json({
        success: true,
        message: 'Order deleted successfully',
      });
    }
    
  } catch (error: any) {
    console.error('Order delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete order' },
      { status: 500 }
    );
  }
}

// PATCH: Bulk update orders
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    const body = await request.json();
    const { order_ids, updates } = body;
    
    if (!order_ids || !order_ids.length) {
      return NextResponse.json(
        { success: false, error: 'Order IDs are required' },
        { status: 400 }
      );
    }
    
    const { data: updatedOrders, error: bulkError } = await supabase
      .from('orders')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in('id', order_ids)
      .select();
    
    if (bulkError) throw bulkError;
    
    // Add tracking entries for bulk updates
    if (updates.status) {
      const trackingEntries = order_ids.map((id: string) => ({
        order_id: id,
        status: updates.status,
        note: `Bulk update: Status changed to ${updates.status}`,
        created_at: new Date().toISOString(),
      }));
      
      await supabase.from('order_tracking').insert(trackingEntries);
    }
    
    return NextResponse.json({
      success: true,
      data: updatedOrders,
      message: `${updatedOrders?.length} orders updated successfully`,
    });
    
  } catch (error: any) {
    console.error('Bulk order update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update orders' },
      { status: 500 }
    );
  }
}