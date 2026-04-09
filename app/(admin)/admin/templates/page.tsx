import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import {
  createTemplateAction,
  updateTemplateStatusAction,
} from "@/app/(admin)/admin/templates/actions";

export default async function AdminTemplatesPage() {
  const supabase = await createClient();

  const { data: templates, error } = await supabase
    .from("admin_templates")
    .select("id, name, category, status, version, updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  const list = templates ?? [];

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Templates"
        description="Create and manage reusable prompts and workspace templates."
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load templates: {error.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="text-base font-semibold text-[#111827]">Template Catalog</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-gray-200 text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Version</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                      No templates yet. Create one from the panel.
                    </td>
                  </tr>
                ) : (
                  list.map((template) => (
                    <tr key={template.id}>
                      <td className="px-3 py-3 font-medium">{template.name}</td>
                      <td className="px-3 py-3">{template.category}</td>
                      <td className="px-3 py-3">v{template.version}</td>
                      <td className="px-3 py-3">
                        <form action={updateTemplateStatusAction} className="flex items-center gap-2">
                          <input type="hidden" name="templateId" value={template.id} />
                          <select
                            name="status"
                            defaultValue={template.status}
                            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          >
                            <option value="draft">Draft</option>
                            <option value="active">Active</option>
                            <option value="archived">Archived</option>
                          </select>
                          <Button type="submit" size="sm" variant="outline" className="h-8">
                            Save
                          </Button>
                        </form>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {new Date(template.updated_at).toLocaleDateString("en-PK")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#111827]">Create Template</h3>
          <form action={createTemplateAction} className="mt-3 space-y-3">
            <Input name="name" placeholder="Template name" required />
            <Input name="category" placeholder="Category" required />
            <Textarea
              name="content"
              placeholder="Template prompt / content"
              className="min-h-32"
              required
            />
            <Button type="submit" className="w-full">
              Save Template
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
