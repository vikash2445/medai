import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

// GET: Real-time dashboard updates (polling endpoint)
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseClient();
    
    const searchParams = new URL(request.url).searchParams;
    const lastFetch = searchParams.get('last_fetch');
    
    // Get updates since last fetch
    let query = supabase
      .from('orders')
      .select('id, status, total, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (lastFetch) {
      query = query.gt('created_at', lastFetch);
    }
    
    const { data: newOrders, error } = await query;
    
    if (error) throw error;
    
    // Get pending orders count
    const { count: pendingCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    // Get today's revenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .gte('created_at', todayStart.toISOString());
    
    const todayRevenue = (todayOrders || []).reduce((sum, o) => sum + (o.total || 0), 0);
    
    return NextResponse.json({
      success: true,
      data: {
        newOrders: newOrders || [],
        pendingCount: pendingCount || 0,
        todayRevenue,
        timestamp: new Date().toISOString(),
      },
    });
    
  } catch (error: any) {
    console.error('Real-time stats error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}