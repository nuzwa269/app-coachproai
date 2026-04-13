import { NextResponse } from "next/server";
import type { AccountType, UserRole } from "@/lib/auth/roles";
import { isSuperAdmin } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/server-roles";
import { logAdminEvent } from "@/lib/admin/audit";

const ALLOWED_ROLES: UserRole[] = ["user", "subscriber", "admin", "super_admin"];
const PRIVILEGED_ROLES: UserRole[] = ["admin", "super_admin"];
const ALLOWED_ACCOUNT_TYPES: AccountType[] = ["free", "subscriber"];

function parsePage(value: string | null, fallback: number) {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric) || numeric < 1) return fallback;
  return Math.floor(numeric);
}

export async function GET(request: Request) {
  let supabase;

  try {
    ({ supabase } = await requireAdmin());
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  const roleFilter = searchParams.get("role")?.trim() ?? "all";
  const page = parsePage(searchParams.get("page"), 1);
  const pageSize = Math.min(parsePage(searchParams.get("pageSize"), 20), 50);

  const rangeStart = (page - 1) * pageSize;
  const rangeEnd = rangeStart + pageSize - 1;

  let dataQuery = supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, account_type, ai_credits_balance, created_at, updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (roleFilter !== "all") {
  if (!ALLOWED_ROLES.includes(roleFilter as UserRole)) {
    return NextResponse.json({ error: "Invalid role filter" }, { status: 400 });
  }

  if (roleFilter === "subscriber") {
    dataQuery = dataQuery.eq("account_type", "subscriber");
  } else {
    dataQuery = dataQuery.eq("role", roleFilter as Exclude<UserRole, "subscriber">);
  }
}

  dataQuery = dataQuery.eq("role", roleFilter as UserRole);
}

  if (query) {
    dataQuery = dataQuery.or(`email.ilike.%${query}%,full_name.ilike.%${query}%`);
  }

  const { data, error, count } = await dataQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    users: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  });
}

type UpdateUserPayload = {
  userId: string;
  role?: UserRole;
  account_type?: AccountType;
  full_name?: string | null;
  ai_credits_balance?: number;
};

export async function PATCH(request: Request) {
  let supabase;
  let actorRole: UserRole;
  let actorId: string;

  try {
    ({ supabase, role: actorRole, user: { id: actorId } } = await requireAdmin());
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as UpdateUserPayload;
  const { userId, role: nextRole, account_type: nextAccountType, full_name, ai_credits_balance } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { data: targetProfile, error: targetError } = await supabase
    .from("profiles")
    .select("id, role, account_type")
    .eq("id", userId)
    .single();

  if (targetError || !targetProfile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const targetRole = targetProfile.role as UserRole;

  if (!isSuperAdmin(actorRole) && PRIVILEGED_ROLES.includes(targetRole)) {
    return NextResponse.json(
      { error: "Only super admins can modify admin or super admin accounts" },
      { status: 403 }
    );
  }

  if (nextRole && !ALLOWED_ROLES.includes(nextRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (nextAccountType && !ALLOWED_ACCOUNT_TYPES.includes(nextAccountType)) {
    return NextResponse.json({ error: "Invalid account_type" }, { status: 400 });
  }

  if (!isSuperAdmin(actorRole) && nextRole && PRIVILEGED_ROLES.includes(nextRole)) {
    return NextResponse.json(
      { error: "Only super admins can assign admin or super admin roles" },
      { status: 403 }
    );
  }

  const updates: {
    role?: UserRole;
    account_type?: AccountType;
    full_name?: string | null;
    ai_credits_balance?: number;
  } = {};

  if (typeof nextRole === "string") {
    if (nextRole === "subscriber") {
      // Legacy compatibility: store subscriber as account_type, keep role as user.
      updates.role = "user";
      updates.account_type = "subscriber";
    } else {
      updates.role = nextRole;
      if (PRIVILEGED_ROLES.includes(nextRole)) {
        updates.account_type = "free";
      }
    }
  }

  if (typeof nextAccountType === "string") {
    updates.account_type = nextAccountType;
  }

  const resultingRole = (updates.role ?? targetProfile.role) as UserRole;
  const resultingAccountType =
    (updates.account_type ?? targetProfile.account_type ?? "free") as AccountType;

  if (PRIVILEGED_ROLES.includes(resultingRole) && resultingAccountType === "subscriber") {
    return NextResponse.json(
      { error: "subscriber account_type cannot be assigned to admin roles" },
      { status: 400 }
    );
  }

  if (full_name !== undefined) {
    updates.full_name = full_name?.trim() ? full_name.trim() : null;
  }

  if (ai_credits_balance !== undefined) {
    if (!Number.isFinite(ai_credits_balance) || ai_credits_balance < 0) {
      return NextResponse.json(
        { error: "ai_credits_balance must be a positive number" },
        { status: 400 }
      );
    }
    updates.ai_credits_balance = Math.floor(ai_credits_balance);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, email, full_name, role, account_type, ai_credits_balance, created_at, updated_at")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const roleChanged =
    typeof updates.role === "string" && updates.role !== targetProfile.role;
  const accountTypeChanged =
    typeof updates.account_type === "string" &&
    updates.account_type !== targetProfile.account_type;

  if (roleChanged || accountTypeChanged) {
    await logAdminEvent(supabase, {
      actorId,
      category: "users",
      action: "change_role",
      entityType: "profile",
      entityId: userId,
      severity: "warning",
      message: `Admin changed access for ${updated.email}: role ${targetProfile.role}→${updated.role}, account_type ${targetProfile.account_type}→${updated.account_type}`,
      metadata: {
        previousRole: targetProfile.role,
        nextRole: updated.role,
        previousAccountType: targetProfile.account_type,
        nextAccountType: updated.account_type,
      },
    });
  }

  return NextResponse.json(updated);
}
