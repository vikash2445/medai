import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// Map common symptoms to search terms
const symptomMapping: Record<string, string[]> = {
  'fever': ['fever', 'temperature', 'bukhar', 'paracetamol'],
  'pain': ['pain', 'dard', 'analgesic', 'ibuprofen', 'paracetamol'],
  'headache': ['headache', 'sir dard', 'migraine', 'pain'],
  'allergy': ['allergy', 'allerji', 'sneezing', 'cetirizine'],
  'acidity': ['acidity', 'heartburn', 'gas', 'jalaan', 'omeprazole'],
  'cold': ['cold', 'cough', 'zukham', 'flu'],
  'dehydration': ['dehydration', 'diarrhea', 'dast', 'ors', 'loose motion'],
  'inflammation': ['inflammation', 'soojan', 'ibuprofen'],
};

function processQuery(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  for (const [symptom, keywords] of Object.entries(symptomMapping)) {
    if (lowerQuery.includes(symptom)) {
      return symptom;
    }
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        return symptom;
      }
    }
  }
  
  return query;
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'Query is required', products: [] },
        { status: 400 }
      );
    }

    console.log('🔍 Searching database for:', query);
    
    const searchTerm = processQuery(query);
    console.log('📝 Processed search term:', searchTerm);

    let products: any[] = [];

    // Method 1: Search by name (ilike - case insensitive)
    const { data: nameResults, error: nameError } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    if (!nameError && nameResults && nameResults.length > 0) {
      products = nameResults;
      console.log(`✅ Found ${products.length} products by name`);
    }

    // Method 2: Search by generic name
    if (products.length === 0) {
      const { data: genericResults, error: genericError } = await supabase
        .from('products')
        .select('*')
        .ilike('generic', `%${searchTerm}%`)
        .limit(10);

      if (!genericError && genericResults && genericResults.length > 0) {
        products = genericResults;
        console.log(`✅ Found ${products.length} products by generic name`);
      }
    }

    // Method 3: Search by category
    if (products.length === 0) {
      const { data: categoryResults, error: categoryError } = await supabase
        .from('products')
        .select('*')
        .ilike('category', `%${searchTerm}%`)
        .limit(10);

      if (!categoryError && categoryResults && categoryResults.length > 0) {
        products = categoryResults;
        console.log(`✅ Found ${products.length} products by category`);
      }
    }

    // Method 4: Search by tags (using PostgreSQL array containment)
    if (products.length === 0) {
      // PostgreSQL syntax for array containment
      const { data: tagResults, error: tagError } = await supabase
        .from('products')
        .select('*')
        .filter('tags', 'cs', `{${searchTerm}}`)
        .limit(10);

      if (!tagError && tagResults && tagResults.length > 0) {
        products = tagResults;
        console.log(`✅ Found ${products.length} products by tags`);
      }
    }

    // Format products for frontend (matching your database structure)
    const formattedproducts = products.map(med => ({
      id: med.id,
      name: med.name,
      generic: med.generic,
      type: med.type,
      category: med.category,
      emoji: med.is_antibiotic ? '💊⚠️' : '💊',
      price: med.price,
      description: `${med.generic} medicine for ${med.category}. ${med.is_antibiotic ? 'Antibiotic - Complete full course.' : 'OTC medicine for relief.'}`,
      tags: med.tags || [med.category],
      recommended: false,
      drugName: med.generic,
      image: med.image || `https://source.unsplash.com/200x200/?${med.generic}`,
      is_antibiotic: med.is_antibiotic,
      dosage: getDosage(med.name),
      usage: {
        frequency: getFrequency(med.category),
        duration: med.is_antibiotic ? '5 days' : '3 days',
        totalTablets: 10
      },
      quantitySelector: {
        allowLoose: !med.is_antibiotic,
        tabletsPerStrip: 10,
        minQuantity: 1,
        maxQuantity: 30,
        defaultQuantity: 6,
        step: 1,
        recommendedType: med.is_antibiotic ? 'strip' : 'loose',
        note: med.is_antibiotic ? '⚠️ Complete full course is required' : 'You can buy loose tablets or full strip'
      },
      pricePerTablet: Math.round(med.price / 10),
    }));

    return NextResponse.json({ 
      products: formattedproducts,
      searchTerm: searchTerm
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error', products: [] },
      { status: 500 }
    );
  }
}

// Helper function to get dosage from medicine name
function getDosage(name: string): string {
  if (name.includes('250mg')) return '250mg';
  if (name.includes('500mg')) return '500mg';
  if (name.includes('650mg')) return '650mg';
  return 'As prescribed';
}

// Helper function to get frequency based on category
function getFrequency(category: string): string {
  const frequencies: Record<string, string> = {
    'fever': 'Every 6 hours',
    'pain': 'Every 8 hours',
    'allergy': 'Once daily',
    'acidity': 'Once daily before breakfast',
    'hydration': 'As needed',
  };
  return frequencies[category] || 'As prescribed';
}