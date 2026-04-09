"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";
import type { AssistantProvider } from "@/types/database";

type Assistant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  persona: string;
  provider: AssistantProvider;
  model: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AssistantsResponse = {
  assistants: Assistant[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const PROVIDERS: Array<AssistantProvider | "all"> = [
  "all",
  "openai",
  "anthropic",
  "google",
  "custom",
];

export function AdminAssistantsManager() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState<AssistantProvider | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    persona: "",
    provider: "openai" as AssistantProvider,
    model: "",
    is_active: true,
  });

  const fetchAssistants = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      query,
      provider: providerFilter,
      status: statusFilter,
    });

    const res = await fetch(`/api/admin/assistants?${params.toString()}`);
    const data = (await res.json()) as AssistantsResponse | { error: string };

    if (!res.ok) {
      setError((data as { error: string }).error ?? "Failed to load assistants");
      setLoading(false);
      return;
    }

    const payload = data as AssistantsResponse;
    setAssistants(payload.assistants);
    setTotalPages(payload.totalPages);
    setLoading(false);
  }, [page, providerFilter, query, statusFilter]);

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  const activeCount = useMemo(
    () => assistants.filter((assistant) => assistant.is_active).length,
    [assistants]
  );

  async function createAssistant() {
    setSaving(true);
    setError(null);

    const res = await fetch("/api/admin/assistants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = (await res.json()) as Assistant | { error: string };

    if (!res.ok) {
      setError((data as { error: string }).error ?? "Failed to create assistant");
      setSaving(false);
      return;
    }

    setForm({
      name: "",
      slug: "",
      description: "",
      persona: "",
      provider: "openai",
      model: "",
      is_active: true,
    });
    setOpen(false);
    setSaving(false);
    await fetchAssistants();
  }

  async function patchAssistant(id: string, patch: Partial<Assistant>) {
    const res = await fetch("/api/admin/assistants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });

    const data = (await res.json()) as Assistant | { error: string };

    if (!res.ok) {
      setError((data as { error: string }).error ?? "Failed to update assistant");
      return;
    }

    const updated = data as Assistant;
    setAssistants((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
  }

  return (
    <div className="space-y-5">
      <AdminSectionHeader
        title="Assistants"
        description="Manage assistant personas, model providers, and active deployment state."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusCircle className="h-4 w-4" />
                New Assistant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Assistant</DialogTitle>
                <DialogDescription>
                  Add a managed assistant definition for project workspaces.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <Input
                  placeholder="Name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <Input
                  placeholder="Slug (optional)"
                  value={form.slug}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, slug: event.target.value }))
                  }
                />
                <Input
                  placeholder="Model (example: gpt-4o-mini)"
                  value={form.model}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, model: event.target.value }))
                  }
                />
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.provider}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      provider: event.target.value as AssistantProvider,
                    }))
                  }
                >
                  {PROVIDERS.filter((provider) => provider !== "all").map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
                <Textarea
                  placeholder="Persona prompt"
                  value={form.persona}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, persona: event.target.value }))
                  }
                />
                <Textarea
                  placeholder="Description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={createAssistant} disabled={saving}>
                  {saving ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Visible Assistants</p>
          <p className="mt-2 text-2xl font-bold text-[#111827]">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Assistants</p>
          <p className="mt-2 text-2xl font-bold text-[#111827]">{assistants.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Provider Mix</p>
          <p className="mt-2 text-sm text-gray-600">OpenAI / Anthropic / Google / Custom</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Schema</p>
          <p className="mt-2 text-sm text-gray-600">Uses assistants table from 004 migration</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            placeholder="Search by name, slug, or model"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            className="md:max-w-sm"
          />
          <Button
            type="button"
            onClick={() => {
              setPage(1);
              setQuery(queryInput.trim());
            }}
          >
            Search
          </Button>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={providerFilter}
            onChange={(event) => {
              setPage(1);
              setProviderFilter(event.target.value as AssistantProvider | "all");
            }}
          >
            {PROVIDERS.map((provider) => (
              <option key={provider} value={provider}>
                {provider === "all" ? "All providers" : provider}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(event) => {
              setPage(1);
              setStatusFilter(event.target.value as "all" | "active" | "inactive");
            }}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading assistants...
        </div>
      ) : assistants.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          No assistants found. Create one to get started.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Provider</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Model</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Persona</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assistants.map((assistant) => (
                <tr key={assistant.id} className="align-top">
                  <td className="px-4 py-3 font-medium text-[#111827]">
                    <Input
                      defaultValue={assistant.name}
                      className="h-8"
                      onBlur={(event) => {
                        const value = event.target.value.trim();
                        if (value && value !== assistant.name) {
                          patchAssistant(assistant.id, { name: value });
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      defaultValue={assistant.slug}
                      className="h-8"
                      onBlur={(event) => {
                        const value = event.target.value.trim();
                        if (value && value !== assistant.slug) {
                          patchAssistant(assistant.id, { slug: value });
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      defaultValue={assistant.provider}
                      onChange={(event) =>
                        patchAssistant(assistant.id, {
                          provider: event.target.value as AssistantProvider,
                        })
                      }
                    >
                      {PROVIDERS.filter((provider) => provider !== "all").map((provider) => (
                        <option key={provider} value={provider}>
                          {provider}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      defaultValue={assistant.model}
                      className="h-8"
                      onBlur={(event) => {
                        const value = event.target.value.trim();
                        if (value && value !== assistant.model) {
                          patchAssistant(assistant.id, { model: value });
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Textarea
                      defaultValue={assistant.persona}
                      className="min-h-20 text-xs"
                      onBlur={(event) => {
                        const value = event.target.value.trim();
                        if (value && value !== assistant.persona) {
                          patchAssistant(assistant.id, { persona: value });
                        }
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={assistant.is_active}
                        onChange={(event) =>
                          patchAssistant(assistant.id, {
                            is_active: event.target.checked,
                          })
                        }
                      />
                      {assistant.is_active ? "Active" : "Inactive"}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
