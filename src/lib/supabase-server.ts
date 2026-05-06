import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Service Role Key bypasses RLS - ONLY use on the server
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Use service role key if available (bypasses RLS), otherwise fallback to anon
const key = serviceRoleKey || anonKey;

export const supabaseServer = createClient(supabaseUrl, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Log which key type we're using (without exposing the key)
if (serviceRoleKey) {
  console.log('[Supabase Server] Usando SERVICE_ROLE_KEY (bypass RLS) ✓');
} else {
  console.log('[Supabase Server] ⚠ Sin SERVICE_ROLE_KEY - usando anon key. DELETE/UPDATE pueden fallar por RLS.');
}
