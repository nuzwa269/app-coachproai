import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  isAdmin,
  isSuperAdmin,
  resolveAccountType,
  type AccountType,
  type UserRole,
} from "@/lib/auth/roles";
import {
  ADMIN_EMAIL,
  ADMIN_EMAIL_FALLBACK_ENABLED,
} from "@/lib/config/auth-env";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type AuthResult = {
  supabase: SupabaseClient<Database, "public", "public">;
  user: User;
  role: UserRole;
};

function isTemporaryAdminByEmail(
  email: string | null | undefined,
  emailConfirmedAt: string | null | undefined
): boolean {
  if (!ADMIN_EMAIL_FALLBACK_ENABLED) return false;
  if (!ADMIN_EMAIL) return false;
  if (!email) return false;
  if (!emailConfirmedAt) return false;

  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

/**
 * Fetches the current user's role from the profiles table.
 * Returns 'user' as the safe default if no profile is found.
 */
export async function getServerUserRole(): Promise<UserRole> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "user";

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (data?.role as UserRole | null) ?? "user";
}

/**
 * Fetches account_type with a legacy fallback for old subscriber role rows.
 */
export async function getServerAccountType(): Promise<AccountType> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "free";

  const { data } = await supabase
    .from("profiles")
    .select("role, account_type")
    .eq("id", user.id)
    .single();

  return resolveAccountType(
    (data?.account_type as AccountType | null) ?? null,
    (data?.role as UserRole | null) ?? "user"
  );
}

/**
 * Ensures the caller is authenticated.
 * Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role: UserRole = (data?.role as UserRole | null) ?? "user";

  return { supabase, user, role };
}

/**
 * Ensures the caller has admin or super_admin role.
 * Redirects to /dashboard if not authorised.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireAuth();

  const isRoleAdmin = isAdmin(result.role);
  const isFallbackAdmin = isTemporaryAdminByEmail(
    result.user.email,
    result.user.email_confirmed_at
  );

  if (!isRoleAdmin && !isFallbackAdmin) {
    redirect("/dashboard");
  }

  return result;
}

/**
 * Ensures the caller has super_admin role.
 * Redirects to /dashboard if not authorised.
 */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const result = await requireAuth();

  if (!isSuperAdmin(result.role)) {
    redirect("/dashboard");
  }

  return result;
}
