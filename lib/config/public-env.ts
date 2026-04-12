function requirePublicEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const NEXT_PUBLIC_SUPABASE_URL = requirePublicEnv(
  "NEXT_PUBLIC_SUPABASE_URL"
);

export const NEXT_PUBLIC_SUPABASE_ANON_KEY = requirePublicEnv(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
);
