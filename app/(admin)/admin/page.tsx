import { AlertCircle, Coins, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AdminSectionHeader } from "@/components/admin/AdminSectionHeader";

type MetricCard = {
  label: string;
  value: string;
  helper?: string;
};

function metricValue(value: number | null | undefined, formatter?: (n: number) => string) {
  if (value === null || value === undefined) return "-";
  return formatter ? formatter(value) : value.toLocaleString();
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    usersCountResult,
    subscribersCountResult,
    creditBalancesResult,
    recentActivityResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "subscriber"),
    supabase.from("profiles").select("ai_credits_balance"),
    supabase
      .from("admin_event_logs")
      .select("id, category, action, message, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalCreditsBalance =
    creditBalancesResult.data?.reduce(
      (sum, row) => sum + (row.ai_credits_balance ?? 0),
      0
    ) ?? null;

  const metricCards: MetricCard[] = [
    { label: "Total Users", value: metricValue(usersCountResult.count) },
    { label: "Subscribers", value: metricValue(subscribersCountResult.count) },
    {
      label: "Total Credits Balance",
      value: metricValue(totalCreditsBalance),
      helper: "Current credits across all accounts",
    },
  ];

  const hasMetricError = [
    usersCountResult.error,
    subscribersCountResult.error,
    creditBalancesResult.error,
  ].some(Boolean);

  return (
    <div className="space-y-6">
      <AdminSectionHeader
        title="Admin Dashboard"
        description="Operational overview for users, credits, payments, and assistant inventory."
      />

      {hasMetricError ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Some overview metrics failed to load.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metricCards.map((card) => (
          <article key={card.label} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#111827]">{card.value}</p>
            {card.helper ? <p className="mt-1 text-xs text-gray-500">{card.helper}</p> : null}
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-orange" />
          <h3 className="font-semibold text-[#111827]">Recent Activity</h3>
        </div>

        {recentActivityResult.error ? (
          <p className="text-sm text-gray-500">Recent activity is currently unavailable.</p>
        ) : !recentActivityResult.data || recentActivityResult.data.length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet.</p>
        ) : (
          <div className="space-y-3">
            {recentActivityResult.data.map((event) => (
              <div key={event.id} className="rounded-md border border-gray-100 px-3 py-2">
                <p className="text-sm font-medium text-[#111827]">{event.message}</p>
                <p className="text-xs text-gray-500">
                  {event.category} • {event.action} • {new Date(event.created_at).toLocaleString("en-PK")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
          <Coins className="h-4 w-4 text-brand-orange" />
          Overview Scope
        </div>
        <p className="mt-2 text-sm text-gray-600">
          This page intentionally shows high-level admin health only: users, subscribers, credits, and recent activity.
        </p>
      </section>
    </div>
  );
}
