"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface LowCreditsWarningProps {
  credits: number;
}

export function LowCreditsWarning({ credits }: LowCreditsWarningProps) {
  if (credits >= 10) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
      <span>
        Running low on credits ({credits} left)!{" "}
        <Link href="/buy-credits" className="font-medium underline hover:text-amber-900">
          Buy more to keep building.
        </Link>
      </span>
    </div>
  );
}
