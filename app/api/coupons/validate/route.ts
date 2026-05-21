import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ success: false, error: 'Coupon code required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Invalid coupon code' }, { status: 404 });
    }

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Coupon has expired' }, { status: 400 });
    }

    // Check usage limit
    if (data.max_uses && data.used_count >= data.max_uses) {
      return NextResponse.json({ success: false, error: 'Coupon usage limit reached' }, { status: 400 });
    }

    return NextResponse.json({ success: true, coupon: data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to validate coupon' }, { status: 500 });
  }
}