import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-roles";
import { logAdminEvent } from "@/lib/admin/audit";

type PurchaseStatus = "pending" | "approved" | "rejected";
type PurchaseMethod = "jazzcash" | "easypaisa" | "bank_transfer" | "whatsapp";
type PurchaseStatusFilter = PurchaseStatus | "all";

function isPurchaseStatus(value: string): value is PurchaseStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function isPurchaseMethod(value: string): value is PurchaseMethod {
  return (
    value === "jazzcash" ||
    value === "easypaisa" ||
    value === "bank_transfer" ||
    value === "whatsapp"
  );
}

function parsePage(value: string | null, fallback: number) {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric) || numeric < 1) return fallback;
  return Math.floor(numeric);
}

function toCsv(rows: Record<string, string | number | null>[]) {
  if (rows.length === 0) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];

  for (const row of rows) {
    const values = headers.map((header) => {
      const raw = row[header];
      const cell = raw === null ? "" : String(raw);
      const escaped = cell.replaceAll('"', '""');
      return `"${escaped}"`;
    });

    lines.push(values.join(","));
  }

  return lines.join("\n");
}

export async function GET(request: Request) {
  let supabase;
  try {
    ({ supabase } = await requireAdmin());
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawStatus = searchParams.get("status")?.trim() ?? "pending";
  const statusFilter: PurchaseStatusFilter =
    rawStatus === "all" || isPurchaseStatus(rawStatus) ? rawStatus : "pending";
  const searchQuery = searchParams.get("query")?.trim() ?? "";
  const rawMethod = searchParams.get("method")?.trim() ?? "all";
  const exportMode = searchParams.get("export")?.trim();
  const page = parsePage(searchParams.get("page"), 1);
  const pageSize = Math.min(parsePage(searchParams.get("pageSize"), 20), 100);

  const rangeStart = (page - 1) * pageSize;
  const rangeEnd = rangeStart + pageSize - 1;

  let purchasesQuery = supabase
    .from("credit_purchases")
    .select("*, credit_packs(name), profiles(email)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    purchasesQuery = purchasesQuery.eq("status", statusFilter);
  }

  // ✅ FIXED (type + reassignment)
  if (rawMethod !== "all" && isPurchaseMethod(rawMethod)) {
    purchasesQuery = purchasesQuery.eq("method", rawMethod);
  }

  if (searchQuery) {
    purchasesQuery = purchasesQuery.ilike(
      "transaction_ref",
      `%${searchQuery}%`
    );
  }

  if (exportMode !== "csv") {
    purchasesQuery = purchasesQuery.range(rangeStart, rangeEnd);
  }

  const { data: purchases, error: dbError, count } = await purchasesQuery;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  const list = purchases ?? [];

  if (exportMode === "csv") {
    const csvRows = list.map((entry) => ({
      id: entry.id,
      user_email: entry.profiles?.email ?? "",
      pack_name: entry.credit_packs?.name ?? "",
      credits: entry.credits,
      amount_pkr: entry.amount_pkr,
      method: entry.method,
      transaction_ref: entry.transaction_ref,
      status: entry.status,
      admin_notes: entry.admin_notes,
      created_at: entry.created_at,
      reviewed_at: entry.reviewed_at,
    }));

    const csv = toCsv(csvRows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="credit-purchases-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({
    purchases: list,
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  });
}

export async function PATCH(request: Request) {
  let supabase;
  let actorId: string;
  try {
    ({ supabase, user: { id: actorId } } = await requireAdmin());
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { purchaseId, purchaseIds, action, admin_notes } = body as {
    purchaseId?: string;
    purchaseIds?: string[];
    action: "approve" | "reject";
    admin_notes?: string;
  };

  const ids = purchaseIds?.length ? purchaseIds : purchaseId ? [purchaseId] : [];

  if (!ids.length || !action) {
    return NextResponse.json(
      { error: "purchaseId or purchaseIds and action are required" },
      { status: 400 }
    );
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  const reviewedIds: string[] = [];

  for (const id of ids) {
    const { data: reviewedRows, error: reviewError } = await supabase.rpc(
      "review_credit_purchase",
      {
        p_purchase_id: id,
        p_action: action,
        p_admin_notes: admin_notes?.trim() || undefined,
      }
    );

    if (reviewError) {
      return NextResponse.json({ error: reviewError.message }, { status: 400 });
    }

    if (!reviewedRows || reviewedRows.length === 0) {
      return NextResponse.json({ error: "Purchase review failed" }, { status: 500 });
    }

    reviewedIds.push(reviewedRows[0].purchase_id);
  }

  await logAdminEvent(supabase, {
    actorId,
    category: "payments",
    action: action === "approve" ? "approve_purchase" : "reject_purchase",
    entityType: "credit_purchase",
    entityId: ids.length === 1 ? ids[0] : undefined,
    message:
      ids.length === 1
        ? `Purchase ${ids[0]} ${action === "approve" ? "approved" : "rejected"}`
        : `${ids.length} purchases ${action === "approve" ? "approved" : "rejected"} in bulk`,
    metadata: {
      purchaseIds: reviewedIds,
      adminNotes: admin_notes ?? null,
    },
  });

  return NextResponse.json({ updatedIds: reviewedIds });
}
