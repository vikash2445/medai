// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ✅ Singleton instance - Only one instance for whole app
let browserClientInstance: any = null;
let adminClientInstance: any = null;

// For client-side (browser) - Single instance
export const createBrowserClient = () => {
  if (typeof window === 'undefined') {
    // Server side - create new instance each time
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  
  // Client side - return cached instance
  if (!browserClientInstance) {
    browserClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClientInstance;
};

// Regular client instance - Singleton
export const supabase = (() => {
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  
  if (!browserClientInstance) {
    browserClientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClientInstance;
})();

// Admin client (bypasses RLS) - Singleton
export const supabaseAdmin = (() => {
  if (!supabaseServiceKey) {
    return supabase;
  }
  
  if (typeof window === 'undefined') {
    return createClient(supabaseUrl, supabaseServiceKey);
  }
  
  if (!adminClientInstance) {
    adminClientInstance = createClient(supabaseUrl, supabaseServiceKey);
  }
  return adminClientInstance;
})();