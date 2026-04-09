"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server-roles";
import { logAdminEvent } from "@/lib/admin/audit";

export async function saveAiConfigAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const primaryProvider = String(formData.get("primaryProvider") ?? "").trim();
  const primaryModel = String(formData.get("primaryModel") ?? "").trim();
  const fallbackProvider = String(formData.get("fallbackProvider") ?? "").trim();
  const fallbackModel = String(formData.get("fallbackModel") ?? "").trim();
  const guardrailsPrompt = String(formData.get("guardrailsPrompt") ?? "").trim();

  if (
    !primaryProvider ||
    !primaryModel ||
    !fallbackProvider ||
    !fallbackModel ||
    !guardrailsPrompt
  ) {
    return;
  }

  const value = {
    primaryProvider,
    primaryModel,
    fallbackProvider,
    fallbackModel,
    guardrailsPrompt,
  };

  const { error } = await supabase.from("admin_settings").upsert(
    {
      key: "ai_config",
      value,
      updated_by: user.id,
    },
    { onConflict: "key" }
  );

  if (error) {
    throw new Error(error.message);
  }

  await logAdminEvent(supabase, {
    actorId: user.id,
    category: "ai_config",
    action: "update",
    entityType: "admin_setting",
    entityId: "ai_config",
    message: "AI config updated",
    metadata: {
      primaryProvider,
      primaryModel,
      fallbackProvider,
      fallbackModel,
    },
  });

  revalidatePath("/admin/ai-config");
}
