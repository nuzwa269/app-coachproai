import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import {
  addKnowledgeSourceAction,
  updateKnowledgeStatusAction,
} from "@/app/(admin)/admin/knowledge/actions";

export default async function AdminKnowledgePage() {
  const supabase = await createClient();

  const { data: sources, error } = await supabase
    .from("admin_knowledge_sources")
    .select(
      "id, name, source_ref, status, chunk_count, last_synced_at, created_at, updated_at"
    )
    .order("updated_at", { ascending: false })
    .limit(50);

  const list = sources ?? [];

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Knowledge"
        description="Knowledge base control center for sources, indexing, and ingestion quality."
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load sources: {error.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="text-base font-semibold text-[#111827]">Knowledge Sources</h3>
          <div className="mt-4 space-y-3">
            {list.length === 0 ? (
              <p className="rounded-md border border-gray-100 p-4 text-sm text-gray-500">
                No sources configured yet.
              </p>
            ) : (
              list.map((source) => (
                <div key={source.id} className="rounded-md border border-gray-100 p-3">
                  <p className="text-sm font-medium text-[#111827]">{source.name}</p>
                  <p className="text-xs text-gray-500">
                    {source.chunk_count} chunks • status: {source.status}
                    {source.last_synced_at
                      ? ` • last sync ${new Date(source.last_synced_at).toLocaleDateString("en-PK")}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">{source.source_ref}</p>
                  <form action={updateKnowledgeStatusAction} className="mt-2 flex items-center gap-2">
                    <input type="hidden" name="sourceId" value={source.id} />
                    <select
                      name="status"
                      defaultValue={source.status}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    >
                      <option value="queued">Queued</option>
                      <option value="indexing">Indexing</option>
                      <option value="healthy">Healthy</option>
                      <option value="failed">Failed</option>
                    </select>
                    <Button type="submit" size="sm" variant="outline" className="h-8">
                      Update
                    </Button>
                  </form>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[#111827]">Add Source</h3>
          <form action={addKnowledgeSourceAction} className="mt-3 space-y-3">
            <Input name="name" placeholder="Source name" required />
            <Input name="sourceRef" placeholder="Source URL or storage key" required />
            <Textarea
              name="syncInstructions"
              placeholder="Optional sync instructions"
              className="min-h-28"
            />
            <Button type="submit" className="w-full">
              Queue Ingestion
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
