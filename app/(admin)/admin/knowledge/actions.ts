"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server-roles";
import { logAdminEvent } from "@/lib/admin/audit";
import type { KnowledgeStatus } from "@/lib/supabase/types";

const KNOWLEDGE_STATUSES: readonly KnowledgeStatus[] = [
  "queued",
  "indexing",
  "healthy",
  "failed",
];

function parseKnowledgeStatus(value: string): KnowledgeStatus | null {
  return KNOWLEDGE_STATUSES.includes(value as KnowledgeStatus)
    ? (value as KnowledgeStatus)
    : null;
}

export async function addKnowledgeSourceAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const sourceRef = String(formData.get("sourceRef") ?? "").trim();
  const syncInstructions = String(formData.get("syncInstructions") ?? "").trim();

  if (!name || !sourceRef) {
    return;
  }

  const { data, error } = await supabase
    .from("admin_knowledge_sources")
    .insert({
      name,
      source_ref: sourceRef,
      sync_instructions: syncInstructions || null,
      status: "queued",
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await logAdminEvent(supabase, {
    actorId: user.id,
    category: "knowledge",
    action: "create_source",
    entityType: "knowledge_source",
    entityId: data.id,
    message: `Knowledge source '${name}' added`,
    metadata: { sourceRef },
  });

  revalidatePath("/admin/knowledge");
}

export async function updateKnowledgeStatusAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const sourceId = String(formData.get("sourceId") ?? "").trim();
  const status = parseKnowledgeStatus(String(formData.get("status") ?? "").trim());

  if (!sourceId || !status) {
    return;
  }

  const { data: source, error: fetchError } = await supabase
    .from("admin_knowledge_sources")
    .select("id, name, status")
    .eq("id", sourceId)
    .single();

  if (fetchError || !source) {
    throw new Error(fetchError?.message ?? "Knowledge source not found");
  }

  const { error } = await supabase
    .from("admin_knowledge_sources")
    .update({
      status,
      last_synced_at: status === "healthy" ? new Date().toISOString() : null,
      updated_by: user.id,
    })
    .eq("id", sourceId);

  if (error) {
    throw new Error(error.message);
  }

  await logAdminEvent(supabase, {
    actorId: user.id,
    category: "knowledge",
    action: "status_update",
    entityType: "knowledge_source",
    entityId: source.id,
    message: `Knowledge source '${source.name}' status changed to ${status}`,
    metadata: { previousStatus: source.status, nextStatus: status },
  });

  revalidatePath("/admin/knowledge");
}
