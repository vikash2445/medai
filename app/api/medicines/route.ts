import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';


export async function GET() {
  try {
    const { data: medicines, error } = await supabase
      .from('medicines')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching medicines:', error);
      return NextResponse.json(
        { error: 'Failed to fetch medicines', medicines: [] },
        { status: 500 }
      );
    }

    // Format medicines for frontend
    const formattedMedicines = (medicines || []).map(med => ({
      id: med.id,
      name: med.name,
      generic: med.generic,
      type: med.type,
      category: med.category,
      price: med.price,
      isAntibiotic: med.isAntibiotic,
      tags: med.tags || [],
      image: med.image || `https://placehold.co/400x300/0fa381/white?text=${encodeURIComponent(med.name)}`,
      description: `${med.generic} - ${med.category} medicine. ${med.isAntibiotic ? 'Antibiotic - Complete full course.' : 'OTC medicine for relief.'}`,
      stock: med.stock || 100,
      quantitySelector: {
        allowLoose: !med.isAntibiotic,
        tabletsPerStrip: 10,
        minQuantity: 1,
        maxQuantity: 30,
        defaultQuantity: 1,
        step: 1,
        recommendedType: med.isAntibiotic ? 'strip' : 'loose',
        note: med.isAntibiotic ? '⚠️ Complete full course is required' : 'You can buy loose tablets or full strip'
      },
      pricePerTablet: Math.round(med.price / 10)
    }));

    return NextResponse.json({ medicines: formattedMedicines });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', medicines: [] },
      { status: 500 }
    );
  }
}