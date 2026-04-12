import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { isAdmin, type UserRole } from "@/lib/auth/roles";
import {
  ADMIN_EMAIL,
  ADMIN_EMAIL_FALLBACK_ENABLED,
} from "@/lib/config/auth-env";
import {
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL,
} from "@/lib/config/public-env";

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
 * Updates the user's Supabase session by refreshing the auth token.
 * Should be called inside the root middleware.ts on every request.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session — do NOT remove this call.
  // It keeps the user's session alive and handles token rotation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect dashboard routes — redirect unauthenticated users to /login
  const isProtectedRoute = pathname.startsWith("/dashboard");
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Protect admin routes — redirect users without admin/super_admin role
  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role: UserRole = (profile?.role as UserRole | null) ?? "user";

    const isRoleAdmin = isAdmin(role);
    const isFallbackAdmin = isTemporaryAdminByEmail(
      user.email,
      user.email_confirmed_at
    );

    if (!isRoleAdmin && !isFallbackAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
