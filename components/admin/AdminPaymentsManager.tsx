"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";

type PurchaseWithDetails = {
  id: string;
  user_id: string;
  credits: number;
  amount_pkr: number;
  method: string;
  transaction_ref: string;
  screenshot_url: string | null;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  credit_packs: { name: string } | null;
  profiles: { email: string } | null;
};

type PaymentsResponse = {
  purchases: PurchaseWithDetails[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type StatusTab = "pending" | "approved" | "rejected" | "all";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
};

const METHOD_OPTIONS = ["all", "jazzcash", "easypaisa", "bank_transfer", "whatsapp"];

export function AdminPaymentsManager() {
  const [tab, setTab] = useState<StatusTab>("pending");
  const [methodFilter, setMethodFilter] = useState("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");

  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      status: tab,
      page: String(page),
      pageSize: "20",
      method: methodFilter,
      query,
    });

    const res = await fetch(`/api/admin/credit-purchases?${params.toString()}`);
    const data = (await res.json()) as PaymentsResponse | { error: string };

    if (!res.ok) {
      setError((data as { error: string }).error ?? "Failed to load purchases");
      setLoading(false);
      return;
    }

    const payload = data as PaymentsResponse;
    setPurchases(payload.purchases ?? []);
    setTotal(payload.total);
    setTotalPages(payload.totalPages);
    setSelectedIds([]);
    setLoading(false);
  }, [methodFilter, page, query, tab]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const pendingSelectedCount = useMemo(() => {
    return selectedIds.filter((id) => {
      const match = purchases.find((purchase) => purchase.id === id);
      return match?.status === "pending";
    }).length;
  }, [purchases, selectedIds]);

  async function handleAction(payload: {
    purchaseId?: string;
    purchaseIds?: string[];
    action: "approve" | "reject";
    admin_notes?: string;
  }) {
    setActionLoading(payload.action);
    setError(null);

    const res = await fetch("/api/admin/credit-purchases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Action failed");
    } else {
      await fetchPurchases();
    }

    setActionLoading(null);
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
    );
  }

  async function exportCsv() {
    const params = new URLSearchParams({
      status: tab,
      method: methodFilter,
      query,
      export: "csv",
    });

    const res = await fetch(`/api/admin/credit-purchases?${params.toString()}`);

    if (!res.ok) {
      setError("Failed to export purchases");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `credit-purchases-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <AdminSectionHeader
        title="Payments"
        description="Review payment requests, approve in bulk, and export filtered data."
        actions={
          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 p-1">
            {(["pending", "approved", "rejected", "all"] as StatusTab[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setPage(1);
                  setTab(status);
                }}
                className={`rounded px-3 py-1 text-xs font-medium capitalize ${
                  tab === status
                    ? "bg-white text-brand-orange shadow"
                    : "text-gray-500 hover:text-[#111827]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <Input
            placeholder="Search by transaction reference"
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            className="lg:max-w-xs"
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
            value={methodFilter}
            onChange={(event) => {
              setPage(1);
              setMethodFilter(event.target.value);
            }}
          >
            {METHOD_OPTIONS.map((method) => (
              <option key={method} value={method}>
                {method === "all" ? "All methods" : method}
              </option>
            ))}
          </select>

          <p className="text-sm text-gray-500 lg:ml-auto">{total} purchases</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {tab === "pending" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={pendingSelectedCount === 0 || actionLoading !== null}
            className="bg-green-600 hover:bg-green-700"
            onClick={() =>
              handleAction({
                purchaseIds: selectedIds,
                action: "approve",
              })
            }
          >
            Approve Selected ({pendingSelectedCount})
          </Button>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            disabled={pendingSelectedCount === 0 || actionLoading !== null}
            onClick={() =>
              handleAction({
                purchaseIds: selectedIds,
                action: "reject",
              })
            }
          >
            Reject Selected
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          Loading purchases...
        </div>
      ) : purchases.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          No purchases matched your filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-[1180px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  {tab === "pending" ? "Select" : "#"}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Pack</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Credits</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Method</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Reference</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Proof</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Created</th>
                {tab === "pending" ? (
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {purchases.map((purchase, index) => (
                <tr key={purchase.id}>
                  <td className="px-4 py-3">
                    {tab === "pending" ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(purchase.id)}
                        onChange={() => toggleSelection(purchase.id)}
                      />
                    ) : (
                      <span className="text-xs text-gray-500">{index + 1}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{purchase.profiles?.email ?? "-"}</td>
                  <td className="px-4 py-3 font-medium">{purchase.credit_packs?.name ?? "-"}</td>
                  <td className="px-4 py-3">{purchase.credits}</td>
                  <td className="px-4 py-3">Rs. {purchase.amount_pkr.toLocaleString()}</td>
                  <td className="px-4 py-3">{purchase.method}</td>
                  <td className="px-4 py-3 font-mono text-xs">{purchase.transaction_ref}</td>
                  <td className="px-4 py-3">
                    {purchase.screenshot_url ? (
                      <a
                        href={purchase.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-orange hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No file</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        STATUS_STYLES[purchase.status]
                      }`}
                    >
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(purchase.created_at).toLocaleDateString("en-PK")}
                  </td>
                  {tab === "pending" ? (
                    <td className="px-4 py-3">
                      <div className="flex min-w-[220px] flex-col gap-2">
                        <Input
                          placeholder="Admin notes (optional)"
                          value={adminNotes[purchase.id] ?? ""}
                          className="h-8 text-xs"
                          onChange={(event) =>
                            setAdminNotes((prev) => ({
                              ...prev,
                              [purchase.id]: event.target.value,
                            }))
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 bg-green-600 text-xs hover:bg-green-700"
                            disabled={actionLoading !== null}
                            onClick={() =>
                              handleAction({
                                purchaseId: purchase.id,
                                action: "approve",
                                admin_notes: adminNotes[purchase.id],
                              })
                            }
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 border-red-200 text-xs text-red-600 hover:bg-red-50"
                            disabled={actionLoading !== null}
                            onClick={() =>
                              handleAction({
                                purchaseId: purchase.id,
                                action: "reject",
                                admin_notes: adminNotes[purchase.id],
                              })
                            }
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </td>
                  ) : null}
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
