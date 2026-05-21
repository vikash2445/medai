import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

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

// Interface for dashboard stats
interface DashboardStats {
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    today: number;
    thisWeek: number;
  };
  customers: {
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    active: number;
  };
  products: {
    total: number;
    lowStock: number;
    outOfStock: number;
    topSelling: Array<{
      id: number;
      name: string;
      total_sold: number;
      revenue: number;
    }>;
  };
  prescriptions: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
}

// GET: Fetch dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    
    // Get date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    
    // Get query parameters for time range
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('range') || 'month'; // day, week, month, year
    
    // ==================== REVENUE STATS ====================
    const [
      { data: allOrders, count: totalOrders },
      { data: todayOrders },
      { data: weekOrders },
      { data: monthOrders },
      { data: lastMonthOrders },
    ] = await Promise.all([
      supabase.from('orders').select('total, payment_status').eq('payment_status', 'paid'),
      supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', todayStart),
      supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', weekStart),
      supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', monthStart),
      supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', lastMonthStart).lt('created_at', monthStart),
    ]);
    
    const totalRevenue = (allOrders ?? []).reduce((sum, o) => sum + (o.total || 0), 0);
    const todayRevenue = (todayOrders ?? []).reduce((sum, o) => sum + (o.total || 0), 0);
    const weekRevenue = (weekOrders ?? []).reduce((sum, o) => sum + (o.total || 0), 0);
    const monthRevenue = (monthOrders ?? []).reduce((sum, o) => sum + (o.total || 0), 0);
    const lastMonthRevenueTotal = (lastMonthOrders ?? []).reduce((sum, o) => sum + (o.total || 0), 0);
    
    const revenueGrowth = lastMonthRevenueTotal > 0 
      ? ((monthRevenue - lastMonthRevenueTotal) / lastMonthRevenueTotal) * 100 
      : 0;
    
    // ==================== ORDER STATS ====================
    const [
      { count: pendingOrders },
      { count: processingOrders },
      { count: shippedOrders },
      { count: deliveredOrders },
      { count: cancelledOrders },
      { count: todayOrdersCount },
      { count: weekOrdersCount },
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'processing'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['shipped', 'out_for_delivery']),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
    ]);
    
    // ==================== CUSTOMER STATS ====================
    const [
      { count: totalCustomers },
      { count: newTodayCustomers },
      { count: newWeekCustomers },
      { count: newMonthCustomers },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    ]);
    
    // Get active customers (placed order in last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeCustomersData } = await supabase
      .from('orders')
      .select('user_id')
      .gte('created_at', thirtyDaysAgo)
      .eq('payment_status', 'paid');
    
    const uniqueActiveCustomers = new Set(activeCustomersData?.map(o => o.user_id) || []);
    
    // ==================== PRODUCT STATS ====================
    const [
      { count: totalProducts },
      { count: lowStockProducts },
      { count: outOfStockProducts },
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 10).gt('stock', 0),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('stock', 0),
    ]);
    
    // Get top selling products
    const { data: topSelling } = await supabase
      .from('order_items')
      .select('product_name, quantity, subtotal')
      .order('created_at', { ascending: false })
      .limit(100);
    
    const productSales = new Map<string, { name: string; total_sold: number; revenue: number }>();
    (topSelling || []).forEach(item => {
      const existing = productSales.get(item.product_name);
      if (existing) {
        existing.total_sold += item.quantity;
        existing.revenue += item.subtotal;
      } else {
        productSales.set(item.product_name, {
          name: item.product_name,
          total_sold: item.quantity,
          revenue: item.subtotal,
        });
      }
    });
    
    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5);
    
    // ==================== PRESCRIPTION STATS ====================
    const [
      { count: totalPrescriptions },
      { count: pendingPrescriptions },
      { count: verifiedPrescriptions },
      { count: rejectedPrescriptions },
    ] = await Promise.all([
      supabase.from('prescription_history').select('*', { count: 'exact', head: true }),
      supabase.from('prescription_history').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('prescription_history').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
      supabase.from('prescription_history').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    ]);
    
    // ==================== CHART DATA ====================
    // Get last 7 days revenue for chart
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString();
      
      const { data: dayOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('payment_status', 'paid')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);
      
      const dailyRevenue = (dayOrders ?? []).reduce((sum, o) => sum + (o.total || 0), 0);
      last7Days.push({
        date: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        revenue: dailyRevenue,
        orders: dayOrders?.length || 0,
      });
    }
    
    // Get last 12 months revenue for chart
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStartDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString();
      const monthEndDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).toISOString();
      
      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('payment_status', 'paid')
        .gte('created_at', monthStartDate)
        .lte('created_at', monthEndDate);
      
      const monthlyRevenue = (monthOrders ?? []).reduce((sum, o) => sum + (o.total || 0), 0);
      last12Months.push({
        month: monthDate.toLocaleDateString('en-IN', { month: 'short' }),
        revenue: monthlyRevenue,
        orders: monthOrders?.length || 0,
      });
    }
    
    // Get top categories by sales
    const { data: categorySales } = await supabase
      .from('order_items')
      .select('product_name, quantity')
      .limit(500);
    
    // Since categories are in products table, we need to join or use a simpler approach
    // For now, returning product-based stats
    
    // Prepare response
    const stats: DashboardStats = {
      revenue: {
        total: totalRevenue,
        today: todayRevenue,
        thisWeek: weekRevenue,
        thisMonth: monthRevenue,
        lastMonth: lastMonthRevenueTotal,
        growth: revenueGrowth,
      },
      orders: {
        total: totalOrders || 0,
        pending: pendingOrders || 0,
        processing: processingOrders || 0,
        shipped: shippedOrders || 0,
        delivered: deliveredOrders || 0,
        cancelled: cancelledOrders || 0,
        today: todayOrdersCount || 0,
        thisWeek: weekOrdersCount || 0,
      },
      customers: {
        total: totalCustomers || 0,
        newToday: newTodayCustomers || 0,
        newThisWeek: newWeekCustomers || 0,
        newThisMonth: newMonthCustomers || 0,
        active: uniqueActiveCustomers.size,
      },
      products: {
        total: totalProducts || 0,
        lowStock: lowStockProducts || 0,
        outOfStock: outOfStockProducts || 0,
        topSelling: topSellingProducts.map((p, index) => ({
          id: index,
          name: p.name,
          total_sold: p.total_sold,
          revenue: p.revenue,
        })),
      },
      prescriptions: {
        total: totalPrescriptions || 0,
        pending: pendingPrescriptions || 0,
        verified: verifiedPrescriptions || 0,
        rejected: rejectedPrescriptions || 0,
      },
    };
    
    // Return response with chart data
    return NextResponse.json({
      success: true,
      data: stats,
      charts: {
        dailyRevenue: last7Days,
        monthlyRevenue: last12Months,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch dashboard statistics' 
      },
      { status: 500 }
    );
  }
}

