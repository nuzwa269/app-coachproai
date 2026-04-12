import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
} from "@/lib/config/public-env";

/**
 * Creates a Supabase client for use in browser (Client Components).
 * Uses the NEXT_PUBLIC_ environment variables.
 *
 * Cast to `SupabaseClient<Database, 'public', 'public'>` to ensure TypeScript
 * properly resolves the Schema generic (same fix as server.ts).
 */
export function createClient(): SupabaseClient<Database, "public", "public"> {
  return createBrowserClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) as unknown as SupabaseClient<Database, "public", "public">;
}
