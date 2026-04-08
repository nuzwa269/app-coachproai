"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function CreditBalance() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchBalance() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("ai_credits_balance")
        .eq("id", user.id)
        .single();

      if (data) {
        setBalance(data.ai_credits_balance as number);
      }
    }

    fetchBalance();
  }, []);

  if (balance === null) return null;

  return (
    <Link
      href="/buy-credits"
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-brand-orange transition-colors"
    >
      <Coins className="h-4 w-4 shrink-0 text-brand-orange" />
      <span>
        <span className="font-semibold">{balance}</span> credits
      </span>
    </Link>
  );
}
