import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for use on the server side (Server Components,
 * Route Handlers, and Server Actions). Reads/writes cookies via next/headers.
 *
 * The return type is cast to `SupabaseClient<Database, 'public', 'public'>` so
 * that TypeScript can properly resolve the Database generic through all three
 * type parameters. Without this, @supabase/ssr returns
 * `SupabaseClient<Database, SchemaName>` (only 2 args) which causes the Schema
 * to resolve as `never`, breaking type-checked insert/update calls.
 */
export async function createClient(): Promise<
  SupabaseClient<Database, "public", "public">
> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — cookies will be set by
            // the middleware instead, so this error can be safely ignored.
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database, "public", "public">;
}
