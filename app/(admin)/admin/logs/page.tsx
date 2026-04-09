import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import { createClient } from "@/lib/supabase/server";

const SEVERITY_STYLE: Record<string, string> = {
  info: "text-blue-700",
  warning: "text-amber-700",
  error: "text-red-700",
};

export default async function AdminLogsPage() {
  const supabase = await createClient();
  const { data: logs, error } = await supabase
    .from("admin_event_logs")
    .select("id, category, severity, action, message, entity_type, entity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const list = logs ?? [];

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Logs"
        description="Operational events and security-sensitive admin actions."
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load admin logs: {error.message}
        </div>
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-[#111827]">Recent Admin Events</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Event ID</th>
                <th className="px-3 py-2 text-left font-medium">Category</th>
                <th className="px-3 py-2 text-left font-medium">Action</th>
                <th className="px-3 py-2 text-left font-medium">Severity</th>
                <th className="px-3 py-2 text-left font-medium">Message</th>
                <th className="px-3 py-2 text-left font-medium">Entity</th>
                <th className="px-3 py-2 text-left font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                    No admin events recorded yet.
                  </td>
                </tr>
              ) : (
                list.map((log) => (
                  <tr key={log.id}>
                    <td className="px-3 py-3 font-mono text-xs">{log.id.slice(0, 8)}</td>
                    <td className="px-3 py-3 capitalize">{log.category}</td>
                    <td className="px-3 py-3 font-mono text-xs">{log.action}</td>
                    <td
                      className={`px-3 py-3 capitalize ${SEVERITY_STYLE[log.severity] ?? "text-gray-700"}`}
                    >
                      {log.severity}
                    </td>
                    <td className="px-3 py-3">{log.message}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {log.entity_type ? `${log.entity_type}:${log.entity_id ?? "-"}` : "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-500">
                      {new Date(log.created_at).toLocaleString("en-PK")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
