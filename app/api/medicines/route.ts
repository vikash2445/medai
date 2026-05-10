import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';


export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products', products: [] },
        { status: 500 }
      );
    }

    // Format products for frontend
    const formattedproducts = (products || []).map(med => ({
      id: med.id,
      name: med.name,
      generic: med.generic,
      type: med.type,
      category: med.category,
      price: med.price,
      is_antibiotic: med.is_antibiotic,
      tags: med.tags || [],
      image: med.image || `https://placehold.co/400x300/0fa381/white?text=${encodeURIComponent(med.name)}`,
      description: `${med.generic} - ${med.category} medicine. ${med.is_antibiotic ? 'Antibiotic - Complete full course.' : 'OTC medicine for relief.'}`,
      stock: med.stock || 100,
      quantitySelector: {
        allowLoose: !med.is_antibiotic,
        tabletsPerStrip: 10,
        minQuantity: 1,
        maxQuantity: 30,
        defaultQuantity: 1,
        step: 1,
        recommendedType: med.is_antibiotic ? 'strip' : 'loose',
        note: med.is_antibiotic ? '⚠️ Complete full course is required' : 'You can buy loose tablets or full strip'
      },
      pricePerTablet: Math.round(med.price / 10)
    }));

    return NextResponse.json({ products: formattedproducts });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', products: [] },
      { status: 500 }
    );
  }
}