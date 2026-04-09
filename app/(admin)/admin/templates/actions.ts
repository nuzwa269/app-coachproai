"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server-roles";
import { logAdminEvent } from "@/lib/admin/audit";

export async function createTemplateAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!name || !category || !content) {
    return;
  }

  const { data, error } = await supabase
    .from("admin_templates")
    .insert({
      name,
      category,
      content,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await logAdminEvent(supabase, {
    actorId: user.id,
    category: "templates",
    action: "create",
    entityType: "admin_template",
    entityId: data.id,
    message: `Template '${name}' created`,
    metadata: { category },
  });

  revalidatePath("/admin/templates");
}

export async function updateTemplateStatusAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const templateId = String(formData.get("templateId") ?? "").trim();
  const nextStatus = String(formData.get("status") ?? "").trim();

  if (!templateId || !["draft", "active", "archived"].includes(nextStatus)) {
    return;
  }

  const { data: template, error: fetchError } = await supabase
    .from("admin_templates")
    .select("id, status, version, name")
    .eq("id", templateId)
    .single();

  if (fetchError || !template) {
    throw new Error(fetchError?.message ?? "Template not found");
  }

  const { error } = await supabase
    .from("admin_templates")
    .update({
      status: nextStatus,
      version: template.version + 1,
      updated_by: user.id,
    })
    .eq("id", templateId);

  if (error) {
    throw new Error(error.message);
  }

  await logAdminEvent(supabase, {
    actorId: user.id,
    category: "templates",
    action: "status_update",
    entityType: "admin_template",
    entityId: template.id,
    message: `Template '${template.name}' moved to ${nextStatus}`,
    metadata: { previousStatus: template.status, nextStatus },
  });

  revalidatePath("/admin/templates");
}
