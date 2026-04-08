import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { SavedOutput } from "@/types/database";

type SavedOutputWithProject = SavedOutput & {
  projects: { name: string } | null;
};

const CATEGORY_STYLES: Record<string, string> = {
  overview: "bg-blue-100 text-blue-700 border border-blue-200",
  database: "bg-purple-100 text-purple-700 border border-purple-200",
  api: "bg-green-100 text-green-700 border border-green-200",
  docs: "bg-amber-100 text-amber-700 border border-amber-200",
  general: "bg-gray-100 text-gray-700 border border-gray-200",
};

export default async function SavedOutputsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; project?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const categoryFilter = params.category ?? "";
  const projectFilter = params.project ?? "";

  let query = supabase
    .from("saved_outputs")
    .select("*, projects(name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (categoryFilter) {
    query = query.eq("category", categoryFilter as "overview" | "database" | "api" | "docs" | "general");
  }

  const { data: outputs } = await query;

  const allOutputs = (outputs ?? []) as unknown as SavedOutputWithProject[];

  // Get unique project names for filter
  const projectNames = Array.from(
    new Set(allOutputs.map((o) => o.projects?.name).filter(Boolean))
  );

  const filtered = projectFilter
    ? allOutputs.filter((o) => o.projects?.name === projectFilter)
    : allOutputs;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] font-heading">Saved Outputs</h1>
        <p className="text-sm text-gray-500 mt-1">
          All AI-generated content you&apos;ve saved across your projects.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category:</span>
          {["", "overview", "database", "api", "docs", "general"].map((c) => {
            const params = new URLSearchParams();
            if (c) params.set("category", c);
            if (projectFilter) params.set("project", projectFilter);
            const href = `/saved-outputs${params.toString() ? `?${params}` : ""}`;
            return (
              <Link
                key={c}
                href={href}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                  categoryFilter === c
                    ? "bg-brand-orange text-white border-brand-orange"
                    : "bg-white text-gray-600 border-gray-200 hover:border-brand-orange hover:text-brand-orange"
                }`}
              >
                {c || "All"}
              </Link>
            );
          })}
        </div>

        {projectNames.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Project:</span>
            {["", ...projectNames].map((p) => {
              const params = new URLSearchParams();
              if (categoryFilter) params.set("category", categoryFilter);
              if (p) params.set("project", p as string);
              const href = `/saved-outputs${params.toString() ? `?${params}` : ""}`;
              return (
                <Link
                  key={p || "all"}
                  href={href}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    projectFilter === p
                      ? "bg-brand-orange text-white border-brand-orange"
                      : "bg-white text-gray-600 border-gray-200 hover:border-brand-orange hover:text-brand-orange"
                  }`}
                >
                  {p || "All"}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Output list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-16 text-center">
          <Bookmark className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No saved outputs yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Save AI responses from the chat to see them here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((output) => (
            <div
              key={output.id}
              className="rounded-lg border border-gray-200 bg-white p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      CATEGORY_STYLES[output.category] ?? CATEGORY_STYLES.general
                    }`}
                  >
                    {output.category}
                  </span>
                  {output.projects?.name && (
                    <span className="text-xs text-gray-400">
                      📁 {output.projects.name}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(output.created_at).toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#111827]">{output.title}</h3>
              <details className="group">
                <summary className="text-xs text-brand-orange cursor-pointer select-none hover:underline">
                  Show content
                </summary>
                <pre className="mt-2 text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded p-3 overflow-x-auto">
                  {output.content}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
