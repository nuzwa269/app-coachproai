import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

type AuditSeverity = "info" | "warning" | "error";

type AdminAuditEvent = {
  actorId: string;
  category: string;
  action: string;
  message: string;
  entityType?: string;
  entityId?: string;
  severity?: AuditSeverity;
  metadata?: Json;
};

export async function logAdminEvent(
  supabase: SupabaseClient<Database, "public", "public">,
  event: AdminAuditEvent
): Promise<void> {
  const { error } = await supabase.from("admin_event_logs").insert({
    actor_id: event.actorId,
    category: event.category,
    action: event.action,
    entity_type: event.entityType ?? null,
    entity_id: event.entityId ?? null,
    severity: event.severity ?? "info",
    message: event.message,
    metadata: event.metadata ?? {},
  });

  if (error) {
    // Audit logging should not block primary admin workflows.
    console.error("Failed to log admin event", error);
  }
}
