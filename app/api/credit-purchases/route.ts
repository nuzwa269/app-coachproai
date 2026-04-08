import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: purchases, error } = await supabase
    .from("credit_purchases")
    .select("*, credit_packs(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(purchases);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { pack_id, method, transaction_ref, screenshot_url } = body as {
    pack_id: string;
    method: string;
    transaction_ref: string;
    screenshot_url?: string;
  };

  if (!pack_id || !method || !transaction_ref) {
    return NextResponse.json(
      { error: "pack_id, method, and transaction_ref are required" },
      { status: 400 }
    );
  }

  const validMethods = ["jazzcash", "easypaisa", "bank_transfer", "whatsapp"];
  if (!validMethods.includes(method)) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  // Verify the pack exists and is active
  const { data: pack, error: packError } = await supabase
    .from("credit_packs")
    .select("id, credits, price_pkr, is_active")
    .eq("id", pack_id)
    .single();

  if (packError || !pack) {
    return NextResponse.json({ error: "Credit pack not found" }, { status: 404 });
  }

  if (!pack.is_active) {
    return NextResponse.json({ error: "This credit pack is no longer available" }, { status: 400 });
  }

  const { data: purchase, error: insertError } = await supabase
    .from("credit_purchases")
    .insert({
      user_id: user.id,
      pack_id,
      credits: pack.credits,
      amount_pkr: pack.price_pkr,
      method: method as "jazzcash" | "easypaisa" | "bank_transfer" | "whatsapp",
      transaction_ref,
      screenshot_url: screenshot_url ?? null,
      status: "pending" as const,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(purchase, { status: 201 });
}
