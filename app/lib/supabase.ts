import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use SERVICE_ROLE key

// For ADMIN operations (bypasses RLS) - Use this in API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// For client-side (browser) - Use this in components
export const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);