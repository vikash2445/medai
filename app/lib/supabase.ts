import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required keys
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Client-side client (always available)
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

// Admin client (only if service key exists)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl!, supabaseServiceKey)
  : supabase; // Fallback to regular client