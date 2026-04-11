import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type AccountType = "free" | "subscriber";

/**
 * NOTE: `subscriber` is legacy in role. New business logic should use account_type.
 */
export type UserRole = "user" | "subscriber" | "admin" | "super_admin";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  subscriber: 0,
  admin: 1,
  super_admin: 2,
};

/**
 * Returns true if `userRole` meets or exceeds `requiredRole` in the hierarchy.
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/** True for admin or super_admin. */
export function isAdmin(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

/** True only for super_admin. */
export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

/** True only for subscriber accounts (legacy role). */
export function isSubscriber(role: UserRole): boolean {
  return role === "subscriber";
}

/**
 * Returns account_type with a legacy fallback for old subscriber role rows.
 */
export function resolveAccountType(
  accountType: AccountType | null | undefined,
  role: UserRole | null | undefined
): AccountType {
  if (accountType === "subscriber") return "subscriber";
  if (role === "subscriber") return "subscriber";
  return "free";
}

/**
 * Fetches the authenticated user's role from the profiles table.
 * Defaults to 'user' if no profile or role is found.
 */
export async function getUserRole(
  supabase: SupabaseClient<Database>
): Promise<UserRole> {
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
 * Fetches the authenticated user's account_type.
 * Falls back to legacy subscriber role to preserve behavior.
 */
export async function getUserAccountType(
  supabase: SupabaseClient<Database>
): Promise<AccountType> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "free";

  const { data } = await supabase
    .from("profiles")
    .select("role, account_type")
    .eq("id", user.id)
    .single();

  const role = (data?.role as UserRole | null) ?? "user";
  const accountType = (data?.account_type as AccountType | null) ?? null;

  return resolveAccountType(accountType, role);
}
