import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-roles";
import { logAdminEvent } from "@/lib/admin/audit";

type PurchaseStatus = "pending" | "approved" | "rejected";

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
  const statusFilter = (searchParams.get("status") ?? "pending") as
    | PurchaseStatus
    | "all";
  const searchQuery = searchParams.get("query")?.trim() ?? "";
  const methodFilter = searchParams.get("method")?.trim() ?? "all";
  const exportMode = searchParams.get("export")?.trim();
  const page = parsePage(searchParams.get("page"), 1);
  const pageSize = Math.min(parsePage(searchParams.get("pageSize"), 20), 100);

  const rangeStart = (page - 1) * pageSize;
  const rangeEnd = rangeStart + pageSize - 1;

  const purchasesQuery = supabase
    .from("credit_purchases")
    .select("*, credit_packs(name), profiles(email)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    purchasesQuery.eq(
      "status",
      statusFilter as "pending" | "approved" | "rejected"
    );
  }

  if (methodFilter !== "all") {
    purchasesQuery.eq("method", methodFilter);
  }

  if (searchQuery) {
    purchasesQuery.ilike("transaction_ref", `%${searchQuery}%`);
  }

  if (exportMode !== "csv") {
    purchasesQuery.range(rangeStart, rangeEnd);
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

  const { data: purchases, error: fetchError } = await supabase
    .from("credit_purchases")
    .select("id, user_id, credits, status")
    .in("id", ids);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const list = purchases ?? [];

  if (!list.length) {
    return NextResponse.json({ error: "No purchases found" }, { status: 404 });
  }

  const alreadyReviewed = list.find((entry) => entry.status !== "pending");
  if (alreadyReviewed) {
    return NextResponse.json(
      { error: "Purchase has already been reviewed" },
      { status: 400 }
    );
  }

  if (action === "approve") {
    for (const purchase of list) {
      const { error: rpcError } = await supabase.rpc("add_credits", {
        p_user_id: purchase.user_id,
        p_amount: purchase.credits,
      });

      if (rpcError) {
        return NextResponse.json({ error: rpcError.message }, { status: 500 });
      }
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("credit_purchases")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      admin_notes: admin_notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .in("id", ids)
    .select();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logAdminEvent(supabase, {
    actorId,
    category: "payments",
    action: action === "approve" ? "approve_purchase" : "reject_purchase",
    entityType: "credit_purchase",
    entityId: ids.length === 1 ? ids[0] : null,
    message:
      ids.length === 1
        ? `Purchase ${ids[0]} ${action === "approve" ? "approved" : "rejected"}`
        : `${ids.length} purchases ${action === "approve" ? "approved" : "rejected"} in bulk`,
    metadata: {
      purchaseIds: ids,
      adminNotes: admin_notes ?? null,
    },
  });

  return NextResponse.json({ updated: updated ?? [] });
}

