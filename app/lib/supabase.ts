import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Make sure you're using the ANON key, not the SERVICE_ROLE key for client-side
export const supabase = createClient(supabaseUrl, supabaseAnonKey);