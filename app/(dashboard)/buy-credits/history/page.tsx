"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type PurchaseWithPack = {
  id: string;
  credits: number;
  amount_pkr: number;
  method: string;
  transaction_ref: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  credit_packs: { name: string } | null;
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

export default function PurchaseHistoryPage() {
  const [purchases, setPurchases] = useState<PurchaseWithPack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/credit-purchases")
      .then((r) => r.json())
      .then((data) => setPurchases(data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/buy-credits"
          className="text-gray-400 hover:text-brand-orange transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#111827] font-heading">Purchase History</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track the status of your credit purchases.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading…</div>
      ) : purchases.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">No purchases yet.</p>
          <Link href="/buy-credits" className="mt-2 inline-block text-sm text-brand-orange hover:underline">
            Buy your first pack
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Pack</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Credits</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Method</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#111827]">
                    {p.credit_packs?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.credits}</td>
                  <td className="px-4 py-3 text-gray-700">Rs.{p.amount_pkr.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {METHOD_LABELS[p.method] ?? p.method}
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
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(p.created_at).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
