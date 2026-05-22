// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { createBrowserClient } from '@lib/supabase-admin';

export async function GET() {
  try {
    console.log('Products API called'); // Debug log
    
    // Create Supabase client
    const supabase = createBrowserClient();
    
    if (!supabase) {
      console.error('Supabase client not created');
      return NextResponse.json(
        { success: false, error: 'Database connection failed', products: [] },
        { status: 500 }
      );
    }
    
    // Fetch products - NO filters
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { success: false, error: error.message, products: [] },
        { status: 500 }
      );
    }
    
    console.log(`Fetched ${data?.length || 0} products`); // Debug log
    
    return NextResponse.json({
      success: true,
      products: data || [],
      count: data?.length || 0,
    });
    
  } catch (error: any) {
    console.error('Products API crash:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error', 
        products: [],
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}