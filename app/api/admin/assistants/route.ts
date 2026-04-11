import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server-roles";
import type { AssistantProvider } from "@/types/database";
import { logAdminEvent } from "@/lib/admin/audit";

const VALID_PROVIDERS: AssistantProvider[] = [
  "openai",
  "anthropic",
  "google",
  "custom",
];

type AssistantStatusFilter = "all" | "active" | "inactive";

function isAssistantProvider(value: string): value is AssistantProvider {
  return VALID_PROVIDERS.includes(value as AssistantProvider);
}

function isAssistantStatusFilter(value: string): value is AssistantStatusFilter {
  return value === "all" || value === "active" || value === "inactive";
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

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
  const rawProvider = searchParams.get("provider")?.trim() ?? "all";
  const rawStatus = searchParams.get("status")?.trim() ?? "all";
  const status = isAssistantStatusFilter(rawStatus) ? rawStatus : "all";
  const page = parsePage(searchParams.get("page"), 1);
  const pageSize = Math.min(parsePage(searchParams.get("pageSize"), 20), 50);

  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let dataQuery = supabase
    .from("assistants")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(start, end);

  if (query) {
    dataQuery = dataQuery.or(
      `name.ilike.%${query}%,slug.ilike.%${query}%,model.ilike.%${query}%`
    );
  }

  // ✅ FIXED provider handling (correct scope + correct type)
  if (rawProvider !== "all" && isAssistantProvider(rawProvider)) {
    dataQuery = dataQuery.eq("provider", rawProvider);
  }

  if (status === "active") {
    dataQuery = dataQuery.eq("is_active", true);
  }

  if (status === "inactive") {
    dataQuery = dataQuery.eq("is_active", false);
  }

  const { data, error, count } = await dataQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    assistants: data ?? [],
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
  });
}

type CreateAssistantPayload = {
  name: string;
  slug?: string;
  description?: string | null;
  persona: string;
  provider: AssistantProvider;
  model: string;
  is_active?: boolean;
};

export async function POST(request: Request) {
  let supabase;
  let actorId: string;

  try {
    ({ supabase, user: { id: actorId } } = await requireAdmin());
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as CreateAssistantPayload;

  if (!body.name?.trim() || !body.persona?.trim() || !body.model?.trim()) {
    return NextResponse.json(
      { error: "name, persona, and model are required" },
      { status: 400 }
    );
  }

  if (!VALID_PROVIDERS.includes(body.provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const slug = slugify(body.slug?.trim() || body.name);

  if (!slug) {
    return NextResponse.json({ error: "A valid slug is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("assistants")
    .insert({
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || null,
      persona: body.persona.trim(),
      provider: body.provider,
      model: body.model.trim(),
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminEvent(supabase, {
    actorId,
    category: "assistants",
    action: "create",
    entityType: "assistant",
    entityId: data.id,
    message: `Assistant '${data.name}' created`,
    metadata: { provider: data.provider, model: data.model },
  });

  return NextResponse.json(data, { status: 201 });
}

type UpdateAssistantPayload = {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  persona?: string;
  provider?: AssistantProvider;
  model?: string;
  is_active?: boolean;
};

export async function PATCH(request: Request) {
  let supabase;
  let actorId: string;

  try {
    ({ supabase, user: { id: actorId } } = await requireAdmin());
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as UpdateAssistantPayload;

  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (body.provider && !VALID_PROVIDERS.includes(body.provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const updates: {
    name?: string;
    slug?: string;
    description?: string | null;
    persona?: string;
    provider?: AssistantProvider;
    model?: string;
    is_active?: boolean;
  } = {};

  if (body.name !== undefined) {
    if (!body.name.trim()) {
      return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
    }
    updates.name = body.name.trim();
  }

  if (body.slug !== undefined) {
    const slug = slugify(body.slug);
    if (!slug) {
      return NextResponse.json({ error: "slug cannot be empty" }, { status: 400 });
    }
    updates.slug = slug;
  }

  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null;
  }

  if (body.persona !== undefined) {
    if (!body.persona.trim()) {
      return NextResponse.json(
        { error: "persona cannot be empty" },
        { status: 400 }
      );
    }
    updates.persona = body.persona.trim();
  }

  if (body.provider !== undefined) {
    updates.provider = body.provider;
  }

  if (body.model !== undefined) {
    if (!body.model.trim()) {
      return NextResponse.json({ error: "model cannot be empty" }, { status: 400 });
    }
    updates.model = body.model.trim();
  }

  if (body.is_active !== undefined) {
    updates.is_active = body.is_active;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("assistants")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminEvent(supabase, {
    actorId,
    category: "assistants",
    action: "update",
    entityType: "assistant",
    entityId: data.id,
    message: `Assistant '${data.name}' updated`,
    metadata: updates,
  });

  return NextResponse.json(data);
}