// GET: Recent activity feed
export async function HEAD(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    
    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, customer_name, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get recent customers
    const { data: recentCustomers } = await supabase
      .from('profiles')
      .select('full_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Get recent prescriptions
    const { data: recentPrescriptions } = await supabase
      .from('prescription_history')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Combine into activity feed
    const activities = [
      ...(recentOrders || []).map(order => ({
        id: order.id,
        type: 'order',
        title: `New Order #${order.id.slice(0, 8)}`,
        description: `₹${order.total.toLocaleString()} from ${order.customer_name}`,
        status: order.status,
        timestamp: order.created_at,
      })),
      ...(recentCustomers || []).map(customer => ({
        id: customer.email,
        type: 'customer',
        title: 'New Customer Joined',
        description: `${customer.full_name} (${customer.email})`,
        timestamp: customer.created_at,
      })),
      ...(recentPrescriptions || []).map(prescription => ({
        id: prescription.id,
        type: 'prescription',
        title: 'New Prescription Uploaded',
        description: `Prescription #${prescription.id.slice(0, 8)}`,
        timestamp: prescription.created_at,
      })),
    ];
    
    // Sort by timestamp descending
    activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return NextResponse.json({
      success: true,
      data: activities.slice(0, 20),
    });
    
  } catch (error: any) {
    console.error('Activity feed error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}