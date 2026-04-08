import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized", status: 401, supabase: null, user: null };
  }

  if (!ADMIN_EMAIL || user.email !== ADMIN_EMAIL) {
    return { error: "Forbidden", status: 403, supabase: null, user: null };
  }

  return { error: null, status: 200, supabase, user };
}

export async function GET(request: Request) {
  const { error, status, supabase } = await requireAdmin();
  if (error || !supabase) {
    return NextResponse.json({ error }, { status });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") ?? "pending";

  const query = supabase
    .from("credit_purchases")
    .select("*, credit_packs(name), profiles(email)")
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") {
    query.eq("status", statusFilter as "pending" | "approved" | "rejected");
  }

  const { data: purchases, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(purchases);
}

export async function PATCH(request: Request) {
  const { error, status, supabase } = await requireAdmin();
  if (error || !supabase) {
    return NextResponse.json({ error }, { status });
  }

  const body = await request.json();
  const { purchaseId, action, admin_notes } = body as {
    purchaseId: string;
    action: "approve" | "reject";
    admin_notes?: string;
  };

  if (!purchaseId || !action) {
    return NextResponse.json(
      { error: "purchaseId and action are required" },
      { status: 400 }
    );
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "action must be 'approve' or 'reject'" },
      { status: 400 }
    );
  }

  // Fetch the purchase
  const { data: purchase, error: fetchError } = await supabase
    .from("credit_purchases")
    .select("id, user_id, credits, status")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }

  if (purchase.status !== "pending") {
    return NextResponse.json(
      { error: "Purchase has already been reviewed" },
      { status: 400 }
    );
  }

  if (action === "approve") {
    // Add credits to the user's balance
    const { error: rpcError } = await supabase.rpc("add_credits", {
      p_user_id: purchase.user_id,
      p_amount: purchase.credits,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }
  }

  // Update purchase status
  const { data: updated, error: updateError } = await supabase
    .from("credit_purchases")
    .update({
      status: action === "approve" ? "approved" : "rejected",
      admin_notes: admin_notes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", purchaseId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
