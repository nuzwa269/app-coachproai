"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreditPack } from "@/types/database";

const PAYMENT_METHODS = [
  { value: "jazzcash", label: "JazzCash" },
  { value: "easypaisa", label: "Easypaisa" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "whatsapp", label: "WhatsApp" },
];

interface PurchaseFormProps {
  packs: CreditPack[];
  selectedPackId: string;
  onSuccess: () => void;
}

export function PurchaseForm({ packs, selectedPackId, onSuccess }: PurchaseFormProps) {
  const [packId, setPackId] = useState(selectedPackId);
  const [method, setMethod] = useState("jazzcash");
  const [transactionRef, setTransactionRef] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transactionRef.trim()) {
      setError("Please enter your transaction reference number.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/credit-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pack_id: packId,
          method,
          transaction_ref: transactionRef.trim(),
          screenshot_url: screenshotUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      onSuccess();
    } catch (err) {
      console.error("Purchase submission failed:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pack selector */}
      <div className="space-y-1.5">
        <Label htmlFor="pack">Credit Pack</Label>
        <select
          id="pack"
          value={packId}
          onChange={(e) => setPackId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange"
        >
          {packs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.credits} credits (Rs.{p.price_pkr.toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      {/* Payment method */}
      <div className="space-y-1.5">
        <Label htmlFor="method">Payment Method</Label>
        <select
          id="method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-orange"
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Transaction reference */}
      <div className="space-y-1.5">
        <Label htmlFor="txn-ref">Transaction Reference Number</Label>
        <Input
          id="txn-ref"
          placeholder="e.g. TXN-1234567890"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          required
        />
        <p className="text-xs text-gray-400">
          The reference/confirmation number from your payment app.
        </p>
      </div>

      {/* Screenshot URL (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="screenshot">Screenshot URL (optional)</Label>
        <Input
          id="screenshot"
          type="url"
          placeholder="https://..."
          value={screenshotUrl}
          onChange={(e) => setScreenshotUrl(e.target.value)}
        />
        <p className="text-xs text-gray-400">
          Upload your screenshot to Imgur or Google Drive and paste the link here.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 rounded-md border border-red-200 bg-red-50 px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-orange hover:bg-brand-orange/90 text-white"
      >
        {loading ? "Submitting..." : "Submit Payment"}
      </Button>
    </form>
  );
}
