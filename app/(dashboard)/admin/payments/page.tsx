"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  credit_packs: { name: string } | null;
  profiles: { email: string } | null;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
};

const METHOD_LABELS: Record<string, string> = {
  jazzcash: "JazzCash",
  easypaisa: "Easypaisa",
  bank_transfer: "Bank Transfer",
  whatsapp: "WhatsApp",
};

type StatusTab = "pending" | "approved" | "rejected" | "all";

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<StatusTab>("pending");
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchPurchases(status: StatusTab) {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/credit-purchases?status=${status}`);
    if (res.status === 403 || res.status === 401) {
      router.replace("/dashboard");
      return;
    }
    const data = await res.json();
    if (res.ok) {
      setPurchases(data ?? []);
    } else {
      setError(data.error ?? "Failed to load purchases");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPurchases(tab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleAction(purchaseId: string, action: "approve" | "reject") {
    setActionLoading(purchaseId + action);
    setError(null);
    const res = await fetch("/api/admin/credit-purchases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchaseId,
        action,
        admin_notes: adminNotes[purchaseId] ?? undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Action failed");
    } else {
      await fetchPurchases(tab);
    }
    setActionLoading(null);
  }

  const TABS: { label: string; value: StatusTab }[] = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] font-heading">Admin: Credit Purchases</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve payment requests.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.value
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-gray-500 hover:text-[#111827]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
      ) : purchases.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
          No {tab === "all" ? "" : tab} purchases.
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Pack</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Credits</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Method</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Ref</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Screenshot</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                {tab === "pending" && (
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate">
                    {p.profiles?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#111827]">
                    {p.credit_packs?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.credits}</td>
                  <td className="px-4 py-3 text-gray-700">Rs.{p.amount_pkr.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {METHOD_LABELS[p.method] ?? p.method}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs max-w-[120px] truncate" title={p.transaction_ref}>
                    {p.transaction_ref}
                  </td>
                  <td className="px-4 py-3">
                    {p.screenshot_url ? (
                      <a
                        href={p.screenshot_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-orange hover:underline text-xs"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        STATUS_STYLES[p.status] ?? ""
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  {tab === "pending" && (
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <Input
                          placeholder="Admin notes (optional)"
                          value={adminNotes[p.id] ?? ""}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({ ...prev, [p.id]: e.target.value }))
                          }
                          className="h-8 text-xs"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                            disabled={actionLoading !== null}
                            onClick={() => handleAction(p.id, "approve")}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {actionLoading === p.id + "approve" ? "…" : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1"
                            disabled={actionLoading !== null}
                            onClick={() => handleAction(p.id, "reject")}
                          >
                            <XCircle className="h-3 w-3" />
                            {actionLoading === p.id + "reject" ? "…" : "Reject"}
                          </Button>
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
