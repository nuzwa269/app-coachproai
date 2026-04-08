"use client";

import { useEffect, useState } from "react";
import { CreditPackCard } from "@/components/credits/CreditPackCard";
import { PurchaseForm } from "@/components/credits/PurchaseForm";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Copy } from "lucide-react";
import type { CreditPack } from "@/types/database";

const PAYMENT_INSTRUCTIONS = [
  {
    method: "JazzCash",
    account: "03XX-XXXXXXX",
    details: "Send payment to the JazzCash mobile account above. Use your full name as the reference.",
  },
  {
    method: "Easypaisa",
    account: "03XX-XXXXXXX",
    details: "Send payment to the Easypaisa account above. Include your email in the message.",
  },
  {
    method: "Bank Transfer",
    account: "IBAN: PK00XXXX0000000000000000",
    details: "Bank: HBL | Account Title: CoachProAI | Transfer the exact amount.",
  },
  {
    method: "WhatsApp",
    account: "+92 3XX XXXXXXX",
    details: "Send payment screenshot on WhatsApp. We'll verify and add credits within 24 hours.",
  },
];

export default function BuyCreditsPage() {
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [selectedPackId, setSelectedPackId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/credit-packs")
      .then((r) => r.json())
      .then((data: CreditPack[]) => {
        setPacks(data);
        if (data.length > 0) setSelectedPackId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleSelectPack(id: string) {
    setSelectedPackId(id);
    setShowForm(true);
    setSubmitted(false);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading credit packs…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] font-heading">Buy Credits</h1>
        <p className="mt-1 text-sm text-gray-500">
          Each AI message costs 1 credit. New accounts start with 50 free credits.
        </p>
      </div>

      {/* Credit Packs */}
      <section>
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Choose a Pack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <CreditPackCard
              key={pack.id}
              id={pack.id}
              name={pack.name}
              credits={pack.credits}
              price_pkr={pack.price_pkr}
              isPopular={pack.name === "Popular Pack"}
              onSelect={handleSelectPack}
            />
          ))}
        </div>
      </section>

      <Separator />

      {/* Payment Instructions */}
      <section>
        <h2 className="text-lg font-semibold text-[#111827] mb-4">How to Pay</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAYMENT_INSTRUCTIONS.map((item) => (
            <Card key={item.method} className="border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#111827]">
                  {item.method}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-50 border border-gray-100 rounded px-2 py-1 font-mono text-gray-700">
                    {item.account}
                  </code>
                  <button
                    onClick={() => handleCopy(item.account)}
                    className="shrink-0 text-gray-400 hover:text-brand-orange transition-colors"
                    aria-label="Copy"
                  >
                    {copied === item.account ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">{item.details}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Purchase Form */}
      <section>
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Submit Payment Proof</h2>

        {submitted ? (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Payment submitted!</p>
              <p className="text-sm text-green-700 mt-0.5">
                We&apos;ll verify and add credits within 24 hours.
              </p>
            </div>
          </div>
        ) : (
          <Card className="border-gray-200 max-w-md">
            <CardContent className="pt-6">
              {packs.length > 0 && (
                <PurchaseForm
                  packs={packs}
                  selectedPackId={showForm && selectedPackId ? selectedPackId : packs[0].id}
                  onSuccess={() => setSubmitted(true)}
                />
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
